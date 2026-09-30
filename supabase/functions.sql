-- ========================================================
-- EXPO INVESTMENT - DATABASE RPC FUNCTIONS (PostgreSQL)
-- ========================================================

-- Function: make_investment
-- Atomically deducts visitor balance, records investment and audit transaction.
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
  -- 1. Identify user: auth.uid() if authenticated session, otherwise p_user_id
  v_user_id := COALESCE(auth.uid(), p_user_id);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado. Inicia sesión o regístrate como visitante para invertir.' USING ERRCODE = '42501';
  END IF;

  -- 2. Validate amount
  IF amount IS NULL OR amount <= 0 THEN
    RAISE EXCEPTION 'El monto a invertir debe ser mayor a 0' USING ERRCODE = '22023';
  END IF;

  -- 3. Lock profile row FOR UPDATE
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

  -- Check sufficient funds
  IF v_current_balance < amount THEN
    RAISE EXCEPTION 'Saldo insuficiente. Tu capital disponible es de $%, no puedes invertir $%'
      , v_current_balance, amount USING ERRCODE = '23514';
  END IF;

  -- 4. Check project exists and is active
  SELECT name, active INTO v_project_name, v_project_active
  FROM public.projects
  WHERE id = project_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proyecto no encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_project_active THEN
    RAISE EXCEPTION 'Este proyecto no se encuentra activo para recibir inversiones' USING ERRCODE = '22023';
  END IF;

  -- 5. Deduct balance
  v_new_balance := v_current_balance - amount;
  UPDATE public.profiles
  SET balance = v_new_balance
  WHERE id = v_user_id;

  -- 6. Insert into investments
  INSERT INTO public.investments (user_id, project_id, amount)
  VALUES (v_user_id, project_id, amount)
  RETURNING id INTO v_investment_id;

  -- 7. Insert audit transaction
  INSERT INTO public.transactions (user_id, type, amount, investment_id, description)
  VALUES (
    v_user_id,
    'investment',
    -amount,
    v_investment_id,
    'Inversión en proyecto: ' || v_project_name
  )
  RETURNING id INTO v_transaction_id;

  -- 8. Return structured JSON
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

-- Overload: 2 parameters
CREATE OR REPLACE FUNCTION public.make_investment(
  project_id UUID,
  amount NUMERIC
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN public.make_investment(project_id, amount, NULL);
END;
$$;

-- Function: give_customer_token
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
    RAISE EXCEPTION 'Usuario no autenticado. Inicia sesión para entregar un Customer Token.' USING ERRCODE = '42501';
  END IF;

  SELECT name INTO v_project_name
  FROM public.projects
  WHERE id = project_id AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proyecto no encontrado o no activo' USING ERRCODE = 'P0002';
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

-- Overload: 1 parameter
CREATE OR REPLACE FUNCTION public.give_customer_token(
  project_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN public.give_customer_token(project_id, NULL);
END;
$$;

-- ========================================================
-- PASAPORTE DE CIUDADES RPC FUNCTIONS
-- ========================================================

-- Function: claim_passport_stamp
-- Validates code, assigns stamp, detects passport completion, and creates Final Token
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

  -- 1. Find project by passport_code
  SELECT id, name, city, country, country_code, active, logo_url INTO v_project
  FROM public.projects
  WHERE upper(passport_code) = v_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El código de ciudad ingresado no existe o no es válido.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_project.active THEN
    RAISE EXCEPTION 'El stand de esta ciudad no se encuentra activo actualmente.' USING ERRCODE = '22023';
  END IF;

  -- 2. Verify if user already has this stamp
  IF EXISTS (
    SELECT 1 FROM public.passport_stamps
    WHERE user_id = v_user_id AND project_id = v_project.id
  ) THEN
    RAISE EXCEPTION 'Ya tienes el sello de esta ciudad.' USING ERRCODE = '23505';
  END IF;

  -- 3. Insert stamp
  INSERT INTO public.passport_stamps (user_id, project_id)
  VALUES (v_user_id, v_project.id)
  RETURNING id, created_at INTO v_stamp_id, v_stamp_time;

  -- 4. Count progress
  SELECT COUNT(*)::INTEGER INTO v_total_cities
  FROM public.projects
  WHERE active = true;

  SELECT COUNT(DISTINCT ps.project_id)::INTEGER INTO v_stamped_cities
  FROM public.passport_stamps ps
  JOIN public.projects p ON ps.project_id = p.id
  WHERE ps.user_id = v_user_id AND p.active = true;

  -- 5. Check if passport is completed
  IF v_stamped_cities >= v_total_cities THEN
    v_completed := true;

    -- Generate Final Token if user doesn't already have one
    IF NOT EXISTS (SELECT 1 FROM public.passport_tokens WHERE user_id = v_user_id) THEN
      v_token_code := 'TOKEN #' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));

      -- Assign a prize safely server-side if available
      SELECT id, name, description, value INTO v_prize
      FROM public.prizes
      WHERE active = true AND quantity > claimed_count
      ORDER BY random()
      LIMIT 1
      FOR UPDATE;

      IF FOUND THEN
        v_prize_id := v_prize.id;
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

-- Function: reveal_passport_token
-- Reveals the prize of a completed passport token
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

  SELECT pt.id, pt.token_code, pt.prize_id, pt.revealed, pt.completed_at
  INTO v_token
  FROM public.passport_tokens pt
  WHERE pt.user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aún no has completado tu Pasaporte de Ciudades.' USING ERRCODE = 'P0002';
  END IF;

  -- Mark revealed
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

-- Permissions
GRANT EXECUTE ON FUNCTION public.make_investment(UUID, NUMERIC, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.make_investment(UUID, NUMERIC) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.give_customer_token(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.give_customer_token(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_passport_stamp(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reveal_passport_token(UUID) TO anon, authenticated;
