import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import type { Env } from "../env";

export function createAuth(env: Env) {
  const db = drizzle(env.DB, { schema });
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.APP_URL,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    trustedOrigins: [
      env.APP_URL,
      "http://localhost:8787",
      "http://127.0.0.1:8787",
      "https://aidenhawkins-site.n1519976.workers.dev",
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

export async function getSession(auth: Auth, request: Request) {
  return auth.api.getSession({ headers: request.headers });
}
