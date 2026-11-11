import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
export const appState = sqliteTable('app_state', {
 id: integer('id').primaryKey(),
 revision: integer('revision').notNull(),
 payload: text('payload').notNull(),
 updatedAt: text('updated_at').notNull(),
});
export const appHistory = sqliteTable('app_history', {
 revision: integer('revision').primaryKey(),
 payload: text('payload').notNull(),
 createdAt: text('created_at').notNull(),
});

export const appSessions = sqliteTable('app_sessions', {
 token: text('token').primaryKey(),
 payload: text('payload').notNull(),
 expiresAt: text('expires_at').notNull(),
});
