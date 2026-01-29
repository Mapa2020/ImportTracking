
export enum MilestoneStatus {
  PENDING = 'PENDING',
  ALERT = 'ALERT',
  OVERDUE = 'OVERDUE',
  COMPLETED = 'COMPLETED'
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  baseHito: 'ETD' | 'ETA' | 'ETAWH' | 'DIM_VAL';
  daysFromBase: number;
  alertDaysFromBase: number;
  dueDate: string;
  alertDate: string;
  completedDate?: string;
  status: MilestoneStatus;
  isMandatory: boolean;
  emailSent?: boolean; // Rastro de notificación automática
}

export interface Shipment {
  id: string;
  identifier: string; // BL or Reference Number
  origin: string;
  destination: string;
  etd: string;
  etaPuerto: string;
  etaWh: string;
  dimValidationDate: string; 
  milestones: Milestone[];
  createdAt: string;
  totalRisk?: number;
}

export interface KPIStats {
  totalShipments: number;
  avgDeviationDays: number;
  taskCompletionRate: number;
  riskValue: number;
}
