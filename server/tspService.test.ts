import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTSPDataUrl, fetchTSPData, parseTSPData, resetTSPDataCache } from './tspService';

describe('tspService official baseline fetch', () => {
  beforeEach(() => resetTSPDataCache());
  afterEach(() => {
    resetTSPDataCache();
    vi.restoreAllMocks();
  });

  it('builds the current official query URL', () => {
    expect(buildTSPDataUrl(new Date('2026-08-17T12:00:00.000Z'))).toBe(
      'https://www.tsp.gov/data/fund-price-history.csv?startdate=2003-06-02&enddate=2026-08-17&Lfunds=1&InvFunds=1&download=0',
    );
  });

  it('fetches and parses the official CSV shape into four individual funds', async () => {
    const csv = [
      'Date,G Fund,F Fund,C Fund,S Fund,I Fund',
      '"Aug 14, 2026",20.1286,20.8619,125.4211,120.9799,66.3709',
      '"Aug 13, 2026",20.1259,20.9184,125.6188,120.7421,66.2866',
    ].join('\n');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      statusText: 'OK',
      text: async () => csv,
    } as Response);

    const raw = await fetchTSPData({ asOf: new Date('2026-08-17T12:00:00.000Z') });
    const parsed = parseTSPData(raw);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://www.tsp.gov/data/fund-price-history.csv?startdate=2003-06-02&enddate=2026-08-17&Lfunds=1&InvFunds=1&download=0',
      expect.objectContaining({
        headers: expect.objectContaining({
          Referer: 'https://www.tsp.gov/share-price-history/',
          'Cache-Control': 'no-cache',
        }),
      }),
    );
    expect(parsed).toHaveLength(8);
    expect(parsed.find((row) => row.fundSymbol === 'C' && row.price === 125.4211)?.date).toEqual(new Date('2026-08-14T00:00:00.000Z'));
  });

  it('bypasses the cache for a forced refresh', async () => {
    const csv = [
      'Date,G Fund,F Fund,C Fund,S Fund,I Fund',
      '2026-08-14,20.1286,20.8619,125.4211,120.9799,66.3709',
    ].join('\n');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      statusText: 'OK',
      text: async () => csv,
    } as Response);

    await fetchTSPData();
    await fetchTSPData({ force: true, asOf: new Date('2026-08-17T12:00:00.000Z') });

    const csvCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('fund-price-history.csv?'));
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(csvCalls).toHaveLength(2);
    expect(csvCalls[1]?.[0]).toContain('enddate=2026-08-17');
  });

  it('surfaces an access-denied error when there is no safe cached baseline', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      statusText: 'Forbidden',
      text: async () => 'Access denied',
    } as Response);

    await expect(fetchTSPData()).rejects.toThrow('Forbidden');
  });
});
