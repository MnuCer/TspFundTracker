/**
 * useTSPData — Custom hook for TSP fund data
 * Uses tRPC backend proxy to fetch data from TSP.gov (bypasses CORS)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  parseCSV,
  calculateStats,
  calculateMACD,
  calculateRSI,
  calculateSMA,
  getDateRange,
  saveToLocalStorage,
  loadFromLocalStorage,
  FundDataPoint,
  FundStats,
  MACDData,
  FundName,
  FUNDS,
} from "@/lib/tspData";

export interface TSPDataState {
  data: FundDataPoint[];
  stats: FundStats[];
  macdData: Record<FundName, MACDData[]>;
  rsiData: Record<FundName, Array<{ date: string; rsi: number }>>;
  sma20Data: Record<FundName, Array<{ date: string; sma: number }>>;
  sma50Data: Record<FundName, Array<{ date: string; sma: number }>>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useTSPData(): TSPDataState {
  const [data, setData] = useState<FundDataPoint[]>([]);
  const [stats, setStats] = useState<FundStats[]>([]);
  const [macdData, setMacdData] = useState<Record<FundName, MACDData[]>>(
    {} as Record<FundName, MACDData[]>
  );
  const [rsiData, setRsiData] = useState<
    Record<FundName, Array<{ date: string; rsi: number }>>
  >({} as Record<FundName, Array<{ date: string; rsi: number }>>);
  const [sma20Data, setSma20Data] = useState<
    Record<FundName, Array<{ date: string; sma: number }>>
  >({} as Record<FundName, Array<{ date: string; sma: number }>>);
  const [sma50Data, setSma50Data] = useState<
    Record<FundName, Array<{ date: string; sma: number }>>
  >({} as Record<FundName, Array<{ date: string; sma: number }>>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [queryInput, setQueryInput] = useState(() => getDateRange(730));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // tRPC query — fetches via server proxy
  const { data: trpcData, isLoading, isError, error: trpcError, refetch } = trpc.tsp.getFundData.useQuery(
    queryInput,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    }
  );

  // Process raw CSV data when tRPC returns
  useEffect(() => {
    if (trpcData?.csv) {
      try {
        const parsed = parseCSV(trpcData.csv);
        setData(parsed);
        setStats(calculateStats(parsed));

        const macd: Partial<Record<FundName, MACDData[]>> = {};
        const rsi: Partial<Record<FundName, Array<{ date: string; rsi: number }>>> = {};
        const sma20: Partial<Record<FundName, Array<{ date: string; sma: number }>>> = {};
        const sma50: Partial<Record<FundName, Array<{ date: string; sma: number }>>> = {};

        for (const fund of FUNDS) {
          macd[fund] = calculateMACD(parsed, fund);
          rsi[fund] = calculateRSI(parsed, fund);
          sma20[fund] = calculateSMA(parsed, fund, 20);
          sma50[fund] = calculateSMA(parsed, fund, 50);
        }

        setMacdData(macd as Record<FundName, MACDData[]>);
        setRsiData(rsi as Record<FundName, Array<{ date: string; rsi: number }>>);
        setSma20Data(sma20 as Record<FundName, Array<{ date: string; sma: number }>>);
        setSma50Data(sma50 as Record<FundName, Array<{ date: string; sma: number }>>);
        setLastUpdated(new Date());
        setError(null);

        // Cache for offline use
        saveToLocalStorage(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse TSP data");
      }
    }
  }, [trpcData]);

  // Handle loading/error states
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (isError) {
      const errMsg = trpcError?.message || "Failed to fetch TSP data";
      setError(errMsg);

      // Try offline cache on error
      const cached = loadFromLocalStorage();
      if (cached && cached.length > 0) {
        setData(cached);
        setStats(calculateStats(cached));
        setError(`${errMsg} — showing cached data`);
      }
    }
  }, [isError, trpcError]);

  const refresh = useCallback(() => {
    setQueryInput(getDateRange(730));
    refetch();
  }, [refetch]);

  // Auto-refresh every 15 minutes during market hours
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const day = now.getDay();
      if (day >= 1 && day <= 5 && hours >= 9 && hours < 16) {
        refetch();
      }
    }, 15 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refetch]);

  return {
    data,
    stats,
    macdData,
    rsiData,
    sma20Data,
    sma50Data,
    loading,
    error,
    lastUpdated,
    refresh,
  };
}
