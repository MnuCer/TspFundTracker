export type TspFundSymbol = 'G' | 'C' | 'S' | 'I';

export type MarketQuote = {
  symbol: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  marketStatus: string;
  observedAt: Date;
};

export type IntradayEstimate = {
  symbol: TspFundSymbol;
  proxySymbol: string | null;
  proxyName: string;
  officialPrice: number;
  estimatedPrice: number;
  officialDailyChange: number;
  estimatedDailyChange: number;
  changeSinceOfficialClose: number;
  confidence: 'high' | 'medium' | 'low' | 'unavailable';
  confidenceScore: number;
  marketStatus: string;
  officialDate: Date;
  observedAt: Date | null;
  isEstimate: boolean;
  notes: string;
};

const PROXY_CONFIG: Record<Exclude<TspFundSymbol, 'G'>, {
  symbol: string;
  name: string;
  confidence: 'medium' | 'low';
  confidenceScore: number;
  notes: string;
}> = {
  C: {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF proxy',
    confidence: 'medium',
    confidenceScore: 0.82,
    notes: 'SPY is used as a liquid intraday proxy for the C Fund’s S&P 500 benchmark.',
  },
  S: {
    symbol: 'IWM',
    name: 'iShares Russell 2000 ETF proxy',
    confidence: 'medium',
    confidenceScore: 0.72,
    notes: 'IWM is a liquid small-cap proxy; the S Fund officially tracks the broader Dow Jones U.S. Completion TSM Index.',
  },
  I: {
    symbol: 'EFA',
    name: 'iShares MSCI EAFE ETF proxy',
    confidence: 'low',
    confidenceScore: 0.62,
    notes: 'EFA is an international-market proxy; currency, time-zone, emerging-market, China, and Hong Kong differences mean this is an approximation.',
  },
};

function round(value: number, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function previousOfficialPrice(officialPrice: number, officialDailyChange: number) {
  const denominator = 1 + officialDailyChange / 100;
  if (!Number.isFinite(denominator) || denominator <= 0) return officialPrice;
  return officialPrice / denominator;
}

export function createIntradayEstimate(input: {
  symbol: TspFundSymbol;
  officialPrice: number;
  officialDailyChange: number;
  officialDate: Date;
  quote?: MarketQuote;
}): IntradayEstimate {
  const { symbol, officialPrice, officialDailyChange, officialDate, quote } = input;

  if (symbol === 'G') {
    return {
      symbol,
      proxySymbol: null,
      proxyName: 'No tradable intraday proxy',
      officialPrice: round(officialPrice),
      estimatedPrice: round(officialPrice),
      officialDailyChange: round(officialDailyChange, 3),
      estimatedDailyChange: round(officialDailyChange, 3),
      changeSinceOfficialClose: 0,
      confidence: 'high',
      confidenceScore: 0.95,
      marketStatus: 'Carry-forward',
      officialDate,
      observedAt: null,
      isEstimate: false,
      notes: 'The G Fund is invested in special nonmarketable Treasury securities and its value does not fluctuate intraday. The official TSP price is carried forward between daily closes.',
    };
  }

  const proxy = PROXY_CONFIG[symbol];
  if (!quote || quote.previousClose <= 0 || quote.currentPrice <= 0) {
    return {
      symbol,
      proxySymbol: proxy.symbol,
      proxyName: proxy.name,
      officialPrice: round(officialPrice),
      estimatedPrice: round(officialPrice),
      officialDailyChange: round(officialDailyChange, 3),
      estimatedDailyChange: round(officialDailyChange, 3),
      changeSinceOfficialClose: 0,
      confidence: 'unavailable',
      confidenceScore: 0,
      marketStatus: 'Unavailable',
      officialDate,
      observedAt: quote?.observedAt ?? null,
      isEstimate: false,
      notes: `The ${proxy.symbol} market quote was unavailable, so the latest official TSP price is shown without an intraday adjustment.`,
    };
  }

  const proxyReturn = ((quote.currentPrice - quote.previousClose) / quote.previousClose) * 100;
  const estimatedPrice = officialPrice * (1 + proxyReturn / 100);
  const priorOfficialPrice = previousOfficialPrice(officialPrice, officialDailyChange);
  const estimatedDailyChange = ((estimatedPrice - priorOfficialPrice) / priorOfficialPrice) * 100;

  return {
    symbol,
    proxySymbol: proxy.symbol,
    proxyName: proxy.name,
    officialPrice: round(officialPrice),
    estimatedPrice: round(estimatedPrice),
    officialDailyChange: round(officialDailyChange, 3),
    estimatedDailyChange: round(estimatedDailyChange, 3),
    changeSinceOfficialClose: round(proxyReturn, 3),
    confidence: proxy.confidence,
    confidenceScore: proxy.confidenceScore,
    marketStatus: quote.marketStatus,
    officialDate,
    observedAt: quote.observedAt,
    isEstimate: true,
    notes: proxy.notes,
  };
}

export const intradayProxyConfig = PROXY_CONFIG;
