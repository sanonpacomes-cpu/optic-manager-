import { getSql } from './db.js';

export default async function handler(req, res) {
  try {
    const sql = getSql();

    if (req.method === 'GET') {
      const agencies = await sql`SELECT * FROM agencies ORDER BY name ASC`;
      return res.status(200).json({ agencies });
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      const rows = await sql`INSERT INTO agencies (name, city, manager_name, phone)
        VALUES (${b.name}, ${b.city || null}, ${b.manager_name || null}, ${b.phone || null})
        RETURNING *`;
      return res.status(201).json({ agency: rows[0] });
    }

    if (req.method === 'PATCH') {
      const b = req.body || {};
      const rows = await sql`UPDATE agencies SET
        name = COALESCE(${b.name || null}, name),
        city = COALESCE(${b.city || null}, city),
        manager_name = COALESCE(${b.manager_name || null}, manager_name),
        phone = COALESCE(${b.phone || null}, phone),
        is_active = COALESCE(${typeof b.is_active === 'boolean' ? b.is_active : null}, is_active)
        WHERE id=${b.id}
        RETURNING *`;
      return res.status(200).json({ agency: rows[0] });
    }

    res.status(405).json({ error:'Méthode non autorisée' });
  } catch (error) {
    res.status(500).json({ error:error.message });
  }
}
