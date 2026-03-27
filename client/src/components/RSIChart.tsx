/**
 * RSIChart — Relative Strength Index Chart
 * Design: Precision Dashboard — Dark Navy Professional
 */

import { useMemo } from "react";
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
import { format, parseISO } from "date-fns";

interface RSIChartProps {
  data: Array<{ date: string; rsi: number }>;
  fundName: string;
  fundColor: string;
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
  const rsi = payload[0]?.value;
  const zone =
    rsi >= 70 ? "Overbought" : rsi <= 30 ? "Oversold" : "Neutral";
  const zoneColor =
    rsi >= 70 ? "#f43f5e" : rsi <= 30 ? "#10b981" : "#64748b";

  return (
    <div className="glass-card rounded-lg p-3 shadow-xl border border-slate-700/60">
      <div className="text-xs text-slate-400 mb-1">
        {label ? format(parseISO(label), "MMM d, yyyy") : ""}
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-300">RSI(14):</span>
        <span className="font-mono font-bold text-sm" style={{ color: payload[0]?.color }}>
          {rsi?.toFixed(2)}
        </span>
        <span className="text-xs font-medium" style={{ color: zoneColor }}>
          {zone}
        </span>
      </div>
    </div>
  );
};

export default function RSIChart({ data, fundName, fundColor }: RSIChartProps) {
  const chartData = useMemo(() => data.slice(0, 120).reverse(), [data]);

  return (
    <div className="chart-container p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-slate-300">
            RSI(14) — {fundName}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Relative Strength Index — Overbought &gt;70, Oversold &lt;30
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span className="text-slate-400">Overbought (70)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-slate-400">Oversold (30)</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          {/* Overbought/oversold zones */}
          <defs>
            <linearGradient id="rsi-overbought" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="rsi-oversold" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
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
            domain={[0, 100]}
            tick={{ fill: "#64748b", fontSize: 10, fontFamily: "DM Mono" }}
            tickLine={false}
            axisLine={false}
            ticks={[0, 30, 50, 70, 100]}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="4 2" strokeOpacity={0.6} />
          <ReferenceLine y={50} stroke="#334155" strokeDasharray="4 2" strokeOpacity={0.4} />
          <ReferenceLine y={30} stroke="#10b981" strokeDasharray="4 2" strokeOpacity={0.6} />
          <Line
            type="monotone"
            dataKey="rsi"
            stroke={fundColor}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
