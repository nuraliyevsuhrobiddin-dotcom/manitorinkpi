import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';

export const EfficiencyPage: React.FC<{
  facultyRatings: any[];
  departmentRatings: any[];
  professorsWithDetails: any[];
  searchQuery: string;
}> = ({ facultyRatings, departmentRatings, professorsWithDetails, searchQuery }) => {
  const [activeTab, setActiveTab] = useState('professors');
  const tabs = [
    { id: 'professors', label: 'Professor-o\'qituvchilar' },
    { id: 'departments', label: 'Kafedralar' },
    { id: 'faculties', label: 'Fakultetlar' },
  ];

  const failedMinThreshold = 0;
  const lowThreshold = 30;
  const midThreshold = 50;

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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Samaradorlik va Nazorat</h1>
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      {renderLists(dataForTab)}
    </motion.div>
  );
};
