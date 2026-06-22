ALTER TABLE public.patient_invoices
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_id uuid;

CREATE INDEX IF NOT EXISTS idx_invoices_source ON public.patient_invoices(source);

DROP POLICY IF EXISTS "Contador/admin insert invoices" ON public.patient_invoices;
CREATE POLICY "Contador/admin/enfermera insert invoices" ON public.patient_invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'contador') OR
    has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin') OR
    has_role(auth.uid(),'dueno') OR
    has_role(auth.uid(),'enfermera')
  );

DROP POLICY IF EXISTS "Admin/administrativo verify invoices" ON public.patient_invoices;
CREATE POLICY "Admin/administrativo/enfermera update invoices" ON public.patient_invoices
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR
    has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin') OR
    has_role(auth.uid(),'contador') OR
    has_role(auth.uid(),'enfermera')
  );
