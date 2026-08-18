import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface FundPrice {
  symbol: string;
  price: number;
  date: Date;
  dailyChange: number;
}

interface FundCardsProps {
  prices: Record<string, FundPrice>;
  isLoading?: boolean;
}

const fundNames: Record<string, string> = {
  G: 'Government Securities',
  C: 'Common Stock',
  S: 'Small Cap Stock',
  I: 'International Stock',
};

const fundColors: Record<string, { bg: string; text: string; border: string }> = {
  G: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-900' },
  C: { bg: 'bg-green-50 dark:bg-emerald-950/40', text: 'text-green-700 dark:text-emerald-300', border: 'border-green-200 dark:border-emerald-900' },
  S: { bg: 'bg-purple-50 dark:bg-violet-950/40', text: 'text-purple-700 dark:text-violet-300', border: 'border-purple-200 dark:border-violet-900' },
  I: { bg: 'bg-orange-50 dark:bg-amber-950/40', text: 'text-orange-700 dark:text-amber-300', border: 'border-orange-200 dark:border-amber-900' },
};

export default function FundCards({ prices, isLoading = false }: FundCardsProps) {
  const funds = ['G', 'C', 'S', 'I'] as const;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Latest official TSP fund prices">
      {funds.map((fund) => {
        const fundData = prices[fund];
        const colors = fundColors[fund];
        const isPositive = (fundData?.dailyChange ?? 0) >= 0;

        return (
          <Card key={fund} className={`${colors.bg} border ${colors.border}`} role="group" aria-labelledby={`fund-${fund}-title`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle id={`fund-${fund}-title`} className="text-lg">{fund} Fund</CardTitle>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{fundNames[fund]}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3" aria-label={`Loading ${fund} Fund`}>
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : fundData ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${colors.text}`}>${fundData.price.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-1" aria-label={`${fund} Fund daily change ${fundData.dailyChange.toFixed(2)} percent`}>
                    {isPositive ? <TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <TrendingDown className="h-4 w-4 text-rose-600" aria-hidden="true" />}
                    <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                      {isPositive ? '+' : ''}{fundData.dailyChange.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Official close: {new Date(fundData.date).toLocaleDateString()}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400" role="status">No official close available</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
