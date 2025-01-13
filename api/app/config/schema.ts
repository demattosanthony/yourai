import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Message roles will be stored as text
const MESSAGE_ROLES = ["system", "user", "assistant", "tool"] as const;
const TOOL_CALL_STATUS = ["pending", "completed", "failed"] as const;

// Content types
const CONTENT_TYPES = ["text", "image", "file"] as const;

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
  content: jsonb("content").notNull(),
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

type BaseContentPart = {
  type: (typeof CONTENT_TYPES)[number];
};

type TextContent = BaseContentPart & {
  type: "text";
  text: string;
};

export type FileContent = BaseContentPart & {
  type: "file" | "image";
  data?: string; // url for the file
  image?: string; // base64 encoded image
  file_metadata: {
    filename: string;
    mime_type: string;
    file_key: string; // the key/path in storage (S3)
    size?: number; // size in bytes
  };
};

export type ContentPart = TextContent | FileContent;
