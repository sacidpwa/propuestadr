-- Permitir a recepción gestionar el catálogo de especialistas (registro/edición/desactivación)
CREATE POLICY "Recepcion can insert specialists"
ON public.specialists
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'recepcion'::app_role));

CREATE POLICY "Recepcion can update specialists"
ON public.specialists
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'recepcion'::app_role));