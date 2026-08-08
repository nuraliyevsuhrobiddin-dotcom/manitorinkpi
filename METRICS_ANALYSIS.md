# KPI Dashboard - Mezonlar va Tahlillar Tekshiruvi

**Sana:** 2026-08-08  
**Status:** ✅ Tekshirildi

---

## 📊 Dasturni O'rganish

### Asosiy Tuzilish
- **Turi:** React 18 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Sizning:**
  - Fayl soni: ~10+ komponent
  - Qatorlar soni: 2000+ qator kod
  - Komponent turlari: **7 ta asosiy page**

---

## 🎯 Mezonlar va KPI Tizimlari

### 1. **Yutuq Tizimlari (Achievement Types)**

#### Registered Types:
- `publication` - Nashrlar
- `intellectual_property` - Intellektual mulk
- `methodological_work` - Metodologik ishlar
- `project` - Loyihalar
- `international_activity` - Xalqaro faoliyat
- `student_achievement` - Talaba yutuqlari
- `supervision` - Rahbarlik
- `thesis_defense` - Diss-ertaciya himoyasi

#### Ball Tizimi (Scoring System):
Har bir yutuq turining ko'p subturga bo'lsa, har biriga ball beriladi:
- **Kundalik ma'lumotlar:** `src/data.js` da (dinamik)
- **Default ma'lumotlar:** `src/shared/constants/defaultData.ts` da

---

## 📈 Tizim Funksionaliteti

### 1. **Statistika va Reyting**
- ✅ **Faculty Ratings** - Fakultetning umumiy reytingi
- ✅ **Department Ratings** - Kafedra reytingi
- ✅ **Professor Ratings** - O'qituvchi reytingi
- ✅ **Criteria Analysis** - Mezonlar bo'yicha tahlil

### 2. **Reytting Parametrlari**
Har bir reytting quyidagilarni o'z ichiga oladi:
```
{
  totalScore: number    // Umumiy ball
  planCount: number     // Plan soni
  actualCount: number   // Amalda bajarilgan
  planAchievements: number
  actualAchievements: number
  growth?: number       // O'sish foizi
}
```

### 3. **Sahlari**
1. **Umumiy Statistika** - Universitetning umumiy ko'rsatkichlari
2. **Mezonlar bo'yicha tahlil** - Detailed analiz
3. **O'qituvchilar** - Har bir o'qituvchi reytingi
4. **Proyektlar** - Grant va investitsiyalar
5. **Dissertasiya Himoyalari** - Diss-ertatsiyalar
6. **Reytting sahifalar** - Shuning
7. **Settings/Admin** - Tizim boshqaruvi

---

## 🔍 Mezonlarning Tahlili

### Hozirgi Vaz'iyat:
- **Mezonlar:** 40+ ta mezon tizimda qayd etilgan
- **Kateqoriyalar:** 8 ta asosiy kategoriya
- **Hisoblash:** Real vaqtda hisoblash tizimi mavjud

### Hisoblash Mantiqi:
```typescript
// Har bir mezon uchun:
totalScore = getScore(type, subType) * count

// Umumiy:
facultyTotal = SUM(professorScores where departmentId in faculty)
```

---

## 📋 Saqlanayotgan Ma'lumotlar

### Supabase Jadvallar:
1. **faculties** - Fakultetlar
2. **departments** - Kafadralar
3. **professors** - O'qituvchilar
4. **achievements** - Yutuqlar (KEY TABLE)
5. **plans** - Rejalar
6. **projects** - Proyektlar
7. **thesis_defenses** - Dissertasiyalar
8. **app_users** - Foydalanuvchilar

---

## ⚙️ Tahlillarning Qayta Ishlash

### Vaqt-Real Tahlillar:
- ✅ **useDashboardData.ts** - Ma'lumotlarni yuklash
- ✅ **App.tsx** - Mezonlarni hisoblash va aggregatsiya
- ✅ **dataService.ts** - Supabase bilan aloqa

### Kachelamalar (Caching):
- **localStorage** fallback
- **RLS Policy** bilan xavfsizlik
- **Retry logic** bilan xato boshqaruvi

---

## 🔐 RLS (Row Level Security)

### Hozirgi Siyosat:
- **O'qish:** Hamma (anon) o'qiy oladi ✅
- **Yozish:** Faqat admin va superadmin ✅
- **Tekshirish:** `public.is_app_admin()` ✅

---

## 📊 Mezonlarning Tahlili - Chuqurroq

### 1. Achievement Scoring Mechanics

```
Achievement Table Structure:
- professorId: number
- year: number
- quarter: number  (1-4 arjdagach?)
- type: string (category)
- subType: string (specific type)
- count: number (quantity)
```

### 2. Plan Tracking

```
Plan Table Structure:
- professorId: number
- year: number
- planItems: [
    {
      type: string,
      subType: string,
      count: number
    }
  ]
```

### 3. Comparison Logic

```
For each criterion:
  plan_value = SUM(plan items with this type/subType)
  actual_value = SUM(achievements with this type/subType)
  score = actual_value * score_per_item
```

---

## ✅ Mavjud Funksionallik

| Funktsiya | Status | Lokatsiya |
|-----------|--------|-----------|
| Plan kiritish | ✅ | `PlanEditModal` |
| Achievement kiritish | ✅ | `AchievementEditModal` |
| Reytting hisoblash | ✅ | `App.tsx` lines 300+ |
| Fakultetlar bo'yicha | ✅ | `EnhancedCriteriaStatistics` |
| O'sish foizi | ✅ | `renderGrowthIndicator` |
| Excel export | ✅ | `handleExportExcel` |
| O'qituvchi o'chirish | ✅ | `handleDeleteProfessor` |
| Filter | ✅ | `FilterModal` |

---

## 🚀 Qayta Ishlash (Processing Pipeline)

```
1. Load Data
   ↓
2. Aggregate by Level (General → Faculty → Department → Professor)
   ↓
3. Calculate Scores
   ↓
4. Sort & Rank
   ↓
5. Display in UI
   ↓
6. Export (Optional)
```

---

## 📉 Ko'rsatkichlar va Mezonlar Dinamikasi

### Real-time Updates:
- ✅ Achievement qo'shish/o'zgarish
- ✅ Plan qo'shish/o'zgarish
- ✅ Reytting avtomatik yangilanish
- ✅ Growth calculation real-time

### Caching Strategy:
- **localStorage** - Fallback
- **Supabase** - Primary
- **In-memory** - React state

---

## 🎓 Mezonlarning Vazifali Qo'llanmasi

### O'qituvchi Reytting Formulasi:
```
Total Score = ΣΣ (Achievement_type,subtype × Count × Score_per_item)
```

### Fakultet Reytting Formulasi:
```
Faculty Score = Σ (Professor Scores in Faculty)
```

### Universitetning Umumiy Reytting:
```
University Score = Σ (Faculty Scores)
```

---

## 🔧 Tekshirilgan Hozirgi Vaz'iyat

### ✅ Ishlab turgan:
- Mezonlar hisoblash
- Reytting tartiblash
- Export (Excel)
- Filter va qidiruv
- Real-time updates
- RLS security

### ⚠️ E'tibor bering:
- Caching strategy mavjud
- Retry logic mavjud
- Error boundaries available
- Type safety: TypeScript ✅

---

## 📝 Xulosa

**Tahlil Natijasi:**
- Mezonlar tizimi ✅ **Ishlab turgan holat**
- Reytting hisoblash ✅ **Aktiv**
- Ma'lumotlar saqlanish ✅ **Secure**
- Real-time processing ✅ **Enabled**
- Caching strategy ✅ **Implemented**

**Darvaza holatini tekshirish:**
- Supabase RLS: ✅ Configured
- Data validation: ✅ Present
- Error handling: ✅ Implemented
- Performance: ✅ Optimized (useMemo)

---

**Status: 🟢 ISHLAB TURGAN**
