import { describe, expect, it } from 'vitest';
import { createIntradayEstimate } from './intradayEstimates';

describe('intraday estimates', () => {
  const officialDate = new Date('2026-08-14T00:00:00.000Z');

  it('applies a proxy return to the latest official C Fund close', () => {
    const estimate = createIntradayEstimate({
      symbol: 'C',
      officialPrice: 100,
      officialDailyChange: 1,
      officialDate,
      quote: {
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF proxy',
        currentPrice: 102,
        previousClose: 100,
        marketStatus: 'Open',
        observedAt: new Date('2026-08-17T15:30:00.000Z'),
      },
    });

    expect(estimate.isEstimate).toBe(true);
    expect(estimate.proxySymbol).toBe('SPY');
    expect(estimate.estimatedPrice).toBe(102);
    expect(estimate.changeSinceOfficialClose).toBe(2);
    expect(estimate.estimatedDailyChange).toBeCloseTo(3.02, 2);
    expect(estimate.confidence).toBe('medium');
  });

  it('carries the official G Fund price forward without inventing an intraday move', () => {
    const estimate = createIntradayEstimate({
      symbol: 'G',
      officialPrice: 19.8765,
      officialDailyChange: 0.02,
      officialDate,
    });

    expect(estimate.isEstimate).toBe(false);
    expect(estimate.proxySymbol).toBeNull();
    expect(estimate.estimatedPrice).toBe(19.8765);
    expect(estimate.changeSinceOfficialClose).toBe(0);
    expect(estimate.confidence).toBe('high');
    expect(estimate.notes).toContain('does not fluctuate intraday');
  });

  it('returns an unavailable state when a proxy quote is missing', () => {
    const estimate = createIntradayEstimate({
      symbol: 'I',
      officialPrice: 75,
      officialDailyChange: -0.5,
      officialDate,
    });

    expect(estimate.isEstimate).toBe(false);
    expect(estimate.confidence).toBe('unavailable');
    expect(estimate.estimatedPrice).toBe(75);
    expect(estimate.estimatedDailyChange).toBe(-0.5);
  });

  it('preserves the lower confidence assigned to the international proxy', () => {
    const estimate = createIntradayEstimate({
      symbol: 'I',
      officialPrice: 75,
      officialDailyChange: 0,
      officialDate,
      quote: {
        symbol: 'EFA',
        name: 'iShares MSCI EAFE ETF proxy',
        currentPrice: 99,
        previousClose: 100,
        marketStatus: 'Open',
        observedAt: new Date('2026-08-17T15:30:00.000Z'),
      },
    });

    expect(estimate.confidence).toBe('low');
    expect(estimate.confidenceScore).toBe(0.62);
    expect(estimate.changeSinceOfficialClose).toBe(-1);
    expect(estimate.estimatedPrice).toBe(74.25);
  });
});
