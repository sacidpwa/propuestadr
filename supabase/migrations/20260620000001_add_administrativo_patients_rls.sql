-- Dar permisos a administrativo para insertar/actualizar pacientes
CREATE POLICY "Administrativo can insert patients" ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrativo'));

CREATE POLICY "Administrativo can update patients" ON public.patients
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'administrativo'));
