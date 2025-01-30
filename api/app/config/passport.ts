import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
import { VerifyCallback } from "passport-oauth2";
import passport from "passport";
import db from "./db";
import { eq } from "drizzle-orm";
import { users } from "./schema";
import s3 from "./s3";

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

  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        callbackURL: process.env.MICROSOFT_CALLBACK_URL!,
        scope: [
          "user.read",
          "profile",
          "email",
          "openid",
          "user.read.all",
          "profilephoto.read.all",
        ],
        tenant: "common",
        authorizationURL:
          "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        tokenURL: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback
      ) => {
        try {
          console.log(
            "Microsoft Auth Profile:",
            JSON.stringify(profile, null, 2)
          );

          let profilePictureUrl: string | null = null;

          try {
            const response = await fetch(
              `https://graph.microsoft.com/v1.0/me/photo/$value`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (response.ok) {
              const buffer = await response.arrayBuffer();

              // Upload to s3
              await s3.write(`profile-pictures/${profile.id}.jpg`, buffer, {
                acl: "public-read",
              });
              profilePictureUrl = await s3.presign(
                `profile-pictures/${profile.id}.jpg`,
                {
                  acl: "public-read",
                }
              );
            }
          } catch (err) {
            console.error("Error fetching profile picture", err);
          }

          let user = await db.query.users.findFirst({
            where: eq(users.microsoftId, profile.id),
          });

          if (!user) {
            // Create new user if they don't exist
            const [newUser] = await db
              .insert(users)
              .values({
                email: profile.emails![0].value,
                name: profile.displayName,
                microsoftId: profile.id,
                profilePicture: profilePictureUrl,
              })
              .returning();
            user = newUser;
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  return passport;
}

const myPassport = configurePassport();

export default myPassport;
