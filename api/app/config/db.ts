import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const pool = new Pool({
  connectionString:
    process.env.POSTGRES_CONNECTION_STRING ||
    "postgresql://postgres:postgres@localhost:5432/postgres",
});

const db = drizzle(pool, { schema });

export default db;
