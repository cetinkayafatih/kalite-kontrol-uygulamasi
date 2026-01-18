import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  FileText,
  Home,
  Plus,
  Printer
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import Card, { CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import {
  useLotStore,
  useInspectionStore,
  useMaterialStore,
  useSupplierStore
} from '../store/useStore';
import { useSwitchingStore } from '../store/switchingStore';
import SwitchingBadge from '../components/switching/SwitchingBadge';
import { formatDate } from '../data/samplingData';
import { generatePDF } from '../utils/pdf';
import toast from 'react-hot-toast';

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

export default function Result() {
  const navigate = useNavigate();
  const location = useLocation();

  // Safely get state data
  const stateData = (location.state as {
    lotId?: string;
    decision?: 'accepted' | 'rejected';
    defectCount?: number;
    sampleSize?: number;
  }) || {};

  // Get stores
  const lots = useLotStore((state) => state.lots);
  const allInspections = useInspectionStore((state) => state.inspections);
  const materials = useMaterialStore((state) => state.materials);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const getSwitchingState = useSwitchingStore((state) => state.getState);

  // Find the lot
  const lotId = stateData.lotId;
  const lot = lotId ? lots.find((l) => l.id === lotId) : undefined;

  // Filter inspections for this lot
  const inspections = lotId ? allInspections.filter((i) => i.lotId === lotId) : [];

  // Use state values or fallback to lot values
  const decision = stateData.decision || lot?.decision;
  const defectCount = stateData.defectCount ?? lot?.defectCount ?? 0;
  const sampleSize = stateData.sampleSize || lot?.sampleSize || 0;

  // Show not found message if no lot
  if (!lot) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Kontrol sonucu bulunamadı
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
            Lütfen bir parti kontrolü tamamladıktan sonra bu sayfayı ziyaret edin.
          </p>
          <Button onClick={() => navigate('/')} className="mt-4">
            <Home className="w-4 h-4 mr-2" />
            Ana Sayfaya Dön
          </Button>
        </Card>
      </div>
    );
  }

  const material = materials.find((m) => m.id === lot.materialTypeId);
  const supplier = suppliers.find((s) => s.id === lot.supplierId);
  const switchingState = getSwitchingState(lot.supplierId, lot.materialTypeId);

  // Calculate defect distribution
  const defectDistribution: Record<string, number> = {};
  inspections.forEach((inspection) => {
    inspection.defects.forEach((defect) => {
      const defectType = material?.defectTypes.find(
        (d) => d.id === defect.defectTypeId
      );
      const name = defectType?.name || defect.defectTypeId;
      defectDistribution[name] = (defectDistribution[name] || 0) + 1;
    });
  });

  const chartData = Object.entries(defectDistribution)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const handleGeneratePDF = async () => {
    try {
      await generatePDF({
        lot,
        supplier,
        material,
        inspections,
        defectDistribution: chartData,
        switchingLevel: switchingState.currentLevel,
      });
      toast.success('PDF raporu oluşturuldu');
    } catch (error) {
      toast.error('PDF oluşturulamadı');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isAccepted = decision === 'accepted';

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:space-y-4">
      {/* Decision Banner */}
      <Card
        padding="lg"
        className={`text-center ${
          isAccepted
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
            : 'bg-gradient-to-r from-red-500 to-red-600'
        } border-0`}
      >
        <div className="flex flex-col items-center">
          {isAccepted ? (
            <CheckCircle className="w-20 h-20 text-white mb-4" />
          ) : (
            <XCircle className="w-20 h-20 text-white mb-4" />
          )}
          <h1 className="text-3xl font-bold text-white mb-2">
            PARTİ {isAccepted ? 'KABUL EDİLDİ' : 'REDDEDİLDİ'}
          </h1>
          <p className="text-white/80">
            {defectCount} hatalı {isAccepted ? '≤' : '≥'}{' '}
            {isAccepted ? lot.acceptanceNumber : lot.rejectionNumber}{' '}
            {isAccepted ? 'kabul' : 'red'} limiti
          </p>
        </div>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader title="Kontrol Özeti" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-xl text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Parti No</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {lot.lotNumber}
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-xl text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Örneklem</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {sampleSize} {material?.unit || 'adet'}
            </p>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Uygun</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {sampleSize - defectCount} {material?.unit || 'adet'}
            </p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Hatalı</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
              {defectCount} {material?.unit || 'adet'}
            </p>
          </div>
        </div>
      </Card>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lot Details */}
        <Card>
          <CardHeader title="Parti Bilgileri" />
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="text-gray-500 dark:text-gray-400">Tedarikçi</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {supplier?.name || '-'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="text-gray-500 dark:text-gray-400">Malzeme</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {material?.name || '-'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="text-gray-500 dark:text-gray-400">Parti Miktarı</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {lot.quantity.toLocaleString('tr-TR')} {material?.unit || 'adet'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="text-gray-500 dark:text-gray-400">Sipariş No</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {lot.orderNumber || '-'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500 dark:text-gray-400">Tarih</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDate(new Date())}
              </span>
            </div>
          </div>
        </Card>

        {/* Sampling Parameters */}
        <Card>
          <CardHeader title="Örnekleme Parametreleri" />
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="text-gray-500 dark:text-gray-400">Standart</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ISO 2859-1
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="text-gray-500 dark:text-gray-400">Muayene Seviyesi</span>
              <span className="font-medium text-gray-900 dark:text-white">
                Seviye {lot.inspectionLevel}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="text-gray-500 dark:text-gray-400">Kontrol Durumu</span>
              <SwitchingBadge
                supplierId={lot.supplierId}
                materialTypeId={lot.materialTypeId}
                supplierName={supplier?.name}
                materialName={material?.name}
                size="sm"
              />
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="text-gray-500 dark:text-gray-400">AQL</span>
              <span className="font-medium text-gray-900 dark:text-white">
                %{lot.aql}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="text-gray-500 dark:text-gray-400">Örneklem Kodu</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {lot.sampleCode}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500 dark:text-gray-400">Ac / Re</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {lot.acceptanceNumber} / {lot.rejectionNumber}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Defect Distribution Chart */}
      {chartData.length > 0 && defectCount > 0 && (
        <Card>
          <CardHeader
            title="Hata Dağılımı"
            subtitle="Tespit edilen hata türleri"
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    border: '1px solid var(--tooltip-border, #e5e7eb)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Defect Table */}
          <div className="mt-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Hata Türü
                  </th>
                  <th className="text-center py-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Adet
                  </th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Oran
                  </th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item, index) => (
                  <tr
                    key={item.name}
                    className="border-b border-gray-100 dark:border-slate-700/50"
                  >
                    <td className="py-2 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-900 dark:text-white">{item.name}</span>
                    </td>
                    <td className="py-2 text-center text-gray-900 dark:text-white">
                      {item.count}
                    </td>
                    <td className="py-2 text-right text-gray-500 dark:text-gray-400">
                      %{defectCount > 0 ? ((item.count / defectCount) * 100).toFixed(1) : 0}
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-2 text-gray-900 dark:text-white">Toplam</td>
                  <td className="py-2 text-center text-gray-900 dark:text-white">
                    {defectCount}
                  </td>
                  <td className="py-2 text-right text-gray-900 dark:text-white">%100</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3 print:hidden">
        <Button onClick={handleGeneratePDF} variant="primary">
          <FileText className="w-4 h-4 mr-2" />
          PDF Rapor
        </Button>
        <Button onClick={handlePrint} variant="secondary">
          <Printer className="w-4 h-4 mr-2" />
          Yazdır
        </Button>
        <Button onClick={() => navigate('/')} variant="secondary">
          <Home className="w-4 h-4 mr-2" />
          Ana Sayfa
        </Button>
        <Button onClick={() => navigate('/lot-entry')} variant="success">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Parti
        </Button>
      </div>
    </div>
  );
}
