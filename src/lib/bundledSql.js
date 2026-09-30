/**
 * Bundled SQL script for Expo Investment
 * Combines Schema + Functions + City Passport + Seed data into a single runnable script
 * that users can paste into the Supabase SQL Editor in one click.
 */

export const BUNDLED_SQL = `-- ========================================================
-- EXPO INVESTMENT - SCRIPT COMPLETO UNIFICADO CON PASAPORTE DE CIUDADES
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase
-- (https://supabase.com/dashboard/project/_/sql)
-- ========================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLAS Y RELACIONES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'visitor' CHECK (role IN ('visitor', 'team', 'admin')),
  balance NUMERIC(12, 2) NOT NULL DEFAULT 10000.00 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

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

CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.customer_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_project_customer_token UNIQUE (user_id, project_id)
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('initial_balance', 'investment', 'refund', 'adjustment')),
  amount NUMERIC(12, 2) NOT NULL,
  investment_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- PREMIOS DEL PASAPORTE
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

-- SELLOS DEL PASAPORTE
CREATE TABLE IF NOT EXISTS public.passport_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_project_stamp UNIQUE (user_id, project_id)
);

-- TOKEN FINAL DEL PASAPORTE
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

-- Asegurar columnas en proyectos
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS passport_code TEXT;

-- 3. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_projects_active ON public.projects(active);
CREATE INDEX IF NOT EXISTS idx_projects_passport_code ON public.projects(passport_code);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_project_id ON public.investments(project_id);
CREATE INDEX IF NOT EXISTS idx_customer_tokens_user_id ON public.customer_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_passport_stamps_user_id ON public.passport_stamps(user_id);
CREATE INDEX IF NOT EXISTS idx_passport_tokens_user_id ON public.passport_tokens(user_id);

-- 4. VISTAS ANALÍTICAS
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

CREATE OR REPLACE VIEW public.expo_stats AS
SELECT
  COALESCE(SUM(amount), 0)::NUMERIC(12,2) AS total_invested,
  COUNT(DISTINCT user_id)::INTEGER AS total_investors,
  (SELECT COUNT(*)::INTEGER FROM public.customer_tokens) AS total_customer_tokens,
  (SELECT COUNT(*)::INTEGER FROM public.passport_stamps) AS total_passport_stamps,
  (SELECT COUNT(*)::INTEGER FROM public.passport_tokens) AS total_passports_completed,
  (SELECT COUNT(*)::INTEGER FROM public.profiles WHERE role = 'visitor') AS total_visitors
FROM public.investments;

-- 5. RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view active projects" ON public.projects;
  DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Public can read investments count" ON public.investments;
  DROP POLICY IF EXISTS "Public can read tokens count" ON public.customer_tokens;
  DROP POLICY IF EXISTS "Users can read own transactions" ON public.transactions;
  DROP POLICY IF EXISTS "Public can read prizes" ON public.prizes;
  DROP POLICY IF EXISTS "Users can read own stamps" ON public.passport_stamps;
  DROP POLICY IF EXISTS "Users can read own token" ON public.passport_tokens;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Public can view active projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Public can read investments count" ON public.investments FOR SELECT USING (true);
CREATE POLICY "Public can read tokens count" ON public.customer_tokens FOR SELECT USING (true);
CREATE POLICY "Users can read own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Public can read prizes" ON public.prizes FOR SELECT USING (true);
CREATE POLICY "Users can read own stamps" ON public.passport_stamps FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Users can read own token" ON public.passport_tokens FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 6. RPC: MAKE_INVESTMENT
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
    RAISE EXCEPTION 'Usuario no autenticado. Inicia sesión o regístrate como visitante para invertir.' USING ERRCODE = '42501';
  END IF;

  IF amount IS NULL OR amount <= 0 THEN
    RAISE EXCEPTION 'El monto a invertir debe ser mayor a 0' USING ERRCODE = '22023';
  END IF;

  SELECT balance INTO v_current_balance
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, full_name, email, role, balance)
    VALUES (v_user_id, 'Visitante Expo', 'visitante@expo.com', 'visitor', 10000.00)
    ON CONFLICT (id) DO NOTHING;

    SELECT balance INTO v_current_balance
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Perfil de usuario no encontrado' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  IF v_current_balance < amount THEN
    RAISE EXCEPTION 'Saldo insuficiente. Tu capital disponible es de $%, no puedes invertir $%'
      , v_current_balance, amount USING ERRCODE = '23514';
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
    'message', 'Inversión realizada con éxito',
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

-- 7. RPC: GIVE_CUSTOMER_TOKEN
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
    RAISE EXCEPTION 'Usuario no autenticado.' USING ERRCODE = '42501';
  END IF;

  SELECT name INTO v_project_name
  FROM public.projects
  WHERE id = project_id AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proyecto no encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.customer_tokens
    WHERE user_id = v_user_id AND project_id = give_customer_token.project_id
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
    'message', 'Customer Token entregado con éxito',
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

-- 8. RPC: CLAIM_PASSPORT_STAMP
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
  v_prize RECORD;
BEGIN
  v_user_id := COALESCE(auth.uid(), p_user_id);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para registrar sellos en tu pasaporte.' USING ERRCODE = '42501';
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
      v_token_code := 'TOKEN #' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));

      SELECT id INTO v_prize_id
      FROM public.prizes
      WHERE active = true AND quantity > claimed_count
      ORDER BY random()
      LIMIT 1
      FOR UPDATE;

      IF FOUND THEN
        UPDATE public.prizes
        SET claimed_count = claimed_count + 1
        WHERE id = v_prize_id;
      END IF;

      INSERT INTO public.passport_tokens (user_id, token_code, prize_id, completed_at)
      VALUES (v_user_id, v_token_code, v_prize_id, now());
    ELSE
      SELECT token_code INTO v_token_code
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
    'token_code', v_token_code
  );
END;
$$;

-- 9. RPC: REVEAL_PASSPORT_TOKEN
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
    RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '42501';
  END IF;

  SELECT pt.id, pt.token_code, pt.prize_id, pt.revealed
  INTO v_token
  FROM public.passport_tokens pt
  WHERE pt.user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aún no has completado tu Pasaporte de Ciudades.' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.passport_tokens
  SET revealed = true
  WHERE id = v_token.id;

  IF v_token.prize_id IS NOT NULL THEN
    SELECT id, name, description, value INTO v_prize
    FROM public.prizes
    WHERE id = v_token.prize_id;

    RETURN json_build_object(
      'success', true,
      'token_code', v_token.token_code,
      'has_prize', true,
      'prize', json_build_object(
        'name', v_prize.name,
        'description', v_prize.description,
        'value', v_prize.value
      )
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'token_code', v_token.token_code,
      'has_prize', false,
      'message', 'Gracias por participar en Expo Investment'
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.make_investment(UUID, NUMERIC, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.make_investment(UUID, NUMERIC) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.give_customer_token(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.give_customer_token(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_passport_stamp(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reveal_passport_token(UUID) TO anon, authenticated;

-- 10. DATOS DE PRUEBA: CIUDADES Y PREMIOS
INSERT INTO public.projects (id, name, description, team_name, category, city, country, country_code, passport_code, active, logo_url)
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

INSERT INTO public.prizes (id, name, description, value, quantity, claimed_count, active)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Gift Card de $25 USD', 'Tarjeta de regalo digital canjeable en tiendas participantes de la Expo.', '$25.00', 10, 0, true),
  ('11111111-1111-1111-1111-111111111102', 'Kit Oficial Merchandising Expo', 'Camiseta conmemorativa de la Expo, termo térmico y sticker pack holográfico.', '$35.00', 15, 0, true),
  ('11111111-1111-1111-1111-111111111103', 'Pase VIP Networking Universitario', 'Acceso exclusivo al salón de creadores con inversionistas y mentores ángeles.', '$50.00', 5, 0, true)
ON CONFLICT (id) DO NOTHING;
`;
