import { lazy, Suspense, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc';
import { useTheme } from '@/contexts/ThemeContext';
import { AlertTriangle, RefreshCw } from 'lucide-react';
const FundCards = lazy(() => import('@/components/FundCards'));
const FundChart = lazy(() => import('@/components/FundChart'));
const ComparisonChart = lazy(() => import('@/components/ComparisonChart'));
const HeatmapChart = lazy(() => import('@/components/HeatmapChart'));
const MomentumAnalysis = lazy(() => import('@/components/MomentumAnalysis'));
const DataTable = lazy(() => import('@/components/DataTable'));
const IntradayEstimatePanel = lazy(() => import('@/components/IntradayEstimatePanel'));
const SettingsPanel = lazy(() => import('@/components/SettingsPanel'));
const InstallPrompt = lazy(() => import('@/components/InstallPrompt'));
const NetworkStatus = lazy(() => import('@/components/NetworkStatus'));

function ChartSkeleton({ label = 'Loading analytics' }: { label?: string }) {
  return (
    <div className="space-y-4" role="status" aria-label={label}>
      <div className="flex h-72 items-end gap-2 rounded-lg border border-slate-200 p-4 dark:border-slate-800 sm:h-96">
        {[42, 58, 34, 72, 49, 68, 38, 82, 56, 64, 45, 76].map((height, index) => (
          <Skeleton key={index} className="flex-1" style={{ height: `${height}%` }} />
        ))}
      </div>
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [dateRange, setDateRange] = useState<'1w' | '1m' | '3m' | '6m' | '1y'>('1m');
  const [selectedFund, setSelectedFund] = useState<'G' | 'C' | 'S' | 'I'>('C');

  // Query for latest prices
  const latestPricesQuery = trpc.funds.getLatestPrices.useQuery();

  // Refresh proxy-based intraday estimates once per minute while the dashboard is open.
  // These are estimates only and never replace official TSP prices.
  const intradayEstimatesQuery = trpc.funds.getIntradayEstimates.useQuery(undefined, {
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
    retry: 1,
  });

  // Query for price history. Memoized dates prevent avoidable tRPC refetch loops.
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date(end);
    if (dateRange === '1w') start.setDate(start.getDate() - 7);
    else if (dateRange === '1m') start.setMonth(start.getMonth() - 1);
    else if (dateRange === '3m') start.setMonth(start.getMonth() - 3);
    else if (dateRange === '6m') start.setMonth(start.getMonth() - 6);
    else if (dateRange === '1y') start.setFullYear(start.getFullYear() - 1);
    return { startDate: start, endDate: end };
  }, [dateRange]);

  const priceHistoryQuery = trpc.funds.getPriceHistory.useQuery({
    fundSymbol: selectedFund,
    startDate,
    endDate,
  });

  const indicatorsQuery = trpc.funds.getIndicators.useQuery({
    fundSymbol: selectedFund,
    startDate,
    endDate,
  });

  const comparisonQuery = trpc.funds.getComparison.useQuery({
    startDate,
    endDate,
  });

  // Mutation for syncing data
  const syncDataMutation = trpc.funds.syncData.useMutation({
    onSuccess: () => {
      void latestPricesQuery.refetch();
      void priceHistoryQuery.refetch();
      void indicatorsQuery.refetch();
      void comparisonQuery.refetch();
      void intradayEstimatesQuery.refetch();
    },
  });



  const handleSync = useCallback(() => {
    void syncDataMutation.mutate();
  }, [syncDataMutation.mutate]);

  const handleToggleTheme = useCallback(() => {
    toggleTheme?.();
  }, [toggleTheme]);

  const handleExportCsv = useCallback(() => {
    const rows = priceHistoryQuery.data || [];
    if (rows.length === 0) return;

    const escapeCsv = (value: string | number) => {
      const text = String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const csvRows = [
      ['Fund', 'Date', 'Official Share Price', 'Official Daily Change (%)'],
      ...rows.map((row) => [
        selectedFund,
        new Date(row.date).toISOString().slice(0, 10),
        row.price.toFixed(4),
        row.dailyChange.toFixed(4),
      ]),
    ];
    const csv = `\\uFEFF${csvRows.map((row) => row.map(escapeCsv).join(',')).join('\\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `tsp-${selectedFund.toLowerCase()}-fund-${dateRange}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [dateRange, priceHistoryQuery.data, selectedFund]);

  const isLoading =
    latestPricesQuery.isLoading ||
    priceHistoryQuery.isLoading ||
    indicatorsQuery.isLoading ||
    comparisonQuery.isLoading;
  const hasLoadError = Boolean(
    latestPricesQuery.error || priceHistoryQuery.error || indicatorsQuery.error || comparisonQuery.error,
  );

  const retryQueries = () => {
    void latestPricesQuery.refetch();
    void priceHistoryQuery.refetch();
    void indicatorsQuery.refetch();
    void comparisonQuery.refetch();
  };

  // Start one public sync when the glance dashboard mounts. The explicit
  // button remains available for a forced refresh without creating request loops.
  const hasAutoSyncedRef = useRef(false);
  useEffect(() => {
    if (!hasAutoSyncedRef.current) {
      hasAutoSyncedRef.current = true;
      void syncDataMutation.mutate();
    }
  }, [syncDataMutation.mutate]);

  return (
    <DashboardLayout publicAccess>
      <Suspense fallback={<div className="space-y-4" role="status" aria-label="Loading dashboard components"><Skeleton className="h-12 w-2/3" /><ChartSkeleton /></div>}>
      <div className="space-y-6">
        <InstallPrompt />

        {/* Header with sync button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">TSP Fund Tracker</h1>
            <p className="text-gray-600 mt-1">
              Real-time monitoring and analysis of TSP fund performance
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NetworkStatus />
            <Button
            onClick={handleSync}
            disabled={syncDataMutation.isPending}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncDataMutation.isPending ? 'animate-spin' : ''}`} />
            {syncDataMutation.isPending ? 'Syncing...' : 'Sync Data'}
            </Button>
          </div>
        </div>

        {syncDataMutation.data?.success === false ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Official TSP prices could not be refreshed from TSP.gov right now. Existing cached values remain usable, and intraday estimates will appear after an official baseline is available. {syncDataMutation.data.error || ''}</span>
          </div>
        ) : null}

        {hasLoadError ? (
          <div className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <span>Some tracker data could not be loaded. Cached sections may still be available.</span>
            <Button type="button" size="sm" variant="outline" onClick={retryQueries}>Retry data</Button>
          </div>
        ) : null}

        {/* Fund Price Cards */}
        <FundCards prices={latestPricesQuery.data || {}} isLoading={latestPricesQuery.isLoading} />

        <IntradayEstimatePanel
          estimates={intradayEstimatesQuery.data?.estimates || []}
          fetchedAt={intradayEstimatesQuery.data?.fetchedAt}
          isLoading={intradayEstimatesQuery.isLoading}
          isFetching={intradayEstimatesQuery.isFetching}
          error={Boolean(intradayEstimatesQuery.error)}
        />

        <SettingsPanel
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onExportCsv={handleExportCsv}
          exportDisabled={!priceHistoryQuery.data || priceHistoryQuery.data.length === 0}
          isSaving={false}
          hasOfficialData={Object.keys(latestPricesQuery.data || {}).length > 0}
        />

        {/* Main Tabs */}
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4" aria-label="Analytics views">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="momentum">Momentum</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          </TabsList>

          {/* Chart Tab */}
          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Fund Performance Chart</CardTitle>
                    <CardDescription>
                      Daily share price for {selectedFund} Fund
                    </CardDescription>
                  </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Chart lookback range">
            {(['1w', '1m', '3m', '6m', '1y'] as const).map((range) => (
                      <Button
                        key={range}
                        variant={dateRange === range ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDateRange(range)}
                      >
                        {range.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <ChartSkeleton label="Loading fund performance chart" />
                ) : (
                  <div className="space-y-4">
                    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Fund selection">
                      {(['G', 'C', 'S', 'I'] as const).map((fund) => (
                        <Button
                          key={fund}
                          variant={selectedFund === fund ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedFund(fund)}
                        >
                          {fund} Fund
                        </Button>
                      ))}
                    </div>
                    {priceHistoryQuery.data && priceHistoryQuery.data.length > 0 ? (
                      <FundChart
                        data={priceHistoryQuery.data}
                        fundSymbol={selectedFund}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-96 text-gray-500">
                        No price history data available
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
              <CardHeader>
                <CardTitle>Price History</CardTitle>
                <CardDescription>
                  Historical share prices and daily changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={priceHistoryQuery.data || []}
                  fundSymbol={selectedFund}
                  isLoading={priceHistoryQuery.isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fund Comparison</CardTitle>
                <CardDescription>
                  Compare performance across all TSP funds (centered on y-axis)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <ChartSkeleton label="Loading fund performance chart" />
                ) : comparisonQuery.data && Object.keys(comparisonQuery.data).length > 0 ? (
                  <ComparisonChart data={comparisonQuery.data} />
                ) : (
                  <div className="flex min-h-72 items-center justify-center text-slate-500 dark:text-slate-400" role="status">
                    No comparison data available for this period.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Momentum Tab */}
          <TabsContent value="momentum" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Momentum Analysis</CardTitle>
                <CardDescription>
                  3-month, 1-month, and 2-week momentum comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <ChartSkeleton label="Loading fund performance chart" />
                ) : comparisonQuery.data && Object.keys(comparisonQuery.data).length > 0 ? (
                  <MomentumAnalysis data={comparisonQuery.data} />
                ) : (
                  <div className="flex min-h-72 items-center justify-center text-slate-500 dark:text-slate-400" role="status">
                    No momentum data available for this period.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Heatmap Tab */}
          <TabsContent value="heatmap" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Heatmap</CardTitle>
                <CardDescription>
                  Visual representation of fund performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <ChartSkeleton label="Loading fund performance chart" />
                ) : comparisonQuery.data && Object.keys(comparisonQuery.data).length > 0 ? (
                  <HeatmapChart data={comparisonQuery.data} />
                ) : (
                  <div className="flex min-h-72 items-center justify-center text-slate-500 dark:text-slate-400" role="status">
                    No heatmap data available for this period.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </Suspense>
    </DashboardLayout>
  );
}
