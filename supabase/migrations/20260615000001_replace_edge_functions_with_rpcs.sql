-- Replace Edge Functions admin-create-user, admin-update-user, admin-reset-password
-- with PostgreSQL SECURITY DEFINER functions that operate directly on auth.users.

-- 1. admin_create_user: creates auth user + profile (via trigger) + roles + optional PIN
CREATE OR REPLACE FUNCTION public.admin_create_user(
  _email text,
  _password text,
  _full_name text,
  _role app_role,
  _pin text DEFAULT NULL,
  _additional_roles app_role[] DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  _user_id uuid;
  _encrypted_pw text;
  _r app_role;
BEGIN
  -- Authorization
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Validation
  IF _email IS NULL OR _email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'email invalido';
  END IF;
  IF _password IS NULL OR length(_password) < 8 THEN
    RAISE EXCEPTION 'password minimo 8 caracteres';
  END IF;
  IF _full_name IS NULL OR trim(_full_name) = '' THEN
    RAISE EXCEPTION 'nombre requerido';
  END IF;

  -- Hash password with bcrypt
  _encrypted_pw := extensions.crypt(_password, extensions.gen_salt('bf'));
  _user_id := extensions.gen_random_uuid();

  -- Create user in auth.users (trigger handle_new_user will auto-create profile)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token,
    is_super_admin, role
  ) VALUES (
    _user_id,
    '00000000-0000-0000-0000-000000000000',
    _email,
    _encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', _full_name),
    now(),
    now(),
    '', '', '', '',
    false,
    'authenticated'
  );

  -- Create identity record for email/password login
  BEGIN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (_user_id, _user_id, jsonb_build_object('sub', _user_id, 'email', _email), 'email', now(), now(), now());
  EXCEPTION WHEN OTHERS THEN
    -- If identities table doesn't exist or has different schema, continue
  END;

  -- Assign primary role
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);

  -- Assign additional roles
  FOREACH _r IN ARRAY _additional_roles
  LOOP
    IF _r <> _role THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _r) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Optionally set PIN
  IF _pin IS NOT NULL AND _pin ~ '^[0-9]{4,8}$' THEN
    UPDATE public.profiles
    SET pin_hash = extensions.crypt(_pin, extensions.gen_salt('bf')),
        pin_set_at = now(),
        updated_at = now()
    WHERE user_id = _user_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'user_id', _user_id::text);
END;
$$;

-- 2. admin_update_user: update email/name in auth, profiles, specialists
CREATE OR REPLACE FUNCTION public.admin_update_user(
  _user_id uuid,
  _email text DEFAULT NULL,
  _full_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Authorization
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user_id requerido';
  END IF;
  IF _email IS NULL AND _full_name IS NULL THEN
    RAISE EXCEPTION 'nada que actualizar';
  END IF;
  IF _email IS NOT NULL AND _email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'email invalido';
  END IF;

  -- Update auth.users
  IF _email IS NOT NULL THEN
    UPDATE auth.users SET email = _email, updated_at = now() WHERE id = _user_id;
  END IF;

  -- Update public.profiles
  UPDATE public.profiles
  SET email = COALESCE(_email, email),
      full_name = COALESCE(_full_name, full_name),
      updated_at = now()
  WHERE user_id = _user_id;

  -- Mirror on specialists
  IF _email IS NOT NULL THEN
    UPDATE public.specialists SET email = _email WHERE user_id = _user_id;
  END IF;
  IF _full_name IS NOT NULL THEN
    UPDATE public.specialists SET full_name = _full_name WHERE user_id = _user_id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- 3. admin_reset_password: change password in auth.users
CREATE OR REPLACE FUNCTION public.admin_reset_password(
  _user_id uuid,
  _password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  _encrypted_pw text;
BEGIN
  -- Authorization
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user_id requerido';
  END IF;
  IF _password IS NULL OR length(_password) < 8 THEN
    RAISE EXCEPTION 'password minimo 8 caracteres';
  END IF;

  _encrypted_pw := extensions.crypt(_password, extensions.gen_salt('bf'));

  UPDATE auth.users
  SET encrypted_password = _encrypted_pw, updated_at = now()
  WHERE id = _user_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Grant execute to authenticated users
REVOKE ALL ON FUNCTION public.admin_create_user(text, text, text, app_role, text, app_role[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_user(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reset_password(uuid, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, text, app_role, text, app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) TO authenticated;
