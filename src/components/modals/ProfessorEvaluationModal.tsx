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

  function getCount(type: string, subType: string) {
    const found = localAchievements.find(a => a.type === type && a.subType === subType);
    return found ? found.count : 0;
  }

  function setCount(type: string, subType: string, count: number) {
    setLocalAchievements(prev => {
      const idx = prev.findIndex(a => a.type === type && a.subType === subType);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], count };
        return updated;
      } else {
        return [...prev, { id: Math.floor(Date.now() + Math.random() * 1000), professorId: professor.id, year, quarter, type, subType, count }];
      }
    });
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
              {allSubTypes[type].map(subType => (
                <div key={subType} className="flex items-center">
                  <span className="text-xs w-36 truncate" title={subType}>{subType}</span>
                  <input
                    type="number"
                    min={0}
                    className="border rounded w-16 p-1 ml-2"
                    value={getCount(type, subType)}
                    onChange={e => setCount(type, subType, Math.max(0, Number(e.target.value)))}
                  />
                  <span className="ml-2 text-xs text-gray-400">({getScore(type, subType)} ball)</span>
                </div>
              ))}
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
