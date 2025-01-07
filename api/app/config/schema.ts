import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Message roles will be stored as text
const MESSAGE_ROLES = ["system", "user", "assistant", "tool"] as const;
const TOOL_CALL_STATUS = ["pending", "completed", "failed"] as const;

// Threads table
export const threads = sqliteTable("threads", {
  id: text("id").primaryKey(), // UUID stored as text
  title: text("title"),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Messages table
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  thread_id: text("thread_id")
    .notNull()
    .references(() => threads.id),
  role: text("role") // Store role as TEXT without enum in SQLite
    .notNull(),
  content: text("content"),
  name: text("name"),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Tool calls table
export const toolCalls = sqliteTable("tool_calls", {
  id: text("id").primaryKey(),
  message_id: text("message_id")
    .notNull()
    .references(() => messages.id),
  function_name: text("function_name").notNull(),
  function_arguments: text("function_arguments"),
  status: text("status") // Store status as TEXT without enum in SQLite
    .notNull(),
  result: text("result"),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" }).notNull(),
});
