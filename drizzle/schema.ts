import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * TSP Fund daily share prices and performance data
 */
export const fundPrices = mysqlTable("fundPrices", {
  id: int("id").autoincrement().primaryKey(),
  /** Fund symbol: G, C, S, I */
  fundSymbol: varchar("fundSymbol", { length: 10 }).notNull(),
  /** Date of the share price */
  priceDate: date("priceDate").notNull(),
  /** Share price value */
  sharePrice: decimal("sharePrice", { precision: 10, scale: 4 }).notNull(),
  /** Daily percentage change from previous day */
  dailyPercentChange: decimal("dailyPercentChange", { precision: 8, scale: 4 }),
  /** Timestamp when this record was created/updated */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  symbolDateUnique: uniqueIndex("fundPrices_symbol_date_unique").on(table.fundSymbol, table.priceDate),
}));

export type FundPrice = typeof fundPrices.$inferSelect;
export type InsertFundPrice = typeof fundPrices.$inferInsert;

/**
 * Calculated MACD and momentum indicators for each fund
 */
export const fundIndicators = mysqlTable("fundIndicators", {
  id: int("id").autoincrement().primaryKey(),
  /** Fund symbol: G, C, S, I */
  fundSymbol: varchar("fundSymbol", { length: 10 }).notNull(),
  /** Date of the indicator calculation */
  indicatorDate: date("indicatorDate").notNull(),
  /** MACD line (12-day EMA - 26-day EMA) */
  macdLine: decimal("macdLine", { precision: 10, scale: 6 }),
  /** Signal line (9-day EMA of MACD) */
  macdSignal: decimal("macdSignal", { precision: 10, scale: 6 }),
  /** MACD histogram (MACD - Signal) */
  macdHistogram: decimal("macdHistogram", { precision: 10, scale: 6 }),
  /** 1-month momentum (current price vs 1 month ago) */
  momentum1Month: decimal("momentum1Month", { precision: 8, scale: 4 }),
  /** 2-week momentum (current price vs 2 weeks ago) */
  momentum2Week: decimal("momentum2Week", { precision: 8, scale: 4 }),
  /** 3-month momentum (current price vs 3 months ago) */
  momentum3Month: decimal("momentum3Month", { precision: 8, scale: 4 }),
  /** Timestamp when this record was created/updated */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  symbolDateUnique: uniqueIndex("fundIndicators_symbol_date_unique").on(table.fundSymbol, table.indicatorDate),
}));

export type FundIndicator = typeof fundIndicators.$inferSelect;
export type InsertFundIndicator = typeof fundIndicators.$inferInsert;

/**
 * User preferences and settings
 */
export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to user */
  userId: int("userId").notNull(),
  /** Dark mode preference */
  darkMode: mysqlEnum("darkMode", ["light", "dark", "auto"]).default("auto").notNull(),
  /** Selected funds to track */
  selectedFunds: text("selectedFunds").notNull().default("G,C,S,I"),
  /** Last data update timestamp */
  lastDataUpdate: timestamp("lastDataUpdate"),
  /** Timestamp when this record was created/updated */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userUnique: uniqueIndex("userSettings_user_id_unique").on(table.userId),
}));

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;
