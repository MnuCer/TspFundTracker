/**
 * TSP Data Fetching Service
 * Handles fetching and caching of TSP fund price data
 */

import { parse } from 'csv-parse/sync';
import {
  getFundPricesByDateRange,
  upsertFundPricesBulk,
  getLatestFundPrice,
  upsertFundIndicator,
} from './db';
import {
  calculatePercentageChange,
  calculateMomentumPeriods,
  calculateMACD,
} from './calculations';

const TSP_CSV_URL = 'https://www.tsp.gov/data/fund-price-history.csv';
const TSP_PAGE_URL = 'https://www.tsp.gov/share-price-history/';
const TSP_HISTORY_START_DATE = '2003-06-02';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const TSP_BROWSER_HEADERS = {
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Referer: TSP_PAGE_URL,
};
const TSP_CSV_HEADERS = {
  ...TSP_BROWSER_HEADERS,
  Accept: 'text/csv, text/plain;q=0.9, */*;q=0.8',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'X-Requested-With': 'XMLHttpRequest',
};

interface TSPFundData {
  date: string;
  'G Fund': string;
  'F Fund': string;
  'C Fund': string;
  'S Fund': string;
  'I Fund': string;
  [key: string]: string;
}

interface CachedData {
  timestamp: number;
  data: TSPFundData[];
}

let cachedTSPData: CachedData | null = null;

/**
 * Fetch TSP fund price data from TSP.gov
 * Uses local cache if available and not expired
 */
export function buildTSPDataUrl(referenceDate = new Date()): string {
  const endDate = toYYYYMMDD(referenceDate);
  const params = new URLSearchParams({
    startdate: TSP_HISTORY_START_DATE,
    enddate: endDate,
    Lfunds: '1',
    InvFunds: '1',
    download: '0',
  });
  return `${TSP_CSV_URL}?${params.toString()}`;
}

function toYYYYMMDD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getSetCookieValues(response: Response): string[] {
  if (!response.headers) return [];
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }
  const combined = response.headers.get('set-cookie');
  return combined ? [combined] : [];
}

async function warmTSPPage(): Promise<string | undefined> {
  try {
    const response = await fetch(TSP_PAGE_URL, {
      headers: {
        ...TSP_BROWSER_HEADERS,
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!response.ok) {
      console.warn(`[TSP Service] TSP page warm-up returned ${response.status}`);
    }
    const cookies = getSetCookieValues(response)
      .map((cookie) => cookie.split(';', 1)[0])
      .filter(Boolean);
    await response.body?.cancel();
    return cookies.length > 0 ? cookies.join('; ') : undefined;
  } catch (error) {
    console.warn('[TSP Service] TSP page warm-up failed; continuing without session cookies:', error);
    return undefined;
  }
}

async function fetchOfficialCsv(url: string): Promise<Response> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const cookie = await warmTSPPage();
    const headers: Record<string, string> = { ...TSP_CSV_HEADERS };
    if (cookie) headers.Cookie = cookie;

    const response = await fetch(url, { headers });
    if (response.status !== 403 || attempt === 2) return response;

    await response.body?.cancel();
    await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
  }

  throw new Error('Failed to fetch TSP data after retrying the official endpoint');
}

export async function fetchTSPData(options: { force?: boolean; asOf?: Date } = {}): Promise<TSPFundData[]> {
  const now = Date.now();

  // Check if cache is still valid unless an explicit sync requested a refresh.
  if (!options.force && cachedTSPData && now - cachedTSPData.timestamp < CACHE_DURATION) {
    console.log('[TSP Service] Using cached data');
    return cachedTSPData.data;
  }

  try {
    console.log('[TSP Service] Fetching fresh data from TSP.gov');
    const response = await fetchOfficialCsv(buildTSPDataUrl(options.asOf));

    if (!response.ok) {
      throw new Error(`Failed to fetch TSP data: ${response.statusText}`);
    }

    const csvText = await response.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      relax_column_count: false,
    }) as TSPFundData[];

    const firstRecord = records[0];
    if (!firstRecord || !firstRecord['G Fund'] || !firstRecord['C Fund'] || !firstRecord['S Fund'] || !firstRecord['I Fund']) {
      throw new Error('TSP data response did not contain the expected fund columns');
    }

    // Cache the data only after validating the official response shape.
    cachedTSPData = {
      timestamp: Date.now(),
      data: records,
    };

    console.log(`[TSP Service] Fetched ${records.length} records from TSP.gov`);
    return records;
  } catch (error) {
    console.error('[TSP Service] Error fetching TSP data:', error);

    // If fetch fails and we have cached data, use it even if expired
    if (cachedTSPData) {
      console.log('[TSP Service] Using expired cache due to fetch error');
      return cachedTSPData.data;
    }

    throw error;
  }
}

/**
 * Parse TSP CSV data and extract fund prices
 */
export function parseTSPData(data: TSPFundData[]) {
  const fundMap: Record<string, { symbol: string; csvColumn: string }> = {
    G: { symbol: 'G', csvColumn: 'G Fund' },
    C: { symbol: 'C', csvColumn: 'C Fund' },
    S: { symbol: 'S', csvColumn: 'S Fund' },
    I: { symbol: 'I', csvColumn: 'I Fund' },
  };

  const parsedData: Array<{
    fundSymbol: string;
    date: Date;
    price: number;
    csvDate: string;
  }> = [];

  for (const record of data) {
    const dateStr = record.Date || record.date;
    if (!dateStr) continue;

    // Parse date string (format: "Mar 20, 2026")
    const date = parseDate(dateStr);
    if (!date) continue;

    for (const [symbol, config] of Object.entries(fundMap)) {
      const priceStr = record[config.csvColumn];
      if (!priceStr) continue;

      const price = parseFloat(priceStr.replace(/[$,]/g, ''));
      if (isNaN(price)) continue;

      parsedData.push({
        fundSymbol: symbol,
        date,
        price,
        csvDate: dateStr,
      });
    }
  }

  return parsedData;
}

/**
 * Parse date string in format "Mar 20, 2026"
 */
function parseDate(dateStr: string): Date | null {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    // Set to UTC midnight
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  } catch {
    return null;
  }
}

/**
 * Sync TSP data to database
 * Fetches latest data and updates database with new prices
 */
export async function syncTSPData(options: { force?: boolean; asOf?: Date } = {}) {
  try {
    console.log('[TSP Service] Starting data sync');

    // Fetch data from TSP.gov
    const tspData = await fetchTSPData(options);
    const parsedData = parseTSPData(tspData);

    if (parsedData.length === 0) {
      console.warn('[TSP Service] No data parsed from TSP CSV');
      return { synced: 0, errors: 0 };
    }

    // Group by fund symbol
    const dataByFund: Record<string, typeof parsedData> = {};
    for (const item of parsedData) {
      if (!dataByFund[item.fundSymbol]) {
        dataByFund[item.fundSymbol] = [];
      }
      dataByFund[item.fundSymbol].push(item);
    }

    let synced = 0;
    let errors = 0;

    // Process each fund
    for (const [fundSymbol, fundData] of Object.entries(dataByFund)) {
      try {
        // Sort by date ascending
        fundData.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Calculate percentage changes in memory, then write the fund in chunks.
        // This keeps a full-history sync within the request budget and remains idempotent.
        let previousPrice: number | null = null;
        const fundRows = fundData.map((record) => {
          const dailyPercentChange =
            previousPrice !== null
              ? calculatePercentageChange(record.price, previousPrice)
              : undefined;
          previousPrice = record.price;
          return {
            fundSymbol,
            priceDate: record.date,
            sharePrice: record.price,
            dailyPercentChange,
          };
        });

        try {
          synced += await upsertFundPricesBulk(fundRows);
        } catch (err) {
          console.error(`[TSP Service] Error bulk upserting prices for ${fundSymbol}:`, err);
          errors++;
        }

        // Calculate and store indicators for the latest date
        if (fundData.length > 0) {
          try {
            await calculateAndStoreIndicators(fundSymbol, fundData);
          } catch (err) {
            console.error(`[TSP Service] Error calculating indicators for ${fundSymbol}:`, err);
          }
        }
      } catch (err) {
        console.error(`[TSP Service] Error processing fund ${fundSymbol}:`, err);
        errors++;
      }
    }

    console.log(
      `[TSP Service] Data sync complete. Synced: ${synced}, Errors: ${errors}`
    );
    return { synced, errors };
  } catch (error) {
    console.error('[TSP Service] Fatal error during data sync:', error);
    throw error;
  }
}

/**
 * Calculate and store MACD and momentum indicators
 */
async function calculateAndStoreIndicators(
  fundSymbol: string,
  fundData: Array<{ date: Date; price: number }>
) {
  const prices = fundData.map((d) => d.price);
  const latestDate = fundData[fundData.length - 1]!.date;

  // Calculate MACD
  const { macdLine, signal, histogram } = calculateMACD(prices);

  // Get the latest MACD values
  const latestMACDIndex = macdLine.length - 1;
  const macdLineValue = latestMACDIndex >= 0 ? macdLine[latestMACDIndex] : undefined;
  const signalValue = latestMACDIndex >= 8 ? signal[latestMACDIndex - 8] : undefined;
  const histogramValue =
    latestMACDIndex >= 8 ? histogram[latestMACDIndex - 8] : undefined;

  // Calculate momentum
  const momentumData = calculateMomentumPeriods(
    fundData.map((d) => ({ date: d.date, price: d.price }))
  );

  // Store indicators
  await upsertFundIndicator({
    fundSymbol,
    indicatorDate: latestDate,
    macdLine: macdLineValue,
    macdSignal: signalValue,
    macdHistogram: histogramValue,
    momentum1Month: momentumData.momentum1Month,
    momentum2Week: momentumData.momentum2Week,
    momentum3Month: momentumData.momentum3Month,
  });
}

/**
 * Get fund data for a specific date range
 */
export async function getFundData(
  fundSymbol: string,
  startDate: Date,
  endDate: Date
) {
  return await getFundPricesByDateRange(fundSymbol, startDate, endDate);
}

/**
 * Get latest price for a fund
 */
export async function getLatestPrice(fundSymbol: string) {
  return await getLatestFundPrice(fundSymbol);
}

export function resetTSPDataCache() {
  cachedTSPData = null;
}
