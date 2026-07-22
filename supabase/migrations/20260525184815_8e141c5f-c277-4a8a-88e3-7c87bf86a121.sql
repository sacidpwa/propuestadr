CREATE POLICY "Promotor can view quotes" ON public.quotes
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'promotor'::app_role));

CREATE POLICY "Promotor can insert quotes" ON public.quotes
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'promotor'::app_role));

CREATE POLICY "Promotor can update quotes" ON public.quotes
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'promotor'::app_role));

CREATE POLICY "Promotor can delete quotes" ON public.quotes
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'promotor'::app_role));
