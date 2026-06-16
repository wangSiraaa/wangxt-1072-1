import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RepairOrder, ValuableItem } from '../types';
import {
  Wrench,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  MessageSquare,
  Calendar,
  Lightbulb,
  Lock,
  Thermometer,
  Droplets,
  HelpCircle,
  XCircle,
  AlertOctagon,
  Shield,
  Diamond,
  Eye,
} from 'lucide-react';

const repairTypeConfig = {
  lighting: { label: '照明故障', icon: Lightbulb, color: 'text-yellow-500 bg-yellow-50' },
  lock: { label: '锁具故障', icon: Lock, color: 'text-red-500 bg-red-50' },
  temperature: { label: '温控故障', icon: Thermometer, color: 'text-orange-500 bg-orange-50' },
  humidity: { label: '除湿故障', icon: Droplets, color: 'text-blue-500 bg-blue-50' },
  other: { label: '其他故障', icon: HelpCircle, color: 'text-gray-500 bg-gray-50' },
};

const repairStatusConfig = {
  pending: { label: '待处理', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  parts_ordered: { label: '待配件', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  closed: { label: '已关闭', color: 'bg-gray-100 text-gray-500' },
};

const priorityConfig = {
  low: { label: '低', color: 'bg-gray-100 text-gray-600' },
  medium: { label: '中', color: 'bg-blue-100 text-blue-600' },
  high: { label: '高', color: 'bg-orange-100 text-orange-600' },
  urgent: { label: '紧急', color: 'bg-red-100 text-red-600' },
};

export default function RepairsPage() {
  const { state, dispatch } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressNote, setProgressNote] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'completed'>('all');

  const openOrders = state.repairOrders.filter(
    (r) => r.status !== 'completed' && r.status !== 'closed'
  );
  const overdueOrders = openOrders.filter((r) => r.overdue);
  const escalatedOrders = openOrders.filter((r) => r.escalated);

  const filteredOrders = state.repairOrders.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'open') return o.status !== 'completed' && o.status !== 'closed';
    return o.status === 'completed' || o.status === 'closed';
  });

  const handleAddProgress = () => {
    if (!selectedOrder || !progressNote.trim()) return;
    dispatch({
      type: 'ADD_REPAIR_PROGRESS',
      payload: {
        orderId: selectedOrder.id,
        note: progressNote,
        author: state.currentUser.name,
      },
    });
    setProgressNote('');
    setShowProgressModal(false);
    const updated = state.repairOrders.find((r) => r.id === selectedOrder.id);
    if (updated) {
      setSelectedOrder({
        ...updated,
        progressNotes: [
          ...updated.progressNotes,
          {
            time: new Date().toISOString(),
            note: progressNote,
            author: state.currentUser.name,
          },
        ],
      });
    }
  };

  const handleUpdateStatus = (
    orderId: string,
    newStatus: RepairOrder['status']
  ) => {
    const order = state.repairOrders.find((r) => r.id === orderId);
    if (!order) return;
    dispatch({
      type: 'UPDATE_REPAIR_ORDER',
      payload: { ...order, status: newStatus },
    });
    setSelectedOrder({ ...order, status: newStatus });
  };

  const handleEscalate = (orderId: string) => {
    dispatch({ type: 'ESCALATE_REPAIR', payload: { orderId } });
    const order = state.repairOrders.find((r) => r.id === orderId);
    if (order) {
      setSelectedOrder({
        ...order,
        escalated: true,
        priority: 'urgent',
        progressNotes: [
          ...order.progressNotes,
          {
            time: new Date().toISOString(),
            note: '维修超时，已升级为紧急优先级',
            author: '系统',
          },
        ],
      });
    }
  };

  const handleCompleteRepair = (orderId: string) => {
    dispatch({
      type: 'COMPLETE_REPAIR',
      payload: { orderId, userId: state.currentUser.id },
    });
    const order = state.repairOrders.find((r) => r.id === orderId);
    if (order) {
      setSelectedOrder({
        ...order,
        status: 'completed',
        actualCompletion: new Date().toISOString(),
      });
    }
  };

  const currentOrder =
    selectedOrder && state.repairOrders.find((r) => r.id === selectedOrder.id)
      ? state.repairOrders.find((r) => r.id === selectedOrder.id)!
      : selectedOrder;

  const getShowcaseValuableItems = (showcaseId: string) => {
    return state.valuableItems.filter(
      (v) => v.showcaseId === showcaseId && v.status === 'on_display'
    );
  };

  const getOverdueRiskShowcases = () => {
    const overdueLightingOrLock = overdueOrders.filter(
      (o) => o.type === 'lighting' || o.type === 'lock'
    );
    const showcaseMap = new Map<string, { orders: RepairOrder[]; items: ValuableItem[]; totalValue: number }>();

    overdueLightingOrLock.forEach((order) => {
      if (!showcaseMap.has(order.showcaseId)) {
        const items = getShowcaseValuableItems(order.showcaseId);
        const totalValue = items.reduce((sum, item) => sum + item.value, 0);
        showcaseMap.set(order.showcaseId, {
          orders: [],
          items,
          totalValue,
        });
      }
      showcaseMap.get(order.showcaseId)!.orders.push(order);
    });

    return Array.from(showcaseMap.entries()).map(([showcaseId, data]) => ({
      showcaseId,
      showcaseName: data.orders[0].showcaseName,
      orders: data.orders,
      items: data.items,
      totalValue: data.totalValue,
    }));
  };

  const overdueRiskShowcases = getOverdueRiskShowcases();

  return (
    <div className="p-6">
      {escalatedOrders.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertOctagon className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <div className="font-medium text-red-800">故障升级提醒</div>
            <div className="text-sm text-red-600 mt-1">
              共有 {escalatedOrders.length} 个维修工单已升级，请优先处理
            </div>
            <div className="text-sm text-red-500 mt-1">
              涉及展柜：{escalatedOrders.map((o) => o.showcaseName).join('、')}
            </div>
          </div>
        </div>
      )}

      {overdueOrders.length > 0 && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
          <Clock className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <div className="font-medium text-orange-800">维修超时提醒</div>
            <div className="text-sm text-orange-600 mt-1">
              共有 {overdueOrders.length} 个维修工单已超时，请尽快完成
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="工单总数" value={state.repairOrders.length} color="gray" />
        <StatCard title="进行中" value={openOrders.length} color="blue" />
        <StatCard title="已超时" value={overdueOrders.length} color="orange" />
        <StatCard title="已完成" value={state.repairOrders.filter((r) => r.status === 'completed').length} color="green" />
      </div>

      {overdueRiskShowcases.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="text-red-500" size={20} />
            <h3 className="font-semibold text-red-800">安保视角 - 超时维修风险柜贵重品</h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
              {overdueRiskShowcases.length}个风险柜
            </span>
          </div>
          <p className="text-sm text-red-600 mb-4">
            以下展柜存在照明或锁具故障超时未修复情况，安保负责人需关注柜内贵重货品安全风险。
          </p>
          <div className="grid grid-cols-2 gap-4">
            {overdueRiskShowcases.map((showcase) => (
              <div key={showcase.showcaseId} className="bg-white rounded-lg p-3 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-800 flex items-center gap-2">
                    <Diamond size={14} className="text-red-500" />
                    {showcase.showcaseName}
                  </div>
                  <span className="text-xs text-red-600 font-medium">
                    ¥{showcase.totalValue.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  故障类型：{showcase.orders.map((o) => repairTypeConfig[o.type].label).join('、')}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  在柜贵重品：{showcase.items.length}件
                </div>
                <div className="flex flex-wrap gap-1">
                  {showcase.items.slice(0, 3).map((item) => (
                    <span
                      key={item.id}
                      className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded"
                      title={`价值¥${item.value.toLocaleString()}`}
                    >
                      {item.name}
                    </span>
                  ))}
                  {showcase.items.length > 3 && (
                    <span className="text-xs text-gray-400 px-2 py-0.5">
                      +{showcase.items.length - 3}件
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">维修工单列表</h3>
            <div className="flex gap-2">
              {(['all', 'open', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    filter === f
                      ? 'bg-gold-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? '全部' : f === 'open' ? '进行中' : '已完成'}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {filteredOrders.map((order) => (
              <RepairOrderItem
                key={order.id}
                order={order}
                selected={currentOrder?.id === order.id}
                onClick={() => setSelectedOrder(order)}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">工单详情</h3>
          </div>
          {currentOrder ? (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`p-3 rounded-lg ${repairTypeConfig[currentOrder.type].color}`}
                  >
                    {(() => {
                      const Icon = repairTypeConfig[currentOrder.type].icon;
                      return <Icon size={24} />;
                    })()}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {repairTypeConfig[currentOrder.type].label}
                    </h4>
                    <p className="text-sm text-gray-500">{currentOrder.showcaseName}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${repairStatusConfig[currentOrder.status].color}`}
                  >
                    {repairStatusConfig[currentOrder.status].label}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig[currentOrder.priority].color}`}
                  >
                    {priorityConfig[currentOrder.priority].label}优先级
                  </span>
                  {currentOrder.escalated && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                      <ArrowUp size={12} />
                      已升级
                    </span>
                  )}
                  {currentOrder.overdue && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 flex items-center gap-1">
                      <Clock size={12} />
                      已超时
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="text-sm font-medium text-gray-700 mb-1">故障描述</h5>
                <p className="text-sm text-gray-600">{currentOrder.description}</p>
              </div>

              <div className="space-y-2 text-sm">
                <DetailRow label="报修人" value={currentOrder.reporter} />
                <DetailRow label="报修时间" value={currentOrder.reportedAt} />
                <DetailRow label="处理人" value={currentOrder.assignedTo} />
                <DetailRow
                  label="预计完成"
                  value={currentOrder.estimatedCompletion}
                />
                {currentOrder.actualCompletion && (
                  <DetailRow
                    label="实际完成"
                    value={currentOrder.actualCompletion}
                  />
                )}
              </div>

              {(currentOrder.type === 'lighting' || currentOrder.type === 'lock') &&
                currentOrder.status !== 'completed' &&
                currentOrder.status !== 'closed' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={14} className="text-amber-600" />
                    <h5 className="text-sm font-medium text-amber-700">安保提醒 - 在柜贵重品</h5>
                  </div>
                  <div className="text-xs text-amber-600 mb-2">
                    {getShowcaseValuableItems(currentOrder.showcaseId).length}件贵重货品在柜，
                    总价值约 ¥{getShowcaseValuableItems(currentOrder.showcaseId)
                      .reduce((s, v) => s + v.value, 0)
                      .toLocaleString()}
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {getShowcaseValuableItems(currentOrder.showcaseId).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs bg-white rounded px-2 py-1"
                      >
                        <span className="text-gray-700 flex items-center gap-1">
                          <Diamond size={10} className="text-amber-500" />
                          {item.name}
                        </span>
                        <span className="text-gray-500">¥{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  {currentOrder.overdue && (
                    <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      维修已超时，请注意安保巡查
                    </div>
                  )}
                </div>
              )}

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">维修进度</h5>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {currentOrder.progressNotes.map((note, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center">
                        <MessageSquare size={12} className="text-gold-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-700">
                            {note.author}
                          </span>
                          <span className="text-gray-400">{note.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{note.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {currentOrder.status !== 'completed' &&
                currentOrder.status !== 'closed' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowProgressModal(true)}
                      className="w-full py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      添加进度
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      {currentOrder.status === 'pending' && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(currentOrder.id, 'in_progress')
                          }
                          className="py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                        >
                          开始处理
                        </button>
                      )}
                      {currentOrder.status === 'in_progress' && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(currentOrder.id, 'parts_ordered')
                          }
                          className="py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                          等待配件
                        </button>
                      )}
                      {currentOrder.status === 'parts_ordered' && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(currentOrder.id, 'in_progress')
                          }
                          className="py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          继续维修
                        </button>
                      )}
                      {!currentOrder.escalated && (
                        <button
                          onClick={() => handleEscalate(currentOrder.id)}
                          className="py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                        >
                          申请升级
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleCompleteRepair(currentOrder.id)}
                      className="w-full py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      完成维修
                    </button>
                    <p className="text-xs text-gray-400 text-center">
                      维修完成前不能关闭故障工单
                    </p>
                  </div>
                )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              请选择一个工单查看详情
            </div>
          )}
        </div>
      </div>

      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[400px]">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">添加维修进度</h3>
            </div>
            <div className="p-4">
              <textarea
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                rows={4}
                placeholder="请输入进度说明..."
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowProgressModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddProgress}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
              >
                提交
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

function RepairOrderItem({
  order,
  selected,
  onClick,
}: {
  order: RepairOrder;
  selected: boolean;
  onClick: () => void;
}) {
  const TypeIcon = repairTypeConfig[order.type].icon;

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
        selected ? 'bg-gold-50 border-l-4 border-l-gold-500' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg mt-0.5 ${repairTypeConfig[order.type].color}`}
          >
            <TypeIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">{order.showcaseName}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${repairStatusConfig[order.status].color}`}
              >
                {repairStatusConfig[order.status].label}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1 line-clamp-1">
              {order.description}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <User size={12} />
                {order.assignedTo}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {order.reportedAt}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig[order.priority].color}`}
          >
            {priorityConfig[order.priority].label}
          </span>
          {order.escalated && (
            <div className="text-xs text-red-500 mt-1 font-medium">已升级</div>
          )}
          {order.overdue && (
            <div className="text-xs text-orange-500 mt-1">已超时</div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}
