import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getLatestFundPrice,
  getFundPricesByDateRange,
  getFundIndicatorsByDateRange,
  updateUserSettings,
  getUserSettings,
} from "./db";
import { syncTSPData, getLatestPrice } from "./tspService";
import { getIntradayEstimates } from "./marketDataService";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Fund data operations
  funds: router({
    /**
     * Get latest prices for all funds
     */
    getLatestPrices: publicProcedure.query(async () => {
      const funds = ['G', 'C', 'S', 'I'];
      const prices: Record<string, any> = {};

      for (const fund of funds) {
        const price = await getLatestFundPrice(fund);
        if (price) {
          prices[fund] = {
            symbol: fund,
            price: parseFloat(price.sharePrice as any),
            date: price.priceDate,
            dailyChange: price.dailyPercentChange
              ? parseFloat(price.dailyPercentChange as any)
              : 0,
          };
        }
      }

      return prices;
    }),

    /**
     * Get intraday estimated prices using liquid market proxies.
     * Values are explicitly estimates and never replace official TSP closes.
     */
    getIntradayEstimates: publicProcedure.query(async () => {
      return await getIntradayEstimates();
    }),

    /**
     * Get historical prices for a fund
     */
    getPriceHistory: publicProcedure
      .input(
        z.object({
          fundSymbol: z.enum(['G', 'C', 'S', 'I']),
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input }) => {
        const prices = await getFundPricesByDateRange(
          input.fundSymbol,
          input.startDate,
          input.endDate
        );

        return prices.map((p) => ({
          date: p.priceDate,
          price: parseFloat(p.sharePrice as any),
          dailyChange: p.dailyPercentChange
            ? parseFloat(p.dailyPercentChange as any)
            : 0,
        }));
      }),

    /**
     * Get indicators for a fund
     */
    getIndicators: publicProcedure
      .input(
        z.object({
          fundSymbol: z.enum(['G', 'C', 'S', 'I']),
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input }) => {
        const indicators = await getFundIndicatorsByDateRange(
          input.fundSymbol,
          input.startDate,
          input.endDate
        );

        return indicators.map((ind) => ({
          date: ind.indicatorDate,
          macdLine: ind.macdLine ? parseFloat(ind.macdLine as any) : null,
          macdSignal: ind.macdSignal ? parseFloat(ind.macdSignal as any) : null,
          macdHistogram: ind.macdHistogram
            ? parseFloat(ind.macdHistogram as any)
            : null,
          momentum1Month: ind.momentum1Month
            ? parseFloat(ind.momentum1Month as any)
            : 0,
          momentum2Week: ind.momentum2Week
            ? parseFloat(ind.momentum2Week as any)
            : 0,
          momentum3Month: ind.momentum3Month
            ? parseFloat(ind.momentum3Month as any)
            : 0,
        }));
      }),

    /**
     * Sync latest data from TSP.gov
     */
    syncData: publicProcedure.mutation(async () => {
      try {
        const result = await syncTSPData({ force: true });
        return {
          success: true,
          synced: result.synced,
          errors: result.errors,
        };
      } catch (error) {
        console.error('Error syncing TSP data:', error);
        return {
          success: false,
          synced: 0,
          errors: 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

    /**
     * Get comparison data for multiple funds
     */
    getComparison: publicProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input }) => {
        const funds = ['G', 'C', 'S', 'I'];
        const comparison: Record<string, any> = {};

        for (const fund of funds) {
          const prices = await getFundPricesByDateRange(
            fund,
            input.startDate,
            input.endDate
          );

          comparison[fund] = {
            prices: prices.map((p) => ({
              date: p.priceDate,
              price: parseFloat(p.sharePrice as any),
              dailyChange: p.dailyPercentChange
                ? parseFloat(p.dailyPercentChange as any)
                : 0,
            })),
            indicators: await getFundIndicatorsByDateRange(
              fund,
              input.startDate,
              input.endDate
            ).then((inds) =>
              inds.map((ind) => ({
                date: ind.indicatorDate,
                momentum1Month: ind.momentum1Month
                  ? parseFloat(ind.momentum1Month as any)
                  : 0,
                momentum2Week: ind.momentum2Week
                  ? parseFloat(ind.momentum2Week as any)
                  : 0,
                momentum3Month: ind.momentum3Month
                  ? parseFloat(ind.momentum3Month as any)
                  : 0,
              }))
            ),
          };
        }

        return comparison;
      }),
  }),

  // User settings
  settings: router({
    /**
     * Get user settings
     */
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getUserSettings(ctx.user.id);
      return (
        settings || {
          darkMode: 'auto',
          selectedFunds: 'G,C,S,I',
        }
      );
    }),

    /**
     * Update user settings
     */
    update: protectedProcedure
      .input(
        z.object({
          darkMode: z.enum(['light', 'dark', 'auto']).optional(),
          selectedFunds: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateUserSettings(ctx.user.id, input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
