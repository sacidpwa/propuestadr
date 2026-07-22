-- Permitir cobros desde el flujo (sin requerir visita) y guardar conceptos
ALTER TABLE public.payments
  ALTER COLUMN visit_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS patient_id uuid,
  ADD COLUMN IF NOT EXISTS flow_id uuid,
  ADD COLUMN IF NOT EXISTS concepts jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Asegurar que recepción pueda ver e insertar (ya hay políticas; añadimos una explícita por claridad)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payments' AND policyname='Recepcion can insert payments (flow)'
  ) THEN
    CREATE POLICY "Recepcion can insert payments (flow)"
    ON public.payments
    FOR INSERT
    TO authenticated
    WITH CHECK (has_role(auth.uid(), 'recepcion'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;