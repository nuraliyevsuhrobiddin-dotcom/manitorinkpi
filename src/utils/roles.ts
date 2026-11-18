export type UserRole =
  | 'superadmin'
  | 'dekan'
  | 'kafedra_mudiri'
  | 'ilmiy_bolim'
  | 'buxgalter'
  | 'kadrlar'
  | 'oqituvchi'
  | 'admin'
  | 'guest';

export interface RoleMeta {
  id: UserRole;
  label: string;
  badge: string;
  icon: string;
  description: string;
  defaultView: string;
}

export const ROLE_DEFINITIONS: Record<string, RoleMeta> = {
  superadmin: {
    id: 'superadmin',
    label: "Super Admin (Rektorat)",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300",
    icon: "👑",
    description: "Tizimni to'liq boshqarish, barcha fakultetlar va sozlamalar",
    defaultView: 'dashboard',
  },
  dekan: {
    id: 'dekan',
    label: "Fakultet Dekani",
    badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300",
    icon: "🏛️",
    description: "O'z fakulteti kafedralari va o'qituvchilari monitoringi",
    defaultView: 'dashboard',
  },
  kafedra_mudiri: {
    id: 'kafedra_mudiri',
    label: "Kafedra Mudiri",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300",
    icon: "🏢",
    description: "Kafedra o'qituvchilarining rejalari va yutuqlarini boshqarish",
    defaultView: 'professors',
  },
  ilmiy_bolim: {
    id: 'ilmiy_bolim',
    label: "Ilmiy Bo'lim / Ilmiy Kotib",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300",
    icon: "🔬",
    description: "Ilmiy nashrlar, Scopus, dissertatsiyalar va patentlarni tasdiqlash",
    defaultView: 'management',
  },
  buxgalter: {
    id: 'buxgalter',
    label: "Moliya / Buxgalteriya",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300",
    icon: "💼",
    description: "KPI oylik ustamalari hisob-kitobi va buyruq blankalari",
    defaultView: 'efficiency',
  },
  kadrlar: {
    id: 'kadrlar',
    label: "Kadrlar Bo'limi (HR)",
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-300",
    icon: "👥",
    description: "Professor-o'qituvchilar bazasi va HEMIS ommaviy yuklash",
    defaultView: 'professors',
  },
  oqituvchi: {
    id: 'oqituvchi',
    label: "Professor-O'qituvchi",
    badge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-300",
    icon: "🎓",
    description: "Shaxsiy KPI rejasi, yutuqlarni kiritish va portfolio",
    defaultView: 'professors',
  },
  admin: {
    id: 'admin',
    label: "Bo'lim Admini",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300",
    icon: "🔑",
    description: "Bo'lim yoki kafedra boshqaruvi",
    defaultView: 'dashboard',
  },
  guest: {
    id: 'guest',
    label: "Mehmon",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300",
    icon: "👁️",
    description: "Faqat umumiy reytinglar va statistikani ko'rish",
    defaultView: 'dashboard',
  },
};

export const getRoleMeta = (roleString?: string): RoleMeta => {
  const normalized = (roleString || 'guest').toLowerCase().trim();
  return ROLE_DEFINITIONS[normalized] || ROLE_DEFINITIONS.guest;
};

/**
 * Returns allowed navigation view IDs based on the user's role.
 */
export const getAllowedViewsForRole = (roleString?: string): string[] => {
  const role = (roleString || 'guest').toLowerCase().trim();

  switch (role) {
    case 'superadmin':
      return ['dashboard', 'faculties', 'departments', 'professors', 'kpi', 'potential', 'projects', 'performance', 'efficiency', 'management'];

    case 'dekan':
      return ['dashboard', 'departments', 'professors', 'kpi', 'potential', 'performance', 'efficiency'];

    case 'kafedra_mudiri':
    case 'admin':
      return ['professors', 'dashboard', 'kpi', 'performance', 'efficiency'];

    case 'ilmiy_bolim':
      return ['management', 'dashboard', 'kpi', 'potential', 'projects'];

    case 'buxgalter':
      return ['efficiency', 'dashboard', 'kpi'];

    case 'kadrlar':
      return ['professors', 'dashboard', 'management', 'potential'];

    case 'oqituvchi':
      return ['professors', 'dashboard', 'kpi', 'potential'];

    case 'guest':
    default:
      return ['dashboard', 'faculties', 'departments', 'projects', 'potential'];
  }
};
