-- ============================================================
-- KPI Dashboard — Production Migration (idempotent)
-- Run this in Supabase SQL Editor any time — safe to re-run.
-- ============================================================

-- ─── 1. SECURITY DEFINER is_app_admin() ──────────────────────
--
-- WHY SECURITY DEFINER?
--   Without it, when RLS evaluates a policy on app_users it
--   calls is_app_admin(), which tries to SELECT from app_users,
--   which triggers app_users RLS again → infinite recursion or
--   permission denied → 403 on every write.
--
--   SECURITY DEFINER runs the function as its owner (postgres),
--   bypassing RLS on app_users, breaking the recursion.
--   SET search_path = '' prevents search_path injection attacks.
-- ─────────────────────────────────────────────────────────────

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    -- 1. user_metadata.role (set via Supabase Dashboard → Auth → Users)
    lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')) = any (array['admin', 'superadmin'])
    -- 2. app_metadata.role  (set via service-role API or SQL)
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) = any (array['admin', 'superadmin'])
    -- 3. email whitelist from JWT (reliable, always present after login)
    or lower(coalesce(auth.jwt() ->> 'email', '')) = any (array['suhrobiddinnuraliyev04@gmail.com'])
    -- 4. app_users table lookup (source of truth; SECURITY DEFINER bypasses RLS here)
    or exists (
      select 1
      from   public.app_users
      where  id   = auth.uid()        -- auth.uid() == (auth.jwt() ->> 'sub')::uuid
        and  role in ('admin', 'superadmin')
    ),
    false
  );
$$;

-- ─── 2. Ensure admin user exists in app_users ────────────────

insert into public.app_users (id, email, role)
select u.id, u.email, 'superadmin'
from   auth.users u
where  lower(u.email) = 'suhrobiddinnuraliyev04@gmail.com'
on conflict (id) do update
  set role       = 'superadmin',
      updated_at = now();

-- ─── 3. Drop all write policies and recreate clean ───────────
--
-- We drop-and-recreate instead of IF NOT EXISTS because we may
-- need to change the policy body (e.g. old ones lacked SECURITY
-- DEFINER) — IF NOT EXISTS would silently skip the update.
-- ─────────────────────────────────────────────────────────────

-- app_state
drop policy if exists "Allow admin insert app state"    on public.app_state;
drop policy if exists "Allow admin update app state"    on public.app_state;
drop policy if exists "Allow admin delete app state"    on public.app_state;
drop policy if exists admin_insert_app_state            on public.app_state;
drop policy if exists admin_update_app_state            on public.app_state;
drop policy if exists admin_delete_app_state            on public.app_state;

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

-- faculties
drop policy if exists "Allow admin manage faculties"    on public.faculties;
drop policy if exists admin_manage_faculties            on public.faculties;

create policy admin_manage_faculties on public.faculties
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- departments
drop policy if exists "Allow admin manage departments"  on public.departments;
drop policy if exists admin_manage_departments          on public.departments;

create policy admin_manage_departments on public.departments
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- professors
drop policy if exists "Allow admin manage professors"   on public.professors;
drop policy if exists admin_manage_professors           on public.professors;

create policy admin_manage_professors on public.professors
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- plans
drop policy if exists "Allow admin manage plans"        on public.plans;
drop policy if exists admin_manage_plans                on public.plans;

create policy admin_manage_plans on public.plans
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- plan_items
drop policy if exists "Allow admin manage plan items"   on public.plan_items;
drop policy if exists admin_manage_plan_items           on public.plan_items;

create policy admin_manage_plan_items on public.plan_items
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- achievements
drop policy if exists "Allow admin manage achievements" on public.achievements;
drop policy if exists admin_manage_achievements         on public.achievements;

create policy admin_manage_achievements on public.achievements
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- projects
drop policy if exists "Allow admin manage projects"     on public.projects;
drop policy if exists admin_manage_projects             on public.projects;

create policy admin_manage_projects on public.projects
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- thesis_defenses
drop policy if exists "Allow admin manage thesis defenses" on public.thesis_defenses;
drop policy if exists admin_manage_thesis_defenses         on public.thesis_defenses;

create policy admin_manage_thesis_defenses on public.thesis_defenses
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- app_users
drop policy if exists "Allow admin manage app users"    on public.app_users;
drop policy if exists admin_manage_app_users            on public.app_users;

create policy admin_manage_app_users on public.app_users
  for all to authenticated
  using      (public.is_app_admin())
  with check (public.is_app_admin());

-- ─── 4. Ensure public READ policies exist ────────────────────

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='app_state' and policyname='anon_read_app_state') then
    create policy anon_read_app_state on public.app_state for select to anon using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='faculties' and policyname='anon_read_faculties') then
    create policy anon_read_faculties on public.faculties for select to anon using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='departments' and policyname='anon_read_departments') then
    create policy anon_read_departments on public.departments for select to anon using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='professors' and policyname='anon_read_professors') then
    create policy anon_read_professors on public.professors for select to anon using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='plans' and policyname='anon_read_plans') then
    create policy anon_read_plans on public.plans for select to anon using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='plan_items' and policyname='anon_read_plan_items') then
    create policy anon_read_plan_items on public.plan_items for select to anon using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='achievements' and policyname='anon_read_achievements') then
    create policy anon_read_achievements on public.achievements for select to anon using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='projects' and policyname='anon_read_projects') then
    create policy anon_read_projects on public.projects for select to anon using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='thesis_defenses' and policyname='anon_read_thesis_defenses') then
    create policy anon_read_thesis_defenses on public.thesis_defenses for select to anon using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='app_users' and policyname='auth_read_app_users') then
    create policy auth_read_app_users on public.app_users for select to authenticated using (true);
  end if;
end $$;

-- ─── 5. Verification queries ─────────────────────────────────

-- Check admin users
select id, email, role from public.app_users;

-- Check is_app_admin() is SECURITY DEFINER
select proname, prosecdef, proconfig
from   pg_proc
where  proname = 'is_app_admin'
  and  pronamespace = 'public'::regnamespace;

-- Check all policies on app_state
select policyname, cmd, roles, qual::text, with_check::text
from   pg_policies
where  schemaname = 'public' and tablename = 'app_state'
order  by policyname;
