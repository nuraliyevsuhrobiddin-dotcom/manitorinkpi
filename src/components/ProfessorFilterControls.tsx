import React from 'react';
import type { Filters } from '../types/kpi';

export const ProfessorFilterControls: React.FC<{ filters: Filters, onFilterChange: (filters: Filters) => void, positions: string[] }> = ({ filters, onFilterChange, positions }) => {
  const handleCheckboxChange = (category: keyof Filters, value: string) => {
    const newValues = filters[category].includes(value)
      ? filters[category].filter(v => v !== value)
      : [...filters[category], value];
    onFilterChange({ ...filters, [category]: newValues });
  };

  const filterGroups = [
    {
      title: 'Jinsi', category: 'gender', options: { 'erkak': 'Erkak', 'ayol': 'Ayol' }
    },
    {
      title: 'Ilmiy daraja', category: 'degree', options: { 'DSc': 'DSc', 'PhD': 'PhD' }
    },
    {
      title: 'Ilmiy unvon', category: 'title', options: { 'Professor': 'Professor', 'Dotsent': 'Dotsent' }
    },
    {
      title: 'Yosh bo\'yicha', category: 'ageRange', options: {
        '<30': '30 yoshgacha', '30-39': '30-39 yosh', '40-49': '40-49 yosh', '50-59': '50-59 yosh', '60+': '60+ yosh'
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4">
      {filterGroups.map(group => (
        <div key={group.title}>
          <label className="block text-sm font-medium text-gray-700 mb-2">{group.title}</label>
          <div className="space-y-2">
            {Object.entries(group.options).map(([value, label]) => (
              <div key={value} className="flex items-center">
                <input
                  id={`${group.category}-${value}`}
                  type="checkbox"
                  value={value}
                  checked={filters[group.category as keyof Filters].includes(value)}
                  onChange={() => handleCheckboxChange(group.category as keyof Filters, value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`${group.category}-${value}`} className="ml-2 block text-sm text-gray-900">{label}</label>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Lavozimi</label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {positions.map(position => (
            <div key={position} className="flex items-center">
              <input
                id={`position-${position}`}
                type="checkbox"
                value={position}
                checked={filters.position.includes(position)}
                onChange={() => handleCheckboxChange('position', position)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`position-${position}`} className="ml-2 block text-sm text-gray-900">{position}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
