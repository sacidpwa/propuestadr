-- Remove health_unit restriction for enfermera role (cross-unit access)
-- jose@synapsia.mx needs to manage all units

-- ===== medication_log =====
DROP POLICY IF EXISTS "Enfermera view med log in unit" ON public.medication_log;
CREATE POLICY "Enfermera view med log" ON public.medication_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'enfermera'));

DROP POLICY IF EXISTS "Enfermera insert med log in unit" ON public.medication_log;
CREATE POLICY "Enfermera insert med log" ON public.medication_log FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'enfermera') AND recorded_by = auth.uid());

DROP POLICY IF EXISTS "Enfermera update own med log in unit" ON public.medication_log;
CREATE POLICY "Enfermera update own med log" ON public.medication_log FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'enfermera') AND recorded_by = auth.uid());

-- ===== meal_plans =====
DROP POLICY IF EXISTS "Enfermera manage meal plans in unit" ON public.meal_plans;
CREATE POLICY "Enfermera manage meal plans" ON public.meal_plans FOR ALL TO authenticated
  USING (has_role(auth.uid(),'enfermera'))
  WITH CHECK (has_role(auth.uid(),'enfermera'));

-- ===== meal_intake =====
DROP POLICY IF EXISTS "Enfermera view intake in unit" ON public.meal_intake;
CREATE POLICY "Enfermera view intake" ON public.meal_intake FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'enfermera'));

DROP POLICY IF EXISTS "Enfermera insert intake in unit" ON public.meal_intake;
CREATE POLICY "Enfermera insert intake" ON public.meal_intake FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'enfermera') AND recorded_by = auth.uid());

-- ===== requisitions =====
-- Split combined policy: enfermera without unit restriction, intendencia/mantenimiento still restricted
DROP POLICY IF EXISTS "Operative view own unit requisitions" ON public.requisitions;
CREATE POLICY "Enfermera view requisitions" ON public.requisitions FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'enfermera'));
CREATE POLICY "Intendencia view own unit requisitions" ON public.requisitions FOR SELECT TO authenticated
  USING ((has_role(auth.uid(),'intendencia') OR has_role(auth.uid(),'mantenimiento')) AND user_in_unit(auth.uid(), health_unit_id));

DROP POLICY IF EXISTS "Operative create requisitions in unit" ON public.requisitions;
CREATE POLICY "Enfermera create requisitions" ON public.requisitions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'enfermera') AND requested_by = auth.uid() AND status = 'pendiente');
CREATE POLICY "Intendencia create requisitions in unit" ON public.requisitions FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(),'intendencia') OR has_role(auth.uid(),'mantenimiento')) AND user_in_unit(auth.uid(), health_unit_id) AND requested_by = auth.uid() AND status = 'pendiente');

DROP POLICY IF EXISTS "Operative update own pending requisitions" ON public.requisitions;
CREATE POLICY "Enfermera update own pending requisitions" ON public.requisitions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'enfermera') AND requested_by = auth.uid() AND status = 'pendiente');
CREATE POLICY "Intendencia update own pending requisitions in unit" ON public.requisitions FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(),'intendencia') OR has_role(auth.uid(),'mantenimiento')) AND requested_by = auth.uid() AND status = 'pendiente');

-- ===== medication_inventory =====
DROP POLICY IF EXISTS "Enfermera view inventory" ON public.medication_inventory;
CREATE POLICY "Enfermera view inventory" ON public.medication_inventory FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'enfermera'));

DROP POLICY IF EXISTS "Enfermera update inventory in unit" ON public.medication_inventory;
CREATE POLICY "Enfermera update inventory" ON public.medication_inventory FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'enfermera'))
  WITH CHECK (has_role(auth.uid(),'enfermera'));

-- ===== inventory_movements =====
DROP POLICY IF EXISTS "Enfermera select movements in unit" ON public.inventory_movements;
CREATE POLICY "Enfermera select movements" ON public.inventory_movements FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'enfermera'));

DROP POLICY IF EXISTS "Enfermera insert movements in unit" ON public.inventory_movements;
CREATE POLICY "Enfermera insert movements" ON public.inventory_movements FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'enfermera') AND created_by = auth.uid());
