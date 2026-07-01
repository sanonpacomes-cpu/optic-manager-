import { getSql } from './db.js';
export default async function handler(req,res){try{const sql=getSql();const r=await sql`SELECT NOW() AS current_time`;res.status(200).json({success:true,message:'Connexion Neon réussie',time:r[0].current_time})}catch(e){res.status(500).json({success:false,error:e.message})}}
