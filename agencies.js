import { getSql } from './db.js';

export default async function handler(req, res) {
  try {
    const sql = getSql();
    if (req.method === 'GET') {
      const agencies = await sql`SELECT * FROM agencies ORDER BY name ASC`;
      return res.status(200).json({ agencies });
    }
    res.status(405).json({ error:'Méthode non autorisée' });
  } catch (error) {
    res.status(500).json({ error:error.message });
  }
}
