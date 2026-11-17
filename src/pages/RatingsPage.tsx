import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { getProfessorName } from '../utils/format';

export const RatingsPage: React.FC<{ data: any; type: 'faculty' | 'department' }> = ({ data, type }) => {
  const title = type === 'faculty' ? 'Fakultetlar Reytingi' : 'Kafedralar Reytingi';
  const items = type === 'faculty' ? data.facultyRatings : data.departmentRatings;

  const [expandedFaculty, setExpandedFaculty] = useState<number | null>(null);
  const [expandedDepartment, setExpandedDepartment] = useState<number | null>(null);

  const renderProfessorList = (professors: any[]) => (
    <ul className="space-y-1 text-sm text-gray-700">
      {professors.map((prof: any) => (
        <li key={prof.id} className="flex justify-between p-2 rounded hover:bg-gray-200">
          <span>{getProfessorName(prof)} ({prof.position})</span>
          <span className="font-semibold">{prof.totalScore.toFixed(2)} ball</span>
        </li>
      ))}
    </ul>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{title}</h1>
      <Card>
        <div className="space-y-2">
          {items.map((item: any, index: number) => (
            <div key={item.id} className="border-b last:border-b-0 py-2">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedFaculty(expandedFaculty === item.id ? null : item.id)}>
                <div className="flex items-center">
                  <span className="text-lg font-bold text-gray-500 w-8">{index + 1}</span>
                  <p className="font-semibold text-gray-800">{item.name} <span className="text-gray-500 font-normal">({item.professors.length} nafar)</span></p>
                </div>
                <div className="flex items-center space-x-4 text-right">
                  <div className="w-28">
                    <p className="text-xs text-gray-500">Ilmiy salohiyat</p>
                    <p className="font-bold text-lg text-purple-600">{item.scientificPotential.toFixed(1)}%</p>
                  </div>
                  <div className="w-20">
                    <p className="text-xs text-gray-500">Reja</p>
                    <p className="font-bold text-lg text-gray-800">{item.totalPlan.toFixed(1)}</p>
                  </div>
                  <div className="w-20">
                    <p className="text-xs text-gray-500">Amalda</p>
                    <p className="font-bold text-lg text-blue-600">{item.totalScore.toFixed(1)}</p>
                  </div>
                   <div className="w-24">
                    <p className="text-xs text-gray-500">Bajarilish</p>
                    <p className="font-bold text-lg text-green-600">{item.completionPercent.toFixed(1)}%</p>
                  </div>
                  {item.departments || item.professors ? (expandedFaculty === item.id ? <ChevronDown /> : <ChevronRight />) : <div className="w-6"/>}
                </div>
              </div>
              <AnimatePresence>
                {expandedFaculty === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pl-10 pt-2"
                  >
                    {type === 'faculty' ? (
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm mb-2 text-gray-600">Kafedralar:</h4>
                        {item.departments.map((dept: any) => (
                          <div key={dept.id} className="border-l-2 pl-3 py-1">
                            <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedDepartment(expandedDepartment === dept.id ? null : dept.id)}>
                                <p className="font-semibold text-sm text-gray-700">{dept.name} <span className="text-gray-500 font-normal">({dept.professors.length} nafar)</span></p>
                                <div className="flex items-center space-x-3 text-right">
                                    <div className="w-20"><p className="text-xs text-gray-500">Amalda</p><p className="font-bold text-sm text-blue-600">{dept.totalScore.toFixed(1)}</p></div>
                                    <div className="w-24"><p className="text-xs text-gray-500">Bajarilish</p><p className="font-bold text-sm text-green-600">{dept.completionPercent.toFixed(1)}%</p></div>
                                    {dept.professors && (expandedDepartment === dept.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                                </div>
                            </div>
                            <AnimatePresence>
                              {expandedDepartment === dept.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden pl-4 pt-2"
                                >
                                  {renderProfessorList(dept.professors)}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    ) : (
                      renderProfessorList(item.professors)
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};
