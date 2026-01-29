
import React, { useState } from 'react';
import { Shipment, MilestoneStatus } from '../types';
import MilestoneTimeline from './MilestoneTimeline';
import { getStatus } from '../utils/calculations';

interface ShipmentListProps {
  shipments: Shipment[];
  onToggleMilestone: (sId: string, mId: string) => void;
  onDelete: (id: string) => void;
  onEdit: (shipment: Shipment) => void;
}

const ShipmentList: React.FC<ShipmentListProps> = ({ shipments, onToggleMilestone, onDelete, onEdit }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return dateString.split('T')[0];
  };

  const handlePrint = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setIsPreparingPrint(true);
    setPrintingId(id);
    
    // El diálogo de impresión bloquea el hilo principal, 
    // usamos un timeout para permitir que el DOM se actualice visualmente.
    setTimeout(() => {
      window.print();
      setPrintingId(null);
      setIsPreparingPrint(false);
    }, 500);
  };

  return (
    <div className="space-y-4 relative">
      {/* Notificación visual de preparación de PDF */}
      {isPreparingPrint && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center no-print">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm animate-in zoom-in duration-300">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Generando PDF</h3>
            <p className="text-slate-500 text-sm font-medium">Estamos preparando el reporte técnico. En el cuadro de diálogo, selecciona <b>"Guardar como PDF"</b>.</p>
          </div>
        </div>
      )}

      {shipments.map(s => {
        const completedCount = s.milestones.filter(m => !!m.completedDate).length;
        const progress = Math.round((completedCount / s.milestones.length) * 100);
        const hasOverdue = s.milestones.some(m => getStatus(m) === MilestoneStatus.OVERDUE);
        const hasAlert = s.milestones.some(m => getStatus(m) === MilestoneStatus.ALERT);
        const isPrinting = printingId === s.id;

        return (
          <div 
            key={s.id} 
            className={`bg-white rounded-2xl border transition-all duration-300 shipment-card 
              ${isPrinting ? 'printing' : ''}
              ${expandedId === s.id ? 'border-blue-400 shadow-2xl scale-[1.01]' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}
          >
            {/* CABECERA EXCLUSIVA PARA EL PDF */}
            {isPrinting && (
              <div className="p-8 border-b-4 border-slate-900 mb-10 flex justify-between items-end">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter">IMPORTRACK PRO</h1>
                  </div>
                  <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Reporte Oficial de Trazabilidad Logística</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento Generado el</p>
                  <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            )}

            <div className="p-6 cursor-pointer" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center space-x-4 min-w-[240px]">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
                    ${hasOverdue ? 'bg-red-50 text-red-500' : hasAlert ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{s.identifier}</h3>
                    <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      <span>{s.origin}</span>
                      <svg className="w-3 h-3 mx-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      <span>{s.destination}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 flex-1 border-x border-slate-50 px-6">
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mb-1">ETD</p>
                    <p className="text-xs font-bold text-slate-700 font-mono">{formatDate(s.etd)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mb-1">ETA Puerto</p>
                    <p className="text-xs font-bold text-slate-700 font-mono">{formatDate(s.etaPuerto)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-purple-400 font-black uppercase tracking-tighter mb-1">Val. DIM</p>
                    <p className="text-xs font-bold text-purple-700 font-mono">{formatDate(s.dimValidationDate)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mb-1">ETA WH</p>
                    <p className="text-xs font-bold text-slate-700 font-mono">{formatDate(s.etaWh)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-8 min-w-[220px]">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase mb-1.5">
                      <span>Progreso</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-700 ease-out ${hasOverdue ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <button className={`p-2 rounded-lg transition-colors no-print ${expandedId === s.id ? 'bg-blue-50 text-blue-600' : 'text-slate-300 hover:text-slate-600'}`}>
                    <svg className={`w-6 h-6 transition-transform duration-300 ${expandedId === s.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {(expandedId === s.id || isPrinting) && (
              <div className="px-8 pb-8 pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-8 no-print">
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Auditoría de Procesos</h4>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={(e) => handlePrint(e, s.id)}
                      className="group px-4 py-2 text-[10px] font-black text-white bg-slate-900 hover:bg-blue-600 rounded-xl transition-all uppercase tracking-tighter flex items-center space-x-2 shadow-lg transform active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      <span>Descargar PDF Reporte</span>
                    </button>

                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onEdit(s); }}
                      className="group px-3 py-1.5 text-[10px] font-black text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all uppercase tracking-tighter flex items-center space-x-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      <span>Editar</span>
                    </button>
                    
                    <button 
                      type="button"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onDelete(s.id); 
                      }}
                      className="group px-3 py-1.5 text-[10px] font-black text-red-500 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200 uppercase tracking-widest flex items-center space-x-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Remover</span>
                    </button>
                  </div>
                </div>
                
                {/* Detalles del reporte para el PDF */}
                {isPrinting && (
                  <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Información de Operación</h4>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-800">Referencia: <span className="font-mono">{s.identifier}</span></p>
                          <p className="text-sm font-bold text-slate-800">Ruta: {s.origin} ➔ {s.destination}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resumen de Ejecución</h4>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-800">Cumplimiento: {progress}%</p>
                          <p className="text-sm font-bold text-slate-800">Estado: {hasOverdue ? 'CRÍTICO' : hasAlert ? 'ALERTA' : 'A TIEMPO'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="max-w-3xl mx-auto px-4">
                  <MilestoneTimeline 
                    milestones={s.milestones} 
                    onToggleComplete={(mId) => onToggleMilestone(s.id, mId)} 
                  />
                </div>
                
                {isPrinting && (
                  <div className="mt-16 pt-8 border-t border-slate-200 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.3em]">Fin del Reporte Técnico - Control de Operaciones ImporTrack</p>
                    <p className="text-[8px] text-slate-300 mt-2 italic">Este documento es una representación digital del estado de la operación en tiempo real.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ShipmentList;
