import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InspectionPlan, InspectionRecord, InspectionPhoto, InspectionReview } from '../types';
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
  Camera,
  FileCheck,
  Image,
  Edit3,
  Eye,
  MapPin,
  Clock as ClockIcon,
  RotateCcw,
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
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRecordDetailModal, setShowRecordDetailModal] = useState(false);
  const [recordForm, setRecordForm] = useState({
    temperature: '',
    humidity: '',
    notes: '',
    itemsChecked: [] as string[],
  });
  const [photoForm, setPhotoForm] = useState({
    label: '',
    tag: '' as 'environment' | 'equipment' | 'abnormal' | 'other',
  });
  const [reviewForm, setReviewForm] = useState({
    status: 'approved' as InspectionReview['status'],
    comment: '',
  });
  const [locationVerified, setLocationVerified] = useState(false);

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
    setLocationVerified(false);
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

    const isMakeup = selectedPlan.status === 'missed' || selectedPlan.status === 'overdue';

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
      photos: [],
      isMakeup,
      makeupReason: isMakeup ? (selectedPlan.status === 'missed' ? '漏检补检' : '逾期补检') : undefined,
      reviewStatus: 'pending',
      reviews: [],
      locationVerified,
    };

    dispatch({ type: 'ADD_INSPECTION_RECORD', payload: newRecord });
    setShowRecordModal(false);
    setSelectedPlan(null);
    setLocationVerified(false);
  };

  const handleOpenPhotoModal = (record: InspectionRecord) => {
    setSelectedRecord(record);
    setPhotoForm({ label: '', tag: 'environment' });
    setShowPhotoModal(true);
  };

  const handleAddPhoto = () => {
    if (!selectedRecord || !photoForm.label) return;

    const newPhoto: InspectionPhoto = {
      id: `p-${Date.now()}`,
      url: `https://picsum.photos/seed/${Date.now()}/400/300`,
      label: photoForm.label,
      tag: photoForm.tag,
      uploadedAt: new Date().toLocaleString('zh-CN'),
      uploadedBy: state.currentUser.name,
    };

    dispatch({
      type: 'ADD_INSPECTION_PHOTO',
      payload: {
        recordId: selectedRecord.id,
        photo: newPhoto,
      },
    });
    setShowPhotoModal(false);
    setPhotoForm({ label: '', tag: 'environment' });
  };

  const handleOpenReviewModal = (record: InspectionRecord) => {
    setSelectedRecord(record);
    setReviewForm({ status: 'approved', comment: '' });
    setShowReviewModal(true);
  };

  const handleSubmitReview = () => {
    if (!selectedRecord) return;

    const newReview: InspectionReview = {
      id: `rv-${Date.now()}`,
      reviewer: state.currentUser.name,
      reviewTime: new Date().toLocaleString('zh-CN'),
      status: reviewForm.status,
      comment: reviewForm.comment,
    };

    dispatch({
      type: 'REVIEW_INSPECTION',
      payload: {
        recordId: selectedRecord.id,
        review: newReview,
        reviewStatus: reviewForm.status,
      },
    });
    setShowReviewModal(false);
  };

  const handleViewRecordDetail = (record: InspectionRecord) => {
    setSelectedRecord(record);
    setShowRecordDetailModal(true);
  };

  const handleVerifyLocation = () => {
    setLocationVerified(true);
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
                              className="bg-white rounded p-3 text-sm border border-gray-200"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500">{record.timestamp}</span>
                                    {record.isMakeup && (
                                      <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                                        补检
                                      </span>
                                    )}
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                      record.reviewStatus === 'approved'
                                        ? 'bg-green-100 text-green-600'
                                        : record.reviewStatus === 'rejected'
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-yellow-100 text-yellow-600'
                                    }`}>
                                      {record.reviewStatus === 'approved' ? '已复核' :
                                       record.reviewStatus === 'rejected' ? '已驳回' : '待复核'}
                                    </span>
                                  </div>
                                  <span className="text-gray-600 text-xs">{record.inspector}</span>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleViewRecordDetail(record)}
                                    className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                                    title="查看详情"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenPhotoModal(record)}
                                    className="p-1 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded"
                                    title="补拍照片"
                                  >
                                    <Camera size={14} />
                                  </button>
                                  {record.reviewStatus === 'pending' && state.currentUser.role === 'manager' && (
                                    <button
                                      onClick={() => handleOpenReviewModal(record)}
                                      className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded"
                                      title="复核"
                                    >
                                      <FileCheck size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-3 mt-1.5">
                                <span>温度: {record.temperature}°C</span>
                                <span>湿度: {record.humidity}%</span>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Image size={12} />
                                  {record.photos?.length || 0}张照片
                                </span>
                                {record.locationVerified ? (
                                  <span className="flex items-center gap-1 text-green-500">
                                    <MapPin size={12} />
                                    位置已验证
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-yellow-500">
                                    <MapPin size={12} />
                                    位置未验证
                                  </span>
                                )}
                                {record.reviews && record.reviews.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <FileCheck size={12} />
                                    {record.reviews.length}次复核
                                  </span>
                                )}
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
              {(selectedPlan.status === 'missed' || selectedPlan.status === 'overdue') && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-orange-700 font-medium text-sm">
                    <RotateCcw size={16} />
                    补检记录
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    本次为{selectedPlan.status === 'missed' ? '漏检' : '逾期'}补检，系统将自动标记为补检记录，需店长复核。
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  位置验证
                </label>
                {locationVerified ? (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                    <MapPin size={16} />
                    <span className="text-sm">位置已验证 - 确认在{selectedPlan.showcaseName}现场</span>
                    <CheckCircle size={16} />
                  </div>
                ) : (
                  <button
                    onClick={handleVerifyLocation}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gold-400 hover:text-gold-600 transition-colors"
                  >
                    <MapPin size={18} />
                    <span className="text-sm">点击验证当前位置</span>
                  </button>
                )}
                {!locationVerified && (
                  <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    未验证位置的记录将被标记为疑似事后补填
                  </p>
                )}
              </div>

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

      {showPhotoModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[450px]">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">补拍照片</h3>
              <p className="text-xs text-gray-500 mt-1">为巡查记录补充照片证据</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  照片标签
                </label>
                <input
                  type="text"
                  value={photoForm.label}
                  onChange={(e) => setPhotoForm((prev) => ({ ...prev, label: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="例如：展柜正面、温湿度计读数"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  照片类型
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'environment', label: '环境' },
                    { value: 'equipment', label: '设备' },
                    { value: 'abnormal', label: '异常' },
                    { value: 'other', label: '其他' },
                  ].map((tag) => (
                    <button
                      key={tag.value}
                      onClick={() =>
                        setPhotoForm((prev) => ({ ...prev, tag: tag.value as any }))
                      }
                      className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                        photoForm.tag === tag.value
                          ? 'bg-purple-100 border-purple-300 text-purple-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Camera size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">点击拍照或上传照片</p>
                <p className="text-xs text-gray-400 mt-1">支持现场拍照，防止事后补填</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-700 flex items-start gap-2">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  补拍照片会记录补拍时间和操作人，用于事后追溯。系统将根据时间戳判断是否为事后集中补拍。
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowPhotoModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddPhoto}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                添加照片
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[450px]">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">复核巡查记录</h3>
              <p className="text-xs text-gray-500 mt-1">
                复核人：{state.currentUser.name}
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-500">
                  巡查记录：{selectedRecord.showcaseName}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  时间：{selectedRecord.timestamp}
                </div>
                <div className="text-sm text-gray-600">
                  巡查人：{selectedRecord.inspector}
                </div>
                {selectedRecord.isMakeup && (
                  <div className="text-xs text-orange-600 mt-1">
                    补检记录：{selectedRecord.makeupReason}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  复核结果
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setReviewForm((prev) => ({ ...prev, status: 'approved' }))}
                    className={`flex-1 py-2 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                      reviewForm.status === 'approved'
                        ? 'bg-green-100 border-green-300 text-green-700'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    <CheckCircle size={16} />
                    通过
                  </button>
                  <button
                    onClick={() => setReviewForm((prev) => ({ ...prev, status: 'rejected' }))}
                    className={`flex-1 py-2 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                      reviewForm.status === 'rejected'
                        ? 'bg-red-100 border-red-300 text-red-700'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    <XCircle size={16} />
                    驳回
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  复核意见
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="请输入复核意见"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-400">照片数：</span>
                  {selectedRecord.photos?.length || 0}张
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-400">位置验证：</span>
                  {selectedRecord.locationVerified ? (
                    <span className="text-green-600">已验证</span>
                  ) : (
                    <span className="text-yellow-600">未验证</span>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitReview}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                提交复核
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecordDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[550px] max-h-[85vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">巡查记录详情</h3>
              <div className="flex items-center gap-2">
                {selectedRecord.isMakeup && (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                    补检
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded ${
                  selectedRecord.reviewStatus === 'approved'
                    ? 'bg-green-100 text-green-600'
                    : selectedRecord.reviewStatus === 'rejected'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {selectedRecord.reviewStatus === 'approved' ? '已复核' :
                   selectedRecord.reviewStatus === 'rejected' ? '已驳回' : '待复核'}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">展柜：</span>
                  <span className="text-gray-800">{selectedRecord.showcaseName}</span>
                </div>
                <div>
                  <span className="text-gray-500">巡查人：</span>
                  <span className="text-gray-800">{selectedRecord.inspector}</span>
                </div>
                <div>
                  <span className="text-gray-500">时间：</span>
                  <span className="text-gray-800">{selectedRecord.timestamp}</span>
                </div>
                <div>
                  <span className="text-gray-500">位置验证：</span>
                  <span className={selectedRecord.locationVerified ? 'text-green-600' : 'text-yellow-600'}>
                    {selectedRecord.locationVerified ? '已验证' : '未验证'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">温度：</span>
                  <span className="text-gray-800">{selectedRecord.temperature}°C</span>
                </div>
                <div>
                  <span className="text-gray-500">湿度：</span>
                  <span className="text-gray-800">{selectedRecord.humidity}%</span>
                </div>
              </div>

              {selectedRecord.abnormalities.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-red-700">异常情况</div>
                  <p className="text-sm text-red-600 mt-1">
                    {selectedRecord.abnormalities.join('、')}
                  </p>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Image size={14} />
                  巡查照片 ({selectedRecord.photos?.length || 0}张)
                </div>
                {selectedRecord.photos && selectedRecord.photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedRecord.photos.map((photo) => (
                      <div key={photo.id} className="relative">
                        <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={photo.url}
                            alt={photo.label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{photo.label}</p>
                        <p className="text-xs text-gray-400">{photo.uploadedAt}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">
                    暂无照片
                  </div>
                )}
              </div>

              {selectedRecord.notes && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">备注</div>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    {selectedRecord.notes}
                  </p>
                </div>
              )}

              {selectedRecord.reviews && selectedRecord.reviews.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileCheck size={14} />
                    复核记录
                  </div>
                  <div className="space-y-2">
                    {selectedRecord.reviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {review.reviewer}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            review.status === 'approved'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {review.status === 'approved' ? '通过' : '驳回'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{review.reviewTime}</p>
                        {review.comment && (
                          <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecord.isMakeup && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-orange-700 text-sm font-medium">
                    <RotateCcw size={14} />
                    补检记录
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    补检原因：{selectedRecord.makeupReason}
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowRecordDetailModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                关闭
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
