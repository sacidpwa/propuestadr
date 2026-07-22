-- PIN verification function (current user)
CREATE OR REPLACE FUNCTION public.verify_pin(_pin text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND pin_hash IS NOT NULL
      AND pin_hash = extensions.crypt(_pin, pin_hash)
  );
$$;

CREATE OR REPLACE FUNCTION public.set_my_pin(_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _pin IS NULL OR length(_pin) < 4 OR length(_pin) > 8 OR _pin !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'PIN debe ser numerico de 4 a 8 digitos';
  END IF;
  UPDATE public.profiles
     SET pin_hash = extensions.crypt(_pin, extensions.gen_salt('bf')),
         pin_set_at = now(),
         updated_at = now()
   WHERE user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_pin(_user_id uuid, _pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _pin IS NULL OR length(_pin) < 4 OR length(_pin) > 8 OR _pin !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'PIN debe ser numerico de 4 a 8 digitos';
  END IF;
  UPDATE public.profiles
     SET pin_hash = extensions.crypt(_pin, extensions.gen_salt('bf')),
         pin_set_at = now(),
         updated_at = now()
   WHERE user_id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_add_user_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role)
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_remove_user_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role;
END;
$$;

-- Lock down EXECUTE: only authenticated, never anon
REVOKE ALL ON FUNCTION public.verify_pin(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_my_pin(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_user_pin(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_add_user_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_remove_user_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_my_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_pin(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_user_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_remove_user_role(uuid, app_role) TO authenticated;

-- RLS extensions for 'dueno'
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins and dueno can view all roles" ON public.user_roles;
CREATE POLICY "Admins and dueno can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno') OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins and dueno can manage roles" ON public.user_roles;
CREATE POLICY "Admins and dueno can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno'));

DROP POLICY IF EXISTS "Admins can manage specialists" ON public.specialists;
DROP POLICY IF EXISTS "Admins and dueno can manage specialists" ON public.specialists;
CREATE POLICY "Admins and dueno can manage specialists"
  ON public.specialists FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno'));

DROP POLICY IF EXISTS "Clinical staff can view records" ON public.medical_records;
DROP POLICY IF EXISTS "Clinical and dueno can view records" ON public.medical_records;
CREATE POLICY "Clinical and dueno can view records"
  ON public.medical_records FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'especialista') OR public.has_role(auth.uid(), 'dueno'));

DROP POLICY IF EXISTS "Clinical staff can view notes" ON public.medical_notes;
DROP POLICY IF EXISTS "Clinical and dueno can view notes" ON public.medical_notes;
CREATE POLICY "Clinical and dueno can view notes"
  ON public.medical_notes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'especialista') OR public.has_role(auth.uid(), 'dueno'));

DROP POLICY IF EXISTS "Clinical view prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Clinical and dueno view prescriptions" ON public.prescriptions;
CREATE POLICY "Clinical and dueno view prescriptions"
  ON public.prescriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'especialista') OR public.has_role(auth.uid(), 'dueno'));

DROP POLICY IF EXISTS "Clinical view prescription_items" ON public.prescription_items;
DROP POLICY IF EXISTS "Clinical and dueno view prescription_items" ON public.prescription_items;
CREATE POLICY "Clinical and dueno view prescription_items"
  ON public.prescription_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'especialista') OR public.has_role(auth.uid(), 'dueno'));

DROP POLICY IF EXISTS "Clinical staff view vitals" ON public.vital_signs;
DROP POLICY IF EXISTS "Clinical and dueno view vitals" ON public.vital_signs;
CREATE POLICY "Clinical and dueno view vitals"
  ON public.vital_signs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'especialista') OR public.has_role(auth.uid(), 'recepcion') OR public.has_role(auth.uid(), 'dueno'));

DROP POLICY IF EXISTS "Clinical staff view consents" ON public.informed_consents;
DROP POLICY IF EXISTS "Clinical and dueno view consents" ON public.informed_consents;
CREATE POLICY "Clinical and dueno view consents"
  ON public.informed_consents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'especialista') OR public.has_role(auth.uid(), 'dueno'));

DROP POLICY IF EXISTS "Admin view audit" ON public.audit_log;
DROP POLICY IF EXISTS "Admin and dueno view audit" ON public.audit_log;
CREATE POLICY "Admin and dueno view audit"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno'));

DROP POLICY IF EXISTS "Admin/administrativo manage expense_entries" ON public.expense_entries;
DROP POLICY IF EXISTS "Admin/administrativo/dueno manage expense_entries" ON public.expense_entries;
CREATE POLICY "Admin/administrativo/dueno manage expense_entries"
  ON public.expense_entries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'administrativo') OR public.has_role(auth.uid(), 'dueno'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'administrativo') OR public.has_role(auth.uid(), 'dueno'));

DROP POLICY IF EXISTS "Admin/administrativo manage fixed_expenses" ON public.fixed_expenses;
DROP POLICY IF EXISTS "Admin/administrativo/dueno manage fixed_expenses" ON public.fixed_expenses;
CREATE POLICY "Admin/administrativo/dueno manage fixed_expenses"
  ON public.fixed_expenses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'administrativo') OR public.has_role(auth.uid(), 'dueno'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'administrativo') OR public.has_role(auth.uid(), 'dueno'));