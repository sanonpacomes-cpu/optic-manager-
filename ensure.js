import { getSql } from './db.js';
import { hashPassword } from './security.js';

export async function ensureDatabase() {
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
    password_hash TEXT,
    role TEXT NOT NULL,
    agency_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    login_count INTEGER DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT,
    age INTEGER,
    gender TEXT,
    address TEXT,
    insurance_company TEXT,
    insurance_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    sale_number TEXT UNIQUE,
    sale_type TEXT DEFAULT 'vente',
    sale_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'brouillon',
    agency_name TEXT NOT NULL,
    seller_identifier TEXT,
    seller_name TEXT,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    client_age INTEGER,
    client_address TEXT,
    product_type TEXT NOT NULL,
    frame_brand TEXT,
    frame_reference TEXT,
    lens_type TEXT,
    payment_method TEXT,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    is_insured BOOLEAN DEFAULT FALSE,
    insurance_company TEXT,
    insurance_number TEXT,
    insurance_rate NUMERIC DEFAULT 0,
    insurance_amount NUMERIC DEFAULT 0,
    prescription_file_name TEXT,
    prescription_file_type TEXT,
    prescription_file_data TEXT,
    follow_up_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category TEXT,
    name TEXT NOT NULL,
    reference TEXT,
    price NUMERIC DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    agency_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_identifier TEXT,
    action TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  const agencies = ['Dori','Somgandé','Kamsonghin','Tengandgo','Kaya','Bobo','Banfora','Gounghin'];
  for (const name of agencies) {
    await sql`INSERT INTO agencies (name, city)
      VALUES (${name}, ${name})
      ON CONFLICT (name) DO NOTHING`;
  }

  const users = [
    ['Administrateur Général','ADM001','admin123','admin',null],
    ['Direction Réseau','DIR001','direction123','direction',null],
    ['Vendeur Dori','DOR001','vente123','vendeur','Dori'],
    ['Responsable Dori','RDA-DOR001','dori123','responsable_agence','Dori'],
    ['Comptable','CPT001','comptable123','comptable',null]
  ];

  for (const u of users) {
    await sql`INSERT INTO users_app (full_name, login_id, password_hash, role, agency_name, is_active)
      VALUES (${u[0]}, ${u[1]}, ${hashPassword(u[2])}, ${u[3]}, ${u[4]}, true)
      ON CONFLICT (login_id)
      DO UPDATE SET password_hash=EXCLUDED.password_hash, role=EXCLUDED.role, agency_name=EXCLUDED.agency_name, is_active=true`;
  }

  return true;
}

export default async function handler(req, res) {
  try {
    await ensureDatabase();
    res.status(200).json({ success: true, message: 'Optic Manager V10 : API et base Neon prêtes.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
