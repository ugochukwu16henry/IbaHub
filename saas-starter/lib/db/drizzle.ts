import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const postgresUrl = process.env.POSTGRES_URL;

export const client = postgresUrl ? postgres(postgresUrl) : null;

const missingDbProxy = new Proxy(
  {},
  {
    get() {
      throw new Error(
        'POSTGRES_URL environment variable is not set. Configure it in your environment (e.g. Vercel project settings).'
      );
    }
  }
);

export const db = client
  ? drizzle(client, { schema })
  : (missingDbProxy as ReturnType<typeof drizzle<typeof schema>>);
