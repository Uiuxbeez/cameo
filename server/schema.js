import { pgSchema, text, integer, jsonb, timestamp, uuid, customType } from 'drizzle-orm/pg-core';
export const cms = pgSchema('cameo_cms');
const bytes = customType({ dataType: () => 'bytea' });
export const pages = cms.table('pages', {
  slug: text('slug').primaryKey(), draft: jsonb('draft').notNull(), published: jsonb('published'),
  version: integer('version').notNull().default(1), publishedVersion: integer('published_version'),
  updatedAt: timestamp('updated_at', {withTimezone:true}).notNull().defaultNow(),
});
export const users = cms.table('users', {
  id: uuid('id').primaryKey().defaultRandom(), email: text('email').notNull().unique(), password: text('password').notNull(),
});
export const sessions = cms.table('sessions', {
  hash: text('hash').primaryKey(), userId: uuid('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}), expiresAt: timestamp('expires_at',{withTimezone:true}).notNull(),
});
export const media = cms.table('media', {
  id: uuid('id').primaryKey().defaultRandom(), name: text('name').notNull(), mime: text('mime').notNull(), data: bytes('data').notNull(), createdAt: timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
});
export const enquiries = cms.table('enquiries', {
  id: uuid('id').primaryKey().defaultRandom(), name:text('name').notNull(), email:text('email').notNull(), company:text('company').notNull(), phone:text('phone').notNull(), subject:text('subject').notNull(), message:text('message').notNull(),
  status:text('status').notNull().default('new'), createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
});
