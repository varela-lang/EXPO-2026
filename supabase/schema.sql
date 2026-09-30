-- ========================================================
-- EXPO INVESTMENT - COMPREHENSIVE SUPABASE SCHEMA & POLICIES
-- Includes:
-- 1. Profiles & Roles (Visitors, Students/Teams, Admin)
-- 2. Projects & Stands (with City Passport Codes)
-- 3. Simulated Investments & Live Cap
-- 4. Customer Tokens
-- 5. Audit Transactions
-- 6. City Passport Stamps & Final Tokens
-- 7. Prizes Inventory & Reveal Logic
-- 8. Views & Row Level Security (RLS)
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'visitor' CHECK (role IN ('visitor', 'team', 'admin')),
  balance NUMERIC(12, 2) NOT NULL DEFAULT 10000.00 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PROJECTS (Representing Expo Stands & Global Cities)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  team_name TEXT NOT NULL,
  logo_url TEXT,
  category TEXT DEFAULT 'Innovación',
  city TEXT,
  country TEXT,
  country_code TEXT,
  passport_code TEXT UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. INVESTMENTS
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. CUSTOMER TOKENS
CREATE TABLE IF NOT EXISTS customer_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_project_customer_token UNIQUE (user_id, project_id)
);

-- 5. TRANSACTIONS (Financial Audit Trail)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('initial_balance', 'investment', 'refund', 'adjustment')),
  amount NUMERIC(12, 2) NOT NULL,
  investment_id UUID REFERENCES investments(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. PRIZES (Rewards Inventory for Passport Completion)
CREATE TABLE IF NOT EXISTS prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  value TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  claimed_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. PASSPORT STAMPS (Visitor City Stamp Collection)
CREATE TABLE IF NOT EXISTS passport_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_project_stamp UNIQUE (user_id, project_id)
);

-- 8. PASSPORT TOKENS (Final Completion Tokens & Claimed Rewards)
CREATE TABLE IF NOT EXISTS passport_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  token_code TEXT NOT NULL UNIQUE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  prize_id UUID REFERENCES prizes(id) ON DELETE SET NULL,
  revealed BOOLEAN NOT NULL DEFAULT false,
  redeemed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ========================================================
-- INDEXES
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(active);
CREATE INDEX IF NOT EXISTS idx_projects_passport_code ON projects(passport_code);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_project_id ON investments(project_id);
CREATE INDEX IF NOT EXISTS idx_investments_created_at ON investments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_tokens_user_id ON customer_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_tokens_project_id ON customer_tokens(project_id);
CREATE INDEX IF NOT EXISTS idx_passport_stamps_user_id ON passport_stamps(user_id);
CREATE INDEX IF NOT EXISTS idx_passport_stamps_project_id ON passport_stamps(project_id);
CREATE INDEX IF NOT EXISTS idx_passport_tokens_user_id ON passport_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- ========================================================
-- VIEWS
-- ========================================================

-- View: project_stats
CREATE OR REPLACE VIEW project_stats AS
SELECT 
  p.id AS project_id,
  p.name,
  p.team_name,
  p.description,
  p.logo_url,
  p.category,
  p.city,
  p.country,
  p.country_code,
  p.passport_code,
  p.active,
  p.created_at,
  COALESCE(SUM(i.amount), 0)::NUMERIC(12,2) AS investment_total,
  COUNT(DISTINCT i.user_id)::INTEGER AS investors,
  COALESCE(ct.token_count, 0)::INTEGER AS customer_tokens,
  COALESCE(st.stamps_count, 0)::INTEGER AS passport_stamps_count
FROM projects p
LEFT JOIN investments i ON p.id = i.project_id
LEFT JOIN (
  SELECT project_id, COUNT(*)::INTEGER AS token_count
  FROM customer_tokens
  GROUP BY project_id
) ct ON p.id = ct.project_id
LEFT JOIN (
  SELECT project_id, COUNT(*)::INTEGER AS stamps_count
  FROM passport_stamps
  GROUP BY project_id
) st ON p.id = st.project_id
GROUP BY p.id, p.name, p.team_name, p.description, p.logo_url, p.category, p.city, p.country, p.country_code, p.passport_code, p.active, p.created_at, ct.token_count, st.stamps_count;

-- View: expo_stats
CREATE OR REPLACE VIEW expo_stats AS
SELECT
  COALESCE(SUM(amount), 0)::NUMERIC(12,2) AS total_invested,
  COUNT(DISTINCT user_id)::INTEGER AS total_investors,
  (SELECT COUNT(*)::INTEGER FROM customer_tokens) AS total_customer_tokens,
  (SELECT COUNT(*)::INTEGER FROM passport_stamps) AS total_passport_stamps,
  (SELECT COUNT(*)::INTEGER FROM passport_tokens) AS total_passports_completed,
  (SELECT COUNT(*)::INTEGER FROM profiles WHERE role = 'visitor') AS total_visitors
FROM investments;

-- ========================================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE passport_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE passport_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can view active projects" ON projects;
  DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
  DROP POLICY IF EXISTS "Public can read investments count" ON investments;
  DROP POLICY IF EXISTS "Users can read own investments" ON investments;
  DROP POLICY IF EXISTS "Public can read customer tokens" ON customer_tokens;
  DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
  DROP POLICY IF EXISTS "Public can view prizes" ON prizes;
  DROP POLICY IF EXISTS "Users can read own stamps" ON passport_stamps;
  DROP POLICY IF EXISTS "Users can read own token" ON passport_tokens;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Anyone can view active projects" 
  ON projects FOR SELECT 
  USING (true);

CREATE POLICY "Users can read own profile" 
  ON profiles FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Public can read investments count" 
  ON investments FOR SELECT 
  USING (true);

CREATE POLICY "Public can read customer tokens" 
  ON customer_tokens FOR SELECT 
  USING (true);

CREATE POLICY "Users can read own transactions" 
  ON transactions FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Public can view prizes" 
  ON prizes FOR SELECT 
  USING (true);

CREATE POLICY "Users can read own stamps" 
  ON passport_stamps FOR SELECT 
  USING (auth.uid() = user_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can read own token" 
  ON passport_tokens FOR SELECT 
  USING (auth.uid() = user_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ========================================================
-- AUTH TRIGGER: Automatic Profile Creation on Signup
-- ========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_initial_balance NUMERIC(12,2) := 10000.00;
  v_role TEXT := 'visitor';
  v_full_name TEXT;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  
  IF NEW.raw_user_meta_data->>'role' IN ('visitor', 'team', 'admin') THEN
    v_role := NEW.raw_user_meta_data->>'role';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role, balance)
  VALUES (NEW.id, v_full_name, NEW.email, v_role, v_initial_balance)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (NEW.id, 'initial_balance', v_initial_balance, 'Capital inicial asignado');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================================
-- SEED DATA (Expo Projects representing Global Cities)
-- ========================================================

INSERT INTO projects (id, name, description, team_name, category, city, country, country_code, passport_code, active, logo_url)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'EcoTech', 'Plataforma inteligente de reciclaje y valorización de residuos con incentivos tokenizados en campus universitarios.', 'Equipo Verde Circular', 'Sostenibilidad', 'New York', 'Estados Unidos', '🇺🇸', 'NYC-7K4P', true, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80'),
  ('00000000-0000-0000-0000-000000000002', 'RoboSmart', 'Brazo robótico articulado modular y de bajo costo para automatización en laboratorios y centros de formación técnica.', 'Mecatrónica Alpha', 'Robótica & AI', 'Tokyo', 'Japón', '🇯🇵', 'TOK-92XM', true, 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&auto=format&fit=crop&q=80'),
  ('00000000-0000-0000-0000-000000000003', 'GreenApp', 'Aplicación de carpooling y micromovilidad eléctrica coordinada para reducir la huella de carbono escolar y urbana.', 'EcoMobility Lab', 'Movilidad', 'Paris', 'Francia', '🇫🇷', 'PAR-5L8Q', true, 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=80'),
  ('00000000-0000-0000-0000-000000000004', 'SmartHome', 'Ecosistema IoT para optimización del consumo eléctrico y detección predictiva de fugas de agua en viviendas.', 'Domótica Conectada', 'IoT & Hardware', 'Rio de Janeiro', 'Brasil', '🇧🇷', 'RIO-3F7A', true, 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&auto=format&fit=crop&q=80'),
  ('00000000-0000-0000-0000-000000000005', 'AgroVision', 'Sistema de teledetección multiespectral con drones para identificación temprana de plagas y estrés hídrico en cultivos.', 'AgroTech Innovators', 'AgTech', 'London', 'Reino Unido', '🇬🇧', 'LON-8H2M', true, 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=400&auto=format&fit=crop&q=80'),
  ('00000000-0000-0000-0000-000000000006', 'BioHealth', 'Dispositivo portátil no invasivo para monitoreo y telemetría de signos vitales en comunidades rurales aisladas.', 'BioIngeniería Sanitaria', 'Salud & Biotech', 'Rome', 'Italia', '🇮🇹', 'ROM-4P9X', true, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  country_code = EXCLUDED.country_code,
  passport_code = EXCLUDED.passport_code;

-- Seed Initial Prizes
INSERT INTO prizes (id, name, description, value, quantity, claimed_count, active)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Gift Card de $25 USD', 'Tarjeta de regalo digital canjeable en tiendas participantes de la Expo.', '$25.00', 10, 0, true),
  ('11111111-1111-1111-1111-111111111102', 'Kit Oficial Merchandising Expo', 'Camiseta conmemorativa de la Expo, termo térmico y sticker pack holográfico.', '$35.00', 15, 0, true),
  ('11111111-1111-1111-1111-111111111103', 'Pase VIP Networking Universitario', 'Acceso exclusivo al salón de creadores con inversionistas y mentores ángeles.', '$50.00', 5, 0, true)
ON CONFLICT (id) DO NOTHING;
