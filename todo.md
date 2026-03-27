# TSP Fund Tracker — Project TODO

## Core Features
- [x] Research TSP.gov API endpoint (CSV data at /data/fund-price-history.csv)
- [x] Initialize project scaffold (React + Vite + TypeScript + TailwindCSS)
- [x] Upgrade to full-stack (Express + tRPC + DB) for server-side CORS proxy
- [x] Backend TSP data proxy (server/routers.ts tsp.getFundData)
- [x] TSP data service (parseCSV, calculateStats, calculateMACD, calculateRSI, calculateSMA)
- [x] useTSPData hook with tRPC integration and offline cache

## UI Components
- [x] TickerStrip — scrolling live fund price ticker at top
- [x] FundCard — individual fund performance cards (G, C, S, I)
- [x] PriceChart — interactive area/line chart with range selector (1W/1M/3M/6M/1Y/2Y)
- [x] MACDChart — MACD technical analysis (12, 26, 9)
- [x] RSIChart — RSI(14) with overbought/oversold zones
- [x] SMAChart — price with SMA 20 and SMA 50 overlays
- [x] PerformanceHeatmap — daily % change heatmap grid
- [x] ComparisonChart — normalized fund comparison (indexed to 100)
- [x] DataTable — sortable price/change history table with CSV export
- [x] SettingsPanel — data refresh, export, notifications, fund info

## Pages
- [x] Home page — full dashboard with tabs (Overview, Analytics, Heatmap, Comparison, Table)

## PWA Features
- [x] manifest.json — PWA manifest with theme colors
- [x] vite-plugin-pwa — service worker with workbox caching
- [x] Offline support — localStorage cache fallback
- [x] Auto-refresh during market hours (15 min interval)

## Design
- [x] Dark navy theme (Precision Dashboard)
- [x] Space Grotesk + DM Mono typography
- [x] Glass card effects
- [x] Animated ticker strip
- [x] Skeleton loading states
- [x] Gain/loss color coding (emerald/rose)
- [x] Hero banner with financial background image

## Testing
- [x] Vitest tests for tsp.getFundData proxy (7 tests)
- [x] Vitest tests for auth.logout (1 test)
- [x] All 8 tests passing

## Bug Fixes
- [x] Fix Comparison chart Y-axis range to show actual high/low instead of fixed 0-200%

## Deployment
- [x] Save checkpoint and publish
