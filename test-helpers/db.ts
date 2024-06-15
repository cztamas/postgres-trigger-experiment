import { Client } from 'pg';

export const pgClient = new Client({ connectionString: process.env.DATABASE_URL });
