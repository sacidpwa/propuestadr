-- Fix RLS for enfermera role: scope inventory/ movements to own unit + allow stock updates

-- 1. Fix: scope medication_inventory SELECT to own unit
DROP POLICY IF EXISTS "Enfermera view inventory" ON public.medication_inventory;
CREATE POLICY "Enfermera view inventory" ON public.medication_inventory FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'enfermera') AND health_unit_id IN (
    SELECT health_unit_id FROM public.employee_assignments WHERE user_id = auth.uid() AND is_active = true
  ));

-- 2. Allow enfermera to UPDATE stock in their unit (for confirmations and adjustments)
CREATE POLICY "Enfermera update inventory in unit" ON public.medication_inventory FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'enfermera') AND health_unit_id IN (
    SELECT health_unit_id FROM public.employee_assignments WHERE user_id = auth.uid() AND is_active = true
  ))
  WITH CHECK (has_role(auth.uid(),'enfermera') AND health_unit_id IN (
    SELECT health_unit_id FROM public.employee_assignments WHERE user_id = auth.uid() AND is_active = true
  ));

-- 3. Replace "Enfermera view movements" (SELECT only) with SELECT + INSERT
DROP POLICY IF EXISTS "Enfermera view movements" ON public.inventory_movements;
CREATE POLICY "Enfermera select movements in unit" ON public.inventory_movements FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'enfermera') AND health_unit_id IN (
    SELECT health_unit_id FROM public.employee_assignments WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Enfermera insert movements in unit" ON public.inventory_movements FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'enfermera') AND health_unit_id IN (
    SELECT health_unit_id FROM public.employee_assignments WHERE user_id = auth.uid() AND is_active = true
  ) AND created_by = auth.uid());
