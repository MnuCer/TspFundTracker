/**
 * DataTable — Sortable fund price history table
 * Design: Precision Dashboard — Dark Navy Professional
 */

import { useState, useMemo } from "react";
import { FundDataPoint, FundName, FUNDS, FUND_COLORS, formatPct } from "@/lib/tspData";
import { format, parseISO } from "date-fns";
import { ChevronUp, ChevronDown, ChevronsUpDown, Download } from "lucide-react";
import { exportToCSV } from "@/lib/tspData";

interface DataTableProps {
  data: FundDataPoint[];
  maxRows?: number;
}

type SortKey = "date" | FundName | `${FundName}_change`;
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={12} className="text-slate-600" />;
  return dir === "asc" ? (
    <ChevronUp size={12} className="text-blue-400" />
  ) : (
    <ChevronDown size={12} className="text-blue-400" />
  );
}

export default function DataTable({ data, maxRows = 50 }: DataTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showRows, setShowRows] = useState(maxRows);
  const [viewMode, setViewMode] = useState<"price" | "change">("price");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      if (sortKey === "date") {
        aVal = a.date;
        bVal = b.date;
      } else if (sortKey.endsWith("_change")) {
        const fund = sortKey.replace("_change", "") as FundName;
        aVal = a.changes[fund];
        bVal = b.changes[fund];
      } else {
        aVal = a.prices[sortKey as FundName];
        bVal = b.prices[sortKey as FundName];
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted.slice(0, showRows);
  }, [data, sortKey, sortDir, showRows]);

  const ColHeader = ({
    label,
    sortK,
    align = "right",
  }: {
    label: string;
    sortK: SortKey;
    align?: "left" | "right";
  }) => (
    <th
      className={`px-3 py-2.5 text-xs font-semibold text-slate-400 cursor-pointer hover:text-slate-200 transition-colors whitespace-nowrap select-none ${
        align === "right" ? "text-right" : "text-left"
      }`}
      onClick={() => handleSort(sortK)}
    >
      <span className="flex items-center gap-1 justify-end">
        {label}
        <SortIcon active={sortKey === sortK} dir={sortDir} />
      </span>
    </th>
  );

  return (
    <div className="chart-container">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
        <div className="text-sm font-semibold text-slate-300">Price History</div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md overflow-hidden border border-slate-700/60">
            <button
              onClick={() => setViewMode("price")}
              className={`px-3 py-1 text-xs font-medium transition-all ${
                viewMode === "price"
                  ? "bg-blue-600/30 text-blue-300"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Price
            </button>
            <button
              onClick={() => setViewMode("change")}
              className={`px-3 py-1 text-xs font-medium transition-all ${
                viewMode === "change"
                  ? "bg-blue-600/30 text-blue-300"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              % Change
            </button>
          </div>
          {/* Export */}
          <button
            onClick={() => exportToCSV(data)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-md hover:border-slate-600 transition-all"
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800/60 bg-slate-900/40">
              <ColHeader label="Date" sortK="date" align="left" />
              {FUNDS.map((fund) => (
                <ColHeader
                  key={fund}
                  label={fund}
                  sortK={viewMode === "price" ? fund : `${fund}_change` as SortKey}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <tr
                key={row.date}
                className={`border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors ${
                  i % 2 === 0 ? "bg-transparent" : "bg-slate-900/20"
                }`}
              >
                <td className="px-3 py-2 text-slate-400 font-mono whitespace-nowrap">
                  {format(parseISO(row.date), "MMM d, yyyy")}
                </td>
                {FUNDS.map((fund) => {
                  const value =
                    viewMode === "price" ? row.prices[fund] : row.changes[fund];
                  const isChange = viewMode === "change";
                  const color = isChange
                    ? value > 0
                      ? "#10b981"
                      : value < 0
                      ? "#f43f5e"
                      : "#64748b"
                    : FUND_COLORS[fund];

                  return (
                    <td key={fund} className="px-3 py-2 text-right font-mono tabular-nums">
                      <span style={{ color }}>
                        {isChange ? formatPct(value) : `$${value.toFixed(4)}`}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {showRows < data.length && (
        <div className="p-3 text-center border-t border-slate-800/60">
          <button
            onClick={() => setShowRows((n) => n + 50)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Load more ({data.length - showRows} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
