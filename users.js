import { getSql } from './db.js';

export default async function handler(req, res) {
  try {
    const sql = getSql();

    if (req.method === 'GET') {
      const users = await sql`SELECT id, full_name, email, role, agency_name, is_active, created_at FROM users_app ORDER BY created_at DESC`;
      return res.status(200).json({ users });
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      const rows = await sql`INSERT INTO users_app (full_name, email, password, role, agency_name)
        VALUES (${b.full_name}, ${b.email}, ${b.password}, ${b.role}, ${b.agency_name || null})
        RETURNING id, full_name, email, role, agency_name, is_active`;
      return res.status(201).json({ user: rows[0] });
    }

    if (req.method === 'PATCH') {
      const b = req.body || {};
      const rows = await sql`UPDATE users_app SET
        full_name = COALESCE(${b.full_name || null}, full_name),
        role = COALESCE(${b.role || null}, role),
        agency_name = COALESCE(${b.agency_name || null}, agency_name),
        is_active = COALESCE(${typeof b.is_active === 'boolean' ? b.is_active : null}, is_active)
        WHERE id=${b.id}
        RETURNING id, full_name, email, role, agency_name, is_active`;
      return res.status(200).json({ user: rows[0] });
    }

    res.status(405).json({ error:'Méthode non autorisée' });
  } catch (error) {
    res.status(500).json({ error:error.message });
  }
}
