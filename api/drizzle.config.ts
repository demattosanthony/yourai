import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./app/config/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: "db.sqlite",
  },
});
