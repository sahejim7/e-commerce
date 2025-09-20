import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const subscribers = pgTable('subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
