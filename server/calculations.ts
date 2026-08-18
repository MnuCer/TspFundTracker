/**
 * Financial calculations for TSP fund analysis
 */

export interface PricePoint {
  date: Date;
  price: number;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param prices Array of price points
 * @param period Number of periods for EMA calculation
 * @returns Array of EMA values
 */
export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return [];

  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // Calculate SMA for first EMA value
  let sma = 0;
  for (let i = 0; i < period; i++) {
    sma += prices[i];
  }
  sma /= period;
  ema[period - 1] = sma;

  // Calculate EMA for remaining values
  for (let i = period; i < prices.length; i++) {
    const currentEMA = (prices[i] - ema[i - 1]!) * multiplier + ema[i - 1]!;
    ema[i] = currentEMA;
  }

  return ema;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param prices Array of price points
 * @returns Object with MACD line, signal line, and histogram
 */
export function calculateMACD(prices: number[]) {
  if (prices.length < 26) {
    return { macdLine: [], signal: [], histogram: [] };
  }

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  // MACD line is the difference between 12-EMA and 26-EMA
  const macdLine: number[] = [];
  for (let i = 25; i < prices.length; i++) {
    const macd = ema12[i]! - ema26[i]!;
    macdLine.push(macd);
  }

  // Signal line is 9-EMA of MACD line
  const signal = calculateEMA(macdLine, 9);

  // Histogram is MACD - Signal
  const histogram: number[] = [];
  for (let i = 8; i < macdLine.length; i++) {
    const hist = macdLine[i]! - signal[i - 8]!;
    histogram.push(hist);
  }

  return { macdLine, signal, histogram };
}

/**
 * Calculate daily percentage change
 * @param currentPrice Current price
 * @param previousPrice Previous day's price
 * @returns Percentage change
 */
export function calculatePercentageChange(
  currentPrice: number,
  previousPrice: number
): number {
  if (previousPrice === 0) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

/**
 * Calculate momentum (percentage change over a period)
 * @param currentPrice Current price
 * @param priceAtPeriodStart Price at the start of the period
 * @returns Percentage change over the period
 */
export function calculateMomentum(
  currentPrice: number,
  priceAtPeriodStart: number
): number {
  if (priceAtPeriodStart === 0) return 0;
  return ((currentPrice - priceAtPeriodStart) / priceAtPeriodStart) * 100;
}

/**
 * Calculate momentum for multiple periods
 * @param prices Array of price points sorted by date (oldest first)
 * @returns Object with 1-month, 2-week, and 3-month momentum
 */
export function calculateMomentumPeriods(prices: PricePoint[]) {
  if (prices.length === 0) {
    return { momentum1Month: 0, momentum2Week: 0, momentum3Month: 0 };
  }

  const currentPrice = prices[prices.length - 1]!.price;
  const currentDate = prices[prices.length - 1]!.date;

  // Find prices from different periods ago
  const oneMonthAgo = new Date(currentDate);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const twoWeeksAgo = new Date(currentDate);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const threeMonthsAgo = new Date(currentDate);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Find closest prices to the target dates
  const findClosestPrice = (targetDate: Date): number | null => {
    let closest: PricePoint | null = null;
    let minDiff = Infinity;

    for (const point of prices) {
      const diff = Math.abs(point.date.getTime() - targetDate.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }

    return closest ? closest.price : null;
  };

  const price1MonthAgo = findClosestPrice(oneMonthAgo);
  const price2WeeksAgo = findClosestPrice(twoWeeksAgo);
  const price3MonthsAgo = findClosestPrice(threeMonthsAgo);

  return {
    momentum1Month: price1MonthAgo ? calculateMomentum(currentPrice, price1MonthAgo) : 0,
    momentum2Week: price2WeeksAgo ? calculateMomentum(currentPrice, price2WeeksAgo) : 0,
    momentum3Month: price3MonthsAgo ? calculateMomentum(currentPrice, price3MonthsAgo) : 0,
  };
}

/**
 * Compare momentum between multiple funds
 * @param fundPrices Object with fund symbols as keys and price arrays as values
 * @returns Comparison object with momentum data for each fund
 */
export function compareFundMomentum(
  fundPrices: Record<string, PricePoint[]>
): Record<string, ReturnType<typeof calculateMomentumPeriods>> {
  const comparison: Record<string, ReturnType<typeof calculateMomentumPeriods>> = {};

  for (const [fund, prices] of Object.entries(fundPrices)) {
    comparison[fund] = calculateMomentumPeriods(prices);
  }

  return comparison;
}

/**
 * Calculate performance statistics for a fund
 */
export function calculatePerformanceStats(prices: number[]) {
  if (prices.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      current: 0,
      volatility: 0,
    };
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const average = prices.reduce((a, b) => a + b, 0) / prices.length;
  const current = prices[prices.length - 1]!;

  // Calculate volatility (standard deviation)
  const variance =
    prices.reduce((sum, price) => sum + Math.pow(price - average, 2), 0) /
    prices.length;
  const volatility = Math.sqrt(variance);

  return {
    min,
    max,
    average,
    current,
    volatility,
  };
}
