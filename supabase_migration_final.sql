-- ============================================================
-- KPI Dashboard — FINAL Production Migration v3
-- Run this ONCE in Supabase SQL Editor → safe to re-run.
-- ============================================================
-- WHY this migration exists:
--   The old is_app_admin() had no SECURITY DEFINER, so when
--   RLS on app_users called is_app_admin() → SELECT app_users →
--   triggers app_users RLS again → infinite recursion → 403 on
--   every INSERT / UPDATE / DELETE.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Drop the old (unsafe) is_app_admin and recreate it
--         with SECURITY DEFINER + fixed search_path.
--
-- CASCADE is required because RLS policies depend on this function.
-- All dependent policies will be dropped automatically, then we
-- recreate them cleanly in STEP 5.
-- ─────────────────────────────────────────────────────────────
drop function if exists public.is_app_admin() cascade;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''            -- prevents search_path injection
as $$
  select coalesce(
    -- Check 1: user_metadata.role (set in Supabase Dashboard → Auth → Users)
    lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', ''))
      = any (array['admin', 'superadmin'])
    -- Check 2: app_metadata.role (set via service-role API or SQL)
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', ''))
      = any (array['admin', 'superadmin'])
    -- Check 3: JWT email whitelist (always reliable — no table lookup)
    or lower(coalesce(auth.jwt() ->> 'email', ''))
      = any (array['suhrobiddinnuraliyev04@gmail.com'])
    -- Check 4: app_users table (SECURITY DEFINER bypasses RLS here — no recursion)
    or exists (
      select 1
      from   public.app_users
      where  id   = auth.uid()
        and  role in ('admin', 'superadmin')
    ),
    false
  );
$$;

-- Grant execute to authenticated and anon roles
grant execute on function public.is_app_admin() to authenticated, anon;

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Ensure the superadmin user exists in app_users
--         (upsert so it's safe to re-run)
-- ─────────────────────────────────────────────────────────────
insert into public.app_users (id, email, role)
select u.id, u.email, 'superadmin'
from   auth.users u
where  lower(u.email) = 'suhrobiddinnuraliyev04@gmail.com'
on conflict (id) do update
  set role       = 'superadmin',
      updated_at = now();

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Enable RLS on all tables (idempotent)
-- ─────────────────────────────────────────────────────────────
alter table public.app_state      enable row level security;
alter table public.faculties       enable row level security;
alter table public.departments     enable row level security;
alter table public.professors      enable row level security;
alter table public.plans           enable row level security;
alter table public.plan_items      enable row level security;
alter table public.achievements    enable row level security;
alter table public.projects        enable row level security;
alter table public.thesis_defenses enable row level security;
alter table public.app_users       enable row level security;

-- ─────────────────────────────────────────────────────────────
-- STEP 4: Drop any remaining policies (CASCADE in STEP 1 already
--         removed most of them, but we drop-if-exists here to
--         also catch any old "Allow admin..." named policies that
--         CASCADE may not have removed.)
-- ─────────────────────────────────────────────────────────────

-- app_state (quoted names from old schema)
drop policy if exists "Allow admin insert app state" on public.app_state;
drop policy if exists "Allow admin update app state" on public.app_state;
drop policy if exists "Allow admin delete app state" on public.app_state;
drop policy if exists anon_read_app_state            on public.app_state;
drop policy if exists admin_insert_app_state         on public.app_state;
drop policy if exists admin_update_app_state         on public.app_state;
drop policy if exists admin_delete_app_state         on public.app_state;

-- faculties
drop policy if exists "Allow admin manage faculties" on public.faculties;
drop policy if exists anon_read_faculties            on public.faculties;
drop policy if exists admin_manage_faculties         on public.faculties;

-- departments
drop policy if exists "Allow admin manage departments" on public.departments;
drop policy if exists anon_read_departments          on public.departments;
drop policy if exists admin_manage_departments       on public.departments;

-- professors
drop policy if exists "Allow admin manage professors" on public.professors;
drop policy if exists anon_read_professors           on public.professors;
drop policy if exists admin_manage_professors        on public.professors;

-- plans
drop policy if exists "Allow admin manage plans"     on public.plans;
drop policy if exists anon_read_plans                on public.plans;
drop policy if exists admin_manage_plans             on public.plans;

-- plan_items
drop policy if exists "Allow admin manage plan items" on public.plan_items;
drop policy if exists anon_read_plan_items           on public.plan_items;
drop policy if exists admin_manage_plan_items        on public.plan_items;

-- achievements
drop policy if exists "Allow admin manage achievements" on public.achievements;
drop policy if exists anon_read_achievements         on public.achievements;
drop policy if exists admin_manage_achievements      on public.achievements;

-- projects
drop policy if exists "Allow admin manage projects"  on public.projects;
drop policy if exists anon_read_projects             on public.projects;
drop policy if exists admin_manage_projects          on public.projects;

-- thesis_defenses
drop policy if exists "Allow admin manage thesis defenses" on public.thesis_defenses;
drop policy if exists anon_read_thesis_defenses      on public.thesis_defenses;
drop policy if exists admin_manage_thesis_defenses   on public.thesis_defenses;

-- app_users
drop policy if exists "Allow admin manage app users" on public.app_users;
drop policy if exists auth_read_app_users            on public.app_users;
drop policy if exists admin_manage_app_users         on public.app_users;
drop policy if exists "Allow admin manage thesis defenses" on public.thesis_defenses;

-- app_users
drop policy if exists auth_read_app_users          on public.app_users;
drop policy if exists admin_manage_app_users        on public.app_users;
drop policy if exists "Allow admin manage app users" on public.app_users;

-- ─────────────────────────────────────────────────────────────
-- STEP 5: Recreate all policies (clean, using new is_app_admin)
-- ─────────────────────────────────────────────────────────────

-- ── app_state ────────────────────────────────────────────────
-- Public (anon) can read app_state
create policy anon_read_app_state on public.app_state
  for select to anon, authenticated
  using (true);

-- Only admins can write
create policy admin_insert_app_state on public.app_state
  for insert to authenticated
  with check (public.is_app_admin());

create policy admin_update_app_state on public.app_state
  for update to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

create policy admin_delete_app_state on public.app_state
  for delete to authenticated
  using      (public.is_app_admin());

-- ── faculties ─────────────────────────────────────────────────
create policy anon_read_faculties on public.faculties
  for select to anon, authenticated
  using (true);

create policy admin_manage_faculties on public.faculties
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- ── departments ───────────────────────────────────────────────
create policy anon_read_departments on public.departments
  for select to anon, authenticated
  using (true);

create policy admin_manage_departments on public.departments
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- ── professors ────────────────────────────────────────────────
create policy anon_read_professors on public.professors
  for select to anon, authenticated
  using (true);

create policy admin_manage_professors on public.professors
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- ── plans ─────────────────────────────────────────────────────
create policy anon_read_plans on public.plans
  for select to anon, authenticated
  using (true);

create policy admin_manage_plans on public.plans
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- ── plan_items ────────────────────────────────────────────────
create policy anon_read_plan_items on public.plan_items
  for select to anon, authenticated
  using (true);

create policy admin_manage_plan_items on public.plan_items
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- ── achievements ──────────────────────────────────────────────
create policy anon_read_achievements on public.achievements
  for select to anon, authenticated
  using (true);

create policy admin_manage_achievements on public.achievements
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- ── projects ──────────────────────────────────────────────────
create policy anon_read_projects on public.projects
  for select to anon, authenticated
  using (true);

create policy admin_manage_projects on public.projects
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- ── thesis_defenses ───────────────────────────────────────────
create policy anon_read_thesis_defenses on public.thesis_defenses
  for select to anon, authenticated
  using (true);

create policy admin_manage_thesis_defenses on public.thesis_defenses
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- ── app_users ─────────────────────────────────────────────────
-- Authenticated users can see all app_users (needed to check own role)
create policy auth_read_app_users on public.app_users
  for select to authenticated
  using (true);

-- Only admins can write to app_users
-- NOTE: is_app_admin() uses SECURITY DEFINER, so no recursion here
create policy admin_manage_app_users on public.app_users
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- ─────────────────────────────────────────────────────────────
-- STEP 6: Verification queries (run manually to confirm)
-- ─────────────────────────────────────────────────────────────

-- 6a. Check is_app_admin() is SECURITY DEFINER
select proname, prosecdef, proconfig
from   pg_proc
where  proname = 'is_app_admin'
  and  pronamespace = 'public'::regnamespace;
-- Expected: prosecdef = true, proconfig = {search_path=}

-- 6b. Check admin user exists
select id, email, role from public.app_users;
-- Expected: suhrobiddinnuraliyev04@gmail.com with role = superadmin

-- 6c. Check all policies on app_state (should have 4 policies)
select policyname, cmd, roles::text, qual::text, with_check::text
from   pg_policies
where  schemaname = 'public' and tablename = 'app_state'
order  by policyname;

-- 6d. Check all policies on app_users (should have 2 policies)
select policyname, cmd, roles::text
from   pg_policies
where  schemaname = 'public' and tablename = 'app_users'
order  by policyname;

-- 6e. Quick test: simulate what is_app_admin returns for current user
-- (Run while authenticated as suhrobiddinnuraliyev04@gmail.com)
-- select public.is_app_admin();
-- Expected: true

-- ─────────────────────────────────────────────────────────────
-- STEP 7: Debug queries for 403 troubleshooting
-- ─────────────────────────────────────────────────────────────

-- Check JWT claims in current session
-- select auth.jwt() -> 'email', auth.jwt() -> 'sub', auth.uid();

-- Check if user exists in app_users with correct role
-- select id, email, role from public.app_users where id = auth.uid();

-- Try inserting a test record (will fail if RLS blocks)
-- insert into public.faculties (name) values ('__test__');
-- delete from public.faculties where name = '__test__';
