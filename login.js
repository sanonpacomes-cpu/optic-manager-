import { getSql } from './db.js';
import { hashPassword } from './security.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error:'Méthode non autorisée' });
  try {
    const { login_id, password } = req.body || {};
    if (!login_id || !password) return res.status(400).json({ error:'Identifiant et mot de passe obligatoires' });
    const normalized = String(login_id).trim().toUpperCase();
    const sql = getSql();
    const users = await sql`
      SELECT id, full_name, login_id, email, phone, role, agency_name, is_active, login_count, last_login_at
      FROM users_app
      WHERE login_id=${normalized}
      AND is_active=true
      AND (password_hash=${hashPassword(password)} OR password=${password})
      LIMIT 1`;
    if (!users.length) {
      await sql`INSERT INTO login_logs (login_id, success, message) VALUES (${normalized}, false, 'Identifiant ou mot de passe incorrect')`;
      return res.status(401).json({ error:'Identifiant ou mot de passe incorrect' });
    }
    const user = users[0];
    await sql`UPDATE users_app SET login_count=COALESCE(login_count,0)+1, last_login_at=NOW(), updated_at=NOW() WHERE id=${user.id}`;
    await sql`INSERT INTO login_logs (user_id, login_id, success, message) VALUES (${user.id}, ${normalized}, true, 'Connexion réussie')`;
    res.status(200).json({ success:true, user: { ...user, login_count: Number(user.login_count || 0) + 1 } });
  } catch (error) {
    res.status(500).json({ error:error.message });
  }
}
