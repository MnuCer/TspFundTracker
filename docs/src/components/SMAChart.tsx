/**
 * SMAChart — Price chart with SMA overlays
 * Design: Precision Dashboard — Dark Navy Professional
 */

import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { FundDataPoint, FundName, FUND_COLORS } from "@/lib/tspData";
import { format, parseISO } from "date-fns";

interface SMAChartProps {
  data: FundDataPoint[];
  sma20: Array<{ date: string; sma: number }>;
  sma50: Array<{ date: string; sma: number }>;
  fund: FundName;
  days?: number;
}

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
    <div className="glass-card rounded-lg p-3 shadow-xl border border-slate-700/60">
      <div className="text-xs text-slate-400 mb-2">
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
            ${entry.value?.toFixed(4)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function SMAChart({ data, sma20, sma50, fund, days = 120 }: SMAChartProps) {
  const fundColor = FUND_COLORS[fund];

  const chartData = useMemo(() => {
    const sliced = data.slice(0, days).reverse();
    const sma20Map = new Map(sma20.map((d) => [d.date, d.sma]));
    const sma50Map = new Map(sma50.map((d) => [d.date, d.sma]));

    return sliced.map((d) => ({
      date: d.date,
      Price: d.prices[fund],
      "SMA 20": sma20Map.get(d.date),
      "SMA 50": sma50Map.get(d.date),
    }));
  }, [data, sma20, sma50, fund, days]);

  return (
    <div className="chart-container p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-slate-300">
            Price + Moving Averages — {fund}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            20-day and 50-day Simple Moving Averages
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block" style={{ background: fundColor }} />
            <span className="text-slate-400">Price</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-yellow-400 inline-block" />
            <span className="text-slate-400">SMA 20</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-purple-400 inline-block" />
            <span className="text-slate-400">SMA 50</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
            domain={["auto", "auto"]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="Price"
            stroke={fundColor}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="SMA 20"
            stroke="#eab308"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="SMA 50"
            stroke="#a855f7"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="6 3"
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
