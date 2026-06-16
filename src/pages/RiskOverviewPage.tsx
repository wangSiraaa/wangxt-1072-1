import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  Wrench,
  Package,
  ShieldCheck,
  Clock,
  ChevronRight,
  Thermometer,
  Droplets,
  Lock,
  Lightbulb,
  TrendingDown,
  CheckCircle,
  XCircle,
  ArrowRight,
  AlertOctagon,
  FileWarning,
  Eye,
} from 'lucide-react';

const riskLevelConfig = {
  high: { label: '高风险', color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-50', borderColor: 'border-red-200' },
  medium: { label: '中风险', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgLight: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  low: { label: '低风险', color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50', borderColor: 'border-blue-200' },
  none: { label: '正常', color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-50', borderColor: 'border-green-200' },
};

export default function RiskOverviewPage() {
  const { state } = useApp();
  const [selectedShowcase, setSelectedShowcase] = useState<string | null>(null);

  const getShowcaseRiskLevel = (showcaseId: string) => {
    const activeAlarms = state.alarms.filter(
      (a) => a.showcaseId === showcaseId && a.status === 'active'
    );
    const openRepairs = state.repairOrders.filter(
      (r) =>
        r.showcaseId === showcaseId && r.status !== 'completed' && r.status !== 'closed'
    );
    const hasHighAlarm = activeAlarms.some((a) => a.level === 'high');
    const hasOverdueRepair = openRepairs.some((r) => r.overdue);

    if (hasHighAlarm || hasOverdueRepair) return 'high';
    if (activeAlarms.length > 0 || openRepairs.length > 0) return 'medium';
    return 'none';
  };

  const getRiskShowcases = () => {
    return state.showcases
      .map((s) => ({
        ...s,
        riskLevel: getShowcaseRiskLevel(s.id),
        activeAlarms: state.alarms.filter(
          (a) => a.showcaseId === s.id && a.status === 'active'
        ),
        openRepairs: state.repairOrders.filter(
          (r) =>
            r.showcaseId === s.id && r.status !== 'completed' && r.status !== 'closed'
        ),
        frozenPlans: state.newArrivalPlans.filter(
          (p) => p.showcaseId === s.id && p.status === 'frozen'
        ),
        valuableItems: state.valuableItems.filter(
          (v) => v.showcaseId === s.id && v.status === 'on_display'
        ),
      }))
      .sort((a, b) => {
        const levelOrder = { high: 0, medium: 1, low: 2, none: 3 };
        return levelOrder[a.riskLevel as keyof typeof levelOrder] - levelOrder[b.riskLevel as keyof typeof levelOrder];
      });
  };

  const riskShowcases = getRiskShowcases();
  const highRiskCount = riskShowcases.filter((s) => s.riskLevel === 'high').length;
  const mediumRiskCount = riskShowcases.filter((s) => s.riskLevel === 'medium').length;
  const frozenCount = state.newArrivalPlans.filter((p) => p.status === 'frozen').length;
  const activeAlarmsCount = state.alarms.filter((a) => a.status === 'active').length;
  const openRepairsCount = state.repairOrders.filter(
    (r) => r.status !== 'completed' && r.status !== 'closed'
  ).length;
  const overdueRepairsCount = state.repairOrders.filter((r) => r.overdue).length;

  const selectedData = riskShowcases.find((s) => s.id === selectedShowcase);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">风险总览</h2>
        <p className="text-sm text-gray-500 mt-1">
          全局展示报警、维修、上新冻结与风险解除的完整链路关系
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard
          title="高风险展柜"
          value={highRiskCount}
          icon={AlertOctagon}
          color="red"
        />
        <StatCard
          title="中风险展柜"
          value={mediumRiskCount}
          icon={AlertTriangle}
          color="yellow"
        />
        <StatCard
          title="活跃报警"
          value={activeAlarmsCount}
          icon={Thermometer}
          color="orange"
        />
        <StatCard
          title="进行中维修"
          value={openRepairsCount}
          icon={Wrench}
          color="blue"
        />
        <StatCard
          title="冻结上新"
          value={frozenCount}
          icon={Package}
          color="purple"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">风险流转链路</h3>
        <div className="flex items-center justify-between">
          <FlowStep
            icon={Thermometer}
            title="触发报警"
            description="温湿度/设备/安防异常"
            count={activeAlarmsCount}
            color="red"
            isActive={activeAlarmsCount > 0}
          />
          <ArrowConnector />
          <FlowStep
            icon={Wrench}
            title="维修处理"
            description="报修→派工→修复"
            count={openRepairsCount}
            color="blue"
            isActive={openRepairsCount > 0}
          />
          <ArrowConnector />
          <FlowStep
            icon={Package}
            title="上新冻结"
            description="风险期间禁止上新"
            count={frozenCount}
            color="purple"
            isActive={frozenCount > 0}
          />
          <ArrowConnector />
          <FlowStep
            icon={ShieldCheck}
            title="风险解除"
            description="修复完成→恢复正常"
            count={state.showcases.length - highRiskCount - mediumRiskCount}
            color="green"
            isActive={false}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">展柜风险状态</h3>
            <p className="text-sm text-gray-500 mt-1">按风险等级排序，点击查看详情</p>
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {riskShowcases.map((showcase) => (
              <div
                key={showcase.id}
                onClick={() => setSelectedShowcase(showcase.id)}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedShowcase === showcase.id ? 'bg-gold-50 border-l-4 border-l-gold-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${riskLevelConfig[showcase.riskLevel as keyof typeof riskLevelConfig].color}`}
                    />
                    <div>
                      <div className="font-medium text-gray-800">{showcase.name}</div>
                      <div className="text-xs text-gray-500">{showcase.code} · {showcase.location}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      {showcase.activeAlarms.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          <AlertTriangle size={12} />
                          {showcase.activeAlarms.length}个报警
                        </span>
                      )}
                      {showcase.openRepairs.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          <Wrench size={12} />
                          {showcase.openRepairs.length}项维修
                        </span>
                      )}
                      {showcase.frozenPlans.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                          <Package size={12} />
                          {showcase.frozenPlans.length}个冻结
                        </span>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Thermometer size={12} />
                    {showcase.temperature}°C
                  </span>
                  <span className="flex items-center gap-1">
                    <Droplets size={12} />
                    {showcase.humidity}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={12} />
                    {showcase.valuableItems.length}件贵重品
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">风险详情</h3>
          </div>
          {selectedData ? (
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              <div className={`p-3 rounded-lg ${riskLevelConfig[selectedData.riskLevel as keyof typeof riskLevelConfig].bgLight} ${riskLevelConfig[selectedData.riskLevel as keyof typeof riskLevelConfig].borderColor} border`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${riskLevelConfig[selectedData.riskLevel as keyof typeof riskLevelConfig].textColor}`}>
                    当前风险等级
                  </span>
                  <span className={`text-sm font-bold ${riskLevelConfig[selectedData.riskLevel as keyof typeof riskLevelConfig].textColor}`}>
                    {riskLevelConfig[selectedData.riskLevel as keyof typeof riskLevelConfig].label}
                  </span>
                </div>
              </div>

              {selectedData.activeAlarms.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-500" />
                    活跃报警 ({selectedData.activeAlarms.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedData.activeAlarms.map((alarm) => (
                      <div key={alarm.id} className="bg-red-50 border border-red-100 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-red-700">
                            {alarm.type === 'temperature' ? '温度报警' :
                             alarm.type === 'humidity' ? '湿度报警' :
                             alarm.type === 'security' ? '安防报警' : '设备报警'}
                          </span>
                          <span className="text-xs text-red-500">
                            连续{alarm.continuousCount}次
                          </span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">{alarm.message}</p>
                        <p className="text-xs text-red-400 mt-1">开始于 {alarm.startTime}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedData.openRepairs.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Wrench size={14} className="text-blue-500" />
                    进行中维修 ({selectedData.openRepairs.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedData.openRepairs.map((repair) => (
                      <div key={repair.id} className={`border rounded-lg p-3 ${
                        repair.overdue ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-100'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${
                            repair.overdue ? 'text-orange-700' : 'text-blue-700'
                          }`}>
                            {repair.type === 'lighting' ? '照明维修' :
                             repair.type === 'lock' ? '锁具维修' :
                             repair.type === 'temperature' ? '温控维修' :
                             repair.type === 'humidity' ? '除湿维修' : '其他维修'}
                          </span>
                          {repair.overdue && (
                            <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
                              已超时
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{repair.description}</p>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>预计完成：{repair.estimatedCompletion}</span>
                          <span>负责人：{repair.assignedTo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedData.frozenPlans.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Package size={14} className="text-purple-500" />
                    冻结上新 ({selectedData.frozenPlans.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedData.frozenPlans.map((plan) => (
                      <div key={plan.id} className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                        <div className="text-sm font-medium text-purple-700">{plan.productName}</div>
                        <p className="text-xs text-purple-600 mt-1">冻结原因：{plan.frozenReason}</p>
                        <p className="text-xs text-purple-400 mt-1">冻结时间：{plan.frozenAt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedData.valuableItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Eye size={14} className="text-amber-500" />
                    在柜贵重品 ({selectedData.valuableItems.length})
                  </h4>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <div className="text-xs text-amber-700 font-medium mb-2">
                      总价值：¥{selectedData.valuableItems.reduce((sum, v) => sum + v.value, 0).toLocaleString()}
                    </div>
                    <div className="space-y-1">
                      {selectedData.valuableItems.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="text-amber-800">{item.name}</span>
                          <span className="text-amber-600">¥{item.value.toLocaleString()}</span>
                        </div>
                      ))}
                      {selectedData.valuableItems.length > 3 && (
                        <div className="text-xs text-amber-500">
                          还有 {selectedData.valuableItems.length - 3} 件...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedData.riskLevel === 'none' && (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle size={40} className="mx-auto mb-2 text-green-400" />
                  <p className="text-sm">该展柜运行正常，无风险</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <ShieldCheck size={40} className="mx-auto mb-2" />
              <p className="text-sm">请选择一个展柜查看风险详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
  );
}

function FlowStep({
  icon: Icon,
  title,
  description,
  count,
  color,
  isActive,
}: {
  icon: any;
  title: string;
  description: string;
  count: number;
  color: string;
  isActive: boolean;
}) {
  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  };

  const cls = colorClasses[color];

  return (
    <div className="flex-1 text-center">
      <div
        className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
          isActive ? `${cls.bg} ${cls.text} border-2 ${cls.border}` : 'bg-gray-100 text-gray-400'
        }`}
      >
        <Icon size={28} />
      </div>
      <div className="mt-3 font-medium text-gray-800">{title}</div>
      <div className="text-xs text-gray-500 mt-1">{description}</div>
      <div
        className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-bold ${
          isActive ? `${cls.bg} ${cls.text}` : 'bg-gray-100 text-gray-400'
        }`}
      >
        {count}
      </div>
    </div>
  );
}

function ArrowConnector() {
  return (
    <div className="flex-shrink-0 px-2">
      <ArrowRight size={24} className="text-gray-300" />
    </div>
  );
}
