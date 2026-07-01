import { getSql } from './db.js';

export default async function handler(req, res) {
  try {
    const sql = getSql();
    if (req.method === 'GET') {
      const sales = await sql`SELECT * FROM sales ORDER BY created_at DESC LIMIT 500`;
      return res.status(200).json({ sales });
    }
    res.status(405).json({ error:'Méthode non autorisée' });
  } catch (error) {
    res.status(500).json({ error:error.message });
  }
}
