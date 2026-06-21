-- KPI dashboard relational schema
-- This version keeps the app snapshot table and adds proper relations for the main entities.

create table if not exists public.app_state (
  id text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_state_id_not_blank check (btrim(id) <> '')
);

create table if not exists public.faculties (
  id bigint generated always as identity primary key,
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.departments (
  id bigint generated always as identity primary key,
  faculty_id bigint not null references public.faculties(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_name_unique_per_faculty unique (faculty_id, name)
);

create table if not exists public.professors (
  id bigint generated always as identity primary key,
  department_id bigint not null references public.departments(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  patronymic text,
  birth_date date,
  gender text not null check (gender in ('erkak', 'ayol')),
  degree text,
  title text,
  position text,
  employment_type text,
  phone text,
  staff_unit numeric(4,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id bigint generated always as identity primary key,
  professor_id bigint not null references public.professors(id) on delete cascade,
  year integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_unique_per_professor_year unique (professor_id, year)
);

create table if not exists public.plan_items (
  plan_id bigint not null references public.plans(id) on delete cascade,
  type text not null,
  sub_type text not null,
  count numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  primary key (plan_id, type, sub_type)
);

create table if not exists public.achievements (
  id bigint generated always as identity primary key,
  professor_id bigint not null references public.professors(id) on delete cascade,
  year integer not null,
  quarter integer not null check (quarter between 1 and 4),
  type text not null,
  sub_type text not null,
  count numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint achievements_unique_per_professor_period unique (professor_id, year, quarter, type, sub_type)
);

create table if not exists public.projects (
  id bigint generated always as identity primary key,
  department_id bigint not null references public.departments(id) on delete cascade,
  faculty_id bigint not null references public.faculties(id) on delete cascade,
  name text not null,
  type text not null,
  direction text not null,
  leader_name text not null,
  leader_position text not null,
  total_funding numeric(18,2) not null default 0,
  duration integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.thesis_defenses (
  id bigint generated always as identity primary key,
  department_id bigint not null references public.departments(id) on delete cascade,
  faculty_id bigint not null references public.faculties(id) on delete cascade,
  last_name text not null,
  first_name text not null,
  patronymic text,
  specialty text,
  type text not null,
  field_of_science text,
  thesis_topic text not null,
  supervisor text,
  defense_organization text,
  council_number text,
  defense_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('admin', 'superadmin', 'guest')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_state_created_at on public.app_state (created_at desc);
create index if not exists idx_app_state_updated_at on public.app_state (updated_at desc);
create index if not exists idx_departments_faculty_id on public.departments (faculty_id);
create index if not exists idx_professors_department_id on public.professors (department_id);
create index if not exists idx_plans_professor_year on public.plans (professor_id, year);
create index if not exists idx_achievements_professor_year on public.achievements (professor_id, year);
create index if not exists idx_projects_department_id on public.projects (department_id);
create index if not exists idx_thesis_defenses_department_id on public.thesis_defenses (department_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name in ('app_state', 'faculties', 'departments', 'professors', 'plans', 'achievements', 'projects', 'thesis_defenses', 'app_users') then
    if new.created_at is null then
      new.created_at := now();
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')) = any (array['admin', 'superadmin'])
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) = any (array['admin', 'superadmin'])
    or lower(coalesce(auth.jwt() ->> 'email', '')) = any (array['admin@example.com', 'timaganiyev102@gmail.com']),
    false
  );
$$;

create or replace function public.trigger_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists app_state_set_updated_at on public.app_state;
drop trigger if exists faculties_set_updated_at on public.faculties;
drop trigger if exists departments_set_updated_at on public.departments;
drop trigger if exists professors_set_updated_at on public.professors;
drop trigger if exists plans_set_updated_at on public.plans;
drop trigger if exists achievements_set_updated_at on public.achievements;
drop trigger if exists projects_set_updated_at on public.projects;
drop trigger if exists thesis_defenses_set_updated_at on public.thesis_defenses;
drop trigger if exists app_users_set_updated_at on public.app_users;

create trigger app_state_set_updated_at
before insert or update on public.app_state
for each row
execute function public.set_updated_at();

create trigger faculties_set_updated_at
before insert or update on public.faculties
for each row
execute function public.trigger_set_updated_at();

create trigger departments_set_updated_at
before insert or update on public.departments
for each row
execute function public.trigger_set_updated_at();

create trigger professors_set_updated_at
before insert or update on public.professors
for each row
execute function public.trigger_set_updated_at();

create trigger plans_set_updated_at
before insert or update on public.plans
for each row
execute function public.trigger_set_updated_at();

create trigger achievements_set_updated_at
before insert or update on public.achievements
for each row
execute function public.trigger_set_updated_at();

create trigger projects_set_updated_at
before insert or update on public.projects
for each row
execute function public.trigger_set_updated_at();

create trigger thesis_defenses_set_updated_at
before insert or update on public.thesis_defenses
for each row
execute function public.trigger_set_updated_at();

create trigger app_users_set_updated_at
before insert or update on public.app_users
for each row
execute function public.trigger_set_updated_at();

alter table public.app_state enable row level security;
alter table public.faculties enable row level security;
alter table public.departments enable row level security;
alter table public.professors enable row level security;
alter table public.plans enable row level security;
alter table public.plan_items enable row level security;
alter table public.achievements enable row level security;
alter table public.projects enable row level security;
alter table public.thesis_defenses enable row level security;
alter table public.app_users enable row level security;

-- Read access for everyone (dashboard is public)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'app_state' and policyname = 'Allow anon read app state'
  ) then
    create policy "Allow anon read app state"
    on public.app_state
    for select
    to anon
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'faculties' and policyname = 'Allow anon read faculties'
  ) then
    create policy "Allow anon read faculties"
    on public.faculties
    for select
    to anon
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'departments' and policyname = 'Allow anon read departments'
  ) then
    create policy "Allow anon read departments"
    on public.departments
    for select
    to anon
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'professors' and policyname = 'Allow anon read professors'
  ) then
    create policy "Allow anon read professors"
    on public.professors
    for select
    to anon
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'plans' and policyname = 'Allow anon read plans'
  ) then
    create policy "Allow anon read plans"
    on public.plans
    for select
    to anon
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'plan_items' and policyname = 'Allow anon read plan items'
  ) then
    create policy "Allow anon read plan items"
    on public.plan_items
    for select
    to anon
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'achievements' and policyname = 'Allow anon read achievements'
  ) then
    create policy "Allow anon read achievements"
    on public.achievements
    for select
    to anon
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'Allow anon read projects'
  ) then
    create policy "Allow anon read projects"
    on public.projects
    for select
    to anon
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'thesis_defenses' and policyname = 'Allow anon read thesis defenses'
  ) then
    create policy "Allow anon read thesis defenses"
    on public.thesis_defenses
    for select
    to anon
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'app_users' and policyname = 'Allow authenticated read app users'
  ) then
    create policy "Allow authenticated read app users"
    on public.app_users
    for select
    to authenticated
    using (true);
  end if;
end $$;

-- Admin-only writes
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

create policy "Allow admin delete app state"
on public.app_state
for delete
to authenticated
using (public.is_app_admin());

create policy "Allow admin manage faculties"
on public.faculties
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "Allow admin manage departments"
on public.departments
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "Allow admin manage professors"
on public.professors
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "Allow admin manage plans"
on public.plans
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "Allow admin manage plan items"
on public.plan_items
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "Allow admin manage achievements"
on public.achievements
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "Allow admin manage projects"
on public.projects
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "Allow admin manage thesis defenses"
on public.thesis_defenses
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "Allow admin manage app users"
on public.app_users
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());
