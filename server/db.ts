import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, fundPrices, fundIndicators, userSettings } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TSP Fund Data Queries

/**
 * Get all fund prices for a specific date range
 */
export async function getFundPricesByDateRange(
  fundSymbol: string,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(fundPrices)
    .where(
      and(
        eq(fundPrices.fundSymbol, fundSymbol),
        gte(fundPrices.priceDate, startDate),
        lte(fundPrices.priceDate, endDate)
      )
    )
    .orderBy(asc(fundPrices.priceDate));
}

/**
 * Get the latest fund price for a specific fund
 */
export async function getLatestFundPrice(fundSymbol: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(fundPrices)
    .where(eq(fundPrices.fundSymbol, fundSymbol))
    .orderBy(desc(fundPrices.priceDate))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get all latest prices for all funds
 */
export async function getLatestFundPrices() {
  const db = await getDb();
  if (!db) return [];

  const funds = ['G', 'C', 'S', 'I'];
  const results = await Promise.all(
    funds.map(fund => getLatestFundPrice(fund))
  );

  return results.filter((r) => r !== null);
}

/**
 * Insert or update fund price data
 */
export async function upsertFundPrice(data: {
  fundSymbol: string;
  priceDate: Date;
  sharePrice: number;
  dailyPercentChange?: number;
}) {
  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select()
    .from(fundPrices)
    .where(
      and(
        eq(fundPrices.fundSymbol, data.fundSymbol),
        eq(fundPrices.priceDate, data.priceDate)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(fundPrices)
      .set({
        sharePrice: data.sharePrice.toString(),
        dailyPercentChange: data.dailyPercentChange?.toString(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(fundPrices.fundSymbol, data.fundSymbol),
          eq(fundPrices.priceDate, data.priceDate)
        )
      );
  } else {
    await db.insert(fundPrices).values({
      fundSymbol: data.fundSymbol,
      priceDate: data.priceDate,
      sharePrice: data.sharePrice.toString(),
      dailyPercentChange: data.dailyPercentChange?.toString(),
    });
  }
}

/**
 * Insert or update many fund prices in chunks.
 * Requires the unique fund/date index so repeated official syncs remain idempotent.
 */
export async function upsertFundPricesBulk(
  data: Array<{
    fundSymbol: string;
    priceDate: Date;
    sharePrice: number;
    dailyPercentChange?: number;
  }>,
): Promise<number> {
  const db = await getDb();
  if (!db || data.length === 0) return 0;

  const chunkSize = 500;
  let written = 0;
  for (let offset = 0; offset < data.length; offset += chunkSize) {
    const chunk = data.slice(offset, offset + chunkSize);
    await db
      .insert(fundPrices)
      .values(
        chunk.map((item) => ({
          fundSymbol: item.fundSymbol,
          priceDate: item.priceDate,
          sharePrice: item.sharePrice.toString(),
          dailyPercentChange: item.dailyPercentChange?.toString() ?? null,
        })),
      )
      .onDuplicateKeyUpdate({
        set: {
          sharePrice: sql`VALUES(${fundPrices.sharePrice})`,
          dailyPercentChange: sql`VALUES(${fundPrices.dailyPercentChange})`,
          updatedAt: new Date(),
        },
      });
    written += chunk.length;
  }

  return written;
}

/**
 * Get fund indicators for a specific date range
 */
export async function getFundIndicatorsByDateRange(
  fundSymbol: string,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(fundIndicators)
    .where(
      and(
        eq(fundIndicators.fundSymbol, fundSymbol),
        gte(fundIndicators.indicatorDate, startDate),
        lte(fundIndicators.indicatorDate, endDate)
      )
    )
    .orderBy(asc(fundIndicators.indicatorDate));
}

/**
 * Insert or update fund indicators
 */
export async function upsertFundIndicator(data: {
  fundSymbol: string;
  indicatorDate: Date;
  macdLine?: number;
  macdSignal?: number;
  macdHistogram?: number;
  momentum1Month?: number;
  momentum2Week?: number;
  momentum3Month?: number;
}) {
  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select()
    .from(fundIndicators)
    .where(
      and(
        eq(fundIndicators.fundSymbol, data.fundSymbol),
        eq(fundIndicators.indicatorDate, data.indicatorDate)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(fundIndicators)
      .set({
        macdLine: data.macdLine?.toString(),
        macdSignal: data.macdSignal?.toString(),
        macdHistogram: data.macdHistogram?.toString(),
        momentum1Month: data.momentum1Month?.toString(),
        momentum2Week: data.momentum2Week?.toString(),
        momentum3Month: data.momentum3Month?.toString(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(fundIndicators.fundSymbol, data.fundSymbol),
          eq(fundIndicators.indicatorDate, data.indicatorDate)
        )
      );
  } else {
    await db.insert(fundIndicators).values({
      fundSymbol: data.fundSymbol,
      indicatorDate: data.indicatorDate,
      macdLine: data.macdLine?.toString(),
      macdSignal: data.macdSignal?.toString(),
      macdHistogram: data.macdHistogram?.toString(),
      momentum1Month: data.momentum1Month?.toString(),
      momentum2Week: data.momentum2Week?.toString(),
      momentum3Month: data.momentum3Month?.toString(),
    });
  }
}

/**
 * Get user settings
 */
export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: number,
  settings: {
    darkMode?: 'light' | 'dark' | 'auto';
    selectedFunds?: string;
  }
) {
  const db = await getDb();
  if (!db) return null;

  const existing = await getUserSettings(userId);

  if (existing) {
    await db
      .update(userSettings)
      .set({
        darkMode: settings.darkMode,
        selectedFunds: settings.selectedFunds,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({
      userId,
      darkMode: settings.darkMode || 'auto',
      selectedFunds: settings.selectedFunds || 'G,C,S,I',
    });
  }
}
