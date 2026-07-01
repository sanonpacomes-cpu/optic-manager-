import { getSql } from './db.js';

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
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      agency_name TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      sale_number TEXT UNIQUE,
      sale_date DATE DEFAULT CURRENT_DATE,
      status TEXT DEFAULT 'brouillon',
      agency_name TEXT NOT NULL,
      seller_email TEXT,
      client_name TEXT NOT NULL,
      client_phone TEXT,
      client_age INTEGER,
      client_gender TEXT,
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

    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_number TEXT`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'brouillon'`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS client_age INTEGER`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS client_gender TEXT`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS client_address TEXT`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS frame_brand TEXT`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS frame_reference TEXT`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS lens_type TEXT`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method TEXT`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS insurance_number TEXT`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS insurance_rate NUMERIC DEFAULT 0`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS insurance_amount NUMERIC DEFAULT 0`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS prescription_file_name TEXT`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS prescription_file_type TEXT`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS prescription_file_data TEXT`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS follow_up_date DATE`;
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`;

    const agencies = ['Dori','Somgandé','Kamsonghin','Tengandgo','Kaya','Bobo','Banfora','Gounghin'];
    for (const name of agencies) {
      await sql`INSERT INTO agencies (name, city) VALUES (${name}, ${name}) ON CONFLICT (name) DO NOTHING`;
    }

    await sql`INSERT INTO users_app (full_name,email,password,role,agency_name)
      VALUES ('Administrateur Général','admin@optic.com','admin123','admin',NULL)
      ON CONFLICT (email) DO NOTHING`;

    await sql`INSERT INTO users_app (full_name,email,password,role,agency_name)
      VALUES ('Vendeuse Dori','vendeuse@optic.com','vente123','vendeur','Dori')
      ON CONFLICT (email) DO NOTHING`;

    await sql`INSERT INTO users_app (full_name,email,password,role,agency_name)
      VALUES ('Directeur Réseau','direction@optic.com','direction123','direction',NULL)
      ON CONFLICT (email) DO NOTHING`;

    res.status(200).json({ success:true, message:'Optic Manager V3 initialisé avec succès' });
  } catch (error) {
    res.status(500).json({ success:false, error:error.message });
  }
}
