-- Fix RLS policies: add asistente_admin role to tables Diana needs
-- Execute this in Supabase SQL Editor

-- 1. expense_entries
DROP POLICY IF EXISTS "Admin/administrativo/dueno manage expense_entries" ON public.expense_entries;
CREATE POLICY "Admin/administrativo/dueno manage expense_entries"
  ON public.expense_entries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'administrativo') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'asistente_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'administrativo') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'asistente_admin'));

-- 2. fixed_expenses
DROP POLICY IF EXISTS "Admin/administrativo/dueno manage fixed_expenses" ON public.fixed_expenses;
CREATE POLICY "Admin/administrativo/dueno manage fixed_expenses"
  ON public.fixed_expenses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'administrativo') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'asistente_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'administrativo') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'asistente_admin'));

-- 3. meal_plans
DROP POLICY IF EXISTS "Admin/dueno/administrativo manage meal plans" ON public.meal_plans;
CREATE POLICY "Admin/dueno/administrativo manage meal plans"
  ON public.meal_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'administrativo') OR public.has_role(auth.uid(),'asistente_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'administrativo') OR public.has_role(auth.uid(),'asistente_admin'));

-- 4. meal_intake
DROP POLICY IF EXISTS "Admin/dueno/administrativo manage intake" ON public.meal_intake;
CREATE POLICY "Admin/dueno/administrativo manage intake"
  ON public.meal_intake FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'administrativo') OR public.has_role(auth.uid(),'asistente_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'administrativo') OR public.has_role(auth.uid(),'asistente_admin'));

-- 5. medication_log
DROP POLICY IF EXISTS "Admin/dueno/administrativo manage med log" ON public.medication_log;
CREATE POLICY "Admin/dueno/administrativo manage med log"
  ON public.medication_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'administrativo') OR public.has_role(auth.uid(),'asistente_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'administrativo') OR public.has_role(auth.uid(),'asistente_admin'));
