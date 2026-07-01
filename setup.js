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
      sale_date DATE DEFAULT CURRENT_DATE,
      agency_name TEXT NOT NULL,
      seller_email TEXT,
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

    const count = await sql`SELECT COUNT(*)::int AS count FROM sales`;
    if (count[0].count === 0) {
      await sql`INSERT INTO sales (agency_name, seller_email, client_name, client_phone, product_type, total_amount, paid_amount, is_insured, insurance_company, notes)
      VALUES
      ('Dori','vendeuse@optic.com','Client Démo','70000000','Monture + verres unifocaux',29000,29000,false,NULL,'Vente initiale'),
      ('Kaya','admin@optic.com','Client Assurance','70000001','Monture + verres progressifs',59000,20000,true,'Assurance démo','Dossier assurance')`;
    }

    res.status(200).json({ success:true, message:'Optic Manager V2 initialisé avec succès' });
  } catch (error) {
    res.status(500).json({ success:false, error:error.message });
  }
}
