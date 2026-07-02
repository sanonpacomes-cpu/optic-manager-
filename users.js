import { getSql } from './db.js';
import { hashPassword } from './security.js';
import { ensureDatabase } from './ensure.js';

export default async function handler(req,res){
  try{
    await ensureDatabase();
    const sql=getSql();

    if(req.method==='GET'){
      const users=await sql`SELECT id,full_name,login_id,email,phone,role,agency_name,is_active,login_count,last_login_at,created_at FROM users_app ORDER BY created_at DESC`;
      return res.status(200).json({users});
    }

    if(req.method==='POST'){
      const b=req.body||{};
      const id=String(b.login_id||'').trim().toUpperCase();
      const rows=await sql`INSERT INTO users_app(full_name,login_id,email,phone,password_hash,role,agency_name,is_active)
      VALUES(${b.full_name},${id},${b.email||null},${b.phone||null},${hashPassword(b.password)},${b.role},${b.agency_name||null},true)
      RETURNING id,full_name,login_id,email,phone,role,agency_name,is_active,login_count,last_login_at,created_at`;
      return res.status(201).json({user:rows[0]});
    }

    if(req.method==='PATCH'){
      const b=req.body||{};
      if(b.password){
        const rows=await sql`UPDATE users_app SET full_name=COALESCE(${b.full_name||null},full_name),email=${b.email===undefined?null:b.email||null},phone=${b.phone===undefined?null:b.phone||null},role=COALESCE(${b.role||null},role),agency_name=${b.agency_name===undefined?null:b.agency_name||null},password_hash=${hashPassword(b.password)},updated_at=NOW() WHERE id=${b.id} RETURNING *`;
        return res.status(200).json({user:rows[0]});
      }

      const rows=await sql`UPDATE users_app SET full_name=COALESCE(${b.full_name||null},full_name),email=${b.email===undefined?null:b.email||null},phone=${b.phone===undefined?null:b.phone||null},role=COALESCE(${b.role||null},role),agency_name=${b.agency_name===undefined?null:b.agency_name||null},is_active=COALESCE(${typeof b.is_active==='boolean'?b.is_active:null},is_active),updated_at=NOW() WHERE id=${b.id} RETURNING *`;
      return res.status(200).json({user:rows[0]});
    }

    res.status(405).json({error:'Méthode non autorisée'});
  }catch(e){res.status(500).json({error:e.message})}
}
