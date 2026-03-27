import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

/**
 * TSP Fund data proxy — fetches CSV from TSP.gov server-side to bypass CORS
 */
async function fetchTSPCSV(startDate: string, endDate: string): Promise<string> {
  const params = new URLSearchParams({
    startdate: startDate,
    enddate: endDate,
    Lfunds: "0",
    InvFunds: "1",
    download: "0",
  });

  const url = `https://www.tsp.gov/data/fund-price-history.csv?${params}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "text/csv,text/plain,*/*",
      Referer: "https://www.tsp.gov/share-price-history/",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) {
    throw new Error(`TSP.gov returned ${response.status}`);
  }

  return response.text();
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
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

  /**
   * TSP Fund data proxy — server-side fetch to bypass CORS
   */
  tsp: router({
    getFundData: publicProcedure
      .input(
        z.object({
          startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        })
      )
      .query(async ({ input }) => {
        const csv = await fetchTSPCSV(input.startDate, input.endDate);
        return { csv };
      }),
  }),
});

export type AppRouter = typeof appRouter;
