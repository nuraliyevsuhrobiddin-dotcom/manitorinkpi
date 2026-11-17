import React from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';

export const BarChart: React.FC<{ data: { label: string; value: number }[]; title: string; unit?: string }> = ({ data, title, unit = '' }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const gradients = ['from-indigo-500 to-violet-500','from-blue-500 to-cyan-500','from-emerald-500 to-teal-500','from-amber-500 to-orange-500','from-rose-500 to-pink-500','from-purple-500 to-fuchsia-500'];
  return (
    <Card>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-5">{title}</h3>
      <div className="space-y-3.5">
        {data.map((item, index) => (
          <div key={index} className="group">
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400 w-5 text-right">{index + 1}</span>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-2">{item.label}</p>
              </div>
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{item.value.toFixed(2)}{unit}</p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`bg-gradient-to-r ${gradients[index % gradients.length]} h-2 rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / maxValue) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.05 }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
