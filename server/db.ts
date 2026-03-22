import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { env, isProduction } from "./config";
import { logger } from "./logger";

/**
 * Resolve SSL config for the database connection.
 *
 * `rejectUnauthorized` is `false` by default because managed Postgres
 * providers (Railway, Neon, Supabase) use self-signed or provider-CA
 * certificates that Node.js doesn't trust out of the box. Set
 * `DATABASE_SSL_REJECT_UNAUTHORIZED=true` when your provider supplies
 * a publicly-trusted or pinned CA certificate.
 */
function resolveSsl(): false | { rejectUnauthorized: boolean } {
  if (env.DATABASE_SSL_MODE === "disable") {
    return false;
  }

  const reject = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true";

  if (env.DATABASE_SSL_MODE === "require") {
    return { rejectUnauthorized: reject };
  }

  return isProduction ? { rejectUnauthorized: reject } : false;
}

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  allowExitOnIdle: env.NODE_ENV === "test",
  ssl: resolveSsl(),
});

export const db = drizzle(pool, { schema });

const TRANSIENT_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "57P01", // admin_shutdown
  "57P03", // cannot_connect_now
  "08006", // connection_failure
  "08001", // sqlclient_unable_to_establish_sqlconnection
]);

function isTransient(err: unknown): boolean {
  if (err && typeof err === "object" && "code" in err) {
    return TRANSIENT_CODES.has((err as { code: string }).code);
  }
  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseMs = 500,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !isTransient(err)) throw err;
      const delay = baseMs * 2 ** attempt;
      logger.warn(
        { err, attempt: attempt + 1, retries, delayMs: delay },
        "transient DB error, retrying",
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

export async function checkDatabaseConnection() {
  const client = await pool.connect();

  try {
    await client.query("select 1");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error };
  } finally {
    client.release();
  }
}

export async function closeDatabasePool() {
  await pool.end();
}

export async function withTenant(
  userId: string,
  callback: (tx: any) => Promise<any>,
) {
  const client = await pool.connect();

  try {
    await client.query(
      "select set_config('app.current_user_id', $1, false)",
      [userId],
    );

    const tx = drizzle(client, { schema });
    return await callback(tx);
  } finally {
    await client.query("RESET app.current_user_id");
    client.release();
  }
}
