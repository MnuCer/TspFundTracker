/**
 * TSP Fund Data Service
 * Design: Precision Dashboard — Dark Navy Professional
 * Uses tRPC backend proxy to fetch fund price data from TSP.gov
 */

import Papa from "papaparse";
import { format, subDays } from "date-fns";

export const FUNDS = ["G Fund", "C Fund", "S Fund", "I Fund"] as const;
export type FundName = (typeof FUNDS)[number];

export const FUND_COLORS: Record<FundName, string> = {
  "G Fund": "#64748b", // slate
  "C Fund": "#3b82f6", // blue
  "S Fund": "#8b5cf6", // violet
  "I Fund": "#f59e0b", // amber
};

export const FUND_SHORT: Record<FundName, string> = {
  "G Fund": "G",
  "C Fund": "C",
  "S Fund": "S",
  "I Fund": "I",
};

export const FUND_DESCRIPTIONS: Record<FundName, string> = {
  "G Fund": "Government Securities Investment Fund — US Treasury securities",
  "C Fund": "Common Stock Index Investment Fund — S&P 500 Index",
  "S Fund": "Small Cap Stock Index Investment Fund — Dow Jones U.S. Completion TSM Index",
  "I Fund": "International Stock Index Investment Fund — MSCI EAFE Index",
};

export interface FundDataPoint {
  date: string; // ISO date string YYYY-MM-DD
  prices: Record<FundName, number>;
  changes: Record<FundName, number>; // daily % change
}

export interface FundStats {
  fund: FundName;
  currentPrice: number;
  dailyChange: number;
  dailyChangePct: number;
  weekChange: number;
  monthChange: number;
  ytdChange: number;
  high52w: number;
  low52w: number;
}

export interface MACDData {
  date: string;
  macd: number;
  signal: number;
  histogram: number;
  price: number;
}

/**
 * Parse CSV data from TSP.gov
 */
export function parseCSV(csvText: string): FundDataPoint[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0) {
    console.warn("CSV parse warnings:", result.errors);
  }

  const rows = result.data;
  const dataPoints: FundDataPoint[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const date = row["Date"]?.trim();
    if (!date) continue;

    const prices: Partial<Record<FundName, number>> = {};
    for (const fund of FUNDS) {
      const val = parseFloat(row[fund] || "0");
      prices[fund] = isNaN(val) ? 0 : val;
    }

    // Calculate daily % change vs previous row (data is newest-first)
    const changes: Partial<Record<FundName, number>> = {};
    if (i < rows.length - 1) {
      const prevRow = rows[i + 1];
      for (const fund of FUNDS) {
        const curr = prices[fund] || 0;
        const prev = parseFloat(prevRow[fund] || "0");
        changes[fund] = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
      }
    } else {
      for (const fund of FUNDS) {
        changes[fund] = 0;
      }
    }

    dataPoints.push({
      date,
      prices: prices as Record<FundName, number>,
      changes: changes as Record<FundName, number>,
    });
  }

  return dataPoints;
}

/**
 * Get date range strings for API calls
 */
export function getDateRange(days = 730): { startDate: string; endDate: string } {
  const endDate = format(new Date(), "yyyy-MM-dd");
  const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");
  return { startDate, endDate };
}

/**
 * Save data to localStorage for offline use
 */
export function saveToLocalStorage(data: FundDataPoint[]): void {
  try {
    localStorage.setItem("tsp_data", JSON.stringify(data));
    localStorage.setItem("tsp_data_ts", String(Date.now()));
  } catch {
    // Storage quota exceeded, ignore
  }
}

/**
 * Load data from localStorage
 */
export function loadFromLocalStorage(): FundDataPoint[] | null {
  try {
    const stored = localStorage.getItem("tsp_data");
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return null;
}

/**
 * Calculate fund statistics
 */
export function calculateStats(data: FundDataPoint[]): FundStats[] {
  if (data.length === 0) return [];

  const latest = data[0];
  const yearStart = data.find((d) => d.date.startsWith(new Date().getFullYear().toString()));

  return FUNDS.map((fund) => {
    const currentPrice = latest.prices[fund];
    const dailyChangePct = latest.changes[fund];

    // Week change (5 trading days)
    const weekAgo = data[Math.min(5, data.length - 1)];
    const weekChange =
      weekAgo.prices[fund] > 0
        ? ((currentPrice - weekAgo.prices[fund]) / weekAgo.prices[fund]) * 100
        : 0;

    // Month change (~21 trading days)
    const monthAgo = data[Math.min(21, data.length - 1)];
    const monthChange =
      monthAgo.prices[fund] > 0
        ? ((currentPrice - monthAgo.prices[fund]) / monthAgo.prices[fund]) * 100
        : 0;

    // YTD change
    const ytdData = yearStart || data[data.length - 1];
    const ytdChange =
      ytdData.prices[fund] > 0
        ? ((currentPrice - ytdData.prices[fund]) / ytdData.prices[fund]) * 100
        : 0;

    // 52-week high/low
    const yearData = data.slice(0, Math.min(252, data.length));
    const prices52w = yearData.map((d) => d.prices[fund]);
    const high52w = Math.max(...prices52w);
    const low52w = Math.min(...prices52w);

    return {
      fund,
      currentPrice,
      dailyChange: data[1] ? currentPrice - data[1].prices[fund] : 0,
      dailyChangePct,
      weekChange,
      monthChange,
      ytdChange,
      high52w,
      low52w,
    };
  });
}

/**
 * Calculate EMA (Exponential Moving Average)
 */
function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = new Array(prices.length).fill(NaN);

  // Start with SMA for first period
  let sum = 0;
  for (let i = 0; i < period && i < prices.length; i++) {
    sum += prices[i];
  }
  if (period <= prices.length) {
    ema[period - 1] = sum / period;
    for (let i = period; i < prices.length; i++) {
      ema[i] = prices[i] * k + ema[i - 1] * (1 - k);
    }
  }

  return ema;
}

/**
 * Calculate MACD for a given fund
 */
export function calculateMACD(
  data: FundDataPoint[],
  fund: FundName,
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MACDData[] {
  const reversed = [...data].reverse();
  const prices = reversed.map((d) => d.prices[fund]);

  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);

  const macdLine: number[] = prices.map((_, i) => {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) return NaN;
    return fastEMA[i] - slowEMA[i];
  });

  const signalEMAFull = calculateEMA(
    macdLine.map((v) => (isNaN(v) ? 0 : v)),
    signalPeriod
  );

  const result: MACDData[] = [];
  for (let i = slowPeriod - 1; i < reversed.length; i++) {
    const macd = macdLine[i];
    const signal = signalEMAFull[i];
    if (isNaN(macd) || isNaN(signal)) continue;

    result.push({
      date: reversed[i].date,
      macd,
      signal,
      histogram: macd - signal,
      price: prices[i],
    });
  }

  return result.reverse();
}

/**
 * Calculate RSI for a given fund
 */
export function calculateRSI(
  data: FundDataPoint[],
  fund: FundName,
  period = 14
): Array<{ date: string; rsi: number }> {
  const reversed = [...data].reverse();
  const prices = reversed.map((d) => d.prices[fund]);
  const rsiData: Array<{ date: string; rsi: number }> = [];

  for (let i = period; i < prices.length; i++) {
    let gains = 0;
    let losses = 0;

    for (let j = i - period + 1; j <= i; j++) {
      const change = prices[j] - prices[j - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    rsiData.push({ date: reversed[i].date, rsi });
  }

  return rsiData.reverse();
}

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(
  data: FundDataPoint[],
  fund: FundName,
  period: number
): Array<{ date: string; sma: number }> {
  const reversed = [...data].reverse();
  const prices = reversed.map((d) => d.prices[fund]);
  const result: Array<{ date: string; sma: number }> = [];

  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push({ date: reversed[i].date, sma: sum / period });
  }

  return result.reverse();
}

/**
 * Format percentage with sign
 */
export function formatPct(value: number, decimals = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Get color class for a value
 */
export function getChangeColor(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-rose-400";
  return "text-slate-400";
}

/**
 * Export data to CSV
 */
export function exportToCSV(data: FundDataPoint[]): void {
  const headers = ["Date", ...FUNDS, ...FUNDS.map((f) => `${f} Change%`)];
  const rows = data.map((d) => [
    d.date,
    ...FUNDS.map((f) => d.prices[f].toFixed(4)),
    ...FUNDS.map((f) => d.changes[f].toFixed(4)),
  ]);

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tsp-fund-data-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
