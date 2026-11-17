import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import type { Plan, PlanItem, ScoringSystem } from '../../types/kpi';
import { achievementIcons, getProfessorName } from '../../utils/format';

export const ProfessorPlanModal: React.FC<{
  open: boolean;
  onClose: () => void;
  professor: any;
  plans: Plan[];
  onSave: (updatedPlan: Plan) => void;
  year: number;
  scoringSystem: ScoringSystem;
  getScore: (type: string, subType: string) => number;
  isAdminMode?: boolean;
  submittedBy?: number;
}> = ({ open, onClose, professor, plans, onSave, year, scoringSystem, getScore, isAdminMode = false, submittedBy }) => {

  const profPlan = useMemo(() => {
    return plans.find(p => p.professorId === professor.id && p.year === year);
  }, [plans, professor.id, year]);

  const [localPlanItems, setLocalPlanItems] = useState<PlanItem[]>([]);

  useEffect(() => {
    if (open) {
      setLocalPlanItems(profPlan ? profPlan.planItems.map(p => ({ ...p })) : []);
    }
  }, [profPlan, open]);

  const allTypes = Object.keys(scoringSystem);
  const allSubTypes: { [type: string]: string[] } = {};
  allTypes.forEach(type => {
    // @ts-ignore
    allSubTypes[type] = Object.keys(scoringSystem[type]);
  });

  function getCount(type: string, subType: string) {
    const found = localPlanItems.find(p => p.type === type && p.subType === subType);
    return found ? found.count : 0;
  }

  function setCount(type: string, subType: string, count: number) {
    setLocalPlanItems(prev => {
      const idx = prev.findIndex(p => p.type === type && p.subType === subType);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], count };
        return updated;
      } else {
        return [...prev, { type, subType, count }];
      }
    });
  }

  function handleSave(asPending = false) {
    const filteredItems = localPlanItems.filter(p => p.count > 0);
    const updatedPlan: Plan = {
      id: profPlan?.id || Math.floor(Date.now() + Math.random() * 1000),
      professorId: professor.id,
      year: year,
      planItems: filteredItems,
      status: asPending ? 'pending' : 'approved',
      submittedBy: asPending ? submittedBy : undefined,
      submittedAt: asPending ? new Date().toISOString() : undefined,
      rejectionNote: undefined,
    };
    onSave(updatedPlan);
    onClose();
  }

  let totalPlanScore = 0;
  localPlanItems.forEach(item => {
    totalPlanScore += getScore(item.type, item.subType) * item.count;
  });

  return (
    <Modal open={open} onClose={onClose} className="max-w-3xl">
      <h2 className="text-xl font-bold mb-2">{getProfessorName(professor)} - {year} Yillik Reja Kiritish</h2>
      <div className="mb-4">
        <span className="font-semibold">Yillik reja bo'yicha jami ball: </span>
        <span className="text-blue-600 font-bold">{totalPlanScore.toFixed(2)}</span>
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
