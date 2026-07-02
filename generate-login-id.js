import { getSql } from './db.js';
import { prefixFor } from './security.js';
import { ensureDatabase } from './ensure.js';

export default async function handler(req,res){
  try{
    await ensureDatabase();
    const sql=getSql();
    const prefix=prefixFor(req.query.role||'vendeur',req.query.agency||'');

    const rows=await sql`SELECT login_id FROM users_app WHERE login_id LIKE ${prefix+'%'} ORDER BY login_id DESC LIMIT 100`;

    let max=0;
    for(const r of rows){
      const m=String(r.login_id||'').match(/(\d+)$/);
      if(m)max=Math.max(max,Number(m[1]));
    }

    res.status(200).json({login_id:`${prefix}${String(max+1).padStart(3,'0')}`});
  }catch(e){res.status(500).json({error:e.message})}
}
