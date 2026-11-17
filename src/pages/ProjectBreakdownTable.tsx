import React from 'react';
import { Card } from '../components/ui/Card';
import { formatFundingCompact, formatFundingTooltip } from '../utils/format';

export const ProjectBreakdownTable: React.FC<{ title: string, data: any[], projectTypes: string[] }> = ({ title, data, projectTypes }) => (
  <Card>
    <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th className="px-4 py-3">Nomi</th>
            <th className="px-4 py-3 text-center">Jami</th>
            {projectTypes.map(type => <th key={type} className="px-4 py-3 text-center">{type}</th>)}
            <th className="px-4 py-3 text-right">Mablag'</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.label} className="bg-white border-b">
              <td className="px-4 py-2 font-medium">{item.label}</td>
              <td className="px-4 py-2 text-center font-bold">{item.value.count}</td>
              {projectTypes.map(type => <td key={type} className="px-4 py-2 text-center">{item.value.types[type] || 0}</td>)}
              <td className="px-4 py-2 text-right font-semibold" title={formatFundingTooltip(item.value.funding)}>
                {formatFundingCompact(item.value.funding)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);
