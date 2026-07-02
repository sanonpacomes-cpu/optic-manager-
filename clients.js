import { getSql } from './db.js';
import { ensureDatabase } from './ensure.js';

export default async function handler(req,res){
  try{
    await ensureDatabase();
    const sql=getSql();

    if(req.method==='GET'){
      const clients=await sql`SELECT * FROM clients ORDER BY created_at DESC LIMIT 500`;
      return res.status(200).json({clients});
    }

    if(req.method==='POST'){
      const b=req.body||{};
      const rows=await sql`INSERT INTO clients(full_name,phone,age,gender,address,insurance_company,insurance_number)
      VALUES(${b.full_name},${b.phone||null},${b.age?Number(b.age):null},${b.gender||null},${b.address||null},${b.insurance_company||null},${b.insurance_number||null})
      RETURNING *`;
      return res.status(201).json({client:rows[0]});
    }

    res.status(405).json({error:'Méthode non autorisée'});
  }catch(e){res.status(500).json({error:e.message})}
}
