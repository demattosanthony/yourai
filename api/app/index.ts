import Express from "express";
import cors from "cors";
import path from "path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { eq } from "drizzle-orm";
import db from "./config/db";
import { MODELS } from "./models";
import { messages, ContentPart, users } from "./config/schema";
import { runInference } from "./inference";
import s3 from "./config/s3";
import { CoreMessage } from "ai";
import cookieParser from "cookie-parser";
import { createThread, getThreads, getThread, createMessage } from "./threads";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { checkTokens, DbUser, sendAuthCookies } from "./createAuthToken";
import { authMiddleware } from "./middleware/auth";

const PORT = process.env.PORT || 4000;

const WHITELIST_EMAILS = [
  "mgkurass@gmail.com",
  "demattosanthony@gmail.com",
  "rsetty@gmail.com",
];

// Error Handling
function handleError(res: Express.Response, error: Error) {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}

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

  if (process.env.NODE_ENV === "production") {
    // you need this if you have nginx or another proxy in front
    // dokku uses nginx
    app.set("trust proxy", 1);
  }

  app.use(Express.json({ limit: "50mb" }));
  app.use(
    cors({
      credentials: true,
      origin: [
        process.env.FRONTEND_URL!,
        "https://yo.syyclops.com",
        "https://www.yo.syyclops.com",
        "https://yo-syyclops.vercel.app",
      ],
    })
  );
  app.use(cookieParser());
  app.use(passport.initialize());

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        if (!WHITELIST_EMAILS.includes(profile._json.email || "")) {
          return done(null, false, { message: "Email not authorized" });
        }

        // 1. grab id
        const googleId = profile.id;

        // 2. check if user exists
        let user = await db.query.users.findFirst({
          where: eq(users.googleId, googleId),
        });

        // 3. create user if not exists
        if (!user) {
          const picture = profile._json.picture;
          const name = profile._json.name;
          const email = profile._json.email;

          if (!email || !name || !picture) {
            return done(new Error("Missing required fields"));
          }

          [user] = await db
            .insert(users)
            .values({
              googleId,
              profilePicture: picture,
              email,
              name,
            })
            .returning();
        }

        // 4. return user
        done(null, user);
      }
    )
  );

  app.get("/auth/google", passport.authenticate("google", { session: false }));

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: process.env.FRONTEND_URL + "?error=unauthorized", // Add error parameter
    }),
    (req, res) => {
      sendAuthCookies(res, req.user as DbUser);
      if ((req.user as DbUser).subscriptionStatus === "active") {
        res.redirect(process.env.FRONTEND_URL!);
      } else {
        res.redirect(process.env.FRONTEND_URL!);
      }
    }
  );

  app.post("/auth/logout", (req, res) => {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      domain: process.env.NODE_ENV === "production" ? ".syyclops.com" : "",
      path: "/", // Make sure this matches the path used when setting the cookies
    };

    res.clearCookie("id", cookieOptions);
    res.clearCookie("rid", cookieOptions);
    res.status(200).send("Logged out");
  });

  app.get("/auth/me", async (req, res) => {
    const { id, rid } = req.cookies;
    let user: DbUser | null | undefined = null;

    try {
      const { userId, user: maybeUser } = await checkTokens(id, rid);
      if (maybeUser) {
        user = maybeUser;
      } else {
        user = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });
      }

      res.json({ user });
    } catch (e) {
      res.json({ user });
    }
  });

  app.post("/presigned-url", authMiddleware, async (req, res) => {
    try {
      const { filename, mime_type, size } = req.body;
      const file_key = `uploads/${Date.now()}-${filename}`;
      const url = s3.presign(file_key, {
        expiresIn: 3600, // 1 hour
        type: mime_type,
        method: "PUT",
      });
      const viewUrl = s3.file(file_key).presign({
        expiresIn: 3600,
        method: "GET",
      });

      res.json({
        url,
        viewUrl,
        file_metadata: {
          filename,
          mime_type,
          file_key,
          size,
        },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  });

  app.get("/models", async (req, res) => {
    res.json(
      Object.entries(MODELS).map(([modelName, config]) => ({
        name: modelName,
        supportsToolUse: config.supportsToolUse,
        supportsStreaming: config.supportsStreaming,
        provider: config.provider,
        supportsImages: config.supportsImages,
        supportsPdfs: config.supportsPdfs,
        description: config.description,
      }))
    );
  });

  app.post("/threads", authMiddleware, async (req, res) => {
    try {
      const result = await createThread(req.userId!);
      res.json(result);
    } catch (error: any) {
      handleError(res, error);
    }
  });

  app.get("/threads", authMiddleware, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const search = (req.query.search as string)?.trim() || "";
      const threads = await getThreads(req.userId!, page, search);
      res.json(threads);
    } catch (error: any) {
      handleError(res, error);
    }
  });

  app.get("/threads/:threadId", authMiddleware, async (req, res) => {
    try {
      const { threadId } = req.params;
      const thread = await getThread(threadId);
      if (!thread) {
        res.status(404).json({ error: "Thread not found" });
        return;
      }
      res.json(thread);
    } catch (error: any) {
      handleError(res, error);
    }
  });

  app.post("/threads/:threadId/messages", authMiddleware, async (req, res) => {
    try {
      const { threadId } = req.params;
      const { role, content } = req.body;
      if (!["system", "user", "assistant"].includes(role)) {
        res.status(400).json({ error: "Invalid role" });
        return;
      }
      const thread = await getThread(threadId);
      if (!thread) {
        res.status(404).json({ error: "Thread not found" });
        return;
      }
      const result = await createMessage(req.userId!, threadId, role, content);
      res.status(201).json(result);
    } catch (error: any) {
      handleError(res, error);
    }
  });

  app.post("/threads/:threadId/inference", authMiddleware, async (req, res) => {
    const { threadId } = req.params;
    const { model, maxTokens, temperature, instructions } = req.body;

    res.setHeader("Content-Type", "text/event-stream");

    try {
      const thread = await getThread(threadId);
      if (!thread) {
        res.status(404).json({ error: "Thread not found" });
        return;
      }
      let threadMessages = await db.query.messages.findMany({
        where: eq(messages.threadId, threadId),
        orderBy: messages.createdAt,
      });

      const modelToRun = MODELS[model];

      // If model doesn't support images or files than remove them from the messages
      if (!modelToRun.supportsImages) {
        threadMessages = threadMessages.filter(
          (msg) => (msg.content as ContentPart).type !== "image"
        );
      }
      if (!modelToRun.supportsPdfs) {
        threadMessages = threadMessages.filter(
          (msg) => (msg.content as ContentPart).type !== "file"
        );
      }

      const inferenceMessages = await Promise.all(
        threadMessages.map(async (msg) => ({
          role: msg.role,
          content: await (async (content: ContentPart) => {
            if (content.type === "text") {
              return [
                {
                  type: content.type,
                  text: content.text,
                },
              ];
            } else {
              const metadata = s3.file(content.file_metadata.file_key);
              const data = await metadata.arrayBuffer();
              const buffer = Buffer.from(new Uint8Array(data));
              const base64 = `data:${
                content.file_metadata.mime_type
              };base64,${buffer.toString("base64")}`;

              return [
                {
                  type: content.type,
                  mimeType: content.file_metadata.mime_type,
                  [content.type === "image" ? "image" : "data"]: base64,
                },
              ];
            }
          })(msg.content as ContentPart),
        }))
      );

      const onToolEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      const textStream = await runInference(
        {
          model: modelToRun.model,
          messages: inferenceMessages as CoreMessage[],
          maxTokens,
          temperature,
          system: instructions,
        },
        onToolEvent,
        modelToRun.supportsStreaming
      );

      let aiResponse = "";
      for await (const message of textStream) {
        res.write(
          `event: message\ndata: ${JSON.stringify({
            text: message,
          })}\n\n`
        );
        aiResponse += message;
      }

      await db.insert(messages).values({
        userId: req.userId!,
        id: crypto.randomUUID(),
        threadId: threadId,
        role: "assistant",
        content: JSON.stringify({ type: "text", text: aiResponse }),
        createdAt: new Date(),
        model: model,
        provider: modelToRun.provider,
      });

      res.write("event: done\ndata: true\n\n");
      res.end();
    } catch (error) {
      console.log("Error", error);
      res.status(500).send(error);
    }
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

main();
