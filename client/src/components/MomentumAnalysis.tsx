import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

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

interface MomentumAnalysisProps {
  data: ComparisonData;
}

export default function MomentumAnalysis({ data }: MomentumAnalysisProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex min-h-72 items-center justify-center text-slate-500 dark:text-slate-400" role="status">
        No momentum data available for this period.
      </div>
    );
  }

  const fundKeys = Object.keys(data).filter((key) => data[key]?.indicators?.length > 0);

  if (fundKeys.length === 0) {
    return (
      <div className="flex min-h-72 items-center justify-center text-slate-500 dark:text-slate-400" role="status">
        No momentum data available for this period.
      </div>
    );
  }

  // Get the latest indicators for each fund
  const latestMomentum = fundKeys.map((fund) => {
    const indicators = data[fund]?.indicators || [];
    if (indicators.length === 0) return null;

    const latest = indicators[indicators.length - 1];
    return {
      fund: `${fund} Fund`,
      '3-Month': parseFloat(latest.momentum3Month.toFixed(2)),
      '1-Month': parseFloat(latest.momentum1Month.toFixed(2)),
      '2-Week': parseFloat(latest.momentum2Week.toFixed(2)),
    };
  }).filter((m) => m !== null);

  const colors = ['#3b82f6', '#10b981', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Momentum Comparison Chart */}
      <div className="h-72 w-full sm:h-96" role="img" aria-label="Two-week, one-month, and three-month momentum comparison chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={latestMomentum}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fund" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{ value: 'Momentum (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: any) => {
                if (typeof value === 'number') {
                  return `${value.toFixed(2)}%`;
                }
                return value;
              }}
            />
            <Legend />
            <Bar dataKey="3-Month" fill={colors[0]} isAnimationActive={false} />
            <Bar dataKey="1-Month" fill={colors[1]} isAnimationActive={false} />
            <Bar dataKey="2-Week" fill={colors[2]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Momentum Details Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm" aria-label="TSP fund momentum comparison">
          <caption className="sr-only">Momentum comparison across three-month, one-month, and two-week periods</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
              <th scope="col" className="px-4 py-3 text-left font-semibold">Fund</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">3-Month Momentum</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">1-Month Momentum</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">2-Week Momentum</th>
            </tr>
          </thead>
          <tbody>
            {latestMomentum.map((row) => (
              <tr key={row.fund} className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/70">
                <td className="py-3 px-4 font-semibold">{row.fund}</td>
                <td className="text-right py-3 px-4">
                  <span className={`font-semibold ${row['3-Month'] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row['3-Month'] >= 0 ? '+' : ''}{row['3-Month'].toFixed(2)}%
                  </span>
                </td>
                <td className="text-right py-3 px-4">
                  <span className={`font-semibold ${row['1-Month'] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row['1-Month'] >= 0 ? '+' : ''}{row['1-Month'].toFixed(2)}%
                  </span>
                </td>
                <td className="text-right py-3 px-4">
                  <span className={`font-semibold ${row['2-Week'] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row['2-Week'] >= 0 ? '+' : ''}{row['2-Week'].toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Momentum Interpretation */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
        <p className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">Momentum interpretation:</p>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-100">
          <li>• <strong>Positive momentum:</strong> Fund is trending upward over the period</li>
          <li>• <strong>Negative momentum:</strong> Fund is trending downward over the period</li>
          <li>• <strong>Larger values:</strong> Stronger trend in either direction</li>
          <li>• <strong>Compare periods:</strong> Shorter periods show recent trends, longer periods show overall direction</li>
        </ul>
      </div>
    </div>
  );
}
