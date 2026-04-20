-- Quitar rol admin a Esther y asignarle administrativo
DELETE FROM public.user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'esther.z@synapsia.mx');

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'administrativo'::app_role
FROM auth.users
WHERE email = 'esther.z@synapsia.mx';