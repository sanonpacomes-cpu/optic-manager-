import { getSql } from './db.js';
import { ensureDatabase } from './ensure.js';

export default async function handler(req,res){
  try{
    await ensureDatabase();
    const sql=getSql();
    const agencies=await sql`SELECT * FROM agencies ORDER BY name ASC`;
    res.status(200).json({agencies});
  }catch(e){res.status(500).json({error:e.message})}
}
