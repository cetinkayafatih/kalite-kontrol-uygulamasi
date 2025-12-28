import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import Card, { CardHeader } from '../components/common/Card';
import StatsCard from '../components/common/StatsCard';
import Button from '../components/common/Button';
import { DecisionBadge } from '../components/common/Badge';
import {
  useLotStore,
  useSupplierStore,
  useMaterialStore,
  useAnalytics
} from '../store/useStore';
import { formatDate } from '../data/samplingData';

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6'];

export default function Dashboard() {
  const navigate = useNavigate();
  const lots = useLotStore((state) => state.lots);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const materials = useMaterialStore((state) => state.materials);
  const { getStats, getTrendData } = useAnalytics();

  const stats = getStats();
  const trendData = getTrendData(14);

  // Pie chart data
  const pieData = [
    { name: 'Kabul', value: stats.totalAccepted },
    { name: 'Red', value: stats.totalRejected },
  ].filter(d => d.value > 0);

  // Recent lots
  const recentLots = lots.slice(0, 5);

  // Get supplier and material names
  const getSupplierName = (id: string) =>
    suppliers.find(s => s.id === id)?.name || 'Bilinmiyor';
  const getMaterialName = (id: string) =>
    materials.find(m => m.id === id)?.name || 'Bilinmiyor';

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/lot-entry')}
        >
          Yeni Parti Girişi
        </Button>
        <Button
          variant="secondary"
          icon={<ClipboardCheck className="w-4 h-4" />}
          onClick={() => navigate('/inspection')}
        >
          Kontrol Yap
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Bugün Kontrol"
          value={stats.todayInspections}
          icon={<ClipboardCheck className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="Bu Hafta"
          value={stats.weeklyInspections}
          icon={<Package className="w-6 h-6" />}
          color="purple"
        />
        <StatsCard
          title="Kabul Oranı"
          value={`%${stats.acceptanceRate.toFixed(1)}`}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
        />
        <StatsCard
          title="Bekleyen Parti"
          value={stats.pendingLots}
          icon={<Clock className="w-6 h-6" />}
          color="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Kontrol Trendi"
            subtitle="Son 14 gün"
          />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                  className="text-gray-500"
                />
                <YAxis className="text-gray-500" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    border: '1px solid var(--tooltip-border, #e5e7eb)',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) => formatDate(value)}
                />
                <Area
                  type="monotone"
                  dataKey="accepted"
                  name="Kabul"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorAccepted)"
                />
                <Area
                  type="monotone"
                  dataKey="rejected"
                  name="Red"
                  stroke="#EF4444"
                  fillOpacity={1}
                  fill="url(#colorRejected)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader
            title="Kabul/Red Dağılımı"
            subtitle="Toplam sonuçlar"
          />
          <div className="h-80">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Henüz kontrol verisi yok</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Kabul Edilen</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalAccepted}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-emerald-200 opacity-80" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Reddedilen</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalRejected}</p>
            </div>
            <XCircle className="w-12 h-12 text-red-200 opacity-80" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Toplam Parti</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalLots}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
        </Card>
      </div>

      {/* Recent Inspections */}
      <Card>
        <CardHeader
          title="Son Kontroller"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
              Tümünü Gör
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          }
        />
        {recentLots.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Parti No</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Malzeme</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Tedarikçi</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Tarih</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Sonuç</th>
                </tr>
              </thead>
              <tbody>
                {recentLots.map((lot) => (
                  <tr
                    key={lot.id}
                    className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/reports?lot=${lot.id}`)}
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {lot.lotNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {getMaterialName(lot.materialTypeId)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {getSupplierName(lot.supplierId)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {formatDate(lot.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <DecisionBadge decision={lot.decision} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Henüz kontrol yapılmadı
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              İlk partinizi girerek kalite kontrole başlayın
            </p>
            <Button onClick={() => navigate('/lot-entry')}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Parti Girişi
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
