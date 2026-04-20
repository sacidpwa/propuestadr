-- 1. Agregar valor al enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'administrativo';