import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Building2
} from 'lucide-react';
import Card, { CardHeader } from '../components/common/Card';
import { Select } from '../components/common/Input';
import {
  useAnalytics,
  useLotStore,
  useMaterialStore
} from '../store/useStore';

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30');
  const { getSupplierPerformance, getDefectAnalysis, getTrendData } = useAnalytics();
  const lots = useLotStore((state) => state.lots);
  const materials = useMaterialStore((state) => state.materials);
  const supplierPerformance = getSupplierPerformance().filter(p => p.totalLots > 0);
  const defectAnalysis = getDefectAnalysis();
  const trendData = getTrendData(parseInt(timeRange));

  // Prepare Pareto data
  const paretoData = defectAnalysis.map((item, index) => {
    const cumulative = defectAnalysis
      .slice(0, index + 1)
      .reduce((sum, d) => sum + d.percentage, 0);
    return {
      ...item,
      cumulative,
    };
  });

  // OC Curve simulation data (simplified)
  const ocCurveData = [
    { p: 0, pa: 100 },
    { p: 1, pa: 98 },
    { p: 2, pa: 92 },
    { p: 2.5, pa: 85 },
    { p: 3, pa: 75 },
    { p: 4, pa: 55 },
    { p: 5, pa: 35 },
    { p: 6, pa: 20 },
    { p: 7, pa: 10 },
    { p: 8, pa: 5 },
    { p: 10, pa: 1 },
  ];

  // Material distribution
  const materialDistribution = materials.map(m => {
    const count = lots.filter(l => l.materialTypeId === m.id && l.status === 'completed').length;
    return { name: m.name, value: count };
  }).filter(m => m.value > 0);

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="flex justify-end">
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          options={[
            { value: '7', label: 'Son 7 Gün' },
            { value: '14', label: 'Son 14 Gün' },
            { value: '30', label: 'Son 30 Gün' },
            { value: '90', label: 'Son 90 Gün' },
          ]}
        />
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader
          title="Kontrol Trendi"
          subtitle={`Son ${timeRange} gün`}
          action={<Activity className="w-5 h-5 text-blue-500" />}
        />
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorInspections" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }}
              />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="inspections"
                name="Kontrol"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorInspections)"
              />
              <Line
                type="monotone"
                dataKey="accepted"
                name="Kabul"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="rejected"
                name="Red"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pareto Analysis */}
        <Card>
          <CardHeader
            title="Pareto Analizi (80/20)"
            subtitle="En sık görülen hatalar"
            action={<BarChart3 className="w-5 h-5 text-amber-500" />}
          />
          {paretoData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paretoData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                  <XAxis dataKey="defectName" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="count" name="Adet" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                    {paretoData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulative"
                    name="Kümülatif %"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ fill: '#EF4444' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              Henüz hata verisi yok
            </div>
          )}
        </Card>

        {/* OC Curve */}
        <Card>
          <CardHeader
            title="OC Eğrisi (İşletme Karakteristiği)"
            subtitle="AQL %2.5, n=200 için"
            action={<TrendingUp className="w-5 h-5 text-purple-500" />}
          />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ocCurveData}>
                <defs>
                  <linearGradient id="colorOC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                <XAxis
                  dataKey="p"
                  label={{ value: 'Hata Oranı (%)', position: 'bottom', offset: -5 }}
                />
                <YAxis
                  domain={[0, 100]}
                  label={{ value: 'Kabul Olasılığı (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="pa"
                  name="Pa"
                  stroke="#8B5CF6"
                  fillOpacity={1}
                  fill="url(#colorOC)"
                />
                {/* AQL ve LTPD referans çizgileri */}
                <ReferenceLine x={2.5} stroke="#10B981" strokeDasharray="5 5" />
                <ReferenceLine x={8} stroke="#EF4444" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p><span className="inline-block w-3 h-3 bg-emerald-500 rounded mr-2"></span>AQL = %2.5 (Kabul Kalite Düzeyi)</p>
            <p><span className="inline-block w-3 h-3 bg-red-500 rounded mr-2"></span>LTPD ≈ %8 (Lot Tolerans Hatalı Oranı)</p>
          </div>
        </Card>
      </div>

      {/* Supplier Performance & Material Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Performance */}
        <Card>
          <CardHeader
            title="Tedarikçi Performansı"
            subtitle="Kabul oranlarına göre"
            action={<Building2 className="w-5 h-5 text-blue-500" />}
          />
          {supplierPerformance.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplierPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="supplierName" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`%${value.toFixed(1)}`, 'Kabul Oranı']}
                  />
                  <Bar dataKey="acceptanceRate" name="Kabul Oranı" radius={[0, 4, 4, 0]}>
                    {supplierPerformance.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.acceptanceRate >= 90
                            ? '#10B981'
                            : entry.acceptanceRate >= 70
                            ? '#F59E0B'
                            : '#EF4444'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              Henüz tedarikçi performans verisi yok
            </div>
          )}
        </Card>

        {/* Material Distribution */}
        <Card>
          <CardHeader
            title="Malzeme Dağılımı"
            subtitle="Kontrol edilen partiler"
            action={<PieChartIcon className="w-5 h-5 text-emerald-500" />}
          />
          {materialDistribution.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={materialDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {materialDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              Henüz kontrol verisi yok
            </div>
          )}
        </Card>
      </div>

      {/* Supplier Scorecard Table */}
      {supplierPerformance.length > 0 && (
        <Card>
          <CardHeader
            title="Tedarikçi Karnesi"
            subtitle="Detaylı performans metrikleri"
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Tedarikçi
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Toplam Parti
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Kabul
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Red
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Kabul Oranı
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Ort. Hata
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Puan
                  </th>
                </tr>
              </thead>
              <tbody>
                {supplierPerformance
                  .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
                  .map((supplier) => {
                    const score = Math.round(supplier.acceptanceRate);
                    return (
                      <tr
                        key={supplier.supplierId}
                        className="border-b border-gray-100 dark:border-slate-700/50"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                          {supplier.supplierName}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
                          {supplier.totalLots}
                        </td>
                        <td className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400">
                          {supplier.acceptedLots}
                        </td>
                        <td className="py-3 px-4 text-center text-red-600 dark:text-red-400">
                          {supplier.rejectedLots}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-medium ${
                              supplier.acceptanceRate >= 90
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : supplier.acceptanceRate >= 70
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            %{supplier.acceptanceRate.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
                          {supplier.avgDefectsPerLot.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                              score >= 90
                                ? 'bg-emerald-500'
                                : score >= 70
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                          >
                            {score}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
