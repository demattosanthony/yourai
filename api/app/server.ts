import Express from "express";
import cors from "cors";
import path from "path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import cookieParser from "cookie-parser";
import { CONFIG } from "./config/constants";
import db from "./config/db";
import myPassport from "./config/passport";
import routes from "./api";

async function main() {
  try {
    await migrate(db, {
      migrationsFolder: path.join(__dirname, "../drizzle"),
    });
  } catch (error) {
    console.error("Error occurred during database migration", error);
    process.exit(1);
  }

  const app = Express();

  if (CONFIG.__prod__) {
    // you need this if you have nginx or another proxy in front
    // dokku uses nginx
    app.set("trust proxy", 1);
  }

  app.use("/payments/webhook", Express.raw({ type: "application/json" }));
  app.use("/auth/saml/:slug/callback", Express.urlencoded({ extended: false }));
  app.use(Express.json({ limit: "50mb" }));

  app.use(
    cors({
      credentials: true,
      origin: CONFIG.CORS_ORIGINS,
    })
  );
  app.use(cookieParser());
  app.use(myPassport.initialize());

  app.use("/", routes);

  app.listen(CONFIG.PORT, () => {
    console.log(`Server is running on http://localhost:${CONFIG.PORT}`);
  });
}

main();
