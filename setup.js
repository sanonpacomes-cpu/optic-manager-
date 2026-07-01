import { getSql } from './db.js';
import { hashPassword } from './security.js';

export default async function handler(req, res) {
  try {
    const sql = getSql();

    await sql`CREATE TABLE IF NOT EXISTS agencies (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      city TEXT,
      manager_name TEXT,
      phone TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS users_app (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      login_id TEXT UNIQUE,
      email TEXT,
      phone TEXT,
      password TEXT,
      password_hash TEXT,
      role TEXT NOT NULL,
      agency_name TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      must_change_password BOOLEAN DEFAULT FALSE,
      login_count INTEGER DEFAULT 0,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`ALTER TABLE users_app ADD COLUMN IF NOT EXISTS login_id TEXT UNIQUE`;
    await sql`ALTER TABLE users_app ADD COLUMN IF NOT EXISTS email TEXT`;
    await sql`ALTER TABLE users_app ADD COLUMN IF NOT EXISTS phone TEXT`;
    await sql`ALTER TABLE users_app ADD COLUMN IF NOT EXISTS password_hash TEXT`;
    await sql`ALTER TABLE users_app ADD COLUMN IF NOT EXISTS password TEXT`;
    await sql`ALTER TABLE users_app ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users_app ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0`;
    await sql`ALTER TABLE users_app ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ`;
    await sql`ALTER TABLE users_app ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`;

    await sql`CREATE TABLE IF NOT EXISTS login_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      login_id TEXT,
      success BOOLEAN DEFAULT FALSE,
      message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      sale_number TEXT UNIQUE,
      sale_date DATE DEFAULT CURRENT_DATE,
      status TEXT DEFAULT 'brouillon',
      agency_name TEXT NOT NULL,
      seller_email TEXT,
      seller_identifier TEXT,
      client_name TEXT NOT NULL,
      client_phone TEXT,
      product_type TEXT NOT NULL,
      total_amount NUMERIC NOT NULL DEFAULT 0,
      paid_amount NUMERIC DEFAULT 0,
      is_insured BOOLEAN DEFAULT FALSE,
      insurance_company TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS seller_identifier TEXT`;

    const agencies = ['Dori','Somgandé','Kamsonghin','Tengandgo','Kaya','Bobo','Banfora','Gounghin'];
    for (const name of agencies) {
      await sql`INSERT INTO agencies (name, city) VALUES (${name}, ${name}) ON CONFLICT (name) DO NOTHING`;
    }

    const defaults = [
      ['Administrateur Général','ADM001','admin123','admin',null,''],
      ['Directeur Réseau','DIR001','direction123','direction',null,''],
      ['Vendeur Dori','DOR001','vente123','vendeur','Dori',''],
      ['Responsable Dori','RDA-DOR001','dori123','responsable_agence','Dori',''],
      ['Comptable','CPT001','comptable123','comptable',null,'']
    ];

    for (const [fullName,loginId,password,role,agency,email] of defaults) {
      await sql`INSERT INTO users_app (full_name, login_id, email, password_hash, role, agency_name, is_active)
        VALUES (${fullName}, ${loginId}, ${email || null}, ${hashPassword(password)}, ${role}, ${agency}, true)
        ON CONFLICT (login_id) DO UPDATE SET password_hash=EXCLUDED.password_hash, role=EXCLUDED.role, agency_name=EXCLUDED.agency_name, is_active=true`;
    }

    res.status(200).json({ success:true, message:'Module Identifiants initialisé avec succès' });
  } catch (error) {
    res.status(500).json({ success:false, error:error.message });
  }
}
