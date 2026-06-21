-- ============================================================
-- RLS Fix: is_app_admin() funksiyasini yangilash
-- Bu scriptni Supabase SQL Editor da bir marta bajaring.
-- ============================================================

-- 1. is_app_admin() — 4 usulda admin tekshiradi
create or replace function public.is_app_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')) = any (array['admin', 'superadmin'])
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) = any (array['admin', 'superadmin'])
    or lower(coalesce(auth.jwt() ->> 'email', '')) = any (array['timaganiyev102@gmail.com'])
    or exists (
      select 1 from public.app_users
      where id   = (auth.jwt() ->> 'sub')::uuid
        and role in ('admin', 'superadmin')
    ),
    false
  );
$$;

-- 2. Foydalanuvchiga superadmin roli berish
insert into public.app_users (id, email, role)
select u.id, u.email, 'superadmin'
from auth.users u
where lower(u.email) = 'timaganiyev102@gmail.com'
on conflict (id) do update
  set role       = 'superadmin',
      updated_at = now();

-- 3. Tekshirish
select id, email, role from public.app_users;
