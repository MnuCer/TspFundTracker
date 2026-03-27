/**
 * SettingsPanel — App settings and preferences
 * Design: Precision Dashboard — Dark Navy Professional
 */

import { useState } from "react";
import { X, RefreshCw, Download, Bell, Info, ExternalLink } from "lucide-react";
import { exportToCSV } from "@/lib/tspData";
import type { FundDataPoint } from "@/lib/tspData";

interface SettingsPanelProps {
  onClose: () => void;
  onRefresh: () => void;
  data: FundDataPoint[];
  lastUpdated: Date | null;
}

export default function SettingsPanel({
  onClose,
  onRefresh,
  data,
  lastUpdated,
}: SettingsPanelProps) {
  const [notifications, setNotifications] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-80 h-full bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="font-bold text-slate-200">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Data section */}
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Data
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/40">
                <div>
                  <div className="text-sm text-slate-300 font-medium">Last Updated</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {lastUpdated
                      ? lastUpdated.toLocaleTimeString()
                      : "Never"}
                  </div>
                </div>
                <button
                  onClick={onRefresh}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 border border-blue-500/30 rounded-md hover:bg-blue-500/10 transition-all"
                >
                  <RefreshCw size={12} />
                  Refresh
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/40">
                <div>
                  <div className="text-sm text-slate-300 font-medium">Export Data</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {data.length} trading days
                  </div>
                </div>
                <button
                  onClick={() => exportToCSV(data)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 border border-slate-700/60 rounded-md hover:bg-slate-800 transition-all"
                >
                  <Download size={12} />
                  CSV
                </button>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Notifications
            </h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/40">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-slate-400" />
                <div>
                  <div className="text-sm text-slate-300 font-medium">Price Alerts</div>
                  <div className="text-xs text-slate-500 mt-0.5">Daily update notifications</div>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-10 h-5 rounded-full transition-all relative ${
                  notifications ? "bg-blue-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                    notifications ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* About */}
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              About
            </h3>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/40 space-y-3">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-slate-400 leading-relaxed">
                  TSP Fund Tracker fetches official share price data directly from{" "}
                  <a
                    href="https://www.tsp.gov/share-price-history/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    TSP.gov
                  </a>
                  . Data is updated each business day after market close.
                </div>
              </div>

              <div className="border-t border-slate-700/40 pt-3 space-y-1.5">
                <InfoRow label="Data Source" value="TSP.gov" />
                <InfoRow label="Funds Tracked" value="G, C, S, I" />
                <InfoRow label="Update Frequency" value="Daily (after close)" />
                <InfoRow label="History" value="Since Jun 2003" />
              </div>

              <a
                href="https://www.tsp.gov/share-price-history/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink size={11} />
                View on TSP.gov
              </a>
            </div>
          </section>

          {/* Fund descriptions */}
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Fund Information
            </h3>
            <div className="space-y-2">
              {[
                { fund: "G Fund", desc: "Government Securities Investment Fund. Invests in US Treasury securities specially issued to the TSP. Guaranteed return, no market risk." },
                { fund: "C Fund", desc: "Common Stock Index Investment Fund. Tracks the S&P 500 Index. Invests in large and medium US company stocks." },
                { fund: "S Fund", desc: "Small Cap Stock Index Investment Fund. Tracks the Dow Jones U.S. Completion TSM Index. Invests in smaller US companies." },
                { fund: "I Fund", desc: "International Stock Index Investment Fund. Tracks the MSCI EAFE Index. Invests in international stocks from developed countries." },
              ].map(({ fund, desc }) => (
                <div key={fund} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <div className="text-xs font-bold text-slate-300 mb-1">{fund}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300 font-medium">{value}</span>
    </div>
  );
}
