import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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

interface ComparisonChartProps {
  data: ComparisonData;
}

export default function ComparisonChart({ data }: ComparisonChartProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        No data available
      </div>
    );
  }

  // Normalize prices to percentage change from start
  const normalizeData = () => {
    const chartData: any[] = [];
    const fundKeys = Object.keys(data).filter((key) => data[key]?.prices?.length > 0);

    if (fundKeys.length === 0) return [];

    // Get the maximum number of data points
    const maxLength = Math.max(
      ...fundKeys.map((fund) => data[fund]?.prices?.length || 0)
    );

    for (let i = 0; i < maxLength; i++) {
      const point: any = {};
      const dateSource = fundKeys.map((fund) => data[fund]?.prices?.[i]).find(Boolean);
      if (dateSource) {
        point.date = new Date(dateSource.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }

      for (const fund of fundKeys) {
        const prices = data[fund]?.prices || [];
        if (prices[i]) {
          const startPrice = prices[0]?.price || 1;
          const currentPrice = prices[i].price;
          const percentChange = ((currentPrice - startPrice) / startPrice) * 100;

          point[`${fund}Fund`] = parseFloat(percentChange.toFixed(2));

        }
      }

      if (Object.keys(point).length > 0) {
        chartData.push(point);
      }
    }

    return chartData;
  };

  const chartData = normalizeData();
  const fundKeys = Object.keys(data).filter((key) => data[key]?.prices?.length > 0);
  const percentValues = chartData.flatMap((point) => fundKeys
    .map((fund) => point[`${fund}Fund`])
    .filter((value): value is number => typeof value === 'number'));
  const maxAbsPercent = Math.max(2, ...percentValues.map((value) => Math.abs(value)));
  const axisBound = Math.ceil(maxAbsPercent * 1.1 * 10) / 10;

  const colors: Record<string, string> = {
    GFund: '#3b82f6',
    CFund: '#10b981',
    SFund: '#8b5cf6',
    IFund: '#f59e0b',
  };

  return (
    <div className="h-72 w-full sm:h-96" role="img" aria-label="Percentage change comparison of TSP funds centered around zero">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval={Math.floor(chartData.length / 6)}
          />
          {/* Center Y-axis at 0 for percentage comparison */}
          <YAxis
            tick={{ fontSize: 12 }}
            label={{ value: 'Percentage Change (%)', angle: -90, position: 'insideLeft' }}
            domain={[-axisBound, axisBound]}
          />
          <Tooltip
            formatter={(value: any) => {
              if (typeof value === 'number') {
                return `${value.toFixed(2)}%`;
              }
              return value;
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          {fundKeys.map((fund) => (
            <Line
              key={fund}
              type="monotone"
              dataKey={`${fund}Fund`}
              stroke={colors[`${fund}Fund`]}
              dot={false}
              strokeWidth={2}
              name={`${fund} Fund`}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
