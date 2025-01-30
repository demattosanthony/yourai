import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import db from "./db";
import { eq } from "drizzle-orm";
import { users } from "./schema";

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        // if (!WHITELIST_EMAILS.includes(profile._json.email || "")) {
        //   return done(null, false, { message: "Email not authorized" });
        // }

        // 1. grab id
        const googleId = profile.id;

        // 2. check if user exists
        let user = await db.query.users.findFirst({
          where: eq(users.googleId, googleId),
        });

        const profilePictureUrl = profile.photos?.[0]?.value;

        // 3. create user if not exists
        if (!user) {
          const name = profile._json.name;
          const email = profile._json.email;

          if (!email || !name) {
            return done(new Error("Missing required fields"));
          }

          [user] = await db
            .insert(users)
            .values({
              googleId,
              profilePicture: profilePictureUrl,
              email,
              name,
            })
            .returning();
        } else {
          // Update existing user's profile picture
          [user] = await db
            .update(users)
            .set({ profilePicture: profilePictureUrl })
            .where(eq(users.id, user.id))
            .returning();
        }

        // 4. return user
        done(null, user);
      }
    )
  );

  return passport;
}

const myPassport = configurePassport();

export default myPassport;
