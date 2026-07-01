import { getSql } from './db.js';
import { hashPassword, isValidRole } from './security.js';

export default async function handler(req, res) {
  try {
    const sql = getSql();
    if (req.method === 'GET') {
      const users = await sql`SELECT id, full_name, login_id, email, phone, role, agency_name, is_active, login_count, last_login_at, created_at FROM users_app ORDER BY created_at DESC`;
      return res.status(200).json({ users });
    }
    if (req.method === 'POST') {
      const b = req.body || {};
      const loginId = String(b.login_id || '').trim().toUpperCase();
      if (!b.full_name || !loginId || !b.password || !b.role) return res.status(400).json({ error:'Nom, identifiant, mot de passe et rôle obligatoires' });
      if (!isValidRole(b.role)) return res.status(400).json({ error:'Rôle invalide' });
      const rows = await sql`INSERT INTO users_app (full_name, login_id, email, phone, password_hash, role, agency_name, is_active)
        VALUES (${b.full_name}, ${loginId}, ${b.email || null}, ${b.phone || null}, ${hashPassword(b.password)}, ${b.role}, ${b.agency_name || null}, true)
        RETURNING id, full_name, login_id, email, phone, role, agency_name, is_active, login_count`;
      return res.status(201).json({ user: rows[0] });
    }
    if (req.method === 'PATCH') {
      const b = req.body || {};
      if (!b.id) return res.status(400).json({ error:'ID utilisateur obligatoire' });
      if (b.role && !isValidRole(b.role)) return res.status(400).json({ error:'Rôle invalide' });
      if (b.password) {
        const rows = await sql`UPDATE users_app SET full_name=COALESCE(${b.full_name || null}, full_name), email=${b.email === undefined ? null : b.email || null}, phone=${b.phone === undefined ? null : b.phone || null}, role=COALESCE(${b.role || null}, role), agency_name=${b.agency_name === undefined ? null : b.agency_name || null}, password_hash=${hashPassword(b.password)}, updated_at=NOW() WHERE id=${b.id} RETURNING id, full_name, login_id, email, phone, role, agency_name, is_active, login_count`;
        return res.status(200).json({ user: rows[0] });
      }
      const rows = await sql`UPDATE users_app SET full_name=COALESCE(${b.full_name || null}, full_name), email=${b.email === undefined ? null : b.email || null}, phone=${b.phone === undefined ? null : b.phone || null}, role=COALESCE(${b.role || null}, role), agency_name=${b.agency_name === undefined ? null : b.agency_name || null}, is_active=COALESCE(${typeof b.is_active === 'boolean' ? b.is_active : null}, is_active), updated_at=NOW() WHERE id=${b.id} RETURNING id, full_name, login_id, email, phone, role, agency_name, is_active, login_count`;
      return res.status(200).json({ user: rows[0] });
    }
    res.status(405).json({ error:'Méthode non autorisée' });
  } catch (error) {
    if (String(error.message).includes('duplicate key')) return res.status(409).json({ error:'Cet identifiant existe déjà.' });
    res.status(500).json({ error:error.message });
  }
}
