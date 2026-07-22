
-- Grant 'dueno' role full privileges on patients (and align with admin)
CREATE POLICY "Dueno can insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'dueno'));
CREATE POLICY "Dueno can update patients" ON public.patients FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'dueno')) WITH CHECK (public.has_role(auth.uid(), 'dueno'));
CREATE POLICY "Dueno can delete patients" ON public.patients FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'dueno'));

-- Appointments
CREATE POLICY "Dueno can insert appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'dueno'));
CREATE POLICY "Dueno can update appointments" ON public.appointments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'dueno')) WITH CHECK (public.has_role(auth.uid(), 'dueno'));
CREATE POLICY "Dueno can delete appointments" ON public.appointments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'dueno'));
