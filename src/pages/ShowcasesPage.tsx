import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Showcase } from '../types';
import {
  Thermometer,
  Droplets,
  AlertCircle,
  Wrench,
  CheckCircle,
  Clock,
  MapPin,
  Tag,
} from 'lucide-react';

const statusConfig = {
  normal: { label: '正常', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  warning: { label: '预警', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertCircle },
  alarm: { label: '报警', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
  maintenance: { label: '维修中', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Wrench },
};

export default function ShowcasesPage() {
  const { state } = useApp();
  const [selectedShowcase, setSelectedShowcase] = useState<Showcase | null>(null);

  return (
    <div className="p-6">
      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard
          title="展柜总数"
          value={state.showcases.length}
          icon={Tag}
          color="gray"
        />
        <StatCard
          title="正常运行"
          value={state.showcases.filter((s) => s.status === 'normal').length}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="报警中"
          value={state.showcases.filter((s) => s.status === 'alarm').length}
          icon={AlertCircle}
          color="red"
        />
        <StatCard
          title="维修中"
          value={state.showcases.filter((s) => s.status === 'maintenance').length}
          icon={Wrench}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">展柜列表</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {state.showcases.map((showcase) => (
              <ShowcaseCard
                key={showcase.id}
                showcase={showcase}
                selected={selectedShowcase?.id === showcase.id}
                onClick={() => setSelectedShowcase(showcase)}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">展柜详情</h3>
          </div>
          {selectedShowcase ? (
            <ShowcaseDetail showcase={selectedShowcase} />
          ) : (
            <div className="p-8 text-center text-gray-400">
              请选择一个展柜查看详情
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
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
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

function ShowcaseCard({
  showcase,
  selected,
  onClick,
}: {
  showcase: Showcase;
  selected: boolean;
  onClick: () => void;
}) {
  const status = statusConfig[showcase.status];
  const StatusIcon = status.icon;
  const tempOver =
    showcase.temperature > showcase.tempThreshold.max ||
    showcase.temperature < showcase.tempThreshold.min;
  const humOver =
    showcase.humidity > showcase.humidityThreshold.max ||
    showcase.humidity < showcase.humidityThreshold.min;

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
        selected ? 'bg-gold-50 border-l-4 border-l-gold-500' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-800">{showcase.name}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${status.color}`}>
              <StatusIcon size={12} />
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <MapPin size={12} />
            {showcase.location}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">{showcase.code}</div>
          <div className="text-xs text-gray-400">{showcase.type}</div>
        </div>
      </div>

      <div className="flex gap-4 mt-3">
        <div className={`flex items-center gap-1 text-sm ${tempOver ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
          <Thermometer size={14} />
          <span>{showcase.temperature}°C</span>
          {tempOver && <span className="text-xs">(超标)</span>}
        </div>
        <div className={`flex items-center gap-1 text-sm ${humOver ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
          <Droplets size={14} />
          <span>{showcase.humidity}%RH</span>
          {humOver && <span className="text-xs">(超标)</span>}
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        {showcase.hasActiveAlarm && (
          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
            有报警
          </span>
        )}
        {showcase.hasOpenRepair && (
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
            维修中
          </span>
        )}
        {showcase.newArrivalFrozen && (
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">
            上新冻结
          </span>
        )}
      </div>
    </div>
  );
}

function ShowcaseDetail({ showcase }: { showcase: Showcase }) {
  const status = statusConfig[showcase.status];

  return (
    <div className="p-4 space-y-4">
      <div>
        <h4 className="text-lg font-semibold text-gray-800">{showcase.name}</h4>
        <p className="text-sm text-gray-500">{showcase.code} · {showcase.type}</p>
        <div className={`inline-flex items-center gap-1 mt-2 text-sm px-3 py-1 rounded-full border ${status.color}`}>
          <status.icon size={14} />
          {status.label}
        </div>
      </div>

      <div className="space-y-2">
        <DetailRow label="位置" value={showcase.location} />
        <DetailRow label="上次巡查" value={showcase.lastInspection} />
        <DetailRow label="上次维修" value={showcase.lastMaintenance} />
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h5 className="font-medium text-gray-700 text-sm">温湿度阈值</h5>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded p-3 text-center">
            <div className="text-xs text-gray-500">温度范围</div>
            <div className="text-lg font-semibold text-gray-800">
              {showcase.tempThreshold.min} - {showcase.tempThreshold.max}°C
            </div>
            <div className={`text-sm ${
              showcase.temperature > showcase.tempThreshold.max ||
              showcase.temperature < showcase.tempThreshold.min
                ? 'text-red-500'
                : 'text-green-500'
            }`}>
              当前: {showcase.temperature}°C
            </div>
          </div>
          <div className="bg-white rounded p-3 text-center">
            <div className="text-xs text-gray-500">湿度范围</div>
            <div className="text-lg font-semibold text-gray-800">
              {showcase.humidityThreshold.min} - {showcase.humidityThreshold.max}%
            </div>
            <div className={`text-sm ${
              showcase.humidity > showcase.humidityThreshold.max ||
              showcase.humidity < showcase.humidityThreshold.min
                ? 'text-red-500'
                : 'text-green-500'
            }`}>
              当前: {showcase.humidity}%
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="font-medium text-gray-700 text-sm">状态标记</h5>
        <div className="flex flex-wrap gap-2">
          {showcase.hasActiveAlarm ? (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
              ⚠️ 存在未处理报警
            </span>
          ) : (
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
              ✓ 无活跃报警
            </span>
          )}
          {showcase.hasOpenRepair ? (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
              🔧 维修进行中
            </span>
          ) : (
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
              ✓ 设备正常
            </span>
          )}
          {showcase.newArrivalFrozen ? (
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
              🚫 上新已冻结
            </span>
          ) : (
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
              ✓ 可正常上新
            </span>
          )}
        </div>
      </div>
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
