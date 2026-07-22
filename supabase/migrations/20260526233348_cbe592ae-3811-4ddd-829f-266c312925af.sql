DROP POLICY IF EXISTS "Clinical staff can insert records" ON public.medical_records;
DROP POLICY IF EXISTS "Clinical staff can update records" ON public.medical_records;

CREATE POLICY "Clinical staff can insert records" ON public.medical_records
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'especialista'::app_role) OR has_role(auth.uid(),'dueno'::app_role));

CREATE POLICY "Clinical staff can update records" ON public.medical_records
FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'especialista'::app_role) OR has_role(auth.uid(),'dueno'::app_role));