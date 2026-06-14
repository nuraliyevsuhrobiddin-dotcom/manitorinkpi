create table if not exists public.app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_state_set_updated_at on public.app_state;

create trigger app_state_set_updated_at
before update on public.app_state
for each row
execute function public.set_updated_at();

alter table public.app_state enable row level security;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    lower(auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'superadmin')
    or lower(auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'superadmin'),
    false
  );
$$;

drop policy if exists "Allow anon read app state" on public.app_state;
create policy "Allow anon read app state"
on public.app_state
for select
to anon
using (true);

drop policy if exists "Allow anon upsert app state" on public.app_state;
drop policy if exists "Allow anon update app state" on public.app_state;
drop policy if exists "Allow admin insert app state" on public.app_state;
drop policy if exists "Allow admin update app state" on public.app_state;

create policy "Allow admin insert app state"
on public.app_state
for insert
to authenticated
with check (public.is_app_admin());

create policy "Allow admin update app state"
on public.app_state
for update
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());
