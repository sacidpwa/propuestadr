CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  health_unit_id UUID REFERENCES public.health_units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, health_unit_id)
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_unit ON public.expense_categories(health_unit_id);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read expense_categories" ON public.expense_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert expense_categories" ON public.expense_categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated delete expense_categories" ON public.expense_categories
  FOR DELETE TO authenticated USING (true);

-- Seed default categories for existing units
INSERT INTO public.expense_categories (name, health_unit_id)
SELECT c.name, u.id
FROM public.health_units u
CROSS JOIN (VALUES
  ('Nómina / Personal'),
  ('Medicamentos'),
  ('Alimentos'),
  ('Servicios (luz, agua, gas)'),
  ('Mantenimiento'),
  ('Limpieza'),
  ('Transporte'),
  ('Seguros'),
  ('Impuestos'),
  ('Papelería / Office'),
  ('Equipo / Mobiliario'),
  ('Servicios profesionales'),
  ('Mensualidad'),
  ('Gastos adicionales'),
  ('Insumos médicos'),
  ('Enfermería'),
  ('Lavandería')
) AS c(name)
ON CONFLICT (name, health_unit_id) DO NOTHING;
