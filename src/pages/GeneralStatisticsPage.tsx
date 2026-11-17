import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Star, FileText, Building, GraduationCap, Lightbulb, Rocket, Award } from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { BarChart } from '../components/ui/BarChart';
import { DegreeAndTitleStats } from './DegreeAndTitleStats';
import { EnhancedCriteriaStatistics } from './EnhancedCriteriaStatistics';
import type { Faculty, Department, Professor, Achievement, ScoringSystem, Plan, ThesisDefense } from '../types/kpi';

export const GeneralStatisticsPage: React.FC<{ data: any, faculties: Faculty[], departments: Department[], professors: Professor[], achievements: Achievement[], scoringSystem: ScoringSystem, selectedYear: number, plans: Plan[], thesisDefenses: ThesisDefense[] }> = ({ data, faculties, departments, professors, achievements, scoringSystem, selectedYear, plans, thesisDefenses }) => {
  const { facultyRatings, departmentRatings, professorsWithDetails, universityScientificPotential, projectTypeCounts } = data;

  const topFaculties = facultyRatings.slice(0, 5).map((f: any) => ({
    label: f.name,
    value: f.completionPercent
  }));

  const topDepartments = departmentRatings.slice(0, 5).map((d: any) => ({
    label: d.name,
    value: d.completionPercent
  }));

  const topProfessors = professorsWithDetails.slice(0, 5).map((p: any) => ({
    label: p.name,
    value: p.completionPercent
  }));

  const totalStaffUnits = professors.reduce((sum, p) => sum + p.staffUnit, 0);

  const defenseCounts = useMemo(() => {
    return thesisDefenses.reduce((acc, defense) => {
      if (defense.type === 'PhD') acc.phd++;
      if (defense.type === 'DSc') acc.dsc++;
      if (defense.type === 'dotsent') acc.dotsent++;
      if (defense.type === 'professor') acc.professor++;
      return acc;
    }, { phd: 0, dsc: 0, dotsent: 0, professor: 0 });
  }, [thesisDefenses]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Jami professor-o'qituvchilar" value={professors.length} icon={Users} />
        <StatCard title="Ilmiy salohiyat" value={`${universityScientificPotential.toFixed(1)}%`} icon={Star} />
        <StatCard title="Jami shtat birligi" value={totalStaffUnits.toFixed(2)} icon={FileText} />
        <StatCard title="Jami fakultetlar" value={faculties.length} icon={Building} />
        <StatCard title="Jami kafedralar" value={departments.length} icon={GraduationCap} />
        <StatCard title="Startaplar soni" value={projectTypeCounts?.['Startap'] || 0} icon={Lightbulb} />
        <StatCard title="Loyihalar soni" value={projectTypeCounts?.['Loyiha'] || 0} icon={Rocket} />
        <StatCard title="Grantlar soni" value={projectTypeCounts?.['Grant'] || 0} icon={Award} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="PhD himoyalari" value={defenseCounts.phd} icon={GraduationCap} />
        <StatCard title="DSc himoyalari" value={defenseCounts.dsc} icon={GraduationCap} />
        <StatCard title="Dotsentlik unvonlari" value={defenseCounts.dotsent} icon={Award} />
        <StatCard title="Professorlik unvonlari" value={defenseCounts.professor} icon={Award} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <BarChart title="Fakultetlar reytingi (reja bajarilishi %)" data={topFaculties} unit="%" />
        <BarChart title="Kafedralar reytingi (reja bajarilishi %)" data={topDepartments} unit="%" />
        <BarChart title="Professorlar reytingi (reja bajarilishi %)" data={topProfessors} unit="%" />
      </div>

      <div className="mb-6">
        <DegreeAndTitleStats professors={professors} faculties={faculties} departments={departments} />
      </div>

      <EnhancedCriteriaStatistics
        achievements={achievements}
        professors={professorsWithDetails}
        faculties={faculties}
        departments={departments}
        scoringSystem={scoringSystem}
        selectedYear={selectedYear}
        plans={plans}
      />
    </motion.div>
  );
};
