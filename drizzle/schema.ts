import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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

export const newsSources = mysqlTable("news_sources", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  feedUrl: varchar("feedUrl", { length: 500 }).notNull().unique(),
  language: varchar("language", { length: 10 }).notNull().default("ar"),
  category: mysqlEnum("category", ["politics", "economy", "sports", "technology", "health", "culture", "world", "science", "lifestyle"]).notNull().default("world"),
  isActive: boolean("isActive").notNull().default(true),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  categoryIdx: index("news_sources_category_idx").on(table.category),
  scheduleUidIdx: index("news_sources_schedule_uid_idx").on(table.scheduleCronTaskUid),
}));

export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: int("sourceId").notNull(),
  externalId: varchar("externalId", { length: 512 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary"),
  content: text("content"),
  sourceName: varchar("sourceName", { length: 160 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1000 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 1000 }),
  category: mysqlEnum("category", ["politics", "economy", "sports", "technology", "health", "culture", "world", "science", "lifestyle"]).notNull().default("world"),
  publishedAt: timestamp("publishedAt").notNull(),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  isBreaking: boolean("isBreaking").notNull().default(false),
}, table => ({
  externalIdx: uniqueIndex("news_source_external_idx").on(table.sourceId, table.externalId),
  slugIdx: uniqueIndex("news_slug_idx").on(table.slug),
  publishedIdx: index("news_published_idx").on(table.publishedAt),
  categoryIdx: index("news_category_idx").on(table.category),
}));

export type NewsSource = typeof newsSources.$inferSelect;
export type InsertNewsSource = typeof newsSources.$inferInsert;
export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;