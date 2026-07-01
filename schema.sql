-- Optic Manager V2 - Neon PostgreSQL
-- Les tables sont créées automatiquement via /api/setup

CREATE TABLE IF NOT EXISTS agencies (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  city TEXT,
  manager_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users_app (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  agency_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
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
);
