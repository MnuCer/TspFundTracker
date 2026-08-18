# TSP Fund Tracker PWA

A comprehensive Progressive Web Application for tracking and analyzing Thrift Savings Plan (TSP) fund performance with real-time data, advanced momentum analysis, and MACD indicators.

## Features

### Core Functionality
- **Real-time Fund Tracking**: Monitor daily share prices for I, C, S, and G funds
- **Daily Performance Cards**: Quick overview of each fund's current price and daily percentage change
- **Interactive Charts**: Line charts showing fund performance over customizable time periods (1W, 1M, 3M, 6M, 1Y)
- **Price History Table**: Sortable table with historical prices and daily changes

### Advanced Analytics
- **MACD Indicator**: Moving Average Convergence Divergence analysis for momentum detection
- **Momentum Analysis**: 3-month, 1-month, and 2-week lookback momentum comparison
- **Fund Comparison**: Side-by-side comparison of all four funds with percentage-centered y-axis
- **Performance Heatmap**: Visual representation of fund performance metrics including:
  - Total return
  - Average daily change
  - Volatility
  - Maximum drawdown

### PWA Features
- **Offline Support**: Service worker for offline functionality (coming soon)
- **Dark Mode**: Toggle between light and dark themes
- **CSV Export**: Export fund data for external analysis (coming soon)
- **Installable**: Install as a native app on mobile and desktop

## Technology Stack

- **Frontend**: React 19 + Tailwind CSS 4 + Recharts
- **Backend**: Express 4 + tRPC 11
- **Database**: MySQL/TiDB
- **Authentication**: Manus OAuth
- **Data Source**: TSP.gov share price history

## Getting Started

### Prerequisites
- Node.js 22+
- pnpm 10+
- MySQL/TiDB database

### Installation

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   The project uses Manus-managed secrets. Required environment variables are automatically injected:
   - `DATABASE_URL`: MySQL/TiDB connection string
   - `JWT_SECRET`: Session cookie signing secret
   - `VITE_APP_ID`: OAuth application ID
   - And others (see `server/_core/env.ts`)

3. **Initialize database**:
   ```bash
   pnpm drizzle-kit generate
   # Then apply migrations via webdev_execute_sql
   ```

4. **Seed database with mock data** (for development):
   ```bash
   node server/seed-db.mjs
   ```

5. **Start development server**:
   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:3000`

## Project Structure

```
client/
  src/
    pages/
      Home.tsx              # Main dashboard
    components/
      FundCards.tsx         # Fund price cards
      FundChart.tsx         # Line chart for fund performance
      ComparisonChart.tsx   # Multi-fund comparison chart
      HeatmapChart.tsx      # Performance heatmap
      MomentumAnalysis.tsx  # Momentum comparison analysis
      DataTable.tsx         # Price history table
    lib/
      trpc.ts              # tRPC client setup
    App.tsx                # Routes and layout
    main.tsx               # React entry point

server/
  calculations.ts          # MACD, momentum, and performance calculations
  calculations.test.ts     # Unit tests for calculations
  tspService.ts           # TSP data fetching and caching
  db.ts                   # Database query helpers
  routers.ts              # tRPC procedure definitions
  seed-db.mjs             # Database seeding script

drizzle/
  schema.ts               # Database schema
  0001_*.sql              # Migration files

shared/
  const.ts                # Shared constants
```

## Data Calculations

### MACD (Moving Average Convergence Divergence)
- **12-day EMA**: Short-term exponential moving average
- **26-day EMA**: Long-term exponential moving average
- **MACD Line**: 12-day EMA - 26-day EMA
- **Signal Line**: 9-day EMA of MACD line
- **Histogram**: MACD line - Signal line

### Momentum Analysis
- **3-Month Momentum**: Percentage change from 3 months ago
- **1-Month Momentum**: Percentage change from 1 month ago
- **2-Week Momentum**: Percentage change from 2 weeks ago

### Performance Metrics
- **Total Return**: Percentage gain/loss over the period
- **Average Daily Change**: Mean of daily percentage changes
- **Volatility**: Standard deviation of daily returns
- **Maximum Drawdown**: Largest peak-to-trough decline

## API Endpoints

### Fund Data
- `GET /api/trpc/funds.getLatestPrices` - Get latest prices for all funds
- `GET /api/trpc/funds.getPriceHistory` - Get historical prices for a fund
- `GET /api/trpc/funds.getIndicators` - Get MACD and momentum indicators
- `GET /api/trpc/funds.getComparison` - Get comparison data for all funds
- `POST /api/trpc/funds.syncData` - Sync latest data from TSP.gov

### User Settings
- `GET /api/trpc/settings.get` - Get user preferences
- `POST /api/trpc/settings.update` - Update user preferences

## Testing

Run unit tests:
```bash
pnpm test
```

Run specific test file:
```bash
pnpm test server/calculations.test.ts
```

## Data Source

The application fetches historical share price data from TSP.gov. The data includes:
- Daily share prices for G, C, S, and I funds
- Historical data going back several years
- Updates daily after market close

## Known Limitations

1. **TSP.gov Access**: The direct CSV endpoint requires authentication or may have rate limiting
2. **Real-time Updates**: Data updates daily, not in real-time during market hours
3. **Offline Mode**: Currently in development
4. **CSV Export**: Coming in next release

## Future Enhancements

- [ ] Real-time intraday price estimates
- [ ] Portfolio tracking and analysis
- [ ] Alerts and notifications
- [ ] Advanced charting with technical indicators
- [ ] Mobile app with push notifications
- [ ] Historical data analysis and backtesting
- [ ] Integration with TSP account data

## Troubleshooting

### "No data available" message
- Ensure database is seeded with data using `node server/seed-db.mjs`
- Check that TSP.gov is accessible for data syncing
- Verify database connection in environment variables

### Charts not rendering
- Clear browser cache
- Check browser console for errors
- Ensure data is loaded before rendering charts

### Authentication issues
- Verify OAuth credentials are correct
- Check that cookies are enabled in browser
- Clear browser cookies and try again

## Contributing

When adding new features:
1. Update `todo.md` with new items
2. Write unit tests in `*.test.ts` files
3. Ensure all tests pass: `pnpm test`
4. Create a checkpoint before major changes

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the code comments and documentation
3. Check browser console for error messages
4. Verify database connectivity and data seeding

## Changelog

### v1.0.0 (Initial Release)
- Core fund tracking functionality
- MACD and momentum indicators
- Multi-fund comparison tools
- Performance heatmap
- Dashboard layout with responsive design
- Unit tests for calculations

## Intraday Market-Proxy Estimates

The dashboard now includes a separate intraday estimate panel that refreshes every 60 seconds while the page is open. It reads public Nasdaq quote and chart data for three liquid ETF proxies and applies each proxy’s move from its previous close to the latest official TSP share price:

| TSP fund | Proxy | Why it is used | Confidence |
| --- | --- | --- | --- |
| C | SPY | Liquid proxy for the S&P 500 benchmark | Medium |
| S | IWM | Liquid small-cap proxy for the S Fund’s U.S. small/mid-cap exposure | Medium |
| I | EFA | International-market proxy; it does not fully match the I Fund’s MSCI ACWI IMI ex USA ex China ex Hong Kong benchmark | Low |
| G | None | The G Fund holds special nonmarketable Treasury securities and its value does not fluctuate intraday | High carry-forward |

These values are labeled as estimates, include a confidence score and explanatory note, and never overwrite official TSP prices. The G Fund is carried forward at its latest official price. If the official TSP baseline or a market proxy is unavailable, the panel keeps the official value and reports the unavailable state rather than fabricating a quote.

The implementation uses client-side polling through the existing tRPC layer rather than a minute-level background job. This keeps the app compatible with the current managed web hosting mode and avoids making the estimate look like an official real-time TSP quote.
