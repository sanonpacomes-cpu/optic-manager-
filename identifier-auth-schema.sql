-- Optic Manager - Authentification par identifiant

CREATE TABLE IF NOT EXISTS users_app (
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
);

CREATE TABLE IF NOT EXISTS login_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  login_id TEXT,
  success BOOLEAN DEFAULT FALSE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
