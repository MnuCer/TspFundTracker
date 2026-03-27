/**
 * FundCard — Individual fund performance card
 * Design: Precision Dashboard — Dark Navy Professional
 */

import { FundStats, FUND_COLORS, FUND_DESCRIPTIONS, formatPct, FundName } from "@/lib/tspData";
import { TrendingUp, TrendingDown, Minus, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";

interface FundCardProps {
  stat: FundStats;
  onClick?: () => void;
  isSelected?: boolean;
  index?: number;
}

export default function FundCard({ stat, onClick, isSelected, index = 0 }: FundCardProps) {
  const isGain = stat.dailyChangePct > 0;
  const isLoss = stat.dailyChangePct < 0;
  const changeColor = isGain ? "#10b981" : isLoss ? "#f43f5e" : "#64748b";
  const bgGlow = isGain ? "rgba(16,185,129,0.05)" : isLoss ? "rgba(244,63,94,0.05)" : "transparent";
  const Icon = isGain ? TrendingUp : isLoss ? TrendingDown : Minus;
  const fundColor = FUND_COLORS[stat.fund as FundName];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      onClick={onClick}
      className={`relative glass-card rounded-lg p-4 cursor-pointer transition-all duration-200 group
        ${isSelected ? "ring-1 ring-blue-500/60 bg-blue-500/5" : "hover:border-slate-600/60"}`}
      style={{ background: `linear-gradient(135deg, ${bgGlow}, transparent)` }}
    >
      {/* Fund badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: `${fundColor}20`, color: fundColor, border: `1px solid ${fundColor}40` }}
          >
            {stat.fund.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-sm text-slate-100">{stat.fund}</div>
            <div className="text-xs text-slate-500 leading-tight max-w-[140px] truncate">
              {FUND_DESCRIPTIONS[stat.fund as FundName].split("—")[0]}
            </div>
          </div>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
          style={{ background: `${changeColor}15`, color: changeColor }}
        >
          <Icon size={11} />
          {formatPct(stat.dailyChangePct)}
        </div>
      </div>

      {/* Price */}
      <div className="mb-3">
        <div className="font-mono text-2xl font-medium text-slate-100 tabular-nums">
          ${stat.currentPrice.toFixed(4)}
        </div>
        <div className="font-mono text-xs mt-0.5" style={{ color: changeColor }}>
          {stat.dailyChange >= 0 ? "+" : ""}${stat.dailyChange.toFixed(4)} today
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/60">
        <StatCell label="1W" value={stat.weekChange} />
        <StatCell label="1M" value={stat.monthChange} />
        <StatCell label="YTD" value={stat.ytdChange} />
      </div>

      {/* 52-week range */}
      <div className="mt-3 pt-2 border-t border-slate-800/40">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>52W Range</span>
          <span className="font-mono">${stat.low52w.toFixed(2)} — ${stat.high52w.toFixed(2)}</span>
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${((stat.currentPrice - stat.low52w) / (stat.high52w - stat.low52w)) * 100}%`,
              background: `linear-gradient(90deg, ${fundColor}60, ${fundColor})`,
            }}
          />
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <BarChart2 size={12} className="text-blue-400" />
        </div>
      )}
    </motion.div>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  const isGain = value > 0;
  const isLoss = value < 0;
  const color = isGain ? "#10b981" : isLoss ? "#f43f5e" : "#64748b";

  return (
    <div className="text-center">
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div className="font-mono text-xs font-medium" style={{ color }}>
        {formatPct(value, 1)}
      </div>
    </div>
  );
}
