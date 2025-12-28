import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  FileText,
  Eye,
  Package
} from 'lucide-react';
import Card, { CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Input, { Select } from '../components/common/Input';
import { StatusBadge, DecisionBadge } from '../components/common/Badge';
import {
  useLotStore,
  useSupplierStore,
  useMaterialStore,
  useInspectionStore
} from '../store/useStore';
import { formatDate } from '../data/samplingData';
import { generatePDF, generateBulkPDF } from '../utils/pdf';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function Reports() {
  const navigate = useNavigate();
  const lots = useLotStore((state) => state.lots);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const materials = useMaterialStore((state) => state.materials);
  const inspections = useInspectionStore((state) => state.inspections);

  const [search, setSearch] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('');
  const [filterDecision, setFilterDecision] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Filter lots
  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const supplier = suppliers.find((s) => s.id === lot.supplierId);
        const material = materials.find((m) => m.id === lot.materialTypeId);
        const searchMatch =
          lot.lotNumber.toLowerCase().includes(searchLower) ||
          supplier?.name.toLowerCase().includes(searchLower) ||
          material?.name.toLowerCase().includes(searchLower) ||
          lot.orderNumber?.toLowerCase().includes(searchLower);
        if (!searchMatch) return false;
      }

      // Supplier filter
      if (filterSupplier && lot.supplierId !== filterSupplier) return false;

      // Material filter
      if (filterMaterial && lot.materialTypeId !== filterMaterial) return false;

      // Decision filter
      if (filterDecision) {
        if (filterDecision === 'pending' && lot.status === 'completed') return false;
        if (filterDecision === 'accepted' && lot.decision !== 'accepted') return false;
        if (filterDecision === 'rejected' && lot.decision !== 'rejected') return false;
      }

      // Date filter
      if (filterDateFrom) {
        const lotDate = new Date(lot.createdAt);
        const fromDate = new Date(filterDateFrom);
        if (lotDate < fromDate) return false;
      }
      if (filterDateTo) {
        const lotDate = new Date(lot.createdAt);
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59);
        if (lotDate > toDate) return false;
      }

      return true;
    });
  }, [lots, search, filterSupplier, filterMaterial, filterDecision, filterDateFrom, filterDateTo, suppliers, materials]);

  const getSupplierName = (id: string) =>
    suppliers.find((s) => s.id === id)?.name || '-';
  const getMaterialName = (id: string) =>
    materials.find((m) => m.id === id)?.name || '-';

  const handleExportExcel = () => {
    const data = filteredLots.map((lot) => ({
      'Parti No': lot.lotNumber,
      'Tedarikçi': getSupplierName(lot.supplierId),
      'Malzeme': getMaterialName(lot.materialTypeId),
      'Miktar': lot.quantity,
      'Örneklem': lot.sampleSize,
      'Hatalı': lot.defectCount,
      'AQL': lot.aql,
      'Sonuç': lot.decision === 'accepted' ? 'KABUL' : lot.decision === 'rejected' ? 'RED' : 'Bekliyor',
      'Sipariş No': lot.orderNumber,
      'Tarih': formatDate(lot.createdAt),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kontrol Raporu');
    XLSX.writeFile(wb, `Kalite_Kontrol_Raporu_${formatDate(new Date()).replace(/\//g, '-')}.xlsx`);
    toast.success('Excel raporu oluşturuldu');
  };

  const handleExportPDF = async () => {
    try {
      await generateBulkPDF(filteredLots, suppliers, materials);
      toast.success('PDF raporu oluşturuldu');
    } catch (error) {
      toast.error('PDF oluşturulamadı');
    }
  };

  const handleViewLot = (lotId: string) => {
    const lot = lots.find((l) => l.id === lotId);
    if (lot && lot.status === 'completed') {
      navigate('/result', {
        state: {
          lotId: lot.id,
          decision: lot.decision,
          defectCount: lot.defectCount,
          sampleSize: lot.sampleSize,
        },
      });
    }
  };

  const handleSinglePDF = async (lotId: string) => {
    const lot = lots.find((l) => l.id === lotId);
    if (!lot) return;

    const supplier = suppliers.find((s) => s.id === lot.supplierId);
    const material = materials.find((m) => m.id === lot.materialTypeId);
    const lotInspections = inspections.filter((i) => i.lotId === lotId);

    // Calculate defect distribution
    const defectDistribution: Record<string, number> = {};
    lotInspections.forEach((inspection) => {
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

    try {
      await generatePDF({
        lot,
        supplier,
        material,
        inspections: lotInspections,
        defectDistribution: chartData,
      });
      toast.success('PDF raporu oluşturuldu');
    } catch (error) {
      toast.error('PDF oluşturulamadı');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterSupplier('');
    setFilterMaterial('');
    setFilterDecision('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader
          title="Filtreler"
          action={
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Temizle
            </Button>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Parti no, tedarikçi ara..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <Select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="Tüm Tedarikçiler"
          />

          <Select
            value={filterMaterial}
            onChange={(e) => setFilterMaterial(e.target.value)}
            options={materials.map((m) => ({ value: m.id, label: m.name }))}
            placeholder="Tüm Malzemeler"
          />

          <Select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value)}
            options={[
              { value: 'pending', label: 'Bekliyor' },
              { value: 'accepted', label: 'Kabul' },
              { value: 'rejected', label: 'Red' },
            ]}
            placeholder="Tüm Sonuçlar"
          />

          <Input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            label="Başlangıç Tarihi"
          />

          <Input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            label="Bitiş Tarihi"
          />
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredLots.length} kayıt bulundu
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportExcel}>
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button variant="secondary" onClick={handleExportPDF}>
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card padding="none">
        {filteredLots.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Parti No
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Tedarikçi
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Malzeme
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Miktar
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Hatalı
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Durum
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Sonuç
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Tarih
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLots.map((lot) => (
                  <tr
                    key={lot.id}
                    className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {lot.lotNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {getSupplierName(lot.supplierId)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {getMaterialName(lot.materialTypeId)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                      {lot.quantity.toLocaleString('tr-TR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={lot.defectCount > 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                        {lot.defectCount}/{lot.sampleSize}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={lot.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <DecisionBadge decision={lot.decision} />
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {formatDate(lot.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {lot.status === 'completed' && (
                          <>
                            <button
                              onClick={() => handleViewLot(lot.id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 hover:text-blue-600 transition-colors"
                              title="Görüntüle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSinglePDF(lot.id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 hover:text-blue-600 transition-colors"
                              title="PDF"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
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
              Kayıt bulunamadı
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Filtreleri değiştirerek tekrar deneyin
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
