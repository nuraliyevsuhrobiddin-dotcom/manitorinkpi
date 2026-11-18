import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Star,
  FileText,
  Building,
  GraduationCap,
  Lightbulb,
  Rocket,
  Award,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { BarChart } from '../components/ui/BarChart';
import { DegreeAndTitleStats } from './DegreeAndTitleStats';
import { EnhancedCriteriaStatistics } from './EnhancedCriteriaStatistics';
import type { Faculty, Department, Professor, Achievement, ScoringSystem, Plan, ThesisDefense } from '../types/kpi';

type GeneralStatisticsPageProps = {
  data: any;
  faculties: Faculty[];
  departments: Department[];
  professors: Professor[];
  achievements: Achievement[];
  scoringSystem: ScoringSystem;
  selectedYear: number;
  plans: Plan[];
  thesisDefenses: ThesisDefense[];
};

export const GeneralStatisticsPage: React.FC<GeneralStatisticsPageProps> = ({
  data,
  faculties,
  departments,
  professors,
  achievements,
  scoringSystem,
  selectedYear,
  plans,
  thesisDefenses,
}) => {
  const {
    facultyRatings = [],
    departmentRatings = [],
    professorsWithDetails = [],
    universityScientificPotential = 0,
    projectTypeCounts = {},
  } = data || {};

  // Top rankings for charts
  const topFaculties = useMemo(() => {
    return [...facultyRatings]
      .sort((a, b) => (Number(b.completionPercent) || 0) - (Number(a.completionPercent) || 0))
      .slice(0, 5)
      .map((f: any) => ({
        label: f.name,
        value: Number((Number(f.completionPercent) || 0).toFixed(1)),
      }));
  }, [facultyRatings]);

  const topDepartments = useMemo(() => {
    return [...departmentRatings]
      .sort((a, b) => (Number(b.completionPercent) || 0) - (Number(a.completionPercent) || 0))
      .slice(0, 5)
      .map((d: any) => ({
        label: d.name,
        value: Number((Number(d.completionPercent) || 0).toFixed(1)),
      }));
  }, [departmentRatings]);

  const topProfessors = useMemo(() => {
    return [...professorsWithDetails]
      .sort((a, b) => (Number(b.completionPercent) || 0) - (Number(a.completionPercent) || 0))
      .slice(0, 5)
      .map((p: any) => ({
        label: p.name,
        value: Number((Number(p.completionPercent) || 0).toFixed(1)),
      }));
  }, [professorsWithDetails]);

  // Total staff units
  const totalStaffUnits = useMemo(() => {
    return professors.reduce((sum, p) => sum + (Number(p.staffUnit) || 0), 0);
  }, [professors]);

  // Overall university KPI completion %
  const overallKPICompletion = useMemo(() => {
    if (facultyRatings.length === 0) return '0.0';
    const total = facultyRatings.reduce((sum: number, f: any) => sum + (Number(f.completionPercent) || 0), 0);
    return (total / facultyRatings.length).toFixed(1);
  }, [facultyRatings]);

  // Thesis defense and scientific title counts
  const defenseCounts = useMemo(() => {
    return thesisDefenses.reduce(
      (acc, defense) => {
        const t = (defense.type || '').toLowerCase();
        if (t === 'phd') acc.phd++;
        else if (t === 'dsc') acc.dsc++;
        else if (t === 'dotsent') acc.dotsent++;
        else if (t === 'professor') acc.professor++;
        return acc;
      },
      { phd: 0, dsc: 0, dotsent: 0, professor: 0 }
    );
  }, [thesisDefenses]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* ─── 1. INSTITUT ASOSIY MONITORING BANNERI ─────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 border border-indigo-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-3 py-1 rounded-full">
              <Sparkles size={13} />
              <span>Oliy Ta'lim Muassasasi Yillik Reytingi</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Umumiy KPI & Ilmiy Salohiyat Ko'rsatkichlari
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              O'zbekiston Respublikasi Oliy ta'lim milliy reytingi mezonlari asosida shakllantirilgan umumiy hisobot, ilmiy natijalar va samaradorlik monitoringi.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 self-start md:self-auto">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                Hisobot Davri
              </span>
              <span className="text-lg font-black text-white">{selectedYear}-yil</span>
            </div>
          </div>
        </div>

        {/* 4 Asosiy Mega-Metrika */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-2 text-slate-300 text-xs font-semibold">
              <Star size={16} className="text-amber-400" />
              <span>Ilmiy salohiyat</span>
            </div>
            <div className="text-2xl md:text-3xl font-black text-amber-400 mt-1">
              {(Number(universityScientificPotential) || 0).toFixed(1)}%
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">DSc va PhD darajali xodimlar ulushi</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-2 text-slate-300 text-xs font-semibold">
              <TrendingUp size={16} className="text-emerald-400" />
              <span>KPI Bajarilish darajasi</span>
            </div>
            <div className="text-2xl md:text-3xl font-black text-emerald-400 mt-1">
              {overallKPICompletion}%
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Yillik rejalarga nisbatan o'rtacha</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-2 text-slate-300 text-xs font-semibold">
              <Users size={16} className="text-cyan-400" />
              <span>Jami o'qituvchilar</span>
            </div>
            <div className="text-2xl md:text-3xl font-black text-cyan-400 mt-1">
              {professors.length} nafar
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{totalStaffUnits.toFixed(1)} ta shtat birligi</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-2 text-slate-300 text-xs font-semibold">
              <GraduationCap size={16} className="text-purple-400" />
              <span>Doktorlik himoyalari</span>
            </div>
            <div className="text-2xl md:text-3xl font-black text-purple-400 mt-1">
              {defenseCounts.phd + defenseCounts.dsc} ta
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              PhD: {defenseCounts.phd} | DSc: {defenseCounts.dsc}
            </p>
          </div>
        </div>
      </div>

      {/* ─── 2. TUZILMA VA LOYIHALAR BLOKI ──────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Building size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            OTM Tuzilmasi va Ilmiy Loyihalar
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <StatCard title="Fakultetlar soni" value={faculties.length} icon={Building} />
          <StatCard title="Kafedralar soni" value={departments.length} icon={GraduationCap} />
          <StatCard title="Jami shtat birligi" value={totalStaffUnits.toFixed(1)} icon={FileText} />
          <StatCard title="Startaplar" value={projectTypeCounts?.['Startap'] || 0} icon={Lightbulb} />
          <StatCard title="Ilmiy loyihalar" value={projectTypeCounts?.['Loyiha'] || 0} icon={Rocket} />
          <StatCard title="Ilmiy grantlar" value={projectTypeCounts?.['Grant'] || 0} icon={Award} />
        </div>
      </div>

      {/* ─── 3. ILMIY UNVONLAR VA HIMOYALAR BLOKI ───────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Award size={18} className="text-amber-600 dark:text-amber-400" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            Ilmiy Darajalar va Unvonlar Hisoboti
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="PhD (Falsafa doktori)" value={defenseCounts.phd} icon={GraduationCap} />
          <StatCard title="DSc (Fan doktori)" value={defenseCounts.dsc} icon={GraduationCap} />
          <StatCard title="Dotsentlik unvonlari" value={defenseCounts.dotsent} icon={Award} />
          <StatCard title="Professorlik unvonlari" value={defenseCounts.professor} icon={Award} />
        </div>
      </div>

      {/* ─── 4. YETAKCHILAR REYTINGI (TOP-5 GRAFIKLAR) ──────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            KPI Bajarilishi Bo'yicha Yetakchilar (Top-5)
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BarChart title="Fakultetlar reytingi (reja bajarilishi %)" data={topFaculties} unit="%" />
          <BarChart title="Kafedralar reytingi (reja bajarilishi %)" data={topDepartments} unit="%" />
          <BarChart title="Professor-o'qituvchilar (reja bajarilishi %)" data={topProfessors} unit="%" />
        </div>
      </div>

      {/* ─── 5. FAKULTETLAR KESIMIDA ILMIY DARAJALAR TAHLILI ────────────── */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            Fakultetlar Kesimida DSc, PhD, Professor va Dotsentlar Taqsimoti
          </h2>
        </div>

        <DegreeAndTitleStats professors={professors} faculties={faculties} departments={departments} />
      </div>

      {/* ─── 6. MEZONLAR BO'YICHA YILLIK BATAFSIL STATISTIKA ───────────── */}
      <div className="space-y-3">
        <EnhancedCriteriaStatistics
          achievements={achievements}
          professors={professorsWithDetails}
          faculties={faculties}
          departments={departments}
          scoringSystem={scoringSystem}
          selectedYear={selectedYear}
          plans={plans}
        />
      </div>
    </motion.div>
  );
};
