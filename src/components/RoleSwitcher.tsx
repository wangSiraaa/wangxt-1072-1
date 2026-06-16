import { useApp } from '../context/AppContext';
import { Role } from '../types';

const roleLabels: Record<Role, string> = {
  manager: '店长',
  staff: '店员',
  repair: '维修商',
  security: '安保负责人',
};

const roleDescriptions: Record<Role, string> = {
  manager: '全面管理展柜运营、巡查计划、维修工单和上新安排',
  staff: '执行巡查任务，记录温湿度，上报异常',
  repair: '处理维修工单，更新进度，完成维修',
  security: '查看安防报警，确认安全状态',
};

export default function RoleSwitcher() {
  const { state, switchRole } = useApp();

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-sm font-medium text-gray-700">
          <span className="text-2xl mr-2">{state.currentUser.avatar}</span>
          {state.currentUser.name}
        </div>
        <div className="text-xs text-gray-500">
          {roleLabels[state.currentUser.role]}
        </div>
      </div>
      <div className="flex gap-1">
        {(Object.keys(roleLabels) as Role[]).map((role) => (
          <button
            key={role}
            onClick={() => switchRole(role)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              state.currentUser.role === role
                ? 'bg-gold-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={roleDescriptions[role]}
          >
            {roleLabels[role]}
          </button>
        ))}
      </div>
    </div>
  );
}
