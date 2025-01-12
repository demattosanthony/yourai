import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";

const sqlite = new Database(
  process.env.NODE_ENV === "production" ? "/tmp/db.sqlite" : "db.sqlite",
  { create: true }
);

export const db = drizzle(sqlite, {
  schema,
});
