# Public preview validation

Validated the current preview at `/?from_webdev=1` in the browser on 2026-08-18.

- The page rendered the TSP Fund Tracker dashboard without a sign-in prompt.
- The shell explicitly displayed `Public view` and `No sign-in required`.
- Official G, C, S, and I fund cards loaded with official close dates and daily percentage changes.
- The intraday market-estimate panel loaded with transparent proxy labels, confidence scores, statuses, and the warning that estimates are not official TSP prices.
- Chart, Comparison, Momentum, Heatmap, lookback, fund selector, Dark mode, Export CSV, and Sync Data controls were visible.
- The preview had current official TSP baseline data and a refreshed intraday timestamp.
- A click on the top-right control during validation invoked `Sync Data`; the UI remained rendered and continued to show the public dashboard.

This confirms the no-sign-in landing experience and public read-only data path in the available preview session. Local theme persistence is verified in source: `ThemeContext.tsx` reads and writes the `theme` key in `localStorage`, and `App.tsx` enables `switchable` mode.

The theme interaction was also verified through the preview DOM: before the action the label was `Dark mode`, `localStorage.theme` was `light`, and the document was not dark; after the action the label became `Light mode`, `localStorage.theme` became `dark`, and the document root had the `dark` class.
