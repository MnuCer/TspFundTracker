/**
 * PerformanceHeatmap — Daily performance heatmap grid
 * Design: Precision Dashboard — Dark Navy Professional
 */

import { useMemo } from "react";
import { FundDataPoint, FundName, FUNDS, FUND_COLORS, formatPct } from "@/lib/tspData";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

interface PerformanceHeatmapProps {
  data: FundDataPoint[];
  days?: number;
}

function getHeatColor(value: number): { bg: string; text: string } {
  const abs = Math.abs(value);
  if (value > 0) {
    if (abs > 2) return { bg: "rgba(16,185,129,0.85)", text: "#fff" };
    if (abs > 1) return { bg: "rgba(16,185,129,0.6)", text: "#fff" };
    if (abs > 0.5) return { bg: "rgba(16,185,129,0.35)", text: "#6ee7b7" };
    if (abs > 0.1) return { bg: "rgba(16,185,129,0.15)", text: "#6ee7b7" };
    return { bg: "rgba(16,185,129,0.05)", text: "#64748b" };
  } else if (value < 0) {
    if (abs > 2) return { bg: "rgba(244,63,94,0.85)", text: "#fff" };
    if (abs > 1) return { bg: "rgba(244,63,94,0.6)", text: "#fff" };
    if (abs > 0.5) return { bg: "rgba(244,63,94,0.35)", text: "#fda4af" };
    if (abs > 0.1) return { bg: "rgba(244,63,94,0.15)", text: "#fda4af" };
    return { bg: "rgba(244,63,94,0.05)", text: "#64748b" };
  }
  return { bg: "rgba(100,116,139,0.1)", text: "#64748b" };
}

export default function PerformanceHeatmap({ data, days = 30 }: PerformanceHeatmapProps) {
  const heatmapData = useMemo(() => {
    return data.slice(0, days).reverse();
  }, [data, days]);

  return (
    <div className="chart-container p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-slate-300">Performance Heatmap</div>
          <div className="text-xs text-slate-500 mt-0.5">Daily % change — last {days} trading days</div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Loss</span>
          {[-2, -1, -0.5, 0, 0.5, 1, 2].map((v) => {
            const { bg } = getHeatColor(v);
            return (
              <span
                key={v}
                className="w-4 h-4 rounded-sm inline-block"
                style={{ background: bg }}
              />
            );
          })}
          <span className="text-slate-500">Gain</span>
        </div>
      </div>

      {/* Fund rows */}
      <div className="space-y-2">
        {FUNDS.map((fund) => (
          <div key={fund} className="flex items-center gap-2">
            <div
              className="w-16 text-xs font-bold flex-shrink-0 text-right"
              style={{ color: FUND_COLORS[fund] }}
            >
              {fund}
            </div>
            <div className="flex gap-0.5 flex-1 overflow-hidden">
              {heatmapData.map((d, i) => {
                const change = d.changes[fund];
                const { bg, text } = getHeatColor(change);
                return (
                  <motion.div
                    key={d.date}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className="heatmap-cell flex-1 min-w-[18px] h-8 rounded-sm flex items-center justify-center relative group"
                    style={{ background: bg }}
                    title={`${fund} ${format(parseISO(d.date), "MMM d")}: ${formatPct(change)}`}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 pointer-events-none">
                      <div className="glass-card rounded px-2 py-1 text-xs whitespace-nowrap border border-slate-700/60 shadow-lg">
                        <div className="text-slate-400 text-[10px]">
                          {format(parseISO(d.date), "MMM d, yyyy")}
                        </div>
                        <div className="font-mono font-bold" style={{ color: text }}>
                          {formatPct(change)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Date labels */}
      <div className="flex items-center gap-2 mt-2">
        <div className="w-16 flex-shrink-0" />
        <div className="flex gap-0.5 flex-1 overflow-hidden">
          {heatmapData.map((d, i) => (
            <div
              key={d.date}
              className="flex-1 min-w-[18px] text-center"
            >
              {i % 5 === 0 && (
                <span className="text-[9px] text-slate-600 font-mono">
                  {format(parseISO(d.date), "M/d")}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
