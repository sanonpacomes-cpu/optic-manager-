import { getSql } from './db.js';
import { prefixFor } from './security.js';

export default async function handler(req, res) {
  try {
    const sql = getSql();
    const role = req.query.role || 'vendeur';
    const agency = req.query.agency || '';
    const prefix = prefixFor(role, agency);
    const rows = await sql`SELECT login_id FROM users_app WHERE login_id LIKE ${prefix + '%'} ORDER BY login_id DESC LIMIT 100`;
    let max = 0;
    for (const row of rows) {
      const match = String(row.login_id || '').match(/(\d+)$/);
      if (match) max = Math.max(max, Number(match[1]));
    }
    res.status(200).json({ login_id: `${prefix}${String(max + 1).padStart(3, '0')}` });
  } catch (error) {
    res.status(500).json({ error:error.message });
  }
}
