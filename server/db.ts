import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@shared/schema';
import { env } from './config';

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export async function withTenant(userId: string, callback: (tx: any) => Promise<any>) {
  return pool.connect().then(async (client) => {
    try {
      await client.query(`SET app.current_user_id = '${userId}'`);
      const tx = drizzle(client, { schema });
      return await callback(tx);
    } finally {
      await client.query('RESET app.current_user_id');
      client.release();
    }
  });
}
