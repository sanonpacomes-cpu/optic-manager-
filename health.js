import { getSql } from './db.js';

export default async function handler(req, res) {
  try {
    const sql = getSql();
    const result = await sql`SELECT NOW() AS current_time`;
    res.status(200).json({ success:true, message:'Connexion Neon réussie', time:result[0].current_time });
  } catch (error) {
    res.status(500).json({ success:false, error:error.message });
  }
}
