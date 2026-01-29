
import React from 'react';
import { Milestone, MilestoneStatus } from '../types';
import { getStatus } from '../utils/calculations';

interface MilestoneTimelineProps {
  milestones: Milestone[];
  onToggleComplete: (id: string) => void;
}

const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({ milestones, onToggleComplete }) => {
  return (
    <div className="py-4">
      <div className="grid grid-cols-1 gap-4">
        {milestones.map((m, idx) => {
          const status = getStatus(m);
          const isLast = idx === milestones.length - 1;

          return (
            <div key={m.id} className="group relative flex items-start">
              {!isLast && (
                <div className="absolute left-[23px] top-[48px] bottom-[-20px] w-0.5 bg-slate-100 group-hover:bg-blue-200 transition-colors" />
              )}
              
              <div 
                onClick={() => onToggleComplete(m.id)}
                className={`
                  z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer shadow-sm
                  ${status === MilestoneStatus.COMPLETED ? 'bg-green-500 border-green-500 text-white' : 
                    status === MilestoneStatus.OVERDUE ? 'bg-white border-red-500 text-red-500 animate-pulse' :
                    status === MilestoneStatus.ALERT ? 'bg-amber-500 border-amber-500 text-white' :
                    'bg-white border-slate-200 text-slate-400 hover:border-blue-400'}
                `}
              >
                {status === MilestoneStatus.COMPLETED ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <span className="font-black text-sm">{m.id}</span>
                )}
              </div>

              <div className="ml-6 flex-1 bg-white border border-slate-100 rounded-xl p-4 hover:border-blue-200 transition-all shadow-sm mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className={`text-sm font-bold ${status === MilestoneStatus.COMPLETED ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {m.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{m.description}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter mb-1
                      ${status === MilestoneStatus.COMPLETED ? 'bg-green-100 text-green-700' : 
                        status === MilestoneStatus.OVERDUE ? 'bg-red-100 text-red-700' :
                        status === MilestoneStatus.ALERT ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'}
                    `}>
                      {status === MilestoneStatus.COMPLETED ? 'Ejecutado' : 
                       status === MilestoneStatus.OVERDUE ? 'Vencido / Sobrecosto' :
                       status === MilestoneStatus.ALERT ? 'Alerta Crítica' : 'Pendiente'}
                    </span>
                    <div className="text-[10px] font-bold text-slate-400">
                      Vence: <span className="text-slate-700 font-mono">{m.dueDate}</span>
                    </div>
                  </div>
                </div>

                {status === MilestoneStatus.ALERT && !m.completedDate && (
                  <div className={`mt-3 flex items-center justify-between p-2.5 rounded-xl border transition-all duration-500 ${m.emailSent ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                    <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-tight">
                      {m.emailSent ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span>📧 EMAIL DE ALERTA ENVIADO AUTOMÁTICAMENTE</span>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>PREPARANDO NOTIFICACIÓN DE SEGURIDAD...</span>
                        </>
                      )}
                    </div>
                    {m.emailSent && <span className="text-[8px] font-black opacity-50 font-mono">{new Date().toLocaleTimeString()}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MilestoneTimeline;
