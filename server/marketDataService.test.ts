import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./db', () => ({
  getLatestFundPrices: vi.fn(),
}));

import { getLatestFundPrices } from './db';
import { fetchMarketProxyQuotes, getIntradayEstimates, resetMarketDataCache } from './marketDataService';

function jsonResponse(body: unknown) {
  return {
    ok: true,
    json: async () => body,
  } as Response;
}

describe('marketDataService', () => {
  afterEach(() => {
    resetMarketDataCache();
    vi.restoreAllMocks();
  });

  it('normalizes Nasdaq chart and quote responses for all configured proxies', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      const symbol = url.match(/quote\/([^/]+)/)?.[1] ?? 'UNKNOWN';
      if (url.includes('/info?')) {
        return jsonResponse({
          data: {
            primaryData: {
              lastSalePrice: symbol === 'EFA' ? '$98.50' : '$102.00',
              lastTradeTimestamp: '2026-08-17T15:30:00.000Z',
            },
            marketStatus: 'Open',
          },
        });
      }
      return jsonResponse({
        data: {
          symbol,
          previousClose: '$100.00',
          chart: [{ x: Date.parse('2026-08-17T15:30:00.000Z') / 1000, y: 101 }],
        },
      });
    });

    const quotes = await fetchMarketProxyQuotes();

    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(Object.keys(quotes).sort()).toEqual(['EFA', 'IWM', 'SPY']);
    expect(quotes.SPY).toMatchObject({
      symbol: 'SPY',
      currentPrice: 102,
      previousClose: 100,
      marketStatus: 'Open',
    });
    expect(quotes.EFA?.currentPrice).toBe(98.5);
    expect(quotes.IWM?.observedAt).toEqual(new Date('2026-08-17T15:30:00.000Z'));
  });

  it('combines an official baseline with proxy returns and carries G forward', async () => {
    vi.mocked(getLatestFundPrices).mockResolvedValue([
      { fundSymbol: 'G', sharePrice: '20.1286', dailyPercentChange: '0.01', priceDate: new Date('2026-08-14T00:00:00.000Z') },
      { fundSymbol: 'C', sharePrice: '125.4211', dailyPercentChange: '-0.16', priceDate: new Date('2026-08-14T00:00:00.000Z') },
      { fundSymbol: 'S', sharePrice: '120.9799', dailyPercentChange: '0.20', priceDate: new Date('2026-08-14T00:00:00.000Z') },
      { fundSymbol: 'I', sharePrice: '66.3709', dailyPercentChange: '0.13', priceDate: new Date('2026-08-14T00:00:00.000Z') },
    ] as never);
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/info?')) {
        return jsonResponse({ data: { primaryData: { lastSalePrice: '$102.00' }, marketStatus: 'Open' } });
      }
      return jsonResponse({ data: { previousClose: '$100.00', chart: [{ x: 1_755_441_000, y: 102 }] } });
    });

    const result = await getIntradayEstimates();

    expect(result.estimates).toHaveLength(4);
    expect(result.estimates.find((estimate) => estimate.symbol === 'G')).toMatchObject({
      isEstimate: false,
      proxySymbol: null,
      estimatedPrice: 20.1286,
    });
    expect(result.estimates.find((estimate) => estimate.symbol === 'C')).toMatchObject({
      isEstimate: true,
      proxySymbol: 'SPY',
      estimatedPrice: 127.9295,
    });
  });

  it('uses the short cache window and avoids duplicate provider requests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/info?')) {
        return jsonResponse({ data: { primaryData: { lastSalePrice: '$100.00' }, marketStatus: 'Closed' } });
      }
      return jsonResponse({
        data: {
          previousClose: '$100.00',
          chart: [{ x: 1_755_441_000, y: 100 }],
        },
      });
    });

    await fetchMarketProxyQuotes();
    await fetchMarketProxyQuotes();

    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});
