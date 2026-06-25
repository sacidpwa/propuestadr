-- Add soft-delete column to patients
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_patients_is_active ON public.patients(is_active);

-- Restrict reactivation: only admin/dueno can set is_active from false to true
-- Drop existing per-role UPDATE policies that don't have WITH CHECK
DROP POLICY IF EXISTS "Recepcion and admin can update patients" ON public.patients;
DROP POLICY IF EXISTS "Especialistas can update patients" ON public.patients;
DROP POLICY IF EXISTS "Dueno can update patients" ON public.patients;
DROP POLICY IF EXISTS "Administrativo can update patients" ON public.patients;

-- Admin full access
CREATE POLICY "Admin full update patients"
  ON public.patients FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Dueno full access
CREATE POLICY "Dueno full update patients"
  ON public.patients FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'dueno'))
  WITH CHECK (public.has_role(auth.uid(), 'dueno'));

-- Recepcion can update but cannot reactivate (set is_active from false to true)
CREATE POLICY "Recepcion update patients (no reactivation)"
  ON public.patients FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'recepcion'))
  WITH CHECK (
    public.has_role(auth.uid(), 'recepcion')
    AND NOT (NEW.is_active = true AND OLD.is_active = false)
  );

-- Especialistas can update but cannot reactivate
CREATE POLICY "Especialistas update patients (no reactivation)"
  ON public.patients FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'especialista'))
  WITH CHECK (
    public.has_role(auth.uid(), 'especialista')
    AND NOT (NEW.is_active = true AND OLD.is_active = false)
  );

-- Administrativo can update but cannot reactivate
CREATE POLICY "Administrativo update patients (no reactivation)"
  ON public.patients FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'administrativo'))
  WITH CHECK (
    public.has_role(auth.uid(), 'administrativo')
    AND NOT (NEW.is_active = true AND OLD.is_active = false)
  );
