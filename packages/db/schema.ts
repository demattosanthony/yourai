import { sql } from "drizzle-orm";
import {
  text,
  pgTable,
  serial,
  timestamp,
  jsonb,
  uuid,
  integer,
  vector,
  index,
} from "drizzle-orm/pg-core";

export const thread = pgTable("thread", {
  id: serial(),
  created_at: timestamp(),
  updated_at: timestamp(),
  title: text(),
  messages: jsonb(),
});
