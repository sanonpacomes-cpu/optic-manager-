import { getSql } from './db.js';
import { hashPassword } from './security.js';
import { ensureDatabase } from './ensure.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    await ensureDatabase();

    const { login_id, password } = req.body || {};
    const id = String(login_id || '').trim().toUpperCase();

    const sql = getSql();
    const rows = await sql`
      SELECT id, full_name, login_id, email, phone, role, agency_name, is_active, login_count, last_login_at
      FROM users_app
      WHERE login_id=${id}
      AND is_active=true
      AND password_hash=${hashPassword(password)}
      LIMIT 1`;

    if (!rows.length) return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });

    const u = rows[0];

    await sql`UPDATE users_app SET login_count=COALESCE(login_count,0)+1, last_login_at=NOW(), updated_at=NOW() WHERE id=${u.id}`;
    await sql`INSERT INTO activity_logs (user_identifier, action, details) VALUES (${id}, 'login', 'Connexion réussie')`;

    res.status(200).json({ success: true, user: { ...u, login_count: Number(u.login_count || 0) + 1 } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
