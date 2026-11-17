-- KPI Dashboard — app_users Backfill
--
-- Run this ONCE in the Supabase SQL Editor, right after applying the
-- updated supabase_schema.sql (which removes the user_metadata.role
-- check from is_app_admin()).
--
-- Why: before this fix, "admin"/"superadmin" access was granted purely
-- based on user_metadata.role — a client-writable field — with no
-- corresponding row in public.app_users. Any account created that way
-- would lose write access the moment the user_metadata check is removed.
-- This script copies those accounts into public.app_users so they keep
-- their access through the (trustworthy) app_users-based check instead.
--
-- Safe to re-run (ON CONFLICT DO NOTHING — never overwrites an existing
-- app_users row, e.g. one whose role was since changed by an admin).

-- ─── Schema drift guard ──────────────────────────────────────
-- `create table if not exists` in supabase_schema.sql only creates the
-- table if it's missing — it does NOT add columns to an already-existing
-- app_users table (e.g. one created before full_name/department_id were
-- added to the schema). Add whatever's missing before inserting.

alter table public.app_users add column if not exists full_name text;
alter table public.app_users add column if not exists department_id bigint references public.departments(id) on delete set null;
alter table public.app_users add column if not exists created_at timestamptz not null default now();
alter table public.app_users add column if not exists updated_at timestamptz not null default now();

insert into public.app_users (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.email),
  lower(u.raw_user_meta_data ->> 'role')
from auth.users u
where lower(u.raw_user_meta_data ->> 'role') in ('admin', 'superadmin')
on conflict (id) do nothing;

-- Verify:
-- select id, email, full_name, role from public.app_users order by created_at;
