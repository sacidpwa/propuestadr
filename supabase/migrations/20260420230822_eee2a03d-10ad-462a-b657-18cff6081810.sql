-- Permitir a 'administrativo' gestionar quotes (igual que admin)
DROP POLICY IF EXISTS "Admin can view quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admin can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admin can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admin can delete quotes" ON public.quotes;

CREATE POLICY "Admin or administrativo can view quotes"
ON public.quotes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'administrativo'::app_role));

CREATE POLICY "Admin or administrativo can insert quotes"
ON public.quotes FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'administrativo'::app_role));

CREATE POLICY "Admin or administrativo can update quotes"
ON public.quotes FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'administrativo'::app_role));

CREATE POLICY "Admin or administrativo can delete quotes"
ON public.quotes FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'administrativo'::app_role));