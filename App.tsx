
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import StatsCard from './components/StatsCard';
import ShipmentForm from './components/ShipmentForm';
import ShipmentList from './components/ShipmentList';
import { Shipment, MilestoneStatus } from './types';
import { calculateKPIs, getStatus } from './utils/calculations';
import { sendAlertEmail } from './utils/emailService';
import Auth from './components/Auth';

const API_URL = 'http://localhost:3001';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  // Función para cargar datos desde la API
  const fetchShipments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/shipments`);
      if (response.ok) {
        const data = await response.json();
        setShipments(data);
      }
    } catch (error) {
      console.error("Error conectando al backend:", error);
    }
  };

  useEffect(() => {
    // Verificar si hay token guardado (sesión persistente simple)
    const token = localStorage.getItem('token');
    // Nota: En una app real, validaríamos el token con el backend aquí
    if (token) {
        setUser({ name: 'Usuario' }); // Estado temporal para mostrar dashboard
        fetchShipments();
        setIsInitialized(true);
    } else {
        // Verificar si es un reset de password por URL
        if (window.location.search.includes('token=')) return;
    }
  }, []);

  // --- MOTOR DE NOTIFICACIONES EN SEGUNDO PLANO ---
  useEffect(() => {
    if (!isInitialized || shipments.length === 0) return;

    let hasUpdates = false;
    const newShipments = shipments.map(shipment => {
      let shipmentUpdated = false;
      const updatedMilestones = shipment.milestones.map(m => {
        const currentStatus = getStatus(m);
        if (currentStatus === MilestoneStatus.ALERT && !m.emailSent && !m.completedDate) {
          sendAlertEmail(shipment, m).then(() => {
            setShipments(current => current.map(s => {
              if (s.id !== shipment.id) return s;
              return {
                ...s,
                milestones: s.milestones.map(mil => 
                  mil.id === m.id ? { ...mil, emailSent: true } : mil
                )
              };
            }));
          });
          shipmentUpdated = true;
          hasUpdates = true;
          return { ...m, emailSent: true }; 
        }
        return m;
      });

      return shipmentUpdated ? { ...shipment, milestones: updatedMilestones } : shipment;
    });
  }, [shipments, isInitialized]);

  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      const date = s.etaWh;
      const startMatch = !filters.startDate || date >= filters.startDate;
      const endMatch = !filters.endDate || date <= filters.endDate;
      return startMatch && endMatch;
    });
  }, [shipments, filters]);

  const kpis = useMemo(() => calculateKPIs(filteredShipments), [filteredShipments]);

  const addShipment = async (shipment: Shipment) => {
    try {
      const res = await fetch(`${API_URL}/api/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipment)
      });
      if (res.ok) {
        await fetchShipments(); // Recargar datos
        setShowForm(false);
      }
    } catch (e) {
      console.error("Error guardando:", e);
    }
  };

  const updateShipment = async (updatedShipment: Shipment) => {
    try {
      const res = await fetch(`${API_URL}/api/shipments/${updatedShipment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedShipment)
      });
      if (res.ok) {
        await fetchShipments();
        setEditingShipment(null);
      }
    } catch (e) {
      console.error("Error actualizando:", e);
    }
  };

  const handleEdit = (shipment: Shipment) => {
    setEditingShipment(shipment);
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteShipment = async (id: string) => {
    const shipmentToDelete = shipments.find(s => s.id === id);
    const identifier = shipmentToDelete?.identifier || "esta operación";
    
    if (window.confirm(`¿ESTÁ SEGURO DE ELIMINAR EL TRÁMITE: ${identifier}?\n\nEsta acción es irreversible.`)) {
      try {
        await fetch(`${API_URL}/api/shipments/${id}`, { method: 'DELETE' });
        await fetchShipments();
      } catch (e) {
        console.error("Error eliminando:", e);
      }
    }
  };

  const toggleMilestone = async (shipmentId: string, milestoneId: string) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    const milestone = shipment?.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;

    const newCompletedDate = milestone.completedDate ? null : new Date().toISOString().split('T')[0];

    try {
      await fetch(`${API_URL}/api/shipments/${shipmentId}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedDate: newCompletedDate })
      });
      await fetchShipments();
    } catch (e) {
      console.error("Error actualizando hito:", e);
    }
  };

  const filterInputClasses = "px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white outline-none transition-all focus:bg-slate-900 focus:text-white focus:border-slate-900 focus:ring-4 focus:ring-slate-100 cursor-pointer";

  // Si no hay usuario y no estamos en proceso de reset password, mostrar Login
  if (!user && !window.location.search.includes('token=')) {
    return <Auth onLogin={(u) => { setUser(u); fetchShipments(); setIsInitialized(true); }} />;
  }
  // Si estamos en reset password, Auth maneja la vista internamente
  if (!user && window.location.search.includes('token=')) {
      return <Auth onLogin={(u) => { setUser(u); fetchShipments(); setIsInitialized(true); }} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 stats-container">
        <StatsCard 
          label="Operaciones"
          value={kpis.total}
          icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          colorClass="bg-blue-50"
          subLabel="Total en sistema"
        />
        <StatsCard 
          label="KPI Tiempo"
          value={`${kpis.deviation}d`}
          icon={<svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          colorClass="bg-amber-50"
          subLabel="Días de desvío promedio"
          trend={Number(kpis.deviation) > 2 ? 'up' : 'down'}
        />
        <StatsCard 
          label="KPI Tareas"
          value={`${kpis.completion}%`}
          icon={<svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          colorClass="bg-emerald-50"
          subLabel="Nivel de cumplimiento"
          trend={kpis.completion > 80 ? 'down' : 'up'}
        />
        <StatsCard 
          label="KPI Costo (Riesgo)"
          value={`Bs.${kpis.risk}`}
          icon={<svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          colorClass="bg-red-50"
          subLabel="Riesgo económico proyectado"
          trend={kpis.risk > 500 ? 'up' : 'down'}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-200 pb-6 no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Panel Logístico</h2>
          <p className="text-slate-500 font-medium">Tracking automatizado de hitos críticos y gestión de alertas.</p>
        </div>
        {!showForm && !editingShipment && (
          <button 
            onClick={() => { setShowForm(true); setEditingShipment(null); }}
            className="bg-slate-900 hover:bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold transition-all transform hover:-translate-y-1 shadow-xl flex items-center justify-center space-x-2 group"
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <span>Registrar Importación</span>
          </button>
        )}
      </div>

      {(showForm || editingShipment) && (
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-6 duration-500 no-print">
          <ShipmentForm 
            onAdd={addShipment} 
            onUpdate={updateShipment}
            onCancel={() => { setShowForm(false); setEditingShipment(null); }} 
            initialData={editingShipment}
          />
        </div>
      )}

      {!showForm && !editingShipment && shipments.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center gap-6 filters-container no-print">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Filtrar por ETA WH:</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Desde</span>
              <input 
                type="date"
                className={filterInputClasses}
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Hasta</span>
              <input 
                type="date"
                className={filterInputClasses}
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            
            {(filters.startDate || filters.endDate) && (
              <button 
                onClick={() => setFilters({ startDate: '', endDate: '' })}
                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-tight flex items-center space-x-1 ml-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                <span>Limpiar</span>
              </button>
            )}
          </div>
          
          <div className="md:ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {filteredShipments.length} resultados encontrados
          </div>
        </div>
      )}

      <ShipmentList 
        shipments={filteredShipments} 
        onToggleMilestone={toggleMilestone}
        onDelete={deleteShipment}
        onEdit={handleEdit}
      />

      {shipments.length === 0 && !showForm && !editingShipment && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-24 text-center no-print">
          <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Comienza el Rastreo</h3>
          <p className="text-slate-500 max-w-sm mx-auto font-medium">Aún no hay embarques registrados.</p>
          <button 
            onClick={() => setShowForm(true)}
            className="mt-8 text-blue-600 font-black hover:text-blue-800 transition-colors flex items-center justify-center space-x-2 mx-auto"
          >
            <span>Registrar primer embarque</span>
          </button>
        </div>
      )}
    </Layout>
  );
};
export default App;