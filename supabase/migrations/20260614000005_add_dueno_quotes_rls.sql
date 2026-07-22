-- Agregar role 'dueno' a las policies de quotes
-- (Rodrigo no veía cotizaciones creadas porque RLS no incluía su rol)

DROP POLICY IF EXISTS "Dueno can view quotes" ON public.quotes;
DROP POLICY IF EXISTS "Dueno can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Dueno can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Dueno can delete quotes" ON public.quotes;

CREATE POLICY "Dueno can view quotes"
ON public.quotes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'dueno'::app_role));

CREATE POLICY "Dueno can insert quotes"
ON public.quotes FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'dueno'::app_role));

CREATE POLICY "Dueno can update quotes"
ON public.quotes FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'dueno'::app_role));

CREATE POLICY "Dueno can delete quotes"
ON public.quotes FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'dueno'::app_role));
