import { getSql } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error:'Méthode non autorisée' });
  try {
    const { email, password } = req.body || {};
    const sql = getSql();
    const users = await sql`SELECT id, full_name, email, role, agency_name, is_active FROM users_app WHERE email=${email} AND password=${password} AND is_active=true LIMIT 1`;
    if (!users.length) return res.status(401).json({ error:'Email ou mot de passe incorrect' });
    res.status(200).json({ success:true, user:users[0] });
  } catch (error) {
    res.status(500).json({ error:error.message });
  }
}
