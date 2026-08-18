import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./tspService', () => ({
  syncTSPData: vi.fn(),
  getLatestPrice: vi.fn(),
}));

vi.mock('./marketDataService', () => ({
  getIntradayEstimates: vi.fn(),
}));

import { appRouter } from './routers';
import { syncTSPData } from './tspService';
import { getIntradayEstimates } from './marketDataService';

const caller = appRouter.createCaller({
  user: undefined,
  req: {} as never,
  res: {} as never,
});

describe('fund router application boundary', () => {
  beforeEach(() => vi.clearAllMocks());
  it('exposes latest official fund prices to unauthenticated callers', async () => {
    const result = await caller.funds.getLatestPrices();

    expect(Object.keys(result)).toEqual(expect.arrayContaining(['G', 'C', 'S', 'I']));
    expect(result.C).toMatchObject({ symbol: 'C' });
  });

  it('returns transparent intraday estimates through the public tRPC contract', async () => {
    vi.mocked(getIntradayEstimates).mockResolvedValue({
      estimates: [
        {
          symbol: 'G',
          proxySymbol: null,
          proxyName: 'Carry-forward',
          officialPrice: 20.1286,
          estimatedPrice: 20.1286,
          officialDailyChange: 0.01,
          estimatedDailyChange: 0.01,
          changeSinceOfficialClose: 0,
          confidence: 'high',
          confidenceScore: 1,
          marketStatus: 'Carry-forward',
          officialDate: new Date('2026-08-14T00:00:00.000Z'),
          observedAt: null,
          isEstimate: false,
          notes: 'G Fund carries forward the latest official close.',
        },
      ],
      fetchedAt: new Date('2026-08-17T15:30:00.000Z'),
      provider: 'test provider',
    });

    const result = await caller.funds.getIntradayEstimates();

    expect(result.provider).toBe('test provider');
    expect(result.estimates[0]).toMatchObject({ symbol: 'G', isEstimate: false, estimatedPrice: 20.1286 });
  });

  it('requests a forced official refresh when Sync Data is invoked', async () => {
    vi.mocked(syncTSPData).mockResolvedValue({ synced: 4, errors: 0 });

    await expect(caller.funds.syncData()).resolves.toEqual({
      success: true,
      synced: 4,
      errors: 0,
    });
    expect(syncTSPData).toHaveBeenCalledWith({ force: true });
  });

  it('converts an official TSP access failure into a safe sync result for the UI', async () => {
    vi.mocked(syncTSPData).mockRejectedValue(new Error('Failed to fetch TSP data: Forbidden'));

    const result = await caller.funds.syncData();

    expect(result).toEqual({
      success: false,
      synced: 0,
      errors: 1,
      error: 'Failed to fetch TSP data: Forbidden',
    });
  });
});
