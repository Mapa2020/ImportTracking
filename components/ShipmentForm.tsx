
import React, { useState, useEffect } from 'react';
import { format, addDays as addDaysFns } from 'date-fns';
import { Shipment } from '../types';
import { calculateMilestones } from '../utils/calculations';

interface ShipmentFormProps {
  onAdd: (shipment: Shipment) => void;
  onUpdate?: (shipment: Shipment) => void;
  onCancel: () => void;
  initialData?: Shipment | null;
}

const ShipmentForm: React.FC<ShipmentFormProps> = ({ onAdd, onUpdate, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    identifier: '',
    origin: '',
    destination: '',
    etd: format(new Date(), 'yyyy-MM-dd'),
    etaPuerto: format(addDaysFns(new Date(), 30), 'yyyy-MM-dd'),
    dimValidationDate: format(addDaysFns(new Date(), 32), 'yyyy-MM-dd'),
    etaWh: format(addDaysFns(new Date(), 35), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        identifier: initialData.identifier,
        origin: initialData.origin,
        destination: initialData.destination,
        etd: initialData.etd,
        etaPuerto: initialData.etaPuerto,
        dimValidationDate: initialData.dimValidationDate || initialData.etaPuerto,
        etaWh: initialData.etaWh,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newMilestones = calculateMilestones(
      formData.etd, 
      formData.etaPuerto, 
      formData.etaWh, 
      formData.dimValidationDate
    );
    
    if (initialData) {
      newMilestones.forEach(m => {
        const oldM = initialData.milestones.find(om => om.id === m.id);
        if (oldM?.completedDate) {
          m.completedDate = oldM.completedDate;
        }
      });
    }

    if (initialData && onUpdate) {
      onUpdate({
        ...initialData,
        ...formData,
        milestones: newMilestones,
      });
    } else {
      const newShipment: Shipment = {
        id: crypto.randomUUID(),
        ...formData,
        milestones: newMilestones,
        createdAt: new Date().toISOString()
      };
      onAdd(newShipment);
    }
  };

  const textInputClasses = "w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 transition-all duration-200 outline-none font-medium text-slate-700 bg-white focus:bg-slate-800 focus:text-white focus:border-slate-900 focus:shadow-lg placeholder:text-slate-300 placeholder:focus:text-slate-500 text-base";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {initialData ? 'Modificar Seguimiento' : 'Nueva Operación Logística'}
        </h2>
        <button onClick={onCancel} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-full">
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-widest">Identificador / BL / Referencia</label>
            <input 
              required
              className={textInputClasses}
              placeholder="Ej: MSCU1234567"
              value={formData.identifier}
              onChange={e => setFormData({...formData, identifier: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-widest">Puerto de Origen</label>
            <input 
              required
              className={textInputClasses}
              placeholder="Ciudad o Puerto de carga"
              value={formData.origin}
              onChange={e => setFormData({...formData, origin: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-widest">Puerto de Destino</label>
            <input 
              required
              className={textInputClasses}
              placeholder="Ciudad o Puerto de descarga"
              value={formData.destination}
              onChange={e => setFormData({...formData, destination: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-6 pt-8 border-t border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Cronograma de Hitos Principales</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fila 1 */}
            <div>
              <label className="block text-xs font-bold text-blue-700 mb-3 uppercase tracking-widest flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Fecha ETD (Salida)
              </label>
              <input 
                type="date"
                required
                className="w-full px-4 py-3.5 rounded-xl border-4 border-blue-600 bg-blue-600 text-white font-medium text-lg shadow-lg focus:ring-4 focus:ring-blue-200 outline-none transition-all cursor-pointer hover:bg-blue-700 hover:border-blue-700"
                value={formData.etd}
                onChange={e => setFormData({...formData, etd: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-3 uppercase tracking-widest flex items-center">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                Fecha ETA Puerto (Llegada)
              </label>
              <input 
                type="date"
                required
                className="w-full px-4 py-3.5 rounded-xl border-4 border-indigo-600 bg-indigo-600 text-white font-medium text-lg shadow-lg focus:ring-4 focus:ring-indigo-200 outline-none transition-all cursor-pointer hover:bg-indigo-700 hover:border-indigo-700"
                value={formData.etaPuerto}
                onChange={e => setFormData({...formData, etaPuerto: e.target.value})}
              />
            </div>

            {/* Fila 2 */}
            <div>
              <label className="block text-xs font-bold text-purple-700 mb-3 uppercase tracking-widest flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Fecha Validación DIM
              </label>
              <input 
                type="date"
                required
                className="w-full px-4 py-3.5 rounded-xl border-4 border-purple-600 bg-purple-600 text-white font-medium text-lg shadow-lg focus:ring-4 focus:ring-purple-200 outline-none transition-all cursor-pointer hover:bg-purple-700 hover:border-purple-700"
                value={formData.dimValidationDate}
                onChange={e => setFormData({...formData, dimValidationDate: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-700 mb-3 uppercase tracking-widest flex items-center">
                <span className="w-2 h-2 bg-teal-500 rounded-full mr-2"></span>
                Fecha ETA Warehouse (Planta)
              </label>
              <input 
                type="date"
                required
                className="w-full px-4 py-3.5 rounded-xl border-4 border-teal-600 bg-teal-600 text-white font-medium text-lg shadow-lg focus:ring-4 focus:ring-teal-200 outline-none transition-all cursor-pointer hover:bg-teal-700 hover:border-teal-700"
                value={formData.etaWh}
                onChange={e => setFormData({...formData, etaWh: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-4 pt-6">
          <button 
            type="submit"
            className="flex-1 bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-blue-600 transition-all shadow-xl text-lg uppercase tracking-widest transform active:scale-[0.98]"
          >
            <span>{initialData ? 'Guardar Cambios' : 'Confirmar e Iniciar Tracking'}</span>
          </button>
          <button 
            type="button"
            onClick={onCancel}
            className="px-8 py-5 border-2 border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 hover:text-slate-900 transition-all uppercase tracking-widest text-sm"
          >
            Cerrar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShipmentForm;
