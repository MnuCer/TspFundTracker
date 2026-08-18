# Intraday estimate research

## Official TSP benchmark facts

- C Fund: TSP.gov states that the fund matches the S&P 500 Index. Source: https://www.tsp.gov/funds-individual/c-fund/
- S Fund: TSP.gov states that the fund matches the Dow Jones U.S. Completion Total Stock Market Index. Source: https://www.tsp.gov/funds-individual/s-fund/
- I Fund: TSP.gov states that the fund matches the MSCI ACWI IMI ex USA ex China ex Hong Kong Index and notes currency and time-zone risk. Source: https://www.tsp.gov/funds-individual/i-fund/
- G Fund: TSP.gov states that the fund is invested in special nonmarketable Treasury securities, has no applicable benchmark, and does not fluctuate in value intraday. Source: https://www.tsp.gov/funds-individual/g-fund/
- Data.gov lists the Federal Retirement Thrift Investment Board’s share-price dataset as public and daily-updated, but its resource redirects to the TSP share-price-history page rather than exposing a stable direct CSV URL. Source: https://catalog.data.gov/dataset/share-price-data

## Market proxy decisions

- C → SPY: liquid S&P 500 ETF proxy.
- S → IWM: liquid small-cap ETF proxy. It is not identical to the broader Dow Jones U.S. Completion TSM benchmark, so confidence is reduced.
- I → EFA: liquid international developed-market ETF proxy. It does not fully capture the I Fund’s emerging-market exposure, China/Hong Kong exclusions, currency effects, or time-zone differences, so confidence is low.
- G → no intraday proxy: carry forward the official price and clearly state why.

## Provider validation

Nasdaq public endpoints returned current and previous-close fields for SPY, IWM, and EFA during implementation:

- https://api.nasdaq.com/api/quote/SPY/chart?assetclass=etf
- https://api.nasdaq.com/api/quote/SPY/info?assetclass=etf
- https://api.nasdaq.com/api/quote/IWM/chart?assetclass=etf
- https://api.nasdaq.com/api/quote/IWM/info?assetclass=etf
- https://api.nasdaq.com/api/quote/EFA/chart?assetclass=etf
- https://api.nasdaq.com/api/quote/EFA/info?assetclass=etf

Yahoo Finance chart endpoints returned HTTP 429 from the sandbox and were not used.

## Reliability note

The app’s existing official TSP fetch currently receives HTTP 403 from the server environment. The intraday endpoint therefore returns an empty estimate list until official TSP baseline rows exist, rather than inventing a baseline. The UI explicitly explains this state.

## Browser verification of the official interface

The official share-price-history page successfully rendered a daily table in the browser and exposed a Download results button. The default date window returned an official row for August 14, 2026 with C $125.4211, S $120.9799, I $66.3709, and G $20.1286. The page also showed the previous official rows, confirming the required CSV/table shape. However, direct server-side fetches from the development container continue to receive an access-denied response, so the service should retain the current safe empty-baseline behavior rather than bypassing the official site’s protection.

## PWA browser validation

The running project preview served both `/manifest.webmanifest` and `/sw.js` successfully. The manifest exposed standalone display metadata, theme color, and the SVG icon. The service worker exposed shell precaching, network-first navigation, public fund-query caching, and safe exclusion of auth/settings API requests from cache.

## Production PWA behavior validation

The production build initially omitted the service-worker branch because the sandbox build environment exposed `NODE_ENV=development`; the build script now explicitly sets `NODE_ENV=production`. After rebuilding, Chromium reported an activated service worker for the production origin, with both `tsp-tracker-shell-v1` and `tsp-tracker-public-data-v1` present. The shell, manifest, and favicon were confirmed in Cache Storage.

## Offline fallback correction

A first offline test exposed a real service-worker bug: non-2xx gateway responses were returned directly because the navigation handler only fell back on rejected fetches. The worker now falls back when `response.ok` is false as well as on network rejection. A true `window.location.reload()` performed while the production page was controlled and the server was stopped rendered the cached TSP Tracker app shell successfully. A page-script `fetch('/')` remains a non-navigation request and is intentionally outside the app-shell navigation branch.

## Install prompt validation

The install prompt was made available on the public shell. In Chromium, a synthetic `beforeinstallprompt` event produced the visible “Install TSP Fund Tracker” prompt with accessible Install and Dismiss controls. Clicking the dismiss control removed the prompt and persisted the dismissal state in local storage.

## In-browser accessibility QA

On the production public shell, Tab navigation moved focus to the Sign In button, and the computed focus style included a visible 3px ring using the theme ring color. The button retained its accessible text label and was keyboard reachable. Dashboard-specific charts and tables were additionally validated through semantic labels, captions, scoped headers, and accessible empty states documented in `ACCESSIBILITY_AUDIT.md`; authenticated dashboard browser QA depends on the project’s existing authenticated preview session.

## Public fund-query offline validation

A real public `funds.getLatestPrices` tRPC GET query returned HTTP 200 and was stored in the service worker’s public-data cache. After stopping the production origin, the same query returned the cached 200 response with the preserved tRPC result body. This confirms cached public fund-query fallback independently of the app-shell navigation fallback.

## Sync investigation on August 17, 2026

The current official page at `/share-price-history/` is a client-rendered form with individual-fund checkboxes, date inputs, “Retrieve share prices,” and “Download results” controls. It is not itself a CSV response. The existing app’s fixed `https://www.tsp.gov/data/fund-price-history.csv` request is receiving HTTP 403, so the next repair step is to extract the live page’s client-side request configuration and use the current official data route rather than guessing another static URL.

## Current official TSP data route

The live official page uses `https://www.tsp.gov/data/fund-price-history.csv` with required query parameters `startdate=YYYY-MM-DD`, `enddate=YYYY-MM-DD`, `Lfunds=1`, `InvFunds=1`, and `download=0` (or `download=1` for a browser download). The current CSV header is `Date,L Income,...,G Fund,F Fund,C Fund,S Fund,I Fund`; browser retrieval returned rows through August 14, 2026 for an August 17 request. The page’s AJAX helper defines `siteName = window.location.origin + '/data'` and constructs this URL with `sharePriceDownloadString`.

The endpoint can be downloaded through the browser but returns HTTP 403 to sandbox/server-side curl requests, even with browser-like headers and the exact query string. This means fixing the URL alone is insufficient; the application needs a reliable server-accessible official fallback or an explicit browser-assisted ingestion path rather than silently claiming the sync succeeded.

## Sync repair validation — August 17, 2026

The backend initially queried `/data/fund-price-history.csv` without the query parameters used by the official client, which returned HTTP 403. The repaired service now builds the official URL with `startdate=2003-06-02`, the current `enddate`, `Lfunds=1`, `InvFunds=1`, and `download=0`; it warms the public share-price-history page, mirrors the site’s AJAX headers, and retries 403 responses up to two times. The manual Sync Data procedure now passes `{ force: true }` so an in-process 24-hour cache cannot block a user-requested refresh.

End-to-end validation succeeded through the development server: the sync returned `synced=23180` and `errors=0`, representing 5,795 official trading-date rows across the four tracked funds. The database contains 23,180 fund-price rows. Latest available official close: August 14, 2026 — G 20.1286 (+0.0134%), C 125.4211 (-0.1574%), S 120.9799 (+0.1969%), and I 66.3709 (+0.1272%). The app intentionally labels these as the latest available TSP close when markets are closed; no intraday TSP official price is claimed.

A separate Home dashboard fix prevents the automatic sync from running for unauthenticated users or re-running on every render; authenticated users get one automatic sync, while the Sync Data button performs a forced refresh.
