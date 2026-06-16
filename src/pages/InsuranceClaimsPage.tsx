import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InsuranceClaim } from '../types';
import {
  FileWarning,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Eye,
  FileText,
  Wrench,
  AlertOctagon,
  Shield,
  Filter,
  Plus,
  Send,
} from 'lucide-react';

const claimTypeConfig = {
  temperature_risk: { label: '温度风险', color: 'text-red-500 bg-red-50' },
  humidity_risk: { label: '湿度风险', color: 'text-blue-500 bg-blue-50' },
  equipment_failure: { label: '设备故障', color: 'text-orange-500 bg-orange-50' },
  security_breach: { label: '安防异常', color: 'text-purple-500 bg-purple-50' },
  other: { label: '其他', color: 'text-gray-500 bg-gray-50' },
};

const claimStatusConfig = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
  submitted: { label: '已提交', color: 'bg-blue-100 text-blue-700' },
  reviewing: { label: '审核中', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '已批准', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
  closed: { label: '已结案', color: 'bg-gray-100 text-gray-500' },
};

const priorityConfig = {
  low: { label: '低', color: 'bg-gray-100 text-gray-600' },
  medium: { label: '中', color: 'bg-blue-100 text-blue-600' },
  high: { label: '高', color: 'bg-orange-100 text-orange-600' },
  urgent: { label: '紧急', color: 'bg-red-100 text-red-600' },
};

export default function InsuranceClaimsPage() {
  const { state, dispatch } = useApp();
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [claimForm, setClaimForm] = useState({
    showcaseId: '',
    title: '',
    description: '',
    type: 'temperature_risk' as InsuranceClaim['type'],
    priority: 'medium' as InsuranceClaim['priority'],
    estimatedLoss: '',
  });

  const activeClaims = state.insuranceClaims.filter(
    (c) => c.status !== 'closed' && c.status !== 'rejected'
  );
  const highPriorityClaims = activeClaims.filter(
    (c) => c.priority === 'high' || c.priority === 'urgent'
  );

  const filteredClaims = state.insuranceClaims.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'active') return c.status !== 'closed' && c.status !== 'rejected';
    return c.status === 'closed' || c.status === 'rejected';
  });

  const handleCreateClaim = () => {
    if (!claimForm.title || !claimForm.showcaseId) return;

    const showcase = state.showcases.find((s) => s.id === claimForm.showcaseId);

    const newClaim: InsuranceClaim = {
      id: `ic-${Date.now()}`,
      showcaseId: claimForm.showcaseId,
      showcaseName: showcase?.name || '',
      type: claimForm.type,
      status: 'draft',
      priority: claimForm.priority,
      title: claimForm.title,
      description: claimForm.description,
      reportedBy: state.currentUser.name,
      reportedAt: new Date().toLocaleString('zh-CN'),
      estimatedLoss: claimForm.estimatedLoss ? parseFloat(claimForm.estimatedLoss) : undefined,
      relatedRepairIds: [],
      relatedAlarmIds: [],
    };

    dispatch({ type: 'ADD_INSURANCE_CLAIM', payload: newClaim });
    setShowCreateModal(false);
    setClaimForm({
      showcaseId: '',
      title: '',
      description: '',
      type: 'temperature_risk',
      priority: 'medium',
      estimatedLoss: '',
    });
  };

  const handleSubmitClaim = (claim: InsuranceClaim) => {
    dispatch({
      type: 'UPDATE_INSURANCE_CLAIM',
      payload: { ...claim, status: 'submitted' },
    });
    setSelectedClaim({ ...claim, status: 'submitted' });
  };

  return (
    <div className="p-6">
      {highPriorityClaims.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertOctagon className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <div className="font-medium text-red-800">高优先级保险报备</div>
            <div className="text-sm text-red-600 mt-1">
              共有 {highPriorityClaims.length} 条高优先级保险报备待处理
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="报备总数" value={state.insuranceClaims.length} color="gray" />
        <StatCard title="进行中" value={activeClaims.length} color="blue" />
        <StatCard title="高优先级" value={highPriorityClaims.length} color="red" />
        <StatCard title="已结案" value={state.insuranceClaims.filter((c) => c.status === 'closed').length} color="green" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">保险报备列表</h3>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {(['all', 'active', 'closed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      filter === f
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f === 'all' ? '全部' : f === 'active' ? '进行中' : '已结案'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1 px-3 py-1 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus size={14} />
                新建报备
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {filteredClaims.length > 0 ? (
              filteredClaims.map((claim) => (
                <ClaimItem
                  key={claim.id}
                  claim={claim}
                  selected={selectedClaim?.id === claim.id}
                  onClick={() => setSelectedClaim(claim)}
                />
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">暂无保险报备记录</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">报备详情</h3>
          </div>
          {selectedClaim ? (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-orange-50 text-orange-500">
                    <FileWarning size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{selectedClaim.title}</h4>
                    <p className="text-sm text-gray-500">{selectedClaim.showcaseName}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${claimStatusConfig[selectedClaim.status].color}`}>
                    {claimStatusConfig[selectedClaim.status].label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig[selectedClaim.priority].color}`}>
                    {priorityConfig[selectedClaim.priority].label}优先级
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${claimTypeConfig[selectedClaim.type].color}`}>
                    {claimTypeConfig[selectedClaim.type].label}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">风险描述</h5>
                <p className="text-sm text-gray-600">{selectedClaim.description}</p>
              </div>

              <div className="space-y-2 text-sm">
                <DetailRow label="上报人" value={selectedClaim.reportedBy} />
                <DetailRow label="上报时间" value={selectedClaim.reportedAt} />
                {selectedClaim.estimatedLoss !== undefined && (
                  <DetailRow
                    label="预估损失"
                    value={`¥${selectedClaim.estimatedLoss.toLocaleString()}`}
                  />
                )}
                {selectedClaim.handler && (
                  <DetailRow label="处理人" value={selectedClaim.handler} />
                )}
              </div>

              {(selectedClaim.relatedAlarmIds && selectedClaim.relatedAlarmIds.length > 0) && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-500" />
                    关联报警 ({selectedClaim.relatedAlarmIds.length})
                  </h5>
                  <div className="bg-red-50 rounded-lg p-2 text-xs text-red-600">
                    {selectedClaim.relatedAlarmIds.join('、')}
                  </div>
                </div>
              )}

              {(selectedClaim.relatedRepairIds && selectedClaim.relatedRepairIds.length > 0) && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Wrench size={14} className="text-blue-500" />
                    关联维修 ({selectedClaim.relatedRepairIds.length})
                  </h5>
                  <div className="bg-blue-50 rounded-lg p-2 text-xs text-blue-600">
                    {selectedClaim.relatedRepairIds.join('、')}
                  </div>
                </div>
              )}

              {selectedClaim.status === 'draft' && (
                <div className="space-y-2">
                  <button
                    onClick={() => handleSubmitClaim(selectedClaim)}
                    className="w-full py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send size={14} />
                    提交报备
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              请选择一条报备查看详情
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[500px] max-h-[85vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">新建保险报备</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  涉及展柜
                </label>
                <select
                  value={claimForm.showcaseId}
                  onChange={(e) =>
                    setClaimForm((prev) => ({ ...prev, showcaseId: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">请选择展柜</option>
                  {state.showcases.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  报备标题
                </label>
                <input
                  type="text"
                  value={claimForm.title}
                  onChange={(e) =>
                    setClaimForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="请输入报备标题"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    风险类型
                  </label>
                  <select
                    value={claimForm.type}
                    onChange={(e) =>
                      setClaimForm((prev) => ({
                        ...prev,
                        type: e.target.value as InsuranceClaim['type'],
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="temperature_risk">温度风险</option>
                    <option value="humidity_risk">湿度风险</option>
                    <option value="equipment_failure">设备故障</option>
                    <option value="security_breach">安防异常</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    优先级
                  </label>
                  <select
                    value={claimForm.priority}
                    onChange={(e) =>
                      setClaimForm((prev) => ({
                        ...prev,
                        priority: e.target.value as InsuranceClaim['priority'],
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  预估损失金额（元）
                </label>
                <input
                  type="number"
                  value={claimForm.estimatedLoss}
                  onChange={(e) =>
                    setClaimForm((prev) => ({ ...prev, estimatedLoss: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="请输入预估损失金额"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  风险描述
                </label>
                <textarea
                  value={claimForm.description}
                  onChange={(e) =>
                    setClaimForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={4}
                  placeholder="请详细描述风险情况"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateClaim}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                创建报备
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
    red: 'text-red-600',
    green: 'text-green-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{title}</div>
    </div>
  );
}

function ClaimItem({
  claim,
  selected,
  onClick,
}: {
  claim: InsuranceClaim;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
        selected ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800">{claim.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${claimStatusConfig[claim.status].color}`}>
              {claimStatusConfig[claim.status].label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{claim.showcaseName}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <User size={12} />
              {claim.reportedBy}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {claim.reportedAt}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig[claim.priority].color}`}>
            {priorityConfig[claim.priority].label}
          </span>
          {claim.estimatedLoss !== undefined && (
            <span className="text-xs text-gray-500">
              ¥{claim.estimatedLoss.toLocaleString()}
            </span>
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
