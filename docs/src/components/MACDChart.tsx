/**
 * MACDChart — MACD Technical Analysis Chart
 * Design: Precision Dashboard — Dark Navy Professional
 */

import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import { MACDData } from "@/lib/tspData";
import { format, parseISO } from "date-fns";

interface MACDChartProps {
  data: MACDData[];
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
            {typeof entry.value === "number" ? entry.value.toFixed(4) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function MACDChart({ data, fundName, fundColor }: MACDChartProps) {
  const chartData = useMemo(() => data.slice(0, 120).reverse(), [data]);

  return (
    <div className="chart-container p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-slate-300">
            MACD — {fundName}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Moving Average Convergence/Divergence (12, 26, 9)
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-400 inline-block" />
            <span className="text-slate-400">MACD</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-orange-400 inline-block" />
            <span className="text-slate-400">Signal</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-emerald-500/40 border border-emerald-500/60 inline-block rounded-sm" />
            <span className="text-slate-400">Histogram</span>
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
            tickFormatter={(v) => v.toFixed(2)}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 2" />
          <Bar
            dataKey="histogram"
            name="Histogram"
            fill="#10b981"
            opacity={0.6}
            radius={[1, 1, 0, 0]}
            // Color bars based on value
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="macd"
            name="MACD"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="signal"
            name="Signal"
            stroke="#f97316"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
