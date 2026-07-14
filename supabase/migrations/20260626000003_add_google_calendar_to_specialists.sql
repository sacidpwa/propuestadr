-- Add Google Calendar sync fields to specialists table
alter table public.specialists
  add column if not exists google_calendar_id text default 'primary',
  add column if not exists google_access_token text,
  add column if not exists google_refresh_token text,
  add column if not exists google_token_expiry timestamptz,
  add column if not exists calendar_sync_enabled boolean default false,
  add column if not exists google_sync_token text;

-- Index for finding specialists with sync enabled
create index if not exists idx_specialists_calendar_sync_enabled
  on public.specialists (calendar_sync_enabled)
  where calendar_sync_enabled = true;

comment on column public.specialists.google_calendar_id is 'Google Calendar ID to sync with (usually "primary")';
comment on column public.specialists.google_access_token is 'OAuth2 access token (encrypted at rest recommended)';
comment on column public.specialists.google_refresh_token is 'OAuth2 refresh token for obtaining new access tokens';
comment on column public.specialists.google_token_expiry is 'Expiry timestamp of the current access token';
comment on column public.specialists.calendar_sync_enabled is 'Whether to automatically sync appointments to/from Google Calendar';
comment on column public.specialists.google_sync_token is 'Next sync token for incremental Google Calendar sync';