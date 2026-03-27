/**
 * PriceChart — Interactive fund price history chart
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
  Legend,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { FundDataPoint, FundName, FUNDS, FUND_COLORS, formatPct } from "@/lib/tspData";
import { format, parseISO } from "date-fns";

interface PriceChartProps {
  data: FundDataPoint[];
  selectedFunds?: FundName[];
  mode?: "price" | "change";
  days?: number;
}

const RANGE_OPTIONS = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 252 },
  { label: "2Y", days: 504 },
];

const CustomTooltip = ({
  active,
  payload,
  label,
  mode,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  mode: "price" | "change";
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="glass-card rounded-lg p-3 shadow-xl border border-slate-700/60 min-w-[180px]">
      <div className="text-xs text-slate-400 mb-2 font-medium">
        {label ? format(parseISO(label), "MMM d, yyyy") : ""}
      </div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 text-xs mb-1">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: entry.color }}
            />
            <span className="text-slate-300">{entry.name}</span>
          </span>
          <span className="font-mono font-medium" style={{ color: entry.color }}>
            {mode === "price"
              ? `$${entry.value.toFixed(4)}`
              : formatPct(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function PriceChart({
  data,
  selectedFunds = [...FUNDS],
  mode = "price",
}: PriceChartProps) {
  const [activeRange, setActiveRange] = useState(90);

  const chartData = useMemo(() => {
    const sliced = data.slice(0, activeRange).reverse();
    return sliced.map((d) => ({
      date: d.date,
      ...Object.fromEntries(
        selectedFunds.map((f) => [
          f,
          mode === "price" ? d.prices[f] : d.changes[f],
        ])
      ),
    }));
  }, [data, activeRange, selectedFunds, mode]);

  const isChangeMode = mode === "change";

  return (
    <div className="chart-container p-4">
      {/* Range selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold text-slate-300">
          {isChangeMode ? "Daily % Change" : "Share Price History"}
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

      <ResponsiveContainer width="100%" height={320}>
        {isChangeMode ? (
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
              tickFormatter={(v) => `${v.toFixed(1)}%`}
              width={50}
            />
            <Tooltip content={<CustomTooltip mode="change" />} />
            <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 2" />
            {selectedFunds.map((fund) => (
              <Line
                key={fund}
                type="monotone"
                dataKey={fund}
                stroke={FUND_COLORS[fund]}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        ) : (
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              {selectedFunds.map((fund) => (
                <linearGradient key={fund} id={`grad-${fund.replace(" ", "-")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={FUND_COLORS[fund]} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={FUND_COLORS[fund]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
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
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              width={55}
            />
            <Tooltip content={<CustomTooltip mode="price" />} />
            {selectedFunds.map((fund) => (
              <Area
                key={fund}
                type="monotone"
                dataKey={fund}
                stroke={FUND_COLORS[fund]}
                strokeWidth={2}
                fill={`url(#grad-${fund.replace(" ", "-")})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
