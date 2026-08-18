import { AlertTriangle, CheckCircle2, Clock3, Radio, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Estimate = {
  symbol: 'G' | 'C' | 'S' | 'I';
  proxySymbol: string | null;
  proxyName: string;
  officialPrice: number;
  estimatedPrice: number;
  officialDailyChange: number;
  estimatedDailyChange: number;
  changeSinceOfficialClose: number;
  confidence: 'high' | 'medium' | 'low' | 'unavailable';
  confidenceScore: number;
  marketStatus: string;
  officialDate: Date;
  observedAt: Date | null;
  isEstimate: boolean;
  notes: string;
};

type IntradayEstimatePanelProps = {
  estimates: Estimate[];
  fetchedAt?: Date;
  isFetching?: boolean;
  isLoading?: boolean;
  error?: boolean;
};

const fundNames: Record<Estimate['symbol'], string> = {
  G: 'Government Securities',
  C: 'Common Stock',
  S: 'Small Cap Stock',
  I: 'International Stock',
};

const fundStyles: Record<Estimate['symbol'], string> = {
  G: 'border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/40',
  C: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/40',
  S: 'border-violet-200 bg-violet-50/70 dark:border-violet-900 dark:bg-violet-950/40',
  I: 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/40',
};

function formatPercent(value: number, decimals = 2) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

function confidenceLabel(confidence: Estimate['confidence']) {
  if (confidence === 'high') return 'High confidence';
  if (confidence === 'medium') return 'Medium confidence';
  if (confidence === 'low') return 'Low confidence';
  return 'Unavailable';
}

function confidenceClass(confidence: Estimate['confidence']) {
  if (confidence === 'high') return 'bg-emerald-100 text-emerald-800';
  if (confidence === 'medium') return 'bg-blue-100 text-blue-800';
  if (confidence === 'low') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
}

export default function IntradayEstimatePanel({
  estimates,
  fetchedAt,
  isFetching = false,
  isLoading = false,
  error = false,
}: IntradayEstimatePanelProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-cyan-600" />
              <CardTitle className="text-lg">Intraday market estimates</CardTitle>
            </div>
            <CardDescription className="mt-1 max-w-3xl">
              Estimated between official TSP closes from liquid market proxies. These values are not official TSP prices and should not be used for trade or allocation instructions.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {isFetching ? <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-600" /> : <Clock3 className="h-3.5 w-3.5" />}
            <span>{fetchedAt ? `Updated ${new Date(fetchedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Waiting for quote data'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Loading intraday estimates">
            {['G', 'C', 'S', 'I'].map((symbol) => (
              <div key={symbol} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-2 h-3 w-28" />
                <Skeleton className="mt-6 h-8 w-32" />
                <Skeleton className="mt-4 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-4/5" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="alert">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Market-proxy data is temporarily unavailable. The latest official TSP close remains available above.
          </div>
        ) : estimates.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400" role="status">
            Intraday estimates will appear after the latest official TSP prices are available.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {estimates.map((estimate) => {
              const positive = estimate.estimatedDailyChange >= 0;
              const proxyMovePositive = estimate.changeSinceOfficialClose >= 0;
              return (
                <div key={estimate.symbol} className={`rounded-xl border p-4 ${fundStyles[estimate.symbol]}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{estimate.symbol} Fund</p>
                      <p className="mt-1 text-xs text-slate-600">{fundNames[estimate.symbol]}</p>
                    </div>
                    {estimate.confidence === 'unavailable' ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    ) : estimate.isEstimate ? (
                      <Radio className="h-4 w-4 text-cyan-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-slate-500" />
                    )}
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Estimated price</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">${estimate.estimatedPrice.toFixed(4)}</p>
                    </div>
                    <span className={`text-sm font-semibold ${positive ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {positive ? <TrendingUp className="mr-1 inline h-3.5 w-3.5" /> : <TrendingDown className="mr-1 inline h-3.5 w-3.5" />}
                      {formatPercent(estimate.estimatedDailyChange)}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 border-t border-slate-200/70 pt-3 text-xs text-slate-600">
                    <div className="flex items-center justify-between gap-2">
                      <span>Since official close</span>
                      <span className={`font-semibold ${proxyMovePositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatPercent(estimate.changeSinceOfficialClose, 3)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Proxy</span>
                      <span className="font-semibold text-slate-800">{estimate.proxySymbol ?? 'Carry-forward'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Status</span>
                      <span className="font-semibold text-slate-800">{estimate.marketStatus}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${confidenceClass(estimate.confidence)}`}>
                      {confidenceLabel(estimate.confidence)}
                    </span>
                    <span className="text-[11px] text-slate-500">{Math.round(estimate.confidenceScore * 100)}%</span>
                  </div>

                  <p className="mt-3 text-[11px] leading-4 text-slate-500">{estimate.notes}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
