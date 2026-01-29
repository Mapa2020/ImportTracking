
import { format, addDays, isAfter, startOfDay, differenceInDays } from 'date-fns';
import { Milestone, MilestoneStatus, Shipment } from '../types';

export const calculateMilestones = (etd: string, eta: string, etaWh: string, dimVal: string): Milestone[] => {
  const etdDate = new Date(etd);
  const etaDate = new Date(eta);
  const etaWhDate = new Date(etaWh);
  const dimValDate = new Date(dimVal);

  const config = [
    { id: 'H1', name: 'Gestión de Documentos', desc: 'Factura y Packing List (5d post-ETD)', base: 'ETD', days: 5, alert: 4, mandatory: true },
    { id: 'H2', name: 'Vencimiento de la DAM', desc: 'Plazo legal (20d post-ETD, Alerta 15d)', base: 'ETD', days: 20, alert: 15, mandatory: true },
    { id: 'H3', name: 'Elaboración de la DIM', desc: 'Rapidez desaduanización (5d post-ETA, Alerta 3d)', base: 'ETA', days: 5, alert: 3, mandatory: true },
    { id: 'H3.5', name: 'Regularización de la DIM', desc: 'Trámite post-validación (20d post-VALIDACIÓN, Alerta 15d)', base: 'DIM_VAL', days: 20, alert: 15, mandatory: true },
    { id: 'H4', name: 'Devolución de Contenedor', desc: 'Evitar multas naviera (20d post-ETA, Alerta 15d)', base: 'ETA', days: 20, alert: 15, mandatory: true },
    { id: 'H5', name: 'Sobre-estadía de Puerto', desc: 'Costos almacenaje (30d post-ETA, Alerta 20d)', base: 'ETA', days: 30, alert: 20, mandatory: true },
    { id: 'H6', name: 'Cierre de Costeo', desc: 'Disponibilidad contable (4d post-ETA WH)', base: 'ETAWH', days: 4, alert: 3, mandatory: true },
  ];

  return config.map((c) => {
    let baseDate: Date;
    switch(c.base) {
      case 'ETD': baseDate = etdDate; break;
      case 'ETA': baseDate = etaDate; break;
      case 'ETAWH': baseDate = etaWhDate; break;
      case 'DIM_VAL': baseDate = dimValDate; break;
      default: baseDate = etaDate;
    }
    
    const dueDate = addDays(baseDate, c.days);
    const alertDate = addDays(baseDate, c.alert);

    return {
      id: c.id,
      name: c.name,
      description: c.desc,
      baseHito: c.base as any,
      daysFromBase: c.days,
      alertDaysFromBase: c.alert,
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      alertDate: format(alertDate, 'yyyy-MM-dd'),
      status: MilestoneStatus.PENDING,
      isMandatory: c.mandatory
    };
  });
};

export const getStatus = (milestone: Milestone): MilestoneStatus => {
  if (milestone.completedDate) return MilestoneStatus.COMPLETED;
  
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(milestone.dueDate));
  const alert = startOfDay(new Date(milestone.alertDate));

  if (isAfter(today, due)) return MilestoneStatus.OVERDUE;
  if (isAfter(today, alert) || today.getTime() === alert.getTime()) return MilestoneStatus.ALERT;
  return MilestoneStatus.PENDING;
};

export const calculateKPIs = (shipments: Shipment[]) => {
  if (shipments.length === 0) return { total: 0, deviation: 0, completion: 0, risk: 0 };

  let totalTasks = 0;
  let completedTasks = 0;
  let totalDeviation = 0;
  let riskValue = 0;

  shipments.forEach(s => {
    s.milestones.forEach(m => {
      totalTasks++;
      if (m.completedDate) {
        completedTasks++;
        const due = new Date(m.dueDate);
        const comp = new Date(m.completedDate);
        if (isAfter(comp, due)) {
          totalDeviation += differenceInDays(comp, due);
        }
      } else {
        const currentStatus = getStatus(m);
        if (currentStatus === MilestoneStatus.OVERDUE) riskValue += 650; 
        if (currentStatus === MilestoneStatus.ALERT) riskValue += 500;
      }
    });
  });

  return {
    total: shipments.length,
    deviation: completedTasks > 0 ? (totalDeviation / completedTasks).toFixed(1) : "0",
    completion: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    risk: riskValue
  };
};
