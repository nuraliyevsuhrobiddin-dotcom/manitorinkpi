import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { Card } from '../components/ui/Card';
import { Award, Calculator, Download, DollarSign, TrendingUp, Users } from 'lucide-react';

export const EfficiencyPage: React.FC<{
  facultyRatings: any[];
  departmentRatings: any[];
  professorsWithDetails: any[];
  searchQuery: string;
}> = ({ facultyRatings, departmentRatings, professorsWithDetails, searchQuery }) => {
  const [activeTab, setActiveTab] = useState('bonus-calc');

  // Bonus calculator settings (adjustable)
  const [baseSalary, setBaseSalary] = useState<number>(4500000);
  const [tier1Threshold, setTier1Threshold] = useState<number>(110);
  const [tier1Percent, setTier1Percent] = useState<number>(50);
  const [tier2Threshold, setTier2Threshold] = useState<number>(90);
  const [tier2Percent, setTier2Percent] = useState<number>(30);
  const [tier3Threshold, setTier3Threshold] = useState<number>(70);
  const [tier3Percent, setTier3Percent] = useState<number>(15);

  const tabs = [
    { id: 'bonus-calc', label: '💼 Oylik Ustama Kalkulyatori', icon: Calculator },
    { id: 'professors', label: 'Professor-o\'qituvchilar', icon: Users },
    { id: 'departments', label: 'Kafedralar', icon: TrendingUp },
    { id: 'faculties', label: 'Fakultetlar', icon: Award },
  ];

  const failedMinThreshold = 0;
  const lowThreshold = 30;
  const midThreshold = 50;

  // Calculate bonuses for each professor
  const bonusCalculations = useMemo(() => {
    return professorsWithDetails.map(prof => {
      const completion = prof.completionPercent || 0;
      let bonusPercent = 0;
      let tierName = 'Belgilanmadi';
      let tierBadge = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';

      if (completion >= tier1Threshold) {
        bonusPercent = tier1Percent;
        tierName = `A'lo (+${tier1Percent}%)`;
        tierBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold';
      } else if (completion >= tier2Threshold) {
        bonusPercent = tier2Percent;
        tierName = `Yaxshi (+${tier2Percent}%)`;
        tierBadge = 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-semibold';
      } else if (completion >= tier3Threshold) {
        bonusPercent = tier3Percent;
        tierName = `Qoniqarli (+${tier3Percent}%)`;
        tierBadge = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
      } else {
        tierName = 'Ustama yo‘q (0%)';
        tierBadge = 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400';
      }

      const staffUnit = typeof prof.staffUnit === 'number' && prof.staffUnit > 0 ? prof.staffUnit : 1.0;
      const calculatedBonus = (baseSalary * (bonusPercent / 100)) * staffUnit;

      return {
        id: prof.id,
        name: prof.name,
        departmentName: prof.department?.name || '—',
        facultyName: prof.faculty?.name || '—',
        completionPercent: completion,
        staffUnit,
        bonusPercent,
        tierName,
        tierBadge,
        calculatedBonus,
      };
    });
  }, [professorsWithDetails, baseSalary, tier1Threshold, tier1Percent, tier2Threshold, tier2Percent, tier3Threshold, tier3Percent]);

  const filteredBonuses = useMemo(() => {
    if (!searchQuery) return bonusCalculations;
    const lower = searchQuery.toLowerCase();
    return bonusCalculations.filter(
      b => b.name.toLowerCase().includes(lower) || b.departmentName.toLowerCase().includes(lower)
    );
  }, [bonusCalculations, searchQuery]);

  const totalBonusFund = useMemo(() => {
    return bonusCalculations.reduce((acc, curr) => acc + curr.calculatedBonus, 0);
  }, [bonusCalculations]);

  const rewardedProfCount = useMemo(() => {
    return bonusCalculations.filter(b => b.bonusPercent > 0).length;
  }, [bonusCalculations]);

  const handleExportBonusOrder = () => {
    const dataToExport = filteredBonuses.map((item, idx) => ({
      '№': idx + 1,
      'F.I.Sh.': item.name,
      'Kafedra': item.departmentName,
      'Shtat birligi': item.staffUnit,
      'KPI Bajarilishi (%)': item.completionPercent.toFixed(1),
      'Toifa': item.tierName,
      'Ustama foizi (%)': item.bonusPercent,
      'Oylik ustama summasi (so‘m)': Math.round(item.calculatedBonus),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ustama_Buyrug'i");
    XLSX.writeFile(wb, `KPI_Ustama_Qarori_${new Date().getFullYear()}.xlsx`);
  };

  const renderLists = (items: any[]) => {
    const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const lowPerformers = filteredItems.filter(item => item.annualPlan > 0 && item.completionPercent >= lowThreshold && item.completionPercent < midThreshold);
    const failedPerformers = filteredItems.filter(item => item.annualPlan > 0 && item.completionPercent >= failedMinThreshold && item.completionPercent < lowThreshold);

    const ListComponent: React.FC<{ title: string, items: any[], color: 'yellow' | 'red' }> = ({ title, items, color }) => (
      <Card className={`border-l-4 ${color === 'yellow' ? 'border-yellow-500' : 'border-red-500'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${color === 'yellow' ? 'text-yellow-700' : 'text-red-700'}`}>{title}</h3>
        {items.length > 0 ? (
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {items.map(item => (
              <li key={item.id} className={`p-3 rounded-md flex justify-between items-center ${color === 'yellow' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                <span className="font-medium">{item.name}</span>
                <span className={`font-bold text-lg ${color === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}>{item.completionPercent.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Ushbu toifada subyektlar mavjud emas.</p>
        )}
      </Card>
    );

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ListComponent title={`Samaradorligi past (bajarilish ${lowThreshold}% - ${midThreshold}%)`} items={lowPerformers} color="yellow" />
        <ListComponent title={`Rejani bajarmagan (bajarilish ${failedMinThreshold}% - ${lowThreshold}%)`} items={failedPerformers} color="red" />
      </div>
    );
  };

  const dataForTab = useMemo(() => {
    if (activeTab === 'professors') return professorsWithDetails;
    if (activeTab === 'departments') return departmentRatings;
    return facultyRatings;
  }, [activeTab, professorsWithDetails, departmentRatings, facultyRatings]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Samaradorlik va Ustama Tizimi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Professor-o'qituvchilarning KPI ko'rsatkichlari asosida oylik ustamalarni hisoblash va monitoring
          </p>
        </div>
      </div>

      <div className="mb-6 border-b border-slate-200 dark:border-slate-800">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-all`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'bonus-calc' ? (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Jami Ustama Jamg'armasi</p>
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {Math.round(totalBonusFund).toLocaleString('uz-UZ')} so'm
                  </p>
                  <span className="text-[11px] text-slate-400">Har oylik jami institut hisobi</span>
                </div>
                <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-md">
                  <DollarSign size={24} />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Ustama Oluvchilar</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {rewardedProfCount} / {professorsWithDetails.length} nafar
                  </p>
                  <span className="text-[11px] text-slate-400">
                    O'qituvchilarning {professorsWithDetails.length > 0 ? Math.round((rewardedProfCount / professorsWithDetails.length) * 100) : 0}% qismi
                  </span>
                </div>
                <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-md">
                  <Award size={24} />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">O'rtacha Ustama</p>
                  <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                    {rewardedProfCount > 0 ? Math.round(totalBonusFund / rewardedProfCount).toLocaleString('uz-UZ') : 0} so'm
                  </p>
                  <span className="text-[11px] text-slate-400">Bir nafar rag'batlantirilgan o'qituvchiga</span>
                </div>
                <div className="p-3 bg-purple-500 text-white rounded-2xl shadow-md">
                  <Calculator size={24} />
                </div>
              </div>
            </Card>
          </div>

          {/* Interactive Calculator Setting Controls */}
          <Card>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Calculator size={18} className="text-indigo-600" />
              Ustama Mezonlari Sozlamalari (Rektorat va Moliya nizomi)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Bazaviy oylik maosh (so'm)
                </label>
                <input
                  type="number"
                  step={100000}
                  value={baseSalary}
                  onChange={e => setBaseSalary(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-600 mb-1">
                  1-toifa (A'lo) KPI foizi va ustamasi
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={tier1Threshold}
                    onChange={e => setTier1Threshold(Number(e.target.value))}
                    className="w-1/2 p-2 border rounded-lg text-xs"
                    title="Minimal bajarilish foizi"
                  />
                  <input
                    type="number"
                    value={tier1Percent}
                    onChange={e => setTier1Percent(Number(e.target.value))}
                    className="w-1/2 p-2 border rounded-lg text-xs font-bold text-emerald-600"
                    title="Ustama foizi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-600 mb-1">
                  2-toifa (Yaxshi) KPI foizi va ustamasi
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={tier2Threshold}
                    onChange={e => setTier2Threshold(Number(e.target.value))}
                    className="w-1/2 p-2 border rounded-lg text-xs"
                  />
                  <input
                    type="number"
                    value={tier2Percent}
                    onChange={e => setTier2Percent(Number(e.target.value))}
                    className="w-1/2 p-2 border rounded-lg text-xs font-bold text-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-600 mb-1">
                  3-toifa (Qoniqarli) KPI foizi va ustamasi
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={tier3Threshold}
                    onChange={e => setTier3Threshold(Number(e.target.value))}
                    className="w-1/2 p-2 border rounded-lg text-xs"
                  />
                  <input
                    type="number"
                    value={tier3Percent}
                    onChange={e => setTier3Percent(Number(e.target.value))}
                    className="w-1/2 p-2 border rounded-lg text-xs font-bold text-amber-600"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                O'qituvchilarning hisoblangan oylik ustamalari ro'yxati
              </h3>
              <button
                type="button"
                onClick={handleExportBonusOrder}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
              >
                <Download size={14} /> Buyruq blankasini yuklab olish (Excel)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
                <thead className="text-[11px] uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">№</th>
                    <th className="px-4 py-3">Professor-o'qituvchi</th>
                    <th className="px-4 py-3">Kafedra</th>
                    <th className="px-4 py-3 text-center">Shtat birligi</th>
                    <th className="px-4 py-3 text-center">KPI Bajarilishi</th>
                    <th className="px-4 py-3 text-center">Toifa</th>
                    <th className="px-4 py-3 text-center">Ustama %</th>
                    <th className="px-4 py-3 text-right">Oylik ustama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredBonuses.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium text-slate-400">{index + 1}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="px-4 py-3">{item.departmentName}</td>
                      <td className="px-4 py-3 text-center">{item.staffUnit}</td>
                      <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                        {item.completionPercent.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] ${item.tierBadge}`}>
                          {item.tierName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {item.bonusPercent > 0 ? `+${item.bonusPercent}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-slate-900 dark:text-white">
                        {item.calculatedBonus > 0 ? `${Math.round(item.calculatedBonus).toLocaleString('uz-UZ')} so'm` : '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        renderLists(dataForTab)
      )}
    </motion.div>
  );
};