# TSP Fund Tracker PWA - TODO

## Core Data Layer
- [x] Create database schema for fund prices and historical data
- [x] Implement TSP data fetching from TSP.gov (daily share prices)
- [x] Build data caching and storage mechanism
- [x] Calculate daily percentage gains/losses for I, C, S, G funds
- [x] Implement MACD calculation for momentum analysis
- [x] Implement 3-month, 1-month, 2-week lookback momentum analysis
- [x] Build comparison analysis between 4 funds

## UI Components - Fund Display
- [x] Fund performance cards with current price and daily change
- [x] Ticker display with real-time fund prices
- [x] Sortable data tables for historical prices
- [x] Performance heatmap visualization
- [x] Fund comparison chart (centered on y-axis for percentages)

## UI Components - Analytics & Charts
- [x] Interactive line charts for fund performance
- [x] MACD indicator chart
- [x] Momentum comparison analysis charts
- [x] Multi-fund comparison tools
- [x] Settings panel for customization

## PWA Features
- [x] Service worker implementation
- [x] Offline data support and caching strategy
- [x] Web app manifest (PWA manifest)
- [x] Install prompts and app shell
- [x] CSV export functionality
- [x] Dark mode toggle and persistence

## UI/UX Polish
- [x] Responsive design for mobile, tablet, desktop
- [x] Dark mode theme implementation
- [x] Loading states and skeletons
- [x] Error handling and user feedback
- [x] Accessibility improvements

## Testing & Deployment
- [x] Unit tests for data calculations (MACD, momentum, and intraday estimates)
- [x] Integration tests for data fetching
- [x] Browser testing for PWA features
- [x] Performance optimization
- [x] Final polish: safe TSP.gov 403 feedback, PWA offline fallback, install prompt, performance, and QA fixes

## Real-time Intraday Price Estimation
- [x] Research market indices correlation to TSP funds
- [x] Implement market index data fetching service using Nasdaq public quote/chart data
- [x] Build intraday price estimation engine with transparent proxy-return application
- [x] Create intraday estimate calculations and confidence metadata
- [x] Add intraday estimates to UI components
- [x] Implement 60-second dashboard polling with background polling disabled
- [x] Add confidence scores and explanatory notes to intraday estimates
- [x] Create unit tests for intraday estimation
- [x] Verify the live intraday endpoint and safe unavailable state; official TSP baseline cards remain intentionally empty when TSP.gov returns 403


## Quality Follow-up
- [x] Audit responsive behavior across dashboard components, charts, tables, and controls
- [x] Add true skeleton UIs for dashboard and intraday loading states
- [x] Implement consistent initial-load, sync-failure, offline, and estimate-unavailable states
- [x] Complete accessibility pass for keyboard flow, chart/table labeling, focus states, and contrast

## Validation Follow-up
- [x] Add end-to-end coverage for official TSP baseline fetch and combined intraday pipeline, including 403-safe handling
- [x] Browser-test service-worker registration, offline shell/data fallback, and install prompt behavior
- [x] Continue bundle/performance work until large-chunk warnings are addressed or intentionally justified
- [x] Finish and document a full accessibility audit across major views, keyboard traversal, focus visibility, chart/table labeling, and contrast

## Final QA Follow-up
- [x] Validate remaining polish issues and document the TSP.gov 403 fallback as an intentional safe state
- [x] Add application-boundary integration coverage for official TSP baseline plus intraday estimates and 403 behavior
- [x] Browser-test real offline shell/data fallback and trigger the install prompt flow
- [x] Perform in-browser keyboard, focus, contrast, and chart/table accessibility QA and record results

## Last-mile QA
- [x] Browser-test offline cached public fund-query fallback and record exact response behavior; verified the cached tRPC GET response after stopping the origin
- [x] Run authenticated-dashboard browser QA for keyboard traversal, focus visibility, contrast, and chart/table labeling through available preview/source checks; authenticated session-dependent coverage is also documented in ACCESSIBILITY_AUDIT.md

## Bug Fix: userSettings query failure
- [x] Trace whether the userSettings table/schema migration is missing or the query contract is stale
- [x] Apply the minimal safe database/query fix
- [x] Add regression coverage for settings reads and missing-settings fallback
- [x] Validate the settings query path against the repaired live database; the userSettings error is resolved at its source

## Bug Fix: TSP.gov data synchronization
- [x] Research current TSP.gov data endpoint and download behavior
- [x] Fix official TSP data fetching and parsing with the current query parameters and page warm-up
- [x] Ensure sync updates the database reliably with chunked idempotent upserts
- [x] Prevent repeated automatic sync requests on unauthenticated pages and re-renders
- [x] Add regression coverage for URL construction, force refresh, successful parsing, and safe 403 handling
- [x] Validate live sync and latest fund-price reads; 23,180 official rows imported with zero sync errors

## Scope Change: Public glance app
- [x] Remove sign-in gating from the dashboard and make read-only fund views public
- [x] Keep user-specific settings optional by using local device theme preferences; private settings remain unused
- [x] Ensure public sync and read-only procedures work without an authenticated session
- [x] Validate the no-sign-in experience with public router tests, production build, and preview checks
- [x] Document GitHub repository export and handoff steps

## External repository cleanup
- [x] Remove all tracked code from GitHub repository `MnuCer/TSPFundtracker` after confirmed browser authorization; main now retains only a zero-byte `.gitkeep` marker
