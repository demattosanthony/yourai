import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as SamlStrategy, VerifiedCallback } from "passport-saml";
import passport from "passport";
import db from "./db";
import { eq } from "drizzle-orm";
import { users } from "./schema";

const cert = await Bun.file(process.env.SAML_CERT!).text();

export function configurePassport() {
  passport.use(
    "google",
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

  // SAML Strategy
  passport.use(
    "saml",
    new SamlStrategy(
      {
        entryPoint: process.env.SAML_ENTRY_POINT!, // Your SAML Entry Point URL
        issuer: process.env.SAML_ISSUER!, // Your SAML Issuer
        cert,
        callbackUrl: process.env.SAML_CALLBACK_URL!, // SAML callback URL in your app
        disableRequestedAuthnContext: true,
      },
      async function (samlAssertionInfo: any, done: VerifiedCallback) {
        try {
          const samlEmail =
            samlAssertionInfo[
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
            ];
          const samlName =
            samlAssertionInfo["http://schemas.auth0.com/nickname"];
          const profilePicture =
            samlAssertionInfo["http://schemas.auth0.com/picture"];

          if (!samlEmail) {
            return done(new Error("SAML Response missing email address"));
          }

          let user = await db.query.users.findFirst({
            where: eq(users.email, samlEmail), // Assuming email is the unique identifier
          });

          if (!user) {
            [user] = await db
              .insert(users)
              .values({
                email: samlEmail,
                name: samlName || samlEmail.split("@")[0], // Fallback name
                identityProvider: "saml", // Set identity provider
                profilePicture,
              })
              .returning();
          }

          done(null, user);
        } catch (error: any) {
          done(error);
        }
      }
    )
  );

  return passport;
}

const myPassport = configurePassport();

export default myPassport;
