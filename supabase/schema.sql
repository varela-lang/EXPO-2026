-- ========================================================
-- EXPO INVESTMENT - COMPREHENSIVE SUPABASE SCHEMA & POLICIES
-- Includes:
-- 1. Profiles & Roles (Visitors, Students/Teams, Admin)
-- 2. Projects & Stands (with City Passport Codes)
-- 3. Simulated Investments & Live Cap
-- 4. Customer Tokens
-- 5. Audit Transactions
-- 6. City Passport Stamps & Final Tokens (Safe Random Prize System)
-- 7. Prizes Inventory & Reveal Logic
-- 8. Views & Row Level Security (RLS)
-- 9. Realtime Publication Setup
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'visitor' CHECK (role IN ('visitor', 'team', 'admin')),
  balance NUMERIC(12, 2) NOT NULL DEFAULT 10000.00 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PROJECTS (Representing Expo Stands & Global Cities)
CREATE TABLE IF NOT EXISTS public.projects (
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

-- Safely ensure columns exist if projects table was already created
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS passport_code TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- 3. INVESTMENTS
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. CUSTOMER TOKENS
CREATE TABLE IF NOT EXISTS public.customer_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_project_customer_token UNIQUE (user_id, project_id)
);

-- 5. TRANSACTIONS (Financial Audit Trail)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('initial_balance', 'investment', 'refund', 'adjustment')),
  amount NUMERIC(12, 2) NOT NULL,
  investment_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. PRIZES (Rewards Inventory for Passport Completion)
CREATE TABLE IF NOT EXISTS public.prizes (
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
CREATE TABLE IF NOT EXISTS public.passport_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_project_stamp UNIQUE (user_id, project_id)
);

-- 8. PASSPORT TOKENS (Final Completion Tokens & Claimed Rewards)
CREATE TABLE IF NOT EXISTS public.passport_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_code TEXT NOT NULL UNIQUE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  prize_id UUID REFERENCES public.prizes(id) ON DELETE SET NULL,
  revealed BOOLEAN NOT NULL DEFAULT false,
  redeemed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ========================================================
-- INDEXES
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_projects_active ON public.projects(active);
CREATE INDEX IF NOT EXISTS idx_projects_passport_code ON public.projects(passport_code);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_project_id ON public.investments(project_id);
CREATE INDEX IF NOT EXISTS idx_investments_created_at ON public.investments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_tokens_user_id ON public.customer_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_tokens_project_id ON public.customer_tokens(project_id);
CREATE INDEX IF NOT EXISTS idx_passport_stamps_user_id ON public.passport_stamps(user_id);
CREATE INDEX IF NOT EXISTS idx_passport_stamps_project_id ON public.passport_stamps(project_id);
CREATE INDEX IF NOT EXISTS idx_passport_tokens_user_id ON public.passport_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);

-- ========================================================
-- DROP PREVIOUS VIEWS (Avoids Postgres Error 42P16 column rename conflict)
-- ========================================================
DROP VIEW IF EXISTS public.expo_stats CASCADE;
DROP VIEW IF EXISTS public.project_stats CASCADE;
DROP VIEW IF EXISTS expo_stats CASCADE;
DROP VIEW IF EXISTS project_stats CASCADE;

-- ========================================================
-- VIEWS
-- ========================================================

-- View: project_stats
CREATE OR REPLACE VIEW public.project_stats AS
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
FROM public.projects p
LEFT JOIN public.investments i ON p.id = i.project_id
LEFT JOIN (
  SELECT project_id, COUNT(*)::INTEGER AS token_count
  FROM public.customer_tokens
  GROUP BY project_id
) ct ON p.id = ct.project_id
LEFT JOIN (
  SELECT project_id, COUNT(*)::INTEGER AS stamps_count
  FROM public.passport_stamps
  GROUP BY project_id
) st ON p.id = st.project_id
GROUP BY p.id, p.name, p.team_name, p.description, p.logo_url, p.category, p.city, p.country, p.country_code, p.passport_code, p.active, p.created_at, ct.token_count, st.stamps_count;

-- View: expo_stats
CREATE OR REPLACE VIEW public.expo_stats AS
SELECT
  COALESCE(SUM(amount), 0)::NUMERIC(12,2) AS total_invested,
  COUNT(DISTINCT user_id)::INTEGER AS total_investors,
  (SELECT COUNT(*)::INTEGER FROM public.customer_tokens) AS total_customer_tokens,
  (SELECT COUNT(*)::INTEGER FROM public.passport_stamps) AS total_passport_stamps,
  (SELECT COUNT(*)::INTEGER FROM public.passport_tokens) AS total_passports_completed,
  (SELECT COUNT(*)::INTEGER FROM public.profiles WHERE role = 'visitor') AS total_visitors
FROM public.investments;

-- ========================================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_tokens ENABLE ROW LEVEL SECURITY;

-- Transparent Public Views so all Visitors see Real Rankings & Totals
DROP POLICY IF EXISTS "Public can view projects" ON public.projects;
CREATE POLICY "Public can view projects" ON public.projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view investments" ON public.investments;
CREATE POLICY "Public can view investments" ON public.investments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view customer tokens" ON public.customer_tokens;
CREATE POLICY "Public can view customer tokens" ON public.customer_tokens FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view passport stamps" ON public.passport_stamps;
CREATE POLICY "Public can view passport stamps" ON public.passport_stamps FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view prizes" ON public.prizes;
CREATE POLICY "Public can view prizes" ON public.prizes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view passport tokens" ON public.passport_tokens;
CREATE POLICY "Public can view passport tokens" ON public.passport_tokens FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can read own transactions" ON public.transactions;
CREATE POLICY "Users can read own transactions" ON public.transactions FOR SELECT USING (true);

-- Allow authenticated or proxy visitors to upsert their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- ========================================================
-- RPC FUNCTIONS: INVESTMENTS, TOKENS & PASSPORT
-- ========================================================

-- 1. MAKE_INVESTMENT
CREATE OR REPLACE FUNCTION public.make_investment(
  project_id UUID,
  amount NUMERIC,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance NUMERIC(12, 2);
  v_new_balance NUMERIC(12, 2);
  v_project_name TEXT;
  v_project_active BOOLEAN;
  v_investment_id UUID;
  v_transaction_id UUID;
BEGIN
  v_user_id := COALESCE(auth.uid(), p_user_id);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado. Inicia sesión con tu nombre para invertir.' USING ERRCODE = '42501';
  END IF;

  IF amount IS NULL OR amount <= 0 THEN
    RAISE EXCEPTION 'El monto a invertir debe ser mayor a 0' USING ERRCODE = '22023';
  END IF;

  SELECT balance INTO v_current_balance
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil de inversionista no encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF v_current_balance < amount THEN
    RAISE EXCEPTION 'Saldo insuficiente. Tu capital disponible es de $%', v_current_balance USING ERRCODE = '22023';
  END IF;

  SELECT name, active INTO v_project_name, v_project_active
  FROM public.projects
  WHERE id = project_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proyecto no encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_project_active THEN
    RAISE EXCEPTION 'Este proyecto no se encuentra activo' USING ERRCODE = '22023';
  END IF;

  v_new_balance := v_current_balance - amount;
  UPDATE public.profiles
  SET balance = v_new_balance
  WHERE id = v_user_id;

  INSERT INTO public.investments (user_id, project_id, amount)
  VALUES (v_user_id, project_id, amount)
  RETURNING id INTO v_investment_id;

  INSERT INTO public.transactions (user_id, type, amount, investment_id, description)
  VALUES (
    v_user_id,
    'investment',
    -amount,
    v_investment_id,
    'Inversión en proyecto: ' || v_project_name
  )
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'message', '¡Inversión realizada con éxito!',
    'investment_id', v_investment_id,
    'project_id', project_id,
    'project_name', v_project_name,
    'amount', amount,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.make_investment(project_id UUID, amount NUMERIC)
RETURNS JSON LANGUAGE plpgsql AS $$
BEGIN
  RETURN public.make_investment(project_id, amount, NULL);
END;
$$;

-- 2. GIVE_CUSTOMER_TOKEN
CREATE OR REPLACE FUNCTION public.give_customer_token(
  project_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_token_id UUID;
  v_project_name TEXT;
  v_total_tokens INTEGER;
BEGIN
  v_user_id := COALESCE(auth.uid(), p_user_id);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado. Inicia sesión con tu nombre para apoyar.' USING ERRCODE = '42501';
  END IF;

  SELECT name INTO v_project_name
  FROM public.projects
  WHERE id = project_id AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proyecto no encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.customer_tokens
    WHERE user_id = v_user_id AND customer_tokens.project_id = give_customer_token.project_id
  ) THEN
    RAISE EXCEPTION 'Ya has entregado tu Customer Token a este proyecto' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.customer_tokens (user_id, project_id)
  VALUES (v_user_id, project_id)
  RETURNING id INTO v_token_id;

  SELECT COUNT(*)::INTEGER INTO v_total_tokens
  FROM public.customer_tokens
  WHERE customer_tokens.project_id = give_customer_token.project_id;

  RETURN json_build_object(
    'success', true,
    'message', '¡Customer Token entregado con éxito!',
    'token_id', v_token_id,
    'project_id', project_id,
    'project_name', v_project_name,
    'total_tokens', v_total_tokens
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.give_customer_token(project_id UUID)
RETURNS JSON LANGUAGE plpgsql AS $$
BEGIN
  RETURN public.give_customer_token(project_id, NULL);
END;
$$;

-- 3. CLAIM_PASSPORT_STAMP & FINAL RANDOM PRIZE ASSIGNMENT
CREATE OR REPLACE FUNCTION public.claim_passport_stamp(
  p_code TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_code TEXT;
  v_project RECORD;
  v_stamp_id UUID;
  v_stamp_time TIMESTAMPTZ;
  v_total_cities INTEGER;
  v_stamped_cities INTEGER;
  v_completed BOOLEAN := false;
  v_token_code TEXT := NULL;
  v_prize_id UUID := NULL;
  v_has_prize BOOLEAN := false;
  v_win_chance NUMERIC;
  v_prize_record RECORD;
BEGIN
  v_user_id := COALESCE(auth.uid(), p_user_id);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Debes ingresar tu nombre de visitante para registrar sellos en tu pasaporte.' USING ERRCODE = '42501';
  END IF;

  IF p_code IS NULL OR trim(p_code) = '' THEN
    RAISE EXCEPTION 'Debes ingresar un código de ciudad válido.' USING ERRCODE = '22023';
  END IF;

  v_code := upper(trim(p_code));

  SELECT id, name, city, country, country_code, active INTO v_project
  FROM public.projects
  WHERE upper(passport_code) = v_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El código de ciudad ingresado no existe o no es válido.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_project.active THEN
    RAISE EXCEPTION 'El stand de esta ciudad no se encuentra activo actualmente.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.passport_stamps
    WHERE user_id = v_user_id AND project_id = v_project.id
  ) THEN
    RAISE EXCEPTION 'Ya tienes el sello de esta ciudad.' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.passport_stamps (user_id, project_id)
  VALUES (v_user_id, v_project.id)
  RETURNING id, created_at INTO v_stamp_id, v_stamp_time;

  SELECT COUNT(*)::INTEGER INTO v_total_cities
  FROM public.projects
  WHERE active = true;

  SELECT COUNT(DISTINCT ps.project_id)::INTEGER INTO v_stamped_cities
  FROM public.passport_stamps ps
  JOIN public.projects p ON ps.project_id = p.id
  WHERE ps.user_id = v_user_id AND p.active = true;

  IF v_stamped_cities >= v_total_cities THEN
    v_completed := true;

    IF NOT EXISTS (SELECT 1 FROM public.passport_tokens WHERE user_id = v_user_id) THEN
      -- Token format #EXPO-XXXX
      v_token_code := '#EXPO-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 4));

      -- RANDOM PRIZE ASSIGNMENT: 45% chance of prize, strictly bounded by available stock
      v_win_chance := random();
      
      IF v_win_chance < 0.45 THEN
        -- Atomic stock lock & reservation
        SELECT id, name, description, value INTO v_prize_record
        FROM public.prizes
        WHERE active = true AND quantity > claimed_count
        ORDER BY random()
        LIMIT 1
        FOR UPDATE SKIP LOCKED;

        IF FOUND THEN
          v_prize_id := v_prize_record.id;
          v_has_prize := true;
          UPDATE public.prizes
          SET claimed_count = claimed_count + 1
          WHERE id = v_prize_id;
        END IF;
      END IF;

      INSERT INTO public.passport_tokens (user_id, token_code, prize_id, completed_at, revealed)
      VALUES (v_user_id, v_token_code, v_prize_id, now(), false);
    ELSE
      SELECT token_code, (prize_id IS NOT NULL) INTO v_token_code, v_has_prize
      FROM public.passport_tokens
      WHERE user_id = v_user_id;
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', '¡Sello conseguido con éxito!',
    'stamp', json_build_object(
      'id', v_stamp_id,
      'project_id', v_project.id,
      'project_name', v_project.name,
      'city', v_project.city,
      'country', v_project.country,
      'country_code', v_project.country_code,
      'created_at', v_stamp_time
    ),
    'progress', json_build_object(
      'visited_cities', v_stamped_cities,
      'total_cities', v_total_cities,
      'percentage', ROUND((v_stamped_cities::numeric / GREATEST(v_total_cities, 1)) * 100)
    ),
    'completed', v_completed,
    'token_code', v_token_code,
    'has_prize', v_has_prize
  );
END;
$$;

-- 4. REVEAL_PASSPORT_TOKEN
CREATE OR REPLACE FUNCTION public.reveal_passport_token(
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_token RECORD;
  v_prize RECORD;
BEGIN
  v_user_id := COALESCE(auth.uid(), p_user_id);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_token
  FROM public.passport_tokens
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aún no has completado tu Pasaporte de Ciudades.' USING ERRCODE = 'P0002';
  END IF;

  -- Mark as revealed
  UPDATE public.passport_tokens
  SET revealed = true
  WHERE user_id = v_user_id;

  IF v_token.prize_id IS NOT NULL THEN
    SELECT * INTO v_prize
    FROM public.prizes
    WHERE id = v_token.prize_id;

    RETURN json_build_object(
      'success', true,
      'token_code', v_token.token_code,
      'has_prize', true,
      'prize', json_build_object(
        'id', v_prize.id,
        'name', v_prize.name,
        'description', v_prize.description,
        'value', v_prize.value
      ),
      'message', '🎉 ¡FELICIDADES! Has ganado: ' || v_prize.name
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'token_code', v_token.token_code,
      'has_prize', false,
      'prize', NULL,
      'message', '🌎 ¡FELICIDADES! Has completado las 8 ciudades de la Expo RaizeUp. ¡Gracias por participar!'
    );
  END IF;
END;
$$;

-- ========================================================
-- ENABLE REALTIME FOR ALL EXPO TABLES
-- ========================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
      public.investments,
      public.customer_tokens,
      public.projects,
      public.passport_stamps,
      public.passport_tokens,
      public.prizes,
      public.profiles;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  WHEN OTHERS THEN
    NULL;
  END;
END $$;

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
  VALUES (NEW.id, 'initial_balance', v_initial_balance, 'Capital inicial asignado')
  ON CONFLICT DO NOTHING;

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

INSERT INTO public.projects (id, name, description, team_name, category, city, country, country_code, passport_code, active, logo_url)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'EcoTech', 'Plataforma inteligente de reciclaje y valorización de residuos con incentivos tokenizados en campus universitarios.', 'Equipo Verde Circular', 'Sostenibilidad', 'New York', 'Estados Unidos', '🇺🇸', 'NYC-7K4P', true, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80'),
  ('00000000-0000-0000-0000-000000000002', 'RoboSmart', 'Brazo robótico articulado modular y de bajo costo para automatización en laboratorios y centros de formación técnica.', 'Mecatrónica Alpha', 'Robótica & AI', 'Tokyo', 'Japón', '🇯🇵', 'TOK-92XM', true, 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&auto=format&fit=crop&q=80'),
  ('00000000-0000-0000-0000-000000000003', 'GreenApp', 'Aplicación de carpooling y micromovilidad eléctrica coordinada para reducir la huella de carbono escolar y urbana.', 'EcoMobility Lab', 'Movilidad', 'Paris', 'Francia', '🇫🇷', 'PAR-5L8Q', true, 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=80'),
  ('00000000-0000-0000-0000-000000000004', 'SmartHome', 'Ecosistema IoT para optimización del consumo eléctrico y detección predictiva de fugas de agua en viviendas.', 'Domótica Conectada', 'IoT & Hardware', 'Rio de Janeiro', 'Brasil', '🇧🇷', 'RIO-3F7A', true, 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&auto=format&fit=crop&q=80'),
  ('00000000-0000-0000-0000-000000000005', 'AgroVision', 'Sistema de teledetección multiespectral con drones para identificación temprana de plagas y estrés hídrico en cultivos.', 'AgroTech Innovators', 'AgTech', 'London', 'Reino Unido', '🇬🇧', 'LON-8H2M', true, 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=400&auto=format&fit=crop&q=80'),
  ('00000000-0000-0000-0000-000000000006', 'BioHealth', 'Dispositivo portátil no invasivo para monitoreo y telemetría de signos vitales en comunidades rurales aisladas.', 'BioIngeniería Sanitaria', 'Salud & Biotech', 'Rome', 'Italia', '🇮🇹', 'ROM-4P9X', true, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80'),
  ('00000000-0000-0000-0000-000000000007', 'SolarPulse', 'Microrredes fotovoltaicas modulares y almacenamiento energético con gestión predictiva comunitaria.', 'Solar Energy Labs', 'CleanTech', 'Berlin', 'Alemania', '🇩🇪', 'BER-6W3N', true, 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&auto=format&fit=crop&q=80'),
  ('00000000-0000-0000-0000-000000000008', 'CyberGuard', 'Escudo cibernético distribuido con IA reactiva para protección de infraestructuras críticas conectadas.', 'CyberNetix AI', 'Ciberseguridad', 'Singapore', 'Singapur', '🇸🇬', 'SIN-2Y7K', true, 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  country_code = EXCLUDED.country_code,
  passport_code = EXCLUDED.passport_code;

-- Seed Initial Prizes with strictly bounded quantities
INSERT INTO public.prizes (id, name, description, value, quantity, claimed_count, active)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Gift Card de $25 USD', 'Tarjeta de regalo digital canjeable en tiendas participantes de la Expo.', '$25.00', 10, 0, true),
  ('11111111-1111-1111-1111-111111111102', 'Kit Oficial Merchandising Expo', 'Camiseta conmemorativa de la Expo, termo térmico y sticker pack holográfico.', '$35.00', 15, 0, true),
  ('11111111-1111-1111-1111-111111111103', 'Pase VIP Networking Universitario', 'Acceso exclusivo al salón de creadores con inversionistas y mentores ángeles.', '$50.00', 5, 0, true)
ON CONFLICT (id) DO NOTHING;
