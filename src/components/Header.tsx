import RoleSwitcher from './RoleSwitcher';
import { useApp } from '../context/AppContext';
import { Bell } from 'lucide-react';

export default function Header() {
  const { state } = useApp();
  const activeAlarmCount = state.alarms.filter((a) => a.status === 'active').length;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {getViewTitle(state.currentView)}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Bell className="text-gray-500 hover:text-gray-700 cursor-pointer" size={20} />
          {activeAlarmCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {activeAlarmCount}
            </span>
          )}
        </div>
        <RoleSwitcher />
      </div>
    </header>
  );
}

function getViewTitle(view: string): string {
  const titles: Record<string, string> = {
    showcases: '展柜台账',
    inspections: '巡查计划',
    alarms: '报警趋势',
    repairs: '维修工单',
    newarrivals: '上新限制',
  };
  return titles[view] || '';
}
