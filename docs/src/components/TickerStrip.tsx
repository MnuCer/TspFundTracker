/**
 * TickerStrip — Scrolling live fund price ticker
 * Design: Precision Dashboard — Dark Navy Professional
 */

import { FundStats, FUND_COLORS, formatPct, FundName } from "@/lib/tspData";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TickerStripProps {
  stats: FundStats[];
  loading?: boolean;
}

function TickerItem({ stat }: { stat: FundStats }) {
  const isGain = stat.dailyChangePct > 0;
  const isLoss = stat.dailyChangePct < 0;
  const color = isGain ? "text-emerald-400" : isLoss ? "text-rose-400" : "text-slate-400";
  const Icon = isGain ? TrendingUp : isLoss ? TrendingDown : Minus;

  return (
    <span className="inline-flex items-center gap-2 px-4 py-1">
      <span
        className="font-bold text-xs tracking-widest uppercase"
        style={{ color: FUND_COLORS[stat.fund as FundName] }}
      >
        {stat.fund}
      </span>
      <span className="font-mono text-sm text-slate-200">
        ${stat.currentPrice.toFixed(4)}
      </span>
      <span className={`flex items-center gap-1 font-mono text-xs font-medium ${color}`}>
        <Icon size={11} />
        {formatPct(stat.dailyChangePct)}
      </span>
      <span className="text-slate-600 mx-1">|</span>
    </span>
  );
}

export default function TickerStrip({ stats, loading }: TickerStripProps) {
  if (loading) {
    return (
      <div className="h-8 bg-slate-900/80 border-b border-slate-800 flex items-center px-4">
        <div className="skeleton h-3 w-64 rounded" />
      </div>
    );
  }

  if (stats.length === 0) return null;

  // Duplicate content for seamless loop
  const items = [...stats, ...stats, ...stats, ...stats];

  return (
    <div className="h-9 bg-slate-950/90 border-b border-slate-800/60 backdrop-blur-sm overflow-hidden flex items-center">
      <div className="flex-shrink-0 flex items-center px-3 border-r border-slate-700/50 h-full bg-blue-600/10">
        <span className="text-blue-400 font-bold text-xs tracking-widest uppercase">
          LIVE
        </span>
        <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
      </div>
      <div className="ticker-strip flex-1">
        <div className="ticker-content">
          {items.map((stat, i) => (
            <TickerItem key={`${stat.fund}-${i}`} stat={stat} />
          ))}
        </div>
      </div>
    </div>
  );
}
