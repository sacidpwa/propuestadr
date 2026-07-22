CREATE TABLE IF NOT EXISTS public.petty_cash (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id UUID NOT NULL REFERENCES public.health_units(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('apertura', 'entrada', 'salida')),
  amount DECIMAL(12,2) NOT NULL,
  category TEXT,
  description TEXT,
  reference_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_petty_cash_unit_month ON public.petty_cash(health_unit_id, reference_date);

ALTER TABLE public.petty_cash ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden leer petty_cash" ON public.petty_cash
  FOR SELECT USING (true);

CREATE POLICY "Admin y contador pueden insertar petty_cash" ON public.petty_cash
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'dueno', 'administrativo', 'contador'))
  );

CREATE POLICY "Admin y dueno pueden eliminar petty_cash" ON public.petty_cash
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'dueno'))
  );
