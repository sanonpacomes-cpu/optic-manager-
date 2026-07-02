import { neon } from '@neondatabase/serverless';

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL manquant dans Vercel. Va dans Environment Variables et ajoute DATABASE_URL.');
  }
  return neon(process.env.DATABASE_URL);
}
