import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  Wrench,
  Package,
  Shield,
  FileWarning,
} from 'lucide-react';

const navItems = [
  { id: 'riskoverview', label: '风险总览', icon: Shield },
  { id: 'showcases', label: '展柜台账', icon: LayoutDashboard },
  { id: 'inspections', label: '巡查计划', icon: ClipboardList },
  { id: 'alarms', label: '报警趋势', icon: AlertTriangle },
  { id: 'repairs', label: '维修工单', icon: Wrench },
  { id: 'newarrivals', label: '上新限制', icon: Package },
  { id: 'insurance', label: '保险报备', icon: FileWarning },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();

  return (
    <div className="w-60 bg-burgundy-800 text-white flex flex-col">
      <div className="p-6 border-b border-burgundy-700">
        <h1 className="text-xl font-bold text-gold-400">珠宝展柜保养</h1>
        <p className="text-sm text-burgundy-200 mt-1">管理系统</p>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = state.currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: item.id })}
              className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-burgundy-700 text-gold-400 border-r-4 border-gold-500'
                  : 'text-burgundy-100 hover:bg-burgundy-700 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-burgundy-700">
        <div className="bg-burgundy-900 rounded-lg p-3">
          <div className="text-xs text-burgundy-300 mb-1">今日待处理</div>
          <div className="flex justify-between text-sm">
            <span className="text-white">
              报警：
              <span className="text-red-400 font-bold">
                {state.alarms.filter((a) => a.status === 'active').length}
              </span>
            </span>
            <span className="text-white">
              维修：
              <span className="text-yellow-400 font-bold">
                {state.repairOrders.filter((r) => r.status !== 'completed' && r.status !== 'closed').length}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
