CREATE POLICY "Admin/administrativo delete invoices" ON public.patient_invoices
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR
    has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin')
  );
