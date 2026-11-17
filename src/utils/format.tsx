import React from 'react';
import { BookOpen, Lightbulb, FileText, Briefcase, Languages, Trophy, UserCheck, BookCopy, TrendingUp, TrendingDown } from 'lucide-react';
import type { User, Professor } from '../types/kpi';

export const stripUserSecrets = (items: User[] = []) => items.map(({ password, ...user }) => user);

// Ikonkalarni yutuq turlariga moslash
export const achievementIcons: { [key: string]: React.ElementType } = {
  publication: BookOpen,
  intellectual_property: Lightbulb,
  methodological_work: FileText,
  project: Briefcase,
  international_activity: Languages,
  student_achievement: Trophy,
  supervision: UserCheck,
  thesis_defense: BookCopy,
};

// Yordamchi funksiyalar
export const getProfessorName = (prof: Professor | { lastName: string, firstName: string, patronymic: string }) => `${prof.lastName} ${prof.firstName} ${prof.patronymic}`;

export const getAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

export const renderGrowthIndicator = (growth: number | null) => {
    if (growth === null || !isFinite(growth)) return <span className="text-gray-500">-</span>;
    if (growth === 0) return <span className="text-gray-500">0%</span>;
    const isPositive = growth > 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const icon = isPositive ? <TrendingUp size={16} className="inline mr-1" /> : <TrendingDown size={16} className="inline mr-1" />;
    return <span className={`${color} font-semibold`}>{icon}{growth.toFixed(1)}%</span>;
};

export const formatFundingCompact = (valueInMillions: number) => {
    if (valueInMillions >= 1000) {
        return `${(valueInMillions / 1000).toFixed(2)} mlrd`;
    }
    return `${valueInMillions.toLocaleString('uz-UZ')} mln`;
};

export const formatFundingTooltip = (valueInMillions: number) => {
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', minimumFractionDigits: 0 }).format(valueInMillions * 1000000);
};
