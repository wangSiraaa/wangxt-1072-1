import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NewArrivalPlan, Alarm, RepairOrder, AppState } from '../types';
import {
  Package,
  Snowflake,
  CheckCircle,
  Clock,
  User,
  AlertTriangle,
  Lock,
  Unlock,
  Calendar,
  XCircle,
  Play,
} from 'lucide-react';

const statusConfig = {
  planned: { label: '计划中', color: 'bg-blue-100 text-blue-700' },
  frozen: { label: '已冻结', color: 'bg-orange-100 text-orange-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-500' },
};

function getShowcaseBlockers(
  showcaseId: string,
  alarms: AppState['alarms'],
  repairOrders: AppState['repairOrders']
): { hasActiveAlarm: boolean; hasOpenRepair: boolean; activeAlarms: Alarm[]; openRepairs: RepairOrder[] } {
  const activeAlarms = alarms.filter(
    (a) => a.showcaseId === showcaseId && a.status !== 'resolved'
  );
  const openRepairs = repairOrders.filter(
    (r) => r.showcaseId === showcaseId && r.status !== 'completed' && r.status !== 'closed'
  );
  return {
    hasActiveAlarm: activeAlarms.length > 0,
    hasOpenRepair: openRepairs.length > 0,
    activeAlarms,
    openRepairs,
  };
}

export default function NewArrivalsPage() {
  const { state, dispatch } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<NewArrivalPlan | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const frozenPlans = state.newArrivalPlans.filter((p) => p.status === 'frozen');
  const plannedPlans = state.newArrivalPlans.filter((p) => p.status === 'planned');

  const handleUnfreeze = (planId: string) => {
    dispatch({ type: 'UNFREEZE_NEW_ARRIVAL', payload: { planId } });
    const plan = state.newArrivalPlans.find((p) => p.id === planId);
    if (plan) {
      setSelectedPlan({ ...plan, status: 'planned', frozenReason: null, frozenAt: null });
    }
  };

  const handleComplete = (planId: string) => {
    dispatch({ type: 'COMPLETE_NEW_ARRIVAL', payload: { planId } });
    const plan = state.newArrivalPlans.find((p) => p.id === planId);
    if (plan) {
      setSelectedPlan({ ...plan, status: 'completed' });
    }
  };

  const currentPlan =
    selectedPlan && state.newArrivalPlans.find((p) => p.id === selectedPlan.id)
      ? state.newArrivalPlans.find((p) => p.id === selectedPlan.id)!
      : selectedPlan;

  const currentBlockers = currentPlan
    ? getShowcaseBlockers(currentPlan.showcaseId, state.alarms, state.repairOrders)
    : null;
  const canUnfreeze = currentBlockers ? !currentBlockers.hasActiveAlarm && !currentBlockers.hasOpenRepair : false;
  const canComplete = currentBlockers ? !currentBlockers.hasActiveAlarm && !currentBlockers.hasOpenRepair : false;

  const runDemo = () => {
    setShowDemoModal(true);
    setDemoStep(0);
  };

  const nextDemoStep = () => {
    setDemoStep((prev) => prev + 1);
  };

  const closeDemo = () => {
    setShowDemoModal(false);
    setDemoStep(0);
  };

  return (
    <div className="p-6">
      {frozenPlans.length > 0 && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
          <Snowflake className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <div className="font-medium text-orange-800">上新冻结提醒</div>
            <div className="text-sm text-orange-600 mt-1">
              共有 {frozenPlans.length} 个上新计划被冻结，请检查报警和维修状态
            </div>
            <div className="text-sm text-orange-500 mt-1">
              冻结原因：{Array.from(new Set(frozenPlans.map((p) => p.frozenReason))).filter(Boolean).join('；')}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <div className="grid grid-cols-4 gap-4 flex-1 mr-6">
          <StatCard title="上新计划" value={state.newArrivalPlans.length} color="gray" />
          <StatCard title="计划中" value={plannedPlans.length} color="blue" />
          <StatCard title="已冻结" value={frozenPlans.length} color="orange" />
          <StatCard title="已完成" value={state.newArrivalPlans.filter((p) => p.status === 'completed').length} color="green" />
        </div>
        <button
          onClick={runDemo}
          className="px-4 py-3 bg-gradient-to-r from-burgundy-600 to-gold-500 text-white rounded-lg hover:from-burgundy-700 hover:to-gold-600 transition-all flex items-center gap-2 shadow-lg"
        >
          <Play size={18} />
          演示报警阻断上新
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">上新计划列表</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {state.newArrivalPlans.map((plan) => (
              <NewArrivalItem
                key={plan.id}
                plan={plan}
                selected={currentPlan?.id === plan.id}
                onClick={() => setSelectedPlan(plan)}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">上新详情</h3>
          </div>
          {currentPlan ? (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">{currentPlan.productName}</h4>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[currentPlan.status].color}`}
                  >
                    {statusConfig[currentPlan.status].label}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{currentPlan.productCode}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <DetailRow label="所属展柜" value={currentPlan.showcaseName} />
                <DetailRow label="计划上新日期" value={currentPlan.plannedDate} />
                <DetailRow label="创建人" value={currentPlan.createdBy} />
                <DetailRow label="创建时间" value={currentPlan.createdAt} />
              </div>

              {currentPlan.status === 'frozen' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-orange-700 font-medium text-sm mb-1">
                    <Snowflake size={16} />
                    上新已冻结
                  </div>
                  <p className="text-sm text-orange-600">
                    冻结原因：{currentPlan.frozenReason}
                  </p>
                  {currentPlan.frozenAt && (
                    <p className="text-xs text-orange-400 mt-1">
                      冻结时间：{currentPlan.frozenAt}
                    </p>
                  )}
                </div>
              )}

              {currentPlan.status === 'frozen' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
                    <Lock size={16} />
                    规则提示
                  </div>
                  <ul className="text-sm text-red-600 mt-2 space-y-1">
                    <li>• 报警未处理不能上新货</li>
                    <li>• 维修完成前不能关闭故障</li>
                    <li>• 温湿度连续超标自动冻结</li>
                  </ul>
                </div>
              )}

              <div className="space-y-3">
                {currentBlockers && (currentBlockers.hasActiveAlarm || currentBlockers.hasOpenRepair) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-2">
                      <Lock size={16} />
                      放行受阻
                    </div>
                    <ul className="text-sm text-red-600 space-y-1">
                      {currentBlockers.hasActiveAlarm && (
                        <li>• 存在 {currentBlockers.activeAlarms.length} 条未处理报警，禁止放行上新</li>
                      )}
                      {currentBlockers.hasOpenRepair && (
                        <li>• 存在 {currentBlockers.openRepairs.length} 条未完成维修，禁止放行上新</li>
                      )}
                    </ul>
                    {currentBlockers.activeAlarms.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-red-100">
                        <div className="text-xs font-medium text-red-600 mb-1">未处理报警：</div>
                        <ul className="text-xs text-red-500 space-y-0.5">
                          {currentBlockers.activeAlarms.slice(0, 3).map((a) => (
                            <li key={a.id}>- {a.type} · {a.message}</li>
                          ))}
                          {currentBlockers.activeAlarms.length > 3 && (
                            <li>... 另有 {currentBlockers.activeAlarms.length - 3} 条</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {currentBlockers.openRepairs.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-red-100">
                        <div className="text-xs font-medium text-red-600 mb-1">未完成维修：</div>
                        <ul className="text-xs text-red-500 space-y-0.5">
                          {currentBlockers.openRepairs.slice(0, 3).map((r) => (
                            <li key={r.id}>- {r.type} · 状态：{
                              r.status === 'pending' ? '待处理' :
                              r.status === 'in_progress' ? '处理中' : '等待配件'
                            }</li>
                          ))}
                          {currentBlockers.openRepairs.length > 3 && (
                            <li>... 另有 {currentBlockers.openRepairs.length - 3} 条</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {currentPlan.status === 'frozen' && canUnfreeze && (
                  <button
                    onClick={() => handleUnfreeze(currentPlan.id)}
                    className="w-full py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Unlock size={16} />
                    解除冻结
                  </button>
                )}
                {currentPlan.status === 'frozen' && !canUnfreeze && (
                  <button
                    disabled
                    className="w-full py-2 bg-gray-200 text-gray-500 text-sm rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Lock size={16} />
                    解除冻结（报警/维修未闭环）
                  </button>
                )}
                {currentPlan.status === 'planned' && canComplete && (
                  <button
                    onClick={() => handleComplete(currentPlan.id)}
                    className="w-full py-2 bg-gold-500 text-white text-sm rounded-lg hover:bg-gold-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    标记上新完成
                  </button>
                )}
                {currentPlan.status === 'planned' && !canComplete && (
                  <button
                    disabled
                    className="w-full py-2 bg-gray-200 text-gray-500 text-sm rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Lock size={16} />
                    标记上新完成（报警/维修未闭环）
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              请选择一个上新计划查看详情
            </div>
          )}
        </div>
      </div>

      {showDemoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[600px] max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Play className="text-gold-500" size={20} />
                演示：报警阻断上新 + 维修闭环
              </h3>
              <button
                onClick={closeDemo}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6">
              {demoStep === 0 && (
                <div className="space-y-4">
                  <div className="bg-burgundy-50 rounded-lg p-4">
                    <div className="font-medium text-burgundy-800 mb-2">场景说明</div>
                    <p className="text-sm text-burgundy-600">
                      本演示将展示珠宝展柜保养系统的核心业务流程：
                    </p>
                    <ol className="text-sm text-burgundy-600 mt-2 space-y-1 list-decimal list-inside">
                      <li>店员巡查记录温湿度，连续超标触发报警</li>
                      <li>系统自动冻结对应展柜的上新计划</li>
                      <li>维修商接单处理，更新维修进度</li>
                      <li>维修完成后，报警解除，上新自动解冻</li>
                    </ol>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="font-medium text-gray-700 mb-2">参与角色</div>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-2xl">👩‍💼</div>
                        <div className="text-xs text-gray-500">店长</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl">👩‍🏫</div>
                        <div className="text-xs text-gray-500">店员</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl">🔧</div>
                        <div className="text-xs text-gray-500">维修商</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl">👮</div>
                        <div className="text-xs text-gray-500">安保</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={nextDemoStep}
                    className="w-full py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors font-medium"
                  >
                    开始演示
                  </button>
                </div>
              )}

              {demoStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600 font-medium">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center">
                      1
                    </div>
                    店员巡查，记录温湿度
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      店员李店员巡查 VIP钻石展柜，发现温度 28.5°C，湿度 68%，
                      均超过阈值（温度 ≤26°C，湿度 ≤60%）。
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="bg-white rounded p-3 text-center">
                        <div className="text-xs text-gray-500">当前温度</div>
                        <div className="text-xl font-bold text-red-500">28.5°C</div>
                        <div className="text-xs text-gray-400">阈值: ≤26°C</div>
                      </div>
                      <div className="bg-white rounded p-3 text-center">
                        <div className="text-xs text-gray-500">当前湿度</div>
                        <div className="text-xl font-bold text-red-500">68%</div>
                        <div className="text-xs text-gray-400">阈值: ≤60%</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={nextDemoStep}
                    className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    下一步：触发报警
                  </button>
                </div>
              )}

              {demoStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-600 font-medium">
                    <div className="w-6 h-6 rounded-full bg-red-500 text-white text-sm flex items-center justify-center">
                      2
                    </div>
                    连续超标，触发报警（红色提示）
                  </div>
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 animate-pulse">
                    <div className="flex items-center gap-2 text-red-700 font-bold">
                      <AlertTriangle size={20} />
                      高优先级报警
                    </div>
                    <ul className="text-sm text-red-600 mt-2 space-y-1">
                      <li>• 温度连续5次超过上限阈值 26°C</li>
                      <li>• 湿度连续5次超过上限阈值 60%</li>
                      <li>• 已自动通知店长和安保负责人</li>
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                        温度报警
                      </span>
                      <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                        湿度报警
                      </span>
                      <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                        高优先级
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={nextDemoStep}
                    className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    下一步：自动冻结上新
                  </button>
                </div>
              )}

              {demoStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-orange-600 font-medium">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center">
                      3
                    </div>
                    系统自动冻结上新计划
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-orange-700 font-bold">
                      <Snowflake size={20} />
                      上新冻结
                    </div>
                    <p className="text-sm text-orange-600 mt-2">
                      根据规则：<strong>报警未处理不能上新货</strong>
                    </p>
                    <div className="mt-3 bg-white rounded p-3 border border-orange-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-800">皇室蓝钻项链</div>
                          <div className="text-xs text-gray-500">VIP钻石展柜</div>
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                          已冻结
                        </span>
                      </div>
                      <div className="text-xs text-orange-500 mt-2">
                        冻结原因：温湿度连续超标，存在安全隐患
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={nextDemoStep}
                    className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    下一步：维修商接单处理
                  </button>
                </div>
              )}

              {demoStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-purple-600 font-medium">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-sm flex items-center justify-center">
                      4
                    </div>
                    维修商接单，更新进度
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="font-medium text-purple-700 mb-3">维修进度</div>
                    <div className="space-y-3">
                      {[
                        { time: '11:00', text: '维修商王师傅接单，前往现场检查', done: true },
                        { time: '12:00', text: '确认是空调压缩机故障，需更换配件', done: true },
                        { time: '14:00', text: '配件到位，开始更换', done: true },
                        { time: '16:00', text: '维修完成，等待验收', done: false },
                      ].map((step, i) => (
                        <div key={i} className="flex gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
                              step.done
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {step.done ? '✓' : i + 1}
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">{step.time}</div>
                            <div
                              className={`text-sm ${
                                step.done ? 'text-gray-700' : 'text-gray-400'
                              }`}
                            >
                              {step.text}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={nextDemoStep}
                    className="w-full py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    下一步：维修完成，闭环
                  </button>
                </div>
              )}

              {demoStep === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center">
                      5
                    </div>
                    维修完成，报警解除，上新自动解冻
                  </div>
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-700 font-medium">
                        <CheckCircle size={16} />
                        维修完成
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        空调系统修复，温湿度恢复正常范围
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-blue-700 font-medium">
                        <CheckCircle size={16} />
                        报警解除
                      </div>
                      <p className="text-sm text-blue-600 mt-1">
                        温度、湿度报警均已标记为已解决
                      </p>
                    </div>
                    <div className="bg-gold-50 border border-gold-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gold-700 font-medium">
                        <Unlock size={16} />
                        上新解冻
                      </div>
                      <p className="text-sm text-gold-600 mt-1">
                        皇室蓝钻项链上新计划已自动解除冻结，可按计划上新
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="font-medium text-gray-700 mb-2">业务闭环验证</div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-500" />
                        报警未处理 → 上新自动冻结 ✓
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-500" />
                        维修完成前 → 不能关闭故障 ✓
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-500" />
                        连续超标 → 红色提示 + 高优先级 ✓
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-500" />
                        维修完成 → 报警解除 + 上新解冻 ✓
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={closeDemo}
                    className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    演示完成
                  </button>
                </div>
              )}
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
    gray: 'text-gray-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    green: 'text-green-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{title}</div>
    </div>
  );
}

function NewArrivalItem({
  plan,
  selected,
  onClick,
}: {
  plan: NewArrivalPlan;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
        selected ? 'bg-gold-50 border-l-4 border-l-gold-500' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800">{plan.productName}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[plan.status].color}`}
            >
              {statusConfig[plan.status].label}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {plan.showcaseName} · {plan.productCode}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <Calendar size={12} />
            {plan.plannedDate}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            创建人：{plan.createdBy}
          </div>
        </div>
      </div>
      {plan.status === 'frozen' && plan.frozenReason && (
        <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
          冻结原因：{plan.frozenReason}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}
