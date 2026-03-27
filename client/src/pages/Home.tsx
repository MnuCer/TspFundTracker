/**
 * Home — Main TSP Fund Tracker Dashboard
 * Design: Precision Dashboard — Dark Navy Professional
 * Layout: Ticker strip → Header → Fund cards → Tabbed analytics
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Settings,
  BarChart2,
  TrendingUp,
  Table2,
  Activity,
  Layers,
  AlertCircle,
  Wifi,
  WifiOff,
  Download,
} from "lucide-react";
import { useTSPData } from "@/hooks/useTSPData";
import { FUNDS, FUND_COLORS, FundName, exportToCSV } from "@/lib/tspData";
import TickerStrip from "@/components/TickerStrip";
import FundCard from "@/components/FundCard";
import PriceChart from "@/components/PriceChart";
import MACDChart from "@/components/MACDChart";
import RSIChart from "@/components/RSIChart";
import PerformanceHeatmap from "@/components/PerformanceHeatmap";
import DataTable from "@/components/DataTable";
import ComparisonChart from "@/components/ComparisonChart";
import SMAChart from "@/components/SMAChart";
import SettingsPanel from "@/components/SettingsPanel";

type Tab =
  | "overview"
  | "analytics"
  | "heatmap"
  | "comparison"
  | "table";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <BarChart2 size={14} /> },
  { id: "analytics", label: "Analytics", icon: <Activity size={14} /> },
  { id: "heatmap", label: "Heatmap", icon: <Layers size={14} /> },
  { id: "comparison", label: "Comparison", icon: <TrendingUp size={14} /> },
  { id: "table", label: "Data Table", icon: <Table2 size={14} /> },
];

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-lg p-4 h-44">
            <div className="skeleton h-3 w-20 rounded mb-3" />
            <div className="skeleton h-6 w-28 rounded mb-2" />
            <div className="skeleton h-3 w-16 rounded mb-4" />
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((j) => (
                <div key={j} className="skeleton h-8 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="skeleton h-80 rounded-lg" />
    </div>
  );
}

export default function Home() {
  const {
    data,
    stats,
    macdData,
    rsiData,
    sma20Data,
    sma50Data,
    loading,
    error,
    lastUpdated,
    refresh,
  } = useTSPData();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedFund, setSelectedFund] = useState<FundName>("C Fund");
  const [showSettings, setShowSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const latestData = data[0];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ticker Strip */}
      <TickerStrip stats={stats} loading={loading} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60">
        <div className="container">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <TrendingUp size={16} className="text-blue-400" />
              </div>
              <div>
                <div className="font-bold text-slate-100 text-sm leading-none">
                  TSP Fund Tracker
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Thrift Savings Plan Analytics
                </div>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Last updated */}
              {lastUpdated && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                  <Wifi size={11} className="text-emerald-500" />
                  Updated {lastUpdated.toLocaleTimeString()}
                </div>
              )}

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-md hover:border-slate-600 transition-all disabled:opacity-50"
              >
                <RefreshCw
                  size={12}
                  className={isRefreshing ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Export */}
              <button
                onClick={() => data.length > 0 && exportToCSV(data)}
                disabled={data.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-md hover:border-slate-600 transition-all disabled:opacity-50"
              >
                <Download size={12} />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-md hover:border-slate-600 transition-all"
              >
                <Settings size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero banner */}
      <div
        className="relative h-32 sm:h-40 overflow-hidden"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663426399091/CDW8nQ4b5GgCRphacBZtHJ/tsp-hero-bg-3VBSNGkDy2ao3diNWj5km5.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
        <div className="relative container h-full flex flex-col justify-center">
          <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">
            Federal Retirement Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            TSP Fund Performance
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time G, C, S &amp; I Fund tracking — powered by TSP.gov
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 container py-6 space-y-6">
        {/* Error state */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-sm">Unable to fetch live data</div>
              <div className="text-xs mt-0.5 text-rose-400/80">{error}</div>
              <button
                onClick={handleRefresh}
                className="text-xs text-rose-300 hover:text-rose-200 underline mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && data.length === 0 ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Fund Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {stats.map((stat, i) => (
                <FundCard
                  key={stat.fund}
                  stat={stat}
                  onClick={() => setSelectedFund(stat.fund as FundName)}
                  isSelected={selectedFund === stat.fund}
                  index={i}
                />
              ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 border-b border-slate-800/60 overflow-x-auto pb-px">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all border-b-2 -mb-px
                    ${activeTab === tab.id
                      ? "border-blue-500 text-blue-300"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-4">
                    <PriceChart
                      data={data}
                      selectedFunds={[...FUNDS]}
                      mode="price"
                    />
                    <PriceChart
                      data={data}
                      selectedFunds={[...FUNDS]}
                      mode="change"
                    />
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === "analytics" && (
                  <div className="space-y-4">
                    {/* Fund selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Analyzing:</span>
                      {FUNDS.map((fund) => (
                        <button
                          key={fund}
                          onClick={() => setSelectedFund(fund)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all border ${
                            selectedFund === fund
                              ? "border-current"
                              : "border-slate-700/40 text-slate-500 hover:text-slate-300"
                          }`}
                          style={
                            selectedFund === fund
                              ? {
                                  color: FUND_COLORS[fund],
                                  borderColor: `${FUND_COLORS[fund]}60`,
                                  background: `${FUND_COLORS[fund]}10`,
                                }
                              : {}
                          }
                        >
                          {fund}
                        </button>
                      ))}
                    </div>

                    {/* SMA Chart */}
                    {sma20Data[selectedFund] && sma50Data[selectedFund] && (
                      <SMAChart
                        data={data}
                        sma20={sma20Data[selectedFund]}
                        sma50={sma50Data[selectedFund]}
                        fund={selectedFund}
                        days={120}
                      />
                    )}

                    {/* MACD Chart */}
                    {macdData[selectedFund] && (
                      <MACDChart
                        data={macdData[selectedFund]}
                        fundName={selectedFund}
                        fundColor={FUND_COLORS[selectedFund]}
                      />
                    )}

                    {/* RSI Chart */}
                    {rsiData[selectedFund] && (
                      <RSIChart
                        data={rsiData[selectedFund]}
                        fundName={selectedFund}
                        fundColor={FUND_COLORS[selectedFund]}
                      />
                    )}
                  </div>
                )}

                {/* Heatmap Tab */}
                {activeTab === "heatmap" && (
                  <div className="space-y-4">
                    <PerformanceHeatmap data={data} days={30} />
                    <PerformanceHeatmap data={data} days={60} />
                  </div>
                )}

                {/* Comparison Tab */}
                {activeTab === "comparison" && (
                  <ComparisonChart data={data} />
                )}

                {/* Table Tab */}
                {activeTab === "table" && (
                  <DataTable data={data} maxRows={50} />
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              Data sourced from{" "}
              <a
                href="https://www.tsp.gov/share-price-history/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500/70 hover:text-blue-400 transition-colors"
              >
                TSP.gov
              </a>{" "}
              — Updated daily after market close
            </div>
            <div>
              TSP Fund Tracker — Not affiliated with the Thrift Savings Plan
            </div>
          </div>
        </div>
      </footer>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            onRefresh={handleRefresh}
            data={data}
            lastUpdated={lastUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
