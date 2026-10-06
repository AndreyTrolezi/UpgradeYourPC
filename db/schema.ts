import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userProfiles = sqliteTable("user_profiles", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  profileJson: text("profile_json").notNull(),
  revision: text("revision").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const pcHistory = sqliteTable("pc_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  buildJson: text("build_json").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_pc_history_user_created").on(table.userId, table.createdAt)]);

export const savedBuilds = sqliteTable("saved_builds", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  buildJson: text("build_json").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("idx_saved_builds_user_updated").on(table.userId, table.updatedAt),
]);

export const extensionInstalls = sqliteTable("extension_installs", {
  userId: text("user_id").notNull(),
  pluginId: text("plugin_id").notNull(),
  manifestJson: text("manifest_json").notNull(),
  enabled: text("enabled").notNull().default("1"),
  installedAt: text("installed_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.pluginId] }),
  index("idx_extension_installs_user").on(table.userId),
]);

export const marketCache = sqliteTable("market_cache", {
  key: text("key").primaryKey(),
  payload: text("payload").notNull().default("{}"),
  expiresAt: integer("expires_at").notNull().default(0),
  leaseUntil: integer("lease_until").notNull().default(0),
  leaseToken: text("lease_token").notNull().default(""),
});

export const marketUsage = sqliteTable("market_usage", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
});
