/**
 * TSP Fund Tracker — Server-side tests
 * Tests the tRPC TSP proxy router
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const SAMPLE_CSV = `Date,L Income,L 2030,L 2035,L 2040,L 2045,L 2050,L 2055,L 2060,L 2065,L 2070,L 2075,G Fund,F Fund,C Fund,S Fund,I Fund
2026-03-10,29.5539,58.8607,17.9242,68.7557,19.0318,42.1781,21.7795,21.7770,21.7745,12.9054,11.2729,19.7460,21.0610,108.7531,101.0151,58.5187
2026-03-09,29.5445,58.8192,17.9098,68.6900,19.0200,42.1500,21.7600,21.7575,21.7550,12.8900,11.2600,19.7440,21.0500,108.9747,101.4893,58.0001
2026-03-06,29.5300,58.7800,17.8900,68.6000,18.9900,42.1200,21.7400,21.7375,21.7350,12.8700,11.2400,19.7420,21.0400,109.2000,102.0000,57.5000`;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("tsp.getFundData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and returns CSV data from TSP.gov", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => SAMPLE_CSV,
    });

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.tsp.getFundData({
      startDate: "2026-01-01",
      endDate: "2026-03-11",
    });

    expect(result).toHaveProperty("csv");
    expect(result.csv).toContain("G Fund");
    expect(result.csv).toContain("C Fund");
    expect(result.csv).toContain("S Fund");
    expect(result.csv).toContain("I Fund");
  });

  it("includes correct fund columns in CSV", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => SAMPLE_CSV,
    });

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.tsp.getFundData({
      startDate: "2026-01-01",
      endDate: "2026-03-11",
    });

    const lines = result.csv.split("\n");
    const header = lines[0];
    expect(header).toContain("G Fund");
    expect(header).toContain("C Fund");
    expect(header).toContain("S Fund");
    expect(header).toContain("I Fund");
  });

  it("throws error when TSP.gov returns non-200 status", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
    });

    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.tsp.getFundData({
        startDate: "2026-01-01",
        endDate: "2026-03-11",
      })
    ).rejects.toThrow("TSP.gov returned 403");
  });

  it("validates date format — rejects invalid dates", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.tsp.getFundData({
        startDate: "01/01/2026", // wrong format
        endDate: "2026-03-11",
      })
    ).rejects.toThrow();
  });

  it("validates date format — rejects missing dates", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.tsp.getFundData({
        startDate: "",
        endDate: "2026-03-11",
      })
    ).rejects.toThrow();
  });

  it("calls TSP.gov with correct URL parameters", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => SAMPLE_CSV,
    });

    const caller = appRouter.createCaller(createPublicContext());
    await caller.tsp.getFundData({
      startDate: "2026-01-01",
      endDate: "2026-03-11",
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("tsp.gov");
    expect(calledUrl).toContain("startdate=2026-01-01");
    expect(calledUrl).toContain("enddate=2026-03-11");
    expect(calledUrl).toContain("InvFunds=1");
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
    const ctx: TrpcContext = {
      user: {
        id: 1,
        openId: "test-user",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});
