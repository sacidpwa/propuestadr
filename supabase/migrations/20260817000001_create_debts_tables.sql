CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id UUID NOT NULL REFERENCES public.health_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  original_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado', 'cancelado')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_debts_unit ON public.debts(health_unit_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON public.debts(status);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read debts" ON public.debts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin y dueno insert debts" ON public.debts
  FOR INSERT TO authenticated WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'dueno'::app_role)
    OR has_role(auth.uid(), 'administrativo'::app_role)
  );

CREATE POLICY "Admin y dueno update debts" ON public.debts
  FOR UPDATE TO authenticated USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'dueno'::app_role)
    OR has_role(auth.uid(), 'administrativo'::app_role)
  );

CREATE POLICY "Admin y dueno delete debts" ON public.debts
  FOR DELETE TO authenticated USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'dueno'::app_role)
  );

-- Payments against debts
CREATE TABLE IF NOT EXISTS public.adeudo_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  expense_entry_id UUID REFERENCES public.expense_entries(id) ON DELETE SET NULL,
  notes TEXT,
  paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adeudo_payments_debt ON public.adeudo_payments(debt_id);

ALTER TABLE public.adeudo_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read adeudo_payments" ON public.adeudo_payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert adeudo_payments" ON public.adeudo_payments
  FOR INSERT TO authenticated WITH CHECK (true);

-- Seed initial debts for CT Alcatraces
INSERT INTO public.debts (health_unit_id, name, original_amount, paid_amount, notes)
SELECT u.id, d.name, d.amount, 0, d.notes
FROM public.health_units u
CROSS JOIN (VALUES
  ('Comidas', 166323.49, NULL),
  ('Finiquito María Yolanda Solano Cruz', 56000.00, NULL),
  ('Finiquito Elsa Gabriela Contreras Morales', 2628.77, NULL),
  ('Rentas atrasadas', 200000.00, NULL),
  ('RPBI', 10211.47, NULL),
  ('Agua municipal', 60000.00, NULL),
  ('[Prestamos internos Synapsia] Banorte - 17.04.2026', 32000.00, NULL),
  ('[Prestamos internos Synapsia] Benesse KB - 27.04.2026', 36000.00, NULL),
  ('[Prestamos internos Synapsia] Benesse KB - 31.07.2026', 50000.00, NULL),
  ('[Prestamos internos Synapsia] Benesse KB - 31.07.2026', 11200.00, NULL)
) AS d(name, amount, notes)
WHERE u.name = 'CT Alcatraces'
ON CONFLICT DO NOTHING;

-- Seed initial debts for Centro Benesse
INSERT INTO public.debts (health_unit_id, name, original_amount, paid_amount, notes)
SELECT u.id, d.name, d.amount, 0, d.notes
FROM public.health_units u
CROSS JOIN (VALUES
  ('Redes sociales abril 2026', 11600.00, NULL),
  ('Mindufullnes 2025', 37584.00, NULL),
  ('Psiquiatria 2025 (Diana)', 4800.00, NULL),
  ('Taller filosofia 2025', 7500.00, NULL),
  ('Psiquiatria 2025 (Selene)', 21600.00, NULL),
  ('Psiquiatria 2026 (Diana)', 6400.00, NULL),
  ('Psiquiatria 2026 (Selene)', 1600.00, NULL),
  ('Entrenamiento funcional y yoga julio 2026', 9338.00, NULL),
  ('Taller de teatro julio 2026', 4698.00, NULL),
  ('Taller artes plasticas y escritura julio 2026', 10440.00, NULL),
  ('Mindufullnes julio 2026', 8120.00, NULL),
  ('Taller filosofia ene, feb y mar 2026', 6500.00, NULL),
  ('Taller de filosofia julio 2026', 2000.00, NULL),
  ('Terapia individual julio 2026', 23200.00, NULL),
  ('Terapia grupal julio 2026', 23200.00, NULL),
  ('Recursos Humanos 2025 y 2026', 28000.00, NULL),
  ('Rodrigo 2025 y 2026', 60000.00, NULL),
  ('Esther 2025 y 2026', 70000.00, NULL),
  ('Esther junio 2025', 20000.00, NULL),
  ('[Prestamos internos Synapsia] Consultas', 20879.00, NULL)
) AS d(name, amount, notes)
WHERE u.name = 'Centro Benesse'
ON CONFLICT DO NOTHING;
