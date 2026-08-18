import { getLatestFundPrices } from './db';
import {
  createIntradayEstimate,
  intradayProxyConfig,
  type MarketQuote,
  type TspFundSymbol,
  type IntradayEstimate,
} from './intradayEstimates';

type NasdaqChartPoint = {
  x?: number;
  y?: number;
};

type NasdaqChartResponse = {
  data?: {
    symbol?: string;
    previousClose?: string;
    chart?: NasdaqChartPoint[];
  } | null;
};

type NasdaqInfoResponse = {
  data?: {
    primaryData?: {
      lastSalePrice?: string;
      percentageChange?: string;
      lastTradeTimestamp?: string;
    };
    marketStatus?: string;
  } | null;
};

type CachedQuotes = {
  fetchedAt: number;
  quotes: Record<string, MarketQuote>;
};

const NASDAQ_API = 'https://api.nasdaq.com/api/quote';
const QUOTE_CACHE_MS = 45_000;
const MARKET_PROXY_SYMBOLS = Object.values(intradayProxyConfig).map((proxy) => proxy.symbol);

let cachedQuotes: CachedQuotes | null = null;

function parseMoney(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value.replace(/[$,% ,]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseEpochTimestamp(value: number) {
  // Nasdaq chart timestamps are normally epoch seconds; accept milliseconds too.
  return new Date(value < 10_000_000_000 ? value * 1000 : value);
}

async function fetchNasdaqJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 TSP-Fund-Tracker/1.0',
      Origin: 'https://www.nasdaq.com',
      Referer: 'https://www.nasdaq.com/',
    },
  });

  if (!response.ok) {
    throw new Error(`Nasdaq market data request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchProxyQuote(symbol: string): Promise<MarketQuote | null> {
  try {
    const [chartResponse, infoResponse] = await Promise.all([
      fetchNasdaqJson<NasdaqChartResponse>(
        `${NASDAQ_API}/${encodeURIComponent(symbol)}/chart?assetclass=etf`
      ),
      fetchNasdaqJson<NasdaqInfoResponse>(
        `${NASDAQ_API}/${encodeURIComponent(symbol)}/info?assetclass=etf`
      ),
    ]);

    const chartData = chartResponse.data;
    const infoData = infoResponse.data;
    const chartPoints = (chartData?.chart ?? []).filter(
      (point): point is Required<Pick<NasdaqChartPoint, 'x' | 'y'>> =>
        Number.isFinite(point.x) && Number.isFinite(point.y)
    );
    const latestPoint = chartPoints[chartPoints.length - 1];
    const currentPrice = parseMoney(infoData?.primaryData?.lastSalePrice) ?? latestPoint?.y ?? null;
    const previousClose = parseMoney(chartData?.previousClose);

    if (!currentPrice || !previousClose || !latestPoint) return null;

    return {
      symbol,
      name: symbol,
      currentPrice,
      previousClose,
      marketStatus: infoData?.marketStatus ?? 'Unknown',
      observedAt: parseEpochTimestamp(latestPoint.x),
    };
  } catch (error) {
    console.warn(`[Market Data] Unable to fetch ${symbol}:`, error);
    return null;
  }
}

export async function fetchMarketProxyQuotes(): Promise<Record<string, MarketQuote>> {
  const now = Date.now();
  if (cachedQuotes && now - cachedQuotes.fetchedAt < QUOTE_CACHE_MS) {
    return cachedQuotes.quotes;
  }

  const results = await Promise.all(
    MARKET_PROXY_SYMBOLS.map(async (symbol) => [symbol, await fetchProxyQuote(symbol)] as const)
  );
  const quotes = Object.fromEntries(
    results.filter((entry): entry is [string, MarketQuote] => entry[1] !== null)
  );

  cachedQuotes = { fetchedAt: now, quotes };
  return quotes;
}

export async function getIntradayEstimates(): Promise<{
  estimates: IntradayEstimate[];
  fetchedAt: Date;
  provider: string;
}> {
  const officialPrices = await getLatestFundPrices();
  const quotes = await fetchMarketProxyQuotes();
  const officialByFund = new Map(
    officialPrices.map((price) => [price.fundSymbol as TspFundSymbol, price])
  );

  const estimates = (['G', 'C', 'S', 'I'] as TspFundSymbol[])
    .map((symbol) => {
      const official = officialByFund.get(symbol);
      if (!official) return null;

      const proxySymbol = symbol === 'G' ? null : intradayProxyConfig[symbol].symbol;
      const quote = proxySymbol ? quotes[proxySymbol] : undefined;
      return createIntradayEstimate({
        symbol,
        officialPrice: Number(official.sharePrice),
        officialDailyChange: Number(official.dailyPercentChange ?? 0),
        officialDate: official.priceDate,
        quote,
      });
    })
    .filter((estimate): estimate is IntradayEstimate => estimate !== null);

  return {
    estimates,
    fetchedAt: new Date(),
    provider: 'Nasdaq public quote and chart data; ETF proxies are estimates, not official TSP prices.',
  };
}

export function resetMarketDataCache() {
  cachedQuotes = null;
}
