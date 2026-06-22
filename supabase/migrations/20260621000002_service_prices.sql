CREATE TABLE public.service_prices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  health_unit_id uuid NOT NULL REFERENCES public.health_units(id) ON DELETE CASCADE,
  concept text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL,
  category text DEFAULT 'general',
  requires_prescription boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_prices_select ON service_prices
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dueno') OR
    has_role(auth.uid(), 'administrativo') OR has_role(auth.uid(), 'asistente_admin') OR
    has_role(auth.uid(), 'enfermera') OR has_role(auth.uid(), 'contador'));

CREATE POLICY service_prices_insert ON service_prices
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dueno') OR
    has_role(auth.uid(), 'administrativo') OR has_role(auth.uid(), 'asistente_admin'));

CREATE POLICY service_prices_update ON service_prices
  FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dueno') OR
    has_role(auth.uid(), 'administrativo') OR has_role(auth.uid(), 'asistente_admin'));

CREATE POLICY service_prices_delete ON service_prices
  FOR DELETE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dueno'));
