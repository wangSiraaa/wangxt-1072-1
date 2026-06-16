import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Alarm } from '../types';
import { generateAlarmTrendData } from '../data/mockData';
import {
  AlertTriangle,
  Thermometer,
  Droplets,
  Shield,
  Cpu,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const alarmTypeConfig = {
  temperature: { label: '温度报警', color: '#ef4444', icon: Thermometer },
  humidity: { label: '湿度报警', color: '#3b82f6', icon: Droplets },
  security: { label: '安防报警', color: '#8b5cf6', icon: Shield },
  equipment: { label: '设备报警', color: '#f59e0b', icon: Cpu },
};

const alarmLevelConfig = {
  low: { label: '低', color: 'bg-blue-100 text-blue-700' },
  medium: { label: '中', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: '高', color: 'bg-red-100 text-red-700' },
};

const alarmStatusConfig = {
  active: { label: '活跃', color: 'bg-red-100 text-red-700' },
  acknowledged: { label: '已确认', color: 'bg-yellow-100 text-yellow-700' },
  resolved: { label: '已解决', color: 'bg-green-100 text-green-700' },
};

export default function AlarmsPage() {
  const { state, dispatch } = useApp();
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');

  const trendData = generateAlarmTrendData();

  const filteredAlarms = state.alarms.filter((a) => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const activeAlarms = state.alarms.filter((a) => a.status === 'active');
  const highPriorityAlarms = state.alarms.filter(
    (a) => a.level === 'high' && a.status !== 'resolved'
  );

  const handleAcknowledge = (alarm: Alarm) => {
    dispatch({
      type: 'ACKNOWLEDGE_ALARM',
      payload: {
        alarmId: alarm.id,
        userId: state.currentUser.id,
        userName: state.currentUser.name,
      },
    });
  };

  const handleResolve = (alarm: Alarm) => {
    dispatch({
      type: 'RESOLVE_ALARM',
      payload: {
        alarmId: alarm.id,
        userId: state.currentUser.id,
        userName: state.currentUser.name,
      },
    });
  };

  return (
    <div className="p-6">
      {highPriorityAlarms.length > 0 && (
        <div className="mb-4 bg-red-500 text-white rounded-lg p-4 flex items-start gap-3 animate-pulse">
          <AlertCircle size={24} className="flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">高优先级报警提醒</div>
            <div className="text-sm opacity-90 mt-1">
              共有 {highPriorityAlarms.length} 条高优先级报警未处理，请立即关注
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="总报警数"
          value={state.alarms.length}
          icon={AlertTriangle}
          color="gray"
        />
        <StatCard
          title="活跃报警"
          value={activeAlarms.length}
          icon={Zap}
          color="red"
        />
        <StatCard
          title="今日新增"
          value={3}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="已解决"
          value={state.alarms.filter((a) => a.status === 'resolved').length}
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-4">报警趋势（近7天）</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="temperature" name="温度报警" fill="#ef4444" />
                  <Bar dataKey="humidity" name="湿度报警" fill="#3b82f6" />
                  <Bar dataKey="equipment" name="设备报警" fill="#f59e0b" />
                  <Bar dataKey="security" name="安防报警" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">报警记录</h3>
              <div className="flex gap-2">
                {(['all', 'active', 'acknowledged', 'resolved'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      filter === f
                        ? 'bg-gold-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter === 'all'
                      ? '全部'
                      : f === 'active'
                      ? '活跃'
                      : f === 'acknowledged'
                      ? '已确认'
                      : '已解决'}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {filteredAlarms.map((alarm) => (
                <AlarmItem
                  key={alarm.id}
                  alarm={alarm}
                  selected={selectedAlarm?.id === alarm.id}
                  onClick={() => setSelectedAlarm(alarm)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">报警详情</h3>
          </div>
          {selectedAlarm ? (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const TypeIcon = alarmTypeConfig[selectedAlarm.type].icon;
                    return (
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: alarmTypeConfig[selectedAlarm.type].color + '20',
                          color: alarmTypeConfig[selectedAlarm.type].color,
                        }}
                      >
                        <TypeIcon size={20} />
                      </div>
                    );
                  })()}
                  <div>
                    <div className="font-medium text-gray-800">
                      {alarmTypeConfig[selectedAlarm.type].label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedAlarm.showcaseName}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${alarmLevelConfig[selectedAlarm.level].color}`}
                  >
                    {alarmLevelConfig[selectedAlarm.level].label}级
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${alarmStatusConfig[selectedAlarm.status].color}`}
                  >
                    {alarmStatusConfig[selectedAlarm.status].label}
                  </span>
                  {selectedAlarm.continuousCount >= 3 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      连续{selectedAlarm.continuousCount}次
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{selectedAlarm.message}</p>
                {(selectedAlarm.type === 'temperature' ||
                  selectedAlarm.type === 'humidity') && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-gray-500">当前值：</span>
                    <span className="font-medium text-red-600">
                      {selectedAlarm.value}
                      {selectedAlarm.type === 'temperature' ? '°C' : '%'}
                    </span>
                    <span className="text-gray-500">阈值：</span>
                    <span className="text-gray-700">
                      {selectedAlarm.threshold}
                      {selectedAlarm.type === 'temperature' ? '°C' : '%'}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <DetailRow label="开始时间" value={selectedAlarm.startTime} />
                {selectedAlarm.acknowledgedTime && (
                  <DetailRow
                    label="确认时间"
                    value={selectedAlarm.acknowledgedTime}
                  />
                )}
                {selectedAlarm.acknowledgedBy && (
                  <DetailRow
                    label="确认人"
                    value={selectedAlarm.acknowledgedBy}
                  />
                )}
                {selectedAlarm.resolvedTime && (
                  <DetailRow
                    label="解决时间"
                    value={selectedAlarm.resolvedTime}
                  />
                )}
                {selectedAlarm.resolvedBy && (
                  <DetailRow
                    label="解决人"
                    value={selectedAlarm.resolvedBy}
                  />
                )}
              </div>

              {selectedAlarm.continuousCount >= 3 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
                    <AlertTriangle size={16} />
                    连续超标红色提示
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    该报警已连续 {selectedAlarm.continuousCount} 次超标，属于严重情况，
                    已自动冻结该展柜的上新计划，请尽快处理。
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {selectedAlarm.status === 'active' && (
                  <button
                    onClick={() => handleAcknowledge(selectedAlarm)}
                    className="flex-1 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    确认报警
                  </button>
                )}
                {(selectedAlarm.status === 'active' ||
                  selectedAlarm.status === 'acknowledged') && (
                  <button
                    onClick={() => handleResolve(selectedAlarm)}
                    className="flex-1 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                  >
                    标记解决
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              请选择一条报警查看详情
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
    gray: 'bg-gray-50 text-gray-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
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

function AlarmItem({
  alarm,
  selected,
  onClick,
}: {
  alarm: Alarm;
  selected: boolean;
  onClick: () => void;
}) {
  const TypeIcon = alarmTypeConfig[alarm.type].icon;

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
            className="p-2 rounded-lg mt-0.5"
            style={{
              backgroundColor: alarmTypeConfig[alarm.type].color + '20',
              color: alarmTypeConfig[alarm.type].color,
            }}
          >
            <TypeIcon size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">{alarm.showcaseName}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${alarmStatusConfig[alarm.status].color}`}
              >
                {alarmStatusConfig[alarm.status].label}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{alarm.message}</p>
            <div className="text-xs text-gray-400 mt-1">
              {alarm.startTime}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${alarmLevelConfig[alarm.level].color}`}
          >
            {alarmLevelConfig[alarm.level].label}
          </span>
          {alarm.continuousCount >= 3 && alarm.status === 'active' && (
            <div className="text-xs text-red-500 mt-1 font-medium">
              连续{alarm.continuousCount}次
            </div>
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
