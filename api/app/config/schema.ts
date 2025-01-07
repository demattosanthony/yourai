import {
  pgTable,
  serial,
  timestamp,
  text,
  jsonb,
  uuid,
  integer,
  pgEnum,
  foreignKey,
} from "drizzle-orm/pg-core";

// Enum for message roles
export const messageRoleEnum = pgEnum("message_role", [
  "system",
  "user",
  "assistant",
  "tool",
]);

// Enum for tool call status
export const toolCallStatusEnum = pgEnum("tool_call_status", [
  "pending",
  "completed",
  "failed",
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Threads table
export const threads = pgTable("threads", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  thread_id: uuid("thread_id")
    .notNull()
    .references(() => threads.id),
  role: messageRoleEnum("role").notNull(),
  content: text("content"),
  name: text("name"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Tool calls table
export const toolCalls = pgTable("tool_calls", {
  id: uuid("id").defaultRandom().primaryKey(),
  message_id: uuid("message_id")
    .notNull()
    .references(() => messages.id),
  function_name: text("function_name").notNull(),
  function_arguments: jsonb("function_arguments"),
  status: toolCallStatusEnum("status").notNull(),
  result: jsonb("result"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// AI Models table
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Thread-AI Model association table
export const threadAiModels = pgTable("thread_ai_models", {
  id: serial("id").primaryKey(),
  thread_id: uuid("thread_id")
    .notNull()
    .references(() => threads.id),
  ai_model_id: integer("ai_model_id")
    .notNull()
    .references(() => aiModels.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
