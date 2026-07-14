-- Crear especialista de prueba para Google Calendar sync
-- Ejecuta esto en Supabase Dashboard → SQL Editor

-- 1. Crear especialista (ajusta el nombre/email)
insert into public.specialists (full_name, specialty, consultation_fee, phone, email, is_active, is_partner)
values (
  'Dr. Test Google Calendar',
  'psiquiatra',
  500,
  '5551234567',
  'test@example.com',
  true,
  false
)
on conflict do nothing
returning id;

-- 2. Ver especialistas creados
select id, full_name, specialty, email, user_id, is_active
from public.specialists
where full_name ilike '%test%';