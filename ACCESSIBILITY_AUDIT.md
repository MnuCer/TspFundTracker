# TSP Fund Tracker Accessibility Audit

## Scope

The dashboard was reviewed as a responsive, keyboard-operable analytics interface. The audit covered the authenticated shell, fund cards, intraday estimate panel, chart wrappers, historical tables, heatmap, momentum analysis, settings controls, install prompt, and offline status messaging.

## Implemented checks

| Area | Implementation | Verification |
| --- | --- | --- |
| Keyboard flow | All primary controls use native buttons. The sidebar resize handle is a focusable vertical separator with ArrowLeft and ArrowRight support. | TypeScript validation and source review |
| Focus visibility | Existing shared button/sidebar focus-visible rings are preserved. The resize separator adds an explicit focus state. | Source review |
| Charts | Comparison, single-fund, and momentum charts expose descriptive `role="img"` labels. Empty states use `role="status"`. | Source review |
| Tables | Historical, momentum, and heatmap tables include captions, scoped column headers, horizontal scrolling, and textual values in addition to color cues. | Source review |
| Loading states | Fund cards, intraday estimates, historical tables, chart sections, and the lazy-loaded dashboard shell use skeletons or status regions instead of spinner-only loading. | Production build and preview review |
| Errors and offline state | Sync failures use alert regions, retry controls are available for query failures, intraday unavailability is explained, and the online/offline status is visible. | Live preview review |
| Contrast and themes | Light/dark utility classes were added across fund cards, intraday cards, tables, heatmap, momentum interpretation, settings, and install prompt. | Source review |
| PWA controls | Install and dismiss actions have accessible names; decorative icons are hidden from assistive technology. | Source review |

Charts remain visual summaries; the adjacent tables and explanatory text provide the accessible numeric representation. The dashboard does not make investment recommendations, and intraday proxy values remain explicitly labeled as estimates.
