export type Role = 'manager' | 'staff' | 'repair' | 'security';

export interface ValuableItem {
  id: string;
  showcaseId: string;
  showcaseName: string;
  name: string;
  code: string;
  type: string;
  value: number;
  status: 'on_display' | 'in_storage' | 'sold';
  addedAt: string;
}

export interface Showcase {
  id: string;
  name: string;
  code: string;
  location: string;
  type: string;
  status: 'normal' | 'warning' | 'alarm' | 'maintenance';
  temperature: number;
  humidity: number;
  tempThreshold: { min: number; max: number };
  humidityThreshold: { min: number; max: number };
  lastInspection: string;
  lastMaintenance: string;
  hasActiveAlarm: boolean;
  hasOpenRepair: boolean;
  newArrivalFrozen: boolean;
}

export interface InspectionPlan {
  id: string;
  showcaseId: string;
  showcaseName: string;
  items: string[];
  frequency: string;
  assignedTo: string;
  nextInspection: string;
  lastCompleted: string | null;
  status: 'scheduled' | 'overdue' | 'completed' | 'missed';
  missedCount: number;
}

export interface InspectionPhoto {
  id: string;
  url: string;
  label: string;
  tag: 'environment' | 'equipment' | 'abnormal' | 'other';
  uploadedAt: string;
  uploadedBy: string;
}

export interface InspectionReview {
  id: string;
  reviewer: string;
  reviewTime: string;
  status: 'approved' | 'rejected';
  comment: string;
}

export interface InspectionRecord {
  id: string;
  planId: string;
  showcaseId: string;
  showcaseName: string;
  inspector: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  itemsChecked: string[];
  abnormalities: string[];
  notes: string;
  photos: InspectionPhoto[];
  isMakeup: boolean;
  makeupReason?: string;
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'not_required';
  reviews: InspectionReview[];
  locationVerified: boolean;
}

export interface InsuranceClaim {
  id: string;
  showcaseId: string;
  showcaseName: string;
  alarmId?: string;
  type: 'temperature_risk' | 'humidity_risk' | 'equipment_failure' | 'security_breach' | 'other';
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  reportedBy: string;
  reportedAt: string;
  estimatedLoss?: number;
  handler?: string;
  handlerComment?: string;
  relatedRepairIds: string[];
  relatedAlarmIds: string[];
}

export interface Alarm {
  id: string;
  showcaseId: string;
  showcaseName: string;
  type: 'temperature' | 'humidity' | 'security' | 'equipment';
  level: 'low' | 'medium' | 'high';
  status: 'active' | 'acknowledged' | 'resolved';
  message: string;
  value: number;
  threshold: number;
  startTime: string;
  acknowledgedTime: string | null;
  resolvedTime: string | null;
  acknowledgedBy: string | null;
  resolvedBy: string | null;
  continuousCount: number;
}

export interface RepairOrder {
  id: string;
  showcaseId: string;
  showcaseName: string;
  type: 'lighting' | 'lock' | 'temperature' | 'humidity' | 'other';
  status: 'pending' | 'in_progress' | 'parts_ordered' | 'completed' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  reporter: string;
  reportedAt: string;
  assignedTo: string;
  estimatedCompletion: string;
  actualCompletion: string | null;
  progressNotes: { time: string; note: string; author: string }[];
  escalated: boolean;
  overdue: boolean;
}

export interface NewArrivalPlan {
  id: string;
  showcaseId: string;
  showcaseName: string;
  productName: string;
  productCode: string;
  plannedDate: string;
  status: 'planned' | 'frozen' | 'completed' | 'cancelled';
  frozenReason: string | null;
  frozenAt: string | null;
  createdAt: string;
  createdBy: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
}

export interface AppState {
  showcases: Showcase[];
  inspectionPlans: InspectionPlan[];
  inspectionRecords: InspectionRecord[];
  alarms: Alarm[];
  repairOrders: RepairOrder[];
  newArrivalPlans: NewArrivalPlan[];
  insuranceClaims: InsuranceClaim[];
  valuableItems: ValuableItem[];
  currentUser: User;
  currentView: string;
}
