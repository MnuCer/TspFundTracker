import { Card, CardContent } from '@/components/ui/card';

interface ComparisonData {
  [fund: string]: {
    prices: Array<{
      date: Date;
      price: number;
      dailyChange: number;
    }>;
    indicators: Array<{
      date: Date;
      momentum1Month: number;
      momentum2Week: number;
      momentum3Month: number;
    }>;
  };
}

interface HeatmapChartProps {
  data: ComparisonData;
}

export default function HeatmapChart({ data }: HeatmapChartProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex min-h-72 items-center justify-center text-slate-500 dark:text-slate-400" role="status">
        No performance data available for the heatmap.
      </div>
    );
  }

  const fundKeys = Object.keys(data).filter((key) => data[key]?.prices?.length > 0);

  // Calculate performance metrics for each fund
  const metrics = fundKeys.map((fund) => {
    const prices = data[fund]?.prices || [];
    if (prices.length === 0) return null;

    const startPrice = prices[0]?.price || 0;
    const endPrice = prices[prices.length - 1]?.price || 0;
    const totalReturn = ((endPrice - startPrice) / startPrice) * 100;

    const dailyChanges = prices.map((p) => p.dailyChange);
    const avgDailyChange =
      dailyChanges.reduce((a, b) => a + b, 0) / dailyChanges.length;

    const variance =
      dailyChanges.reduce((sum, change) => sum + Math.pow(change - avgDailyChange, 2), 0) /
      dailyChanges.length;
    const volatility = Math.sqrt(variance);

    const maxPrice = Math.max(...prices.map((p) => p.price));
    const minPrice = Math.min(...prices.map((p) => p.price));
    const maxDrawdown = ((minPrice - maxPrice) / maxPrice) * 100;

    return {
      fund,
      totalReturn,
      avgDailyChange,
      volatility,
      maxDrawdown,
    };
  }).filter((m) => m !== null);

  // Get color based on value
  const getColor = (value: number, isNegativeBetter: boolean = false) => {
    if (isNegativeBetter) {
      // For volatility and drawdown, lower is better
      if (value < -2) return 'bg-red-600 text-white';
      if (value < -1) return 'bg-red-500 text-white';
      if (value < 0) return 'bg-red-400 text-white';
      if (value < 1) return 'bg-yellow-300 text-gray-900';
      if (value < 2) return 'bg-yellow-200 text-gray-900';
      return 'bg-green-400 text-white';
    } else {
      // For returns, higher is better
      if (value < -2) return 'bg-red-600 text-white';
      if (value < -1) return 'bg-red-500 text-white';
      if (value < 0) return 'bg-red-400 text-white';
      if (value < 1) return 'bg-yellow-300 text-gray-900';
      if (value < 2) return 'bg-yellow-200 text-gray-900';
      return 'bg-green-400 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics Heatmap */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm" aria-label="TSP fund performance heatmap">
          <caption className="sr-only">Performance, volatility, and drawdown comparison across TSP funds</caption>
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th scope="col" className="px-4 py-3 text-left font-semibold">Fund</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Total Return</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Avg Daily Change</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Volatility</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Max Drawdown</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => (
              <tr key={metric.fund} className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/70">
                <td className="py-3 px-4 font-semibold">{metric.fund} Fund</td>
                <td className="text-right py-3 px-4">
                  <span className={`px-3 py-1 rounded font-semibold ${getColor(metric.totalReturn)}`}>
                    {metric.totalReturn.toFixed(2)}%
                  </span>
                </td>
                <td className="text-right py-3 px-4">
                  <span className={`px-3 py-1 rounded font-semibold ${getColor(metric.avgDailyChange)}`}>
                    {metric.avgDailyChange.toFixed(3)}%
                  </span>
                </td>
                <td className="text-right py-3 px-4">
                  <span className={`px-3 py-1 rounded font-semibold ${getColor(metric.volatility, true)}`}>
                    {metric.volatility.toFixed(3)}%
                  </span>
                </td>
                <td className="text-right py-3 px-4">
                  <span className={`px-3 py-1 rounded font-semibold ${getColor(metric.maxDrawdown, true)}`}>
                    {metric.maxDrawdown.toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
        <p className="mb-2 text-sm font-semibold">Color legend (values are also shown as text):</p>
        <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-600 rounded"></div>
            <span>Worst</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-300 rounded"></div>
            <span>Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-400 rounded"></div>
            <span>Best</span>
          </div>
        </div>
      </div>
    </div>
  );
}
