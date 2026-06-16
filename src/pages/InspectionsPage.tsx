import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InspectionPlan, InspectionRecord } from '../types';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  List,
  AlertOctagon,
} from 'lucide-react';

const statusConfig = {
  scheduled: { label: '待巡查', color: 'bg-blue-100 text-blue-700', icon: Clock },
  overdue: { label: '已逾期', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  missed: { label: '漏检', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function InspectionsPage() {
  const { state, dispatch } = useApp();
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InspectionPlan | null>(null);
  const [recordForm, setRecordForm] = useState({
    temperature: '',
    humidity: '',
    notes: '',
    itemsChecked: [] as string[],
  });

  const missedPlans = state.inspectionPlans.filter((p) => p.status === 'missed');
  const overduePlans = state.inspectionPlans.filter((p) => p.status === 'overdue');

  const handleStartRecord = (plan: InspectionPlan) => {
    setSelectedPlan(plan);
    setRecordForm({
      temperature: '',
      humidity: '',
      notes: '',
      itemsChecked: plan.items,
    });
    setShowRecordModal(true);
  };

  const handleSubmitRecord = () => {
    if (!selectedPlan) return;

    const showcase = state.showcases.find((s) => s.id === selectedPlan.showcaseId);
    if (!showcase) return;

    const temp = parseFloat(recordForm.temperature);
    const hum = parseFloat(recordForm.humidity);

    const abnormalities: string[] = [];
    if (temp > showcase.tempThreshold.max || temp < showcase.tempThreshold.min) {
      abnormalities.push('温度异常');
    }
    if (hum > showcase.humidityThreshold.max || hum < showcase.humidityThreshold.min) {
      abnormalities.push('湿度异常');
    }

    const newRecord: InspectionRecord = {
      id: `r-${Date.now()}`,
      planId: selectedPlan.id,
      showcaseId: selectedPlan.showcaseId,
      showcaseName: selectedPlan.showcaseName,
      inspector: state.currentUser.name,
      timestamp: new Date().toLocaleString('zh-CN'),
      temperature: temp,
      humidity: hum,
      itemsChecked: recordForm.itemsChecked,
      abnormalities,
      notes: recordForm.notes,
    };

    dispatch({ type: 'ADD_INSPECTION_RECORD', payload: newRecord });
    setShowRecordModal(false);
    setSelectedPlan(null);
  };

  const toggleItem = (item: string) => {
    setRecordForm((prev) => ({
      ...prev,
      itemsChecked: prev.itemsChecked.includes(item)
        ? prev.itemsChecked.filter((i) => i !== item)
        : [...prev.itemsChecked, item],
    }));
  };

  const planRecords = (planId: string) => {
    return state.inspectionRecords
      .filter((r) => r.planId === planId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  };

  return (
    <div className="p-6">
      {missedPlans.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertOctagon className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <div className="font-medium text-red-800">巡查漏检提醒</div>
            <div className="text-sm text-red-600 mt-1">
              共有 {missedPlans.length} 个展柜存在漏检情况，请尽快安排补检
            </div>
            <div className="text-sm text-red-500 mt-1">
              漏检展柜：{missedPlans.map((p) => p.showcaseName).join('、')}
            </div>
          </div>
        </div>
      )}

      {overduePlans.length > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <div className="font-medium text-yellow-800">巡查逾期提醒</div>
            <div className="text-sm text-yellow-600 mt-1">
              共有 {overduePlans.length} 个巡查计划已逾期，请尽快执行
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="巡查计划" value={state.inspectionPlans.length} color="blue" />
        <StatCard title="待巡查" value={state.inspectionPlans.filter((p) => p.status === 'scheduled').length} color="gray" />
        <StatCard title="已逾期" value={overduePlans.length} color="yellow" />
        <StatCard title="漏检数" value={missedPlans.length} color="red" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">巡查计划列表</h3>
          <div className="text-sm text-gray-500">
            按展柜管理巡查任务
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {state.inspectionPlans.map((plan) => (
            <div key={plan.id}>
              <div
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedPlan === plan.id ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">
                          {plan.showcaseName}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[plan.status].color}`}>
                          {statusConfig[plan.status].label}
                        </span>
                        {plan.missedCount > 0 && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            漏检 {plan.missedCount} 次
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <List size={12} />
                          {plan.items.length} 项巡查内容
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {plan.frequency}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {plan.assignedTo}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">下次巡查</div>
                      <div className="text-sm font-medium text-gray-700">
                        {plan.nextInspection}
                      </div>
                    </div>
                    {(plan.status === 'scheduled' || plan.status === 'overdue' || plan.status === 'missed') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRecord(plan);
                        }}
                        className="px-3 py-1.5 bg-gold-500 text-white text-sm rounded-lg hover:bg-gold-600 transition-colors"
                      >
                        记录巡查
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {expandedPlan === plan.id && (
                <div className="bg-gray-50 p-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">巡查项</h5>
                      <div className="flex flex-wrap gap-2">
                        {plan.items.map((item) => (
                          <span
                            key={item}
                            className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                      {plan.lastCompleted && (
                        <div className="mt-3 text-sm text-gray-500">
                          上次完成：{plan.lastCompleted}
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">最近巡查记录</h5>
                      <div className="space-y-2">
                        {planRecords(plan.id).length > 0 ? (
                          planRecords(plan.id).map((record) => (
                            <div
                              key={record.id}
                              className="bg-white rounded p-2 text-sm border border-gray-200"
                            >
                              <div className="flex justify-between">
                                <span className="text-gray-500">{record.timestamp}</span>
                                <span className="text-gray-600">{record.inspector}</span>
                              </div>
                              <div className="flex gap-3 mt-1">
                                <span>温度: {record.temperature}°C</span>
                                <span>湿度: {record.humidity}%</span>
                              </div>
                              {record.abnormalities.length > 0 && (
                                <div className="text-red-500 text-xs mt-1">
                                  异常：{record.abnormalities.join('、')}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-400">暂无巡查记录</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showRecordModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">记录巡查 - {selectedPlan.showcaseName}</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  温度 (°C)
                </label>
                <input
                  type="number"
                  value={recordForm.temperature}
                  onChange={(e) =>
                    setRecordForm((prev) => ({ ...prev, temperature: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="请输入温度"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  湿度 (%RH)
                </label>
                <input
                  type="number"
                  value={recordForm.humidity}
                  onChange={(e) =>
                    setRecordForm((prev) => ({ ...prev, humidity: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="请输入湿度"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  巡查项目
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedPlan.items.map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleItem(item)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        recordForm.itemsChecked.includes(item)
                          ? 'bg-gold-100 border-gold-300 text-gold-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  value={recordForm.notes}
                  onChange={(e) =>
                    setRecordForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  rows={3}
                  placeholder="如有异常请详细描述"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowRecordModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitRecord}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
              >
                提交记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    gray: 'text-gray-600 bg-gray-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    red: 'text-red-600 bg-red-50',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className={`text-2xl font-bold ${colorClasses[color].split(' ')[0]}`}>
        {value}
      </div>
      <div className="text-sm text-gray-500 mt-1">{title}</div>
    </div>
  );
}
