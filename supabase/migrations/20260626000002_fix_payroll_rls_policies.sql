DROP POLICY IF EXISTS "Admin manage payroll_employees" ON public.payroll_employees;

CREATE POLICY "Admin manage payroll_employees" ON public.payroll_employees
FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin') OR has_role(auth.uid(),'rrhh') OR has_role(auth.uid(),'contador'))
WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin') OR has_role(auth.uid(),'rrhh') OR has_role(auth.uid(),'contador'));

DROP POLICY IF EXISTS "Admin manage employee_units" ON public.payroll_employee_units;

CREATE POLICY "Admin manage employee_units" ON public.payroll_employee_units
FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin') OR has_role(auth.uid(),'rrhh') OR has_role(auth.uid(),'contador'))
WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin') OR has_role(auth.uid(),'rrhh') OR has_role(auth.uid(),'contador'));
