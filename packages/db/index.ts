import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { supabase } from "./supabase";

const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
});

const db = drizzle(pool, { schema });

export { schema, supabase };

export default db;
