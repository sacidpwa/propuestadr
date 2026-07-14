-- Add Google Calendar event ID to appointments table
alter table public.appointments
  add column if not exists google_event_id text,
  add column if not exists google_calendar_id text default 'primary';

create index if not exists idx_appointments_google_event_id
  on public.appointments (google_event_id)
  where google_event_id is not null;

comment on column public.appointments.google_event_id is 'Google Calendar event ID for two-way sync';
comment on column public.appointments.google_calendar_id is 'Google Calendar ID this appointment is synced to';