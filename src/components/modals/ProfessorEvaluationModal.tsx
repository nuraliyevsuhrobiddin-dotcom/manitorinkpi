import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import type { Achievement, ScoringSystem, ApprovalStatus } from '../../types/kpi';
import { achievementIcons, getProfessorName } from '../../utils/format';

export const ProfessorEvaluationModal: React.FC<{
  open: boolean;
  onClose: () => void;
  professor: any;
  achievements: Achievement[];
  onSave: (updatedAchievements: Achievement[], target: { year: number, quarter: number }) => void;
  year: number;
  scoringSystem: ScoringSystem;
  getScore: (type: string, subType: string) => number;
  isAdminMode?: boolean;
  submittedBy?: number;
}> = ({ open, onClose, professor, achievements, onSave, year, scoringSystem, getScore, isAdminMode = false, submittedBy }) => {
  const [quarter, setQuarter] = useState(1);

  const profAchievementsForQuarter = useMemo(() => {
    return achievements.filter(a => a.professorId === professor.id && a.year === year && a.quarter === quarter);
  }, [achievements, professor.id, year, quarter]);

  const [localAchievements, setLocalAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (open) {
      setLocalAchievements(profAchievementsForQuarter.map(a => ({ ...a })));
    }
  }, [profAchievementsForQuarter, open]);

  const allTypes = Object.keys(scoringSystem);
  const allSubTypes: { [type: string]: string[] } = {};
  allTypes.forEach(type => {
    // @ts-ignore
    allSubTypes[type] = Object.keys(scoringSystem[type]);
  });


  function getItem(type: string, subType: string) {
    return localAchievements.find(a => a.type === type && a.subType === subType);
  }

  function updateItem(type: string, subType: string, patch: Partial<Achievement>) {
    setLocalAchievements(prev => {
      const idx = prev.findIndex(a => a.type === type && a.subType === subType);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...patch };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: Math.floor(Date.now() + Math.random() * 1000),
            professorId: professor.id,
            year,
            quarter,
            type,
            subType,
            count: 0,
            ...patch,
          },
        ];
      }
    });
  }

  function setCount(type: string, subType: string, count: number) {
    updateItem(type, subType, { count });
  }

  function handleSave(asPending = false) {
    const status: ApprovalStatus = asPending ? 'pending' : 'approved';
    const filtered = localAchievements.filter(a => a.count > 0).map(a => ({
      ...a,
      status,
      submittedBy: asPending ? submittedBy : undefined,
      submittedAt: asPending ? new Date().toISOString() : undefined,
      rejectionNote: undefined,
    }));
    onSave(filtered, { year, quarter });
    onClose();
  }

  let totalScore = 0;
  localAchievements.forEach(ach => {
    totalScore += getScore(ach.type, ach.subType) * ach.count;
  });

  return (
    <Modal open={open} onClose={onClose} className="max-w-3xl">
      <h2 className="text-xl font-bold mb-2">{getProfessorName(professor)} - {year}, {quarter}-chorak baholash</h2>
      <div className="mb-2">
        <span className="font-semibold">Chorak bo'yicha jami ball: </span>
        <span className="text-blue-600 font-bold">{totalScore.toFixed(2)}</span>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Chorakni tanlang</label>
        <select className="w-full border rounded p-1" value={quarter} onChange={e => setQuarter(Number(e.target.value))}>
          <option value={1}>1-chorak</option>
          <option value={2}>2-chorak</option>
          <option value={3}>3-chorak</option>
          <option value={4}>4-chorak</option>
        </select>
      </div>

      <div className="max-h-96 overflow-y-auto mt-2">
        {allTypes.map(type => (
          <div key={type} className="mb-2">
            <div className="font-semibold mb-1 flex items-center">
              {achievementIcons[type] && React.createElement(achievementIcons[type], { size: 18, className: "mr-1" })}
              {type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allSubTypes[type].map(subType => {
                const item = getItem(type, subType);
                const count = item?.count || 0;
                return (
                  <div key={subType} className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium w-40 truncate" title={subType}>{subType}</span>
                      <div className="flex items-center">
                        <input
                          type="number"
                          min={0}
                          className="border rounded w-16 p-1 text-center font-bold text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          value={count}
                          onChange={e => setCount(type, subType, Math.max(0, Number(e.target.value)))}
                        />
                        <span className="ml-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 w-16 text-right">
                          +{getScore(type, subType) * count} b
                        </span>
                      </div>
                    </div>
                    {count > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 animate-fadeIn">
                        <input
                          type="url"
                          placeholder="🔗 Asoslovchi havola (DOI yoki URL)"
                          value={item?.documentUrl || ''}
                          onChange={e => updateItem(type, subType, { documentUrl: e.target.value })}
                          className="w-full text-xs p-1.5 border rounded-md bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                        />
                        <input
                          type="text"
                          placeholder="📝 Maqola/Sertifikat nomi yoki qisqa izoh"
                          value={item?.notes || ''}
                          onChange={e => updateItem(type, subType, { notes: e.target.value })}
                          className="w-full text-xs p-1.5 border rounded-md bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end space-x-2">
        <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={onClose}>Bekor qilish</button>
        {isAdminMode ? (
          <button className="px-5 py-2 rounded bg-amber-500 text-white hover:bg-amber-600 font-semibold" onClick={() => handleSave(true)}>
            📤 Tasdiqlashga yuborish
          </button>
        ) : (
          <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={() => handleSave(false)}>Saqlash</button>
        )}
      </div>
    </Modal>
  );
};
