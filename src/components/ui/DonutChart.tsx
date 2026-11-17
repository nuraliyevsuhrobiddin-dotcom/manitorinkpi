import React from 'react';
import { Card } from './Card';

export const DonutChart: React.FC<{ data: { label: string; value: number; color: string }[]; title: string; }> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">Ma'lumotlar mavjud emas</p>
      </Card>
    );
  }

  let cumulative = 0;
  const segments = data.map(item => {
    const percentage = (item.value / total) * 100;
    const segment = { ...item, percentage, offset: cumulative };
    cumulative += percentage;
    return segment;
  });

  const conicGradient = segments.map(s => `${s.color} ${s.offset}% ${s.offset + s.percentage}%`).join(', ');

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div
          className="relative w-40 h-40 rounded-full flex items-center justify-center"
          style={{ background: `conic-gradient(${conicGradient})` }}
        >
          <div className="absolute w-28 h-28 bg-white rounded-full"></div>
        </div>
        <div className="flex-1 space-y-2 w-full">
          {segments.map(item => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                <span>{item.label}</span>
              </div>
              <span className="font-semibold">{item.value} ({item.percentage.toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
