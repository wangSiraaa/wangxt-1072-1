import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  AppState,
  Showcase,
  InspectionPlan,
  InspectionRecord,
  Alarm,
  RepairOrder,
  NewArrivalPlan,
  User,
  Role,
  InsuranceClaim,
  ValuableItem,
  InspectionReview,
} from '../types';
import {
  mockShowcases,
  mockInspectionPlans,
  mockInspectionRecords,
  mockAlarms,
  mockRepairOrders,
  mockNewArrivalPlans,
  mockUsers,
  mockInsuranceClaims,
  mockValuableItems,
} from '../data/mockData';

type Action =
  | { type: 'SET_CURRENT_USER'; payload: User }
  | { type: 'SET_CURRENT_VIEW'; payload: string }
  | { type: 'ADD_ALARM'; payload: Alarm }
  | { type: 'ACKNOWLEDGE_ALARM'; payload: { alarmId: string; userId: string; userName: string } }
  | { type: 'RESOLVE_ALARM'; payload: { alarmId: string; userId: string; userName: string } }
  | { type: 'UPDATE_REPAIR_ORDER'; payload: RepairOrder }
  | { type: 'ADD_REPAIR_PROGRESS'; payload: { orderId: string; note: string; author: string } }
  | { type: 'COMPLETE_REPAIR'; payload: { orderId: string; userId: string } }
  | { type: 'ESCALATE_REPAIR'; payload: { orderId: string } }
  | { type: 'ADD_INSPECTION_RECORD'; payload: InspectionRecord }
  | { type: 'UPDATE_INSPECTION_PLAN'; payload: InspectionPlan }
  | { type: 'FREEZE_NEW_ARRIVAL'; payload: { planId: string; reason: string } }
  | { type: 'UNFREEZE_NEW_ARRIVAL'; payload: { planId: string } }
  | { type: 'COMPLETE_NEW_ARRIVAL'; payload: { planId: string } }
  | { type: 'UPDATE_SHOWCASE'; payload: Showcase }
  | { type: 'RECORD_TEMPERATURE'; payload: { showcaseId: string; temperature: number; humidity: number } }
  | { type: 'ADD_INSPECTION_PHOTO'; payload: { recordId: string; photo: { label: string; url: string; tag: 'environment' | 'equipment' | 'abnormal' | 'other' } } }
  | { type: 'MAKEUP_INSPECTION'; payload: InspectionRecord }
  | { type: 'REVIEW_INSPECTION'; payload: { recordId: string; review: InspectionReview } }
  | { type: 'ADD_INSURANCE_CLAIM'; payload: InsuranceClaim }
  | { type: 'UPDATE_INSURANCE_CLAIM'; payload: InsuranceClaim }
  | { type: 'SUBMIT_INSURANCE_CLAIM'; payload: { claimId: string; userId: string; userName: string } };

const initialState: AppState = {
  showcases: mockShowcases,
  inspectionPlans: mockInspectionPlans,
  inspectionRecords: mockInspectionRecords,
  alarms: mockAlarms,
  repairOrders: mockRepairOrders,
  newArrivalPlans: mockNewArrivalPlans,
  insuranceClaims: mockInsuranceClaims,
  valuableItems: mockValuableItems,
  currentUser: mockUsers[0],
  currentView: 'showcases',
};

function checkShowcaseStatus(showcase: Showcase, alarms: Alarm[]): Showcase {
  const hasActiveAlarm = alarms.some(
    (a) => a.showcaseId === showcase.id && a.status === 'active'
  );
  const hasOpenRepair = mockRepairOrders.some(
    (r) => r.showcaseId === showcase.id && r.status !== 'completed' && r.status !== 'closed'
  );

  let status: Showcase['status'] = 'normal';
  if (hasOpenRepair && !hasActiveAlarm) {
    status = 'maintenance';
  } else if (hasActiveAlarm) {
    status = 'alarm';
  } else if (
    showcase.temperature > showcase.tempThreshold.max ||
    showcase.temperature < showcase.tempThreshold.min ||
    showcase.humidity > showcase.humidityThreshold.max ||
    showcase.humidity < showcase.humidityThreshold.min
  ) {
    status = 'warning';
  }

  return {
    ...showcase,
    status,
    hasActiveAlarm,
    hasOpenRepair,
    newArrivalFrozen: hasActiveAlarm || hasOpenRepair,
  };
}

function checkAndCreateAlarms(
  showcases: Showcase[],
  inspectionRecords: InspectionRecord[],
  alarms: Alarm[]
): Alarm[] {
  const newAlarms: Alarm[] = [...alarms];

  showcases.forEach((showcase) => {
    const recentRecords = inspectionRecords
      .filter((r) => r.showcaseId === showcase.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 2);

    if (recentRecords.length >= 2) {
      const allTempHigh = recentRecords.every(
        (r) => r.temperature > showcase.tempThreshold.max
      );
      const allHumidityHigh = recentRecords.every(
        (r) => r.humidity > showcase.humidityThreshold.max
      );

      if (allTempHigh) {
        const existingAlarm = newAlarms.find(
          (a) => a.showcaseId === showcase.id && a.type === 'temperature' && a.status === 'active'
        );
        if (!existingAlarm) {
          newAlarms.push({
            id: `a-${Date.now()}-${showcase.id}-temp`,
            showcaseId: showcase.id,
            showcaseName: showcase.name,
            type: 'temperature',
            level: 'high',
            status: 'active',
            message: '温度连续2次超过上限阈值',
            value: recentRecords[0].temperature,
            threshold: showcase.tempThreshold.max,
            startTime: recentRecords[recentRecords.length - 1].timestamp,
            acknowledgedTime: null,
            resolvedTime: null,
            acknowledgedBy: null,
            resolvedBy: null,
            continuousCount: recentRecords.length,
          });
        }
      }

      if (allHumidityHigh) {
        const existingAlarm = newAlarms.find(
          (a) => a.showcaseId === showcase.id && a.type === 'humidity' && a.status === 'active'
        );
        if (!existingAlarm) {
          newAlarms.push({
            id: `a-${Date.now()}-${showcase.id}-hum`,
            showcaseId: showcase.id,
            showcaseName: showcase.name,
            type: 'humidity',
            level: 'high',
            status: 'active',
            message: '湿度连续2次超过上限阈值',
            value: recentRecords[0].humidity,
            threshold: showcase.humidityThreshold.max,
            startTime: recentRecords[recentRecords.length - 1].timestamp,
            acknowledgedTime: null,
            resolvedTime: null,
            acknowledgedBy: null,
            resolvedBy: null,
            continuousCount: recentRecords.length,
          });
        }
      }
    }
  });

  return newAlarms;
}

function checkNewArrivalFreeze(
  newArrivalPlans: NewArrivalPlan[],
  showcases: Showcase[],
  alarms: Alarm[],
  repairOrders: RepairOrder[]
): NewArrivalPlan[] {
  return newArrivalPlans.map((plan) => {
    if (plan.status === 'completed' || plan.status === 'cancelled') return plan;

    const showcase = showcases.find((s) => s.id === plan.showcaseId);
    const hasActiveAlarm = alarms.some(
      (a) => a.showcaseId === plan.showcaseId && a.status === 'active'
    );
    const hasOpenRepair = repairOrders.some(
      (r) =>
        r.showcaseId === plan.showcaseId &&
        r.status !== 'completed' &&
        r.status !== 'closed'
    );

    if ((hasActiveAlarm || hasOpenRepair) && plan.status !== 'frozen') {
      let reason = '';
      if (hasActiveAlarm) reason = '存在未处理报警，安全不达标';
      if (hasOpenRepair) reason = reason ? reason + '；设备维修中' : '设备维修中';
      return {
        ...plan,
        status: 'frozen',
        frozenReason: reason,
        frozenAt: new Date().toISOString(),
      };
    }

    if (!hasActiveAlarm && !hasOpenRepair && plan.status === 'frozen' && plan.frozenReason?.includes('报警')) {
      return {
        ...plan,
        status: 'planned',
        frozenReason: null,
        frozenAt: null,
      };
    }

    return plan;
  });
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };

    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };

    case 'ADD_ALARM': {
      const newAlarms = [...state.alarms, action.payload];
      const updatedShowcases = state.showcases.map((s) =>
        checkShowcaseStatus(s, newAlarms)
      );
      const updatedNewArrivals = checkNewArrivalFreeze(
        state.newArrivalPlans,
        updatedShowcases,
        newAlarms,
        state.repairOrders
      );
      return {
        ...state,
        alarms: newAlarms,
        showcases: updatedShowcases,
        newArrivalPlans: updatedNewArrivals,
      };
    }

    case 'ACKNOWLEDGE_ALARM': {
      const updatedAlarms = state.alarms.map((a) =>
        a.id === action.payload.alarmId
          ? {
              ...a,
              status: 'acknowledged' as const,
              acknowledgedTime: new Date().toISOString(),
              acknowledgedBy: action.payload.userName,
            }
          : a
      );
      return { ...state, alarms: updatedAlarms };
    }

    case 'RESOLVE_ALARM': {
      const updatedAlarms = state.alarms.map((a) =>
        a.id === action.payload.alarmId
          ? {
              ...a,
              status: 'resolved' as const,
              resolvedTime: new Date().toISOString(),
              resolvedBy: action.payload.userName,
            }
          : a
      );
      const updatedShowcases = state.showcases.map((s) =>
        checkShowcaseStatus(s, updatedAlarms)
      );
      const updatedNewArrivals = checkNewArrivalFreeze(
        state.newArrivalPlans,
        updatedShowcases,
        updatedAlarms,
        state.repairOrders
      );
      return {
        ...state,
        alarms: updatedAlarms,
        showcases: updatedShowcases,
        newArrivalPlans: updatedNewArrivals,
      };
    }

    case 'UPDATE_REPAIR_ORDER': {
      const updatedRepairOrders = state.repairOrders.map((r) =>
        r.id === action.payload.id ? action.payload : r
      );
      const updatedShowcases = state.showcases.map((s) =>
        checkShowcaseStatus(s, state.alarms)
      );
      const updatedNewArrivals = checkNewArrivalFreeze(
        state.newArrivalPlans,
        updatedShowcases,
        state.alarms,
        updatedRepairOrders
      );
      return {
        ...state,
        repairOrders: updatedRepairOrders,
        showcases: updatedShowcases,
        newArrivalPlans: updatedNewArrivals,
      };
    }

    case 'ADD_REPAIR_PROGRESS': {
      const updatedRepairOrders = state.repairOrders.map((r) =>
        r.id === action.payload.orderId
          ? {
              ...r,
              progressNotes: [
                ...r.progressNotes,
                {
                  time: new Date().toISOString(),
                  note: action.payload.note,
                  author: action.payload.author,
                },
              ],
            }
          : r
      );
      return { ...state, repairOrders: updatedRepairOrders };
    }

    case 'COMPLETE_REPAIR': {
      const updatedRepairOrders = state.repairOrders.map((r) =>
        r.id === action.payload.orderId
          ? {
              ...r,
              status: 'completed' as const,
              actualCompletion: new Date().toISOString(),
              progressNotes: [
                ...r.progressNotes,
                {
                  time: new Date().toISOString(),
                  note: '维修完成，已验收',
                  author: '系统',
                },
              ],
            }
          : r
      );
      const updatedShowcases = state.showcases.map((s) =>
        checkShowcaseStatus(s, state.alarms)
      );
      const updatedNewArrivals = checkNewArrivalFreeze(
        state.newArrivalPlans,
        updatedShowcases,
        state.alarms,
        updatedRepairOrders
      );
      return {
        ...state,
        repairOrders: updatedRepairOrders,
        showcases: updatedShowcases,
        newArrivalPlans: updatedNewArrivals,
      };
    }

    case 'ESCALATE_REPAIR': {
      const updatedRepairOrders = state.repairOrders.map((r) =>
        r.id === action.payload.orderId
          ? {
              ...r,
              escalated: true,
              priority: 'urgent' as const,
              progressNotes: [
                ...r.progressNotes,
                {
                  time: new Date().toISOString(),
                  note: '维修超时，已升级为紧急优先级',
                  author: '系统',
                },
              ],
            }
          : r
      );
      return { ...state, repairOrders: updatedRepairOrders };
    }

    case 'ADD_INSPECTION_RECORD': {
      const updatedRecords = [...state.inspectionRecords, action.payload];
      const updatedAlarms = checkAndCreateAlarms(
        state.showcases,
        updatedRecords,
        state.alarms
      );
      const updatedPlans = state.inspectionPlans.map((p) =>
        p.id === action.payload.planId
          ? {
              ...p,
              lastCompleted: action.payload.timestamp,
              status: 'scheduled' as const,
              missedCount: 0,
            }
          : p
      );
      const updatedShowcases = state.showcases.map((s) =>
        s.id === action.payload.showcaseId
          ? {
              ...s,
              temperature: action.payload.temperature,
              humidity: action.payload.humidity,
              lastInspection: action.payload.timestamp,
            }
          : s
      );
      const finalShowcases = updatedShowcases.map((s) =>
        checkShowcaseStatus(s, updatedAlarms)
      );
      const updatedNewArrivals = checkNewArrivalFreeze(
        state.newArrivalPlans,
        finalShowcases,
        updatedAlarms,
        state.repairOrders
      );
      return {
        ...state,
        inspectionRecords: updatedRecords,
        inspectionPlans: updatedPlans,
        alarms: updatedAlarms,
        showcases: finalShowcases,
        newArrivalPlans: updatedNewArrivals,
      };
    }

    case 'UPDATE_INSPECTION_PLAN': {
      const updatedPlans = state.inspectionPlans.map((p) =>
        p.id === action.payload.id ? action.payload : p
      );
      return { ...state, inspectionPlans: updatedPlans };
    }

    case 'FREEZE_NEW_ARRIVAL': {
      const updatedPlans = state.newArrivalPlans.map((p) =>
        p.id === action.payload.planId
          ? {
              ...p,
              status: 'frozen' as const,
              frozenReason: action.payload.reason,
              frozenAt: new Date().toISOString(),
            }
          : p
      );
      return { ...state, newArrivalPlans: updatedPlans };
    }

    case 'UNFREEZE_NEW_ARRIVAL': {
      const updatedPlans = state.newArrivalPlans.map((p) =>
        p.id === action.payload.planId
          ? { ...p, status: 'planned' as const, frozenReason: null, frozenAt: null }
          : p
      );
      return { ...state, newArrivalPlans: updatedPlans };
    }

    case 'COMPLETE_NEW_ARRIVAL': {
      const updatedPlans = state.newArrivalPlans.map((p) =>
        p.id === action.payload.planId
          ? { ...p, status: 'completed' as const }
          : p
      );
      return { ...state, newArrivalPlans: updatedPlans };
    }

    case 'UPDATE_SHOWCASE':
      return {
        ...state,
        showcases: state.showcases.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };

    case 'RECORD_TEMPERATURE': {
      const updatedShowcases = state.showcases.map((s) =>
        s.id === action.payload.showcaseId
          ? {
              ...s,
              temperature: action.payload.temperature,
              humidity: action.payload.humidity,
            }
          : s
      );
      return { ...state, showcases: updatedShowcases };
    }

    case 'ADD_INSPECTION_PHOTO': {
      const updatedRecords = state.inspectionRecords.map((r) =>
        r.id === action.payload.recordId
          ? {
              ...r,
              photos: [
                ...r.photos,
                {
                  id: `ph-${Date.now()}`,
                  url: action.payload.photo.url,
                  label: action.payload.photo.label,
                  tag: action.payload.photo.tag,
                  uploadedAt: new Date().toLocaleString('zh-CN'),
                  uploadedBy: state.currentUser.name,
                },
              ],
            }
          : r
      );
      return { ...state, inspectionRecords: updatedRecords };
    }

    case 'MAKEUP_INSPECTION': {
      const updatedRecords = [...state.inspectionRecords, action.payload];
      const updatedAlarms = checkAndCreateAlarms(
        state.showcases,
        updatedRecords,
        state.alarms
      );
      const updatedShowcases = state.showcases.map((s) =>
        s.id === action.payload.showcaseId
          ? {
              ...s,
              temperature: action.payload.temperature,
              humidity: action.payload.humidity,
              lastInspection: action.payload.timestamp,
            }
          : s
      );
      const finalShowcases = updatedShowcases.map((s) =>
        checkShowcaseStatus(s, updatedAlarms)
      );
      const updatedNewArrivals = checkNewArrivalFreeze(
        state.newArrivalPlans,
        finalShowcases,
        updatedAlarms,
        state.repairOrders
      );
      const updatedPlans = state.inspectionPlans.map((p) =>
        p.id === action.payload.planId
          ? { ...p, status: 'completed' as const, missedCount: 0, lastCompleted: action.payload.timestamp }
          : p
      );
      return {
        ...state,
        inspectionRecords: updatedRecords,
        inspectionPlans: updatedPlans,
        alarms: updatedAlarms,
        showcases: finalShowcases,
        newArrivalPlans: updatedNewArrivals,
      };
    }

    case 'REVIEW_INSPECTION': {
      const updatedRecords = state.inspectionRecords.map((r) =>
        r.id === action.payload.recordId
          ? {
              ...r,
              reviews: [...r.reviews, action.payload.review],
              reviewStatus: action.payload.review.status,
            }
          : r
      );
      return { ...state, inspectionRecords: updatedRecords };
    }

    case 'ADD_INSURANCE_CLAIM': {
      return {
        ...state,
        insuranceClaims: [...state.insuranceClaims, action.payload],
      };
    }

    case 'UPDATE_INSURANCE_CLAIM': {
      const updatedClaims = state.insuranceClaims.map((c) =>
        c.id === action.payload.id ? action.payload : c
      );
      return { ...state, insuranceClaims: updatedClaims };
    }

    case 'SUBMIT_INSURANCE_CLAIM': {
      const updatedClaims = state.insuranceClaims.map((c) =>
        c.id === action.payload.claimId
          ? {
              ...c,
              status: 'submitted' as const,
              reportedBy: action.payload.userName,
              reportedAt: new Date().toLocaleString('zh-CN'),
            }
          : c
      );
      return { ...state, insuranceClaims: updatedClaims };
    }

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  switchRole: (role: Role) => void;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const switchRole = (role: Role) => {
    const user = mockUsers.find((u) => u.role === role);
    if (user) {
      dispatch({ type: 'SET_CURRENT_USER', payload: user });
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, switchRole }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
