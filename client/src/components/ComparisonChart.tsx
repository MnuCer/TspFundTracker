/**
 * ComparisonChart — Normalized fund comparison (indexed to 100)
 * Design: Precision Dashboard — Dark Navy Professional
 */

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { FundDataPoint, FundName, FUNDS, FUND_COLORS, formatPct } from "@/lib/tspData";
import { format, parseISO } from "date-fns";

interface ComparisonChartProps {
  data: FundDataPoint[];
}

const RANGE_OPTIONS = [
  { label: "1M", days: 21 },
  { label: "3M", days: 63 },
  { label: "6M", days: 126 },
  { label: "1Y", days: 252 },
  { label: "2Y", days: 504 },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="glass-card rounded-lg p-3 shadow-xl border border-slate-700/60 min-w-[200px]">
      <div className="text-xs text-slate-400 mb-2">
        {label ? format(parseISO(label), "MMM d, yyyy") : ""}
      </div>
      {[...payload]
        .sort((a, b) => b.value - a.value)
        .map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: entry.color }}
              />
              <span className="text-slate-300">{entry.name}</span>
            </span>
            <span
              className="font-mono font-medium"
              style={{ color: entry.value >= 100 ? "#10b981" : "#f43f5e" }}
            >
              {entry.value >= 100 ? "+" : ""}
              {(entry.value - 100).toFixed(2)}%
            </span>
          </div>
        ))}
    </div>
  );
};

export default function ComparisonChart({ data }: ComparisonChartProps) {
  const [activeRange, setActiveRange] = useState(252);
  const [selectedFunds, setSelectedFunds] = useState<Set<FundName>>(new Set(FUNDS));

  const { chartData, yAxisDomain } = useMemo(() => {
    const sliced = data.slice(0, activeRange).reverse();
    if (sliced.length === 0) return { chartData: [], yAxisDomain: [90, 110] };

    // Index to 100 at start
    const baseValues: Record<FundName, number> = {} as Record<FundName, number>;
    for (const fund of FUNDS) {
      baseValues[fund] = sliced[0].prices[fund];
    }

    const indexed = sliced.map((d) => ({
      date: d.date,
      ...Object.fromEntries(
        FUNDS.filter((f) => selectedFunds.has(f)).map((f) => [
          f,
          baseValues[f] > 0 ? (d.prices[f] / baseValues[f]) * 100 : 100,
        ])
      ),
    }));

    // Calculate min/max from selected funds only
    let minVal = 100;
    let maxVal = 100;
    indexed.forEach((point: any) => {
      FUNDS.forEach((fund) => {
        if (selectedFunds.has(fund) && point[fund]) {
          const val = point[fund] as number;
          minVal = Math.min(minVal, val);
          maxVal = Math.max(maxVal, val);
        }
      });
    });

    // Add 5% padding above and below
    const padding = (maxVal - minVal) * 0.05 || 5;
    const domain = [
      Math.floor((minVal - padding) * 10) / 10,
      Math.ceil((maxVal + padding) * 10) / 10,
    ];

    return { chartData: indexed, yAxisDomain: domain };
  }, [data, activeRange, selectedFunds]);

  const toggleFund = (fund: FundName) => {
    setSelectedFunds((prev) => {
      const next = new Set(prev);
      if (next.has(fund)) {
        if (next.size > 1) next.delete(fund);
      } else {
        next.add(fund);
      }
      return next;
    });
  };

  return (
    <div className="chart-container p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-slate-300">Fund Comparison</div>
          <div className="text-xs text-slate-500 mt-0.5">Indexed to 100 at period start</div>
        </div>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setActiveRange(opt.days)}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-all
                ${activeRange === opt.days
                  ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fund toggles */}
      <div className="flex gap-2 mb-4">
        {FUNDS.map((fund) => (
          <button
            key={fund}
            onClick={() => toggleFund(fund)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all border ${
              selectedFunds.has(fund)
                ? "border-current"
                : "border-slate-700/40 text-slate-600"
            }`}
            style={selectedFunds.has(fund) ? { color: FUND_COLORS[fund], borderColor: `${FUND_COLORS[fund]}60` } : {}}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: selectedFunds.has(fund) ? FUND_COLORS[fund] : "#334155" }}
            />
            {fund}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748b", fontSize: 10, fontFamily: "DM Mono" }}
            tickLine={false}
            axisLine={{ stroke: "#1e293b" }}
            tickFormatter={(v) => format(parseISO(v), "MMM d")}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 10, fontFamily: "DM Mono" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v - 100).toFixed(1)}%`}
            width={50}
            domain={yAxisDomain}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={100} stroke="#334155" strokeDasharray="4 2" />
          {FUNDS.filter((f) => selectedFunds.has(f)).map((fund) => (
            <Line
              key={fund}
              type="monotone"
              dataKey={fund}
              stroke={FUND_COLORS[fund]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
