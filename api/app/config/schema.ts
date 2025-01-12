import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Message roles will be stored as text
const MESSAGE_ROLES = ["system", "user", "assistant", "tool"] as const;
const TOOL_CALL_STATUS = ["pending", "completed", "failed"] as const;

// Threads table
export const threads = pgTable("threads", {
  id: uuid("id").primaryKey().defaultRandom(), // UUID type in Postgres
  created_at: timestamp("created_at").notNull(),
  updated_at: timestamp("updated_at").notNull(),
});

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  thread_id: uuid("thread_id")
    .notNull()
    .references(() => threads.id),
  role: text("role").notNull(),
  content: text("content").notNull(), // stringified JSON that looks like {"type": "text", "text": "Hello"}
  created_at: timestamp("created_at").notNull(),
});

// Add relationships
export const threadsRelations = relations(threads, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  thread: one(threads, {
    fields: [messages.thread_id],
    references: [threads.id],
  }),
}));

// Tool calls table
export const toolCalls = pgTable("tool_calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  message_id: uuid("message_id")
    .notNull()
    .references(() => messages.id),
  function_name: text("function_name").notNull(),
  function_arguments: text("function_arguments"),
  status: text("status").notNull(), // Store status as text
  result: text("result"),
  created_at: timestamp("created_at").notNull(),
  updated_at: timestamp("updated_at").notNull(),
});
