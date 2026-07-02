import { getSql } from './db.js';
import { ensureDatabase } from './ensure.js';

export default async function handler(req, res) {
  try {
    await ensureDatabase();
    const sql = getSql();
    const r = await sql`SELECT NOW() AS current_time`;
    res.status(200).json({ success: true, message: 'Connexion Neon réussie. API V11 active. Tables prêtes.', time: r[0].current_time });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
