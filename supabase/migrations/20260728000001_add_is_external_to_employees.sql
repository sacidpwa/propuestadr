-- Agregar campo is_external para identificar prestadores de servicios externos
ALTER TABLE public.payroll_employees ADD COLUMN IF NOT EXISTS is_external boolean NOT NULL DEFAULT false;
