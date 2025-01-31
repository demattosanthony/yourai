import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as SamlStrategy, VerifiedCallback } from "passport-saml";
import passport from "passport";
import db from "./db";
import { eq } from "drizzle-orm";
import { organizationMembers, organizations, users } from "./schema";
import { NextFunction, Response, Request } from "express";

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

  return passport;
}

const myPassport = configurePassport();

export async function authenticateSaml(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const slug = req.params.slug; // Get the organization slug from the URL

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
    with: {
      samlConfig: true,
    },
  });

  console.log(`org: ${org?.id}`);
  console.log(`org.samlConfig: ${JSON.stringify(org?.samlConfig)}`);

  if (!org || !org.samlConfig) {
    res.status(404).send("Organization or SAML configuration not found");
    return;
  }

  // SAML Strategy
  passport.use(
    `saml-${org.id}`,
    new SamlStrategy(
      {
        entryPoint: org.samlConfig.entryPoint,
        issuer: org.samlConfig.issuer,
        cert: org.samlConfig.cert,
        callbackUrl: org.samlConfig.callbackUrl,
        disableRequestedAuthnContext: true,
      },
      async function (samlAssertionInfo: any, done: VerifiedCallback) {
        try {
          const samlEmail =
            samlAssertionInfo[
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
            ];
          const [emailName, emailDomain] = samlEmail.split("@");

          if (!samlEmail) {
            return done(new Error("SAML Response missing email address"));
          }

          // Find organization by domain
          const org = await db.query.organizations.findFirst({
            where: eq(organizations.domain, emailDomain),
          });

          if (!org) {
            throw new Error("No organization found for this email domain");
          }

          const samlName =
            samlAssertionInfo[
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
            ] ||
            samlAssertionInfo["urn:oid:2.5.4.42"] || // givenName
            samlAssertionInfo["urn:oid:2.5.4.4"];

          const profilePicture = null;

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

            // Add user to organization
            await db.insert(organizationMembers).values({
              organizationId: org.id,
              userId: user.id,
              role: "member",
            });
          }

          done(null, user);
        } catch (error: any) {
          done(error);
        }
      }
    )
  );

  passport.authenticate(`saml-${org.id}`, { session: false })(req, res, next);
}

export default myPassport;
