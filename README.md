# KPI Monitoring Dashboard

Professor-o'qituvchilar KPI ko'rsatkichlarini monitoring qilish tizimi.

## Texnologiyalar

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend / DB**: Supabase (PostgreSQL + Auth + RLS)
- **Deploy**: Nginx / static hosting

## Ishga tushirish

```bash
# 1. Paketlarni o'rnatish
npm install

# 2. .env faylini yaratish
cp .env.example .env
# .env faylidagi VITE_* o'zgaruvchilarni to'ldiring

# 3. Dev server
npm run dev

# 4. Production build
npm run build
```

## Supabase sozlash

1. **Schema**: `supabase_schema.sql` faylini Supabase SQL Editor da bir marta bajaring
2. **Admin**: `supabase_fix_rls.sql` faylini bajaring — admin foydalanuvchini `app_users` jadvaliga qo'shadi

## Muhit o'zgaruvchilari (`.env`)

| O'zgaruvchi | Tavsif |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_SUPABASE_STATE_TABLE` | State jadvali nomi (default: `app_state`) |
| `VITE_SUPABASE_STATE_ID` | State yozuv ID si (default: `kpi_constants`) |
| `VITE_ADMIN_EMAILS` | Vergul bilan ajratilgan admin emaillar |

## RLS (Row Level Security)

- **O'qish**: Hamma (anon) o'qiy oladi
- **Yozish**: Faqat `app_users` jadvalida `admin` yoki `superadmin` roli bor foydalanuvchilar
- Admin tekshiruvi `public.is_app_admin()` funksiyasi orqali amalga oshiriladi
