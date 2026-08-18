import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';

interface PriceData {
  date: Date;
  price: number;
  dailyChange: number;
}

interface FundChartProps {
  data: PriceData[];
  fundSymbol: string;
}

export default function FundChart({ data, fundSymbol }: FundChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-slate-500 dark:text-slate-400 sm:h-96" role="status">
        No data available for this period
      </div>
    );
  }

  // Format data for recharts
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    price: parseFloat(item.price.toFixed(4)),
    dailyChange: parseFloat(item.dailyChange.toFixed(2)),
    timestamp: new Date(item.date).getTime(),
  }));

  // Sort by timestamp
  chartData.sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="h-72 w-full sm:h-96" role="img" aria-label={`${fundSymbol} Fund share price and daily percentage change chart`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval={Math.floor(chartData.length / 6)}
          />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: any) => {
              if (typeof value === 'number') {
                return value.toFixed(4);
              }
              return value;
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            dot={false}
            strokeWidth={2}
            name={`${fundSymbol} Fund Price`}
            isAnimationActive={false}
          />
          <Bar
            yAxisId="right"
            dataKey="dailyChange"
            fill="#8b5cf6"
            opacity={0.3}
            name="Daily % Change"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
