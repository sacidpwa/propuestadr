DROP POLICY IF EXISTS "Finanzas view invoices" ON public.patient_invoices;
CREATE POLICY "View invoices" ON public.patient_invoices
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR
    has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'contador') OR
    has_role(auth.uid(),'asistente_admin') OR has_role(auth.uid(),'enfermera')
  );
