import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Info,
  ArrowRight,
  Plus,
  Building2,
  Package,
  Layers
} from 'lucide-react';
import Card, { CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Input, { Select, TextArea } from '../components/common/Input';
import Modal from '../components/common/Modal';
import SwitchingBadge from '../components/switching/SwitchingBadge';
import {
  useLotStore,
  useSupplierStore,
  useMaterialStore,
  useSettingsStore
} from '../store/useStore';
import { useSwitchingStore } from '../store/switchingStore';
import {
  calculateSampling,
  aqlOptions,
  inspectionLevels,
} from '../data/samplingData';
import { getAdjustedSampleSize, getAdjustedAcceptance } from '../utils/switchingLogic';
import {
  generateSamplePositions,
  calculateSamplingStats,
} from '../utils/clusterSampling';
import type { PackageConfig } from '../utils/clusterSampling';
import { SWITCHING_LEVEL_LABELS } from '../types/switching';
import toast from 'react-hot-toast';

export default function LotEntry() {
  const navigate = useNavigate();
  const addLot = useLotStore((state) => state.addLot);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const addSupplier = useSupplierStore((state) => state.addSupplier);
  const materials = useMaterialStore((state) => state.materials);
  const { settings } = useSettingsStore();
  const getSwitchingState = useSwitchingStore((state) => state.getState);

  const [formData, setFormData] = useState({
    supplierId: '',
    materialTypeId: '',
    quantity: '',
    orderNumber: '',
    receivedDate: new Date().toISOString().split('T')[0],
    aql: settings.defaultAQL,
    inspectionLevel: settings.defaultInspectionLevel,
    inspectedBy: '',
    notes: '',
  });

  // Parti yapısı konfigürasyonu (Küme örneklemesi için)
  const [packageConfig, setPackageConfig] = useState<PackageConfig>({
    palletCount: 0,
    packagesPerPallet: 0,
    itemsPerPackage: 0,
  });

  // Örnekleme istatistikleri
  const [samplingStats, setSamplingStats] = useState<{
    totalPackages: number;
    totalItems: number;
    samplesPerPackage: number;
    packagesToOpen: number;
  } | null>(null);

  const [samplingResult, setSamplingResult] = useState<{
    sampleCode: string;
    sampleSize: number;
    acceptanceNumber: number;
    rejectionNumber: number;
  } | null>(null);

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  });

  const selectedMaterial = materials.find(m => m.id === formData.materialTypeId);
  const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);

  // Switching state for selected supplier + material
  const switchingState = formData.supplierId && formData.materialTypeId
    ? getSwitchingState(formData.supplierId, formData.materialTypeId)
    : null;

  // Calculate sampling when quantity or AQL changes
  useEffect(() => {
    const quantity = parseInt(formData.quantity);
    if (quantity > 0) {
      const baseResult = calculateSampling(quantity, formData.aql, formData.inspectionLevel);

      if (baseResult && switchingState) {
        // Switching seviyesine göre ayarla
        const adjustedSampleSize = getAdjustedSampleSize(baseResult.sampleSize, switchingState.currentLevel);
        const adjustedAcceptance = getAdjustedAcceptance(
          baseResult.acceptanceNumber,
          baseResult.rejectionNumber,
          switchingState.currentLevel
        );

        setSamplingResult({
          ...baseResult,
          sampleSize: adjustedSampleSize,
          acceptanceNumber: adjustedAcceptance.acceptance,
          rejectionNumber: adjustedAcceptance.rejection,
        });
      } else {
        setSamplingResult(baseResult);
      }
    } else {
      setSamplingResult(null);
    }
  }, [formData.quantity, formData.aql, formData.inspectionLevel, switchingState]);

  // Parti yapısı değiştiğinde örnekleme istatistiklerini hesapla
  useEffect(() => {
    if (samplingResult && packageConfig.palletCount > 0 && packageConfig.packagesPerPallet > 0) {
      const stats = calculateSamplingStats(samplingResult.sampleSize, packageConfig);
      setSamplingStats(stats);
    } else {
      setSamplingStats(null);
    }
  }, [samplingResult, packageConfig]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePackageConfigChange = (field: keyof PackageConfig, value: string) => {
    const numValue = parseInt(value) || 0;
    setPackageConfig({
      ...packageConfig,
      [field]: numValue,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplierId || !formData.materialTypeId || !formData.quantity) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    if (!samplingResult) {
      toast.error('Geçerli bir parti miktarı girin');
      return;
    }

    // Parti yapısı girilmişse numune pozisyonlarını oluştur
    let samplePositions = undefined;
    let lotPackageConfig = undefined;

    if (packageConfig.palletCount > 0 && packageConfig.packagesPerPallet > 0) {
      samplePositions = generateSamplePositions(samplingResult.sampleSize, packageConfig);
      lotPackageConfig = { ...packageConfig };
    }

    const lot = addLot({
      supplierId: formData.supplierId,
      materialTypeId: formData.materialTypeId,
      quantity: parseInt(formData.quantity),
      sampleSize: samplingResult.sampleSize,
      sampleCode: samplingResult.sampleCode,
      aql: formData.aql,
      inspectionLevel: formData.inspectionLevel as 'I' | 'II' | 'III',
      acceptanceNumber: samplingResult.acceptanceNumber,
      rejectionNumber: samplingResult.rejectionNumber,
      orderNumber: formData.orderNumber,
      receivedDate: formData.receivedDate,
      inspectionDate: '',
      inspectedBy: formData.inspectedBy,
      notes: formData.notes,
      packageConfig: lotPackageConfig,
      samplePositions: samplePositions,
      currentSampleIndex: 0,
    });

    toast.success('Parti başarıyla oluşturuldu');
    navigate('/inspection', { state: { lotId: lot.id } });
  };

  const handleAddSupplier = () => {
    if (!newSupplier.name || !newSupplier.code) {
      toast.error('Tedarikçi adı ve kodu zorunludur');
      return;
    }

    addSupplier({
      ...newSupplier,
      isActive: true,
    });

    toast.success('Tedarikçi eklendi');
    setShowSupplierModal(false);
    setNewSupplier({
      name: '',
      code: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <form onSubmit={handleSubmit}>
        {/* General Information */}
        <Card className="mb-6">
          <CardHeader
            title="Genel Bilgiler"
            subtitle="Parti ve tedarikçi bilgilerini girin"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tedarikçi <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                >
                  <option value="">Tedarikçi Seçin</option>
                  {suppliers.filter(s => s.isActive).map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowSupplierModal(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Select
              label="Malzeme Türü"
              name="materialTypeId"
              value={formData.materialTypeId}
              onChange={handleChange}
              options={materials.map((m) => ({ value: m.id, label: m.name }))}
              placeholder="Malzeme Seçin"
              required
            />

            <Input
              label={`Parti Miktarı (${selectedMaterial?.unit ? selectedMaterial.unit.charAt(0).toUpperCase() + selectedMaterial.unit.slice(1) : 'Adet'})`}
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder={selectedMaterial?.unit === 'bobin' ? 'Örn: 500' : 'Örn: 10000'}
              min="2"
              required
            />

            <Input
              label="Sipariş / İrsaliye No"
              name="orderNumber"
              value={formData.orderNumber}
              onChange={handleChange}
              placeholder="Örn: SIP-2024-123"
            />

            <Input
              label="Teslim Tarihi"
              type="date"
              name="receivedDate"
              value={formData.receivedDate}
              onChange={handleChange}
              required
            />

            <Input
              label="Kontrolü Yapan"
              name="inspectedBy"
              value={formData.inspectedBy}
              onChange={handleChange}
              placeholder="Ad Soyad"
            />
          </div>

          {/* Switching Badge - Tedarikçi ve malzeme seçiliyse göster */}
          {switchingState && selectedSupplier && selectedMaterial && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Kontrol Seviyesi</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {selectedSupplier.name} - {selectedMaterial.name}
                  </p>
                </div>
                <SwitchingBadge
                  supplierId={formData.supplierId}
                  materialTypeId={formData.materialTypeId}
                  supplierName={selectedSupplier.name}
                  materialName={selectedMaterial.name}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Sampling Parameters */}
        <Card className="mb-6">
          <CardHeader
            title="Örnekleme Parametreleri"
            subtitle="ISO 2859-1 standardına göre"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="AQL Değeri"
              name="aql"
              value={formData.aql}
              onChange={handleChange}
              options={aqlOptions}
            />

            <Select
              label="Muayene Seviyesi"
              name="inspectionLevel"
              value={formData.inspectionLevel}
              onChange={handleChange}
              options={inspectionLevels}
            />
          </div>

          {/* Calculated Values */}
          {samplingResult && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      Hesaplanan Değerler
                    </h4>
                    {switchingState && switchingState.currentLevel !== 'normal' && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        switchingState.currentLevel === 'tightened'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {SWITCHING_LEVEL_LABELS[switchingState.currentLevel]} muayene
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {samplingResult.sampleSize}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Örneklem
                      </p>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {samplingResult.acceptanceNumber}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Kabul (Ac)
                      </p>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {samplingResult.rejectionNumber}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Red (Re)
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>
                      {parseInt(formData.quantity).toLocaleString('tr-TR')} {selectedMaterial?.unit || 'adet'}lik partiden{' '}
                      <strong>{samplingResult.sampleSize}</strong> {selectedMaterial?.unit || 'adet'} rastgele numune alınacak.{' '}
                      <strong>{samplingResult.acceptanceNumber}</strong> veya daha az hatalı çıkarsa
                      parti kabul edilecek.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!samplingResult && formData.quantity && parseInt(formData.quantity) > 0 && (
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Info className="w-5 h-5" />
                <p>Bu parti büyüklüğü ve AQL kombinasyonu için örnekleme planı bulunamadı.</p>
              </div>
            </div>
          )}
        </Card>

        {/* Parti Yapısı - Küme Örneklemesi */}
        {samplingResult && (
          <Card className="mb-6">
            <CardHeader
              title="Parti Yapısı (İsteğe Bağlı)"
              subtitle="Küme örneklemesi için palet ve poşet bilgilerini girin"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Package className="w-4 h-4 inline mr-1" />
                  Palet Sayısı (P)
                </label>
                <input
                  type="number"
                  min="0"
                  value={packageConfig.palletCount || ''}
                  onChange={(e) => handlePackageConfigChange('palletCount', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Örn: 4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Layers className="w-4 h-4 inline mr-1" />
                  Poşet/Palet (B)
                </label>
                <input
                  type="number"
                  min="0"
                  value={packageConfig.packagesPerPallet || ''}
                  onChange={(e) => handlePackageConfigChange('packagesPerPallet', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Örn: 16"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Etiket/Poşet (L)
                </label>
                <input
                  type="number"
                  min="0"
                  value={packageConfig.itemsPerPackage || ''}
                  onChange={(e) => handlePackageConfigChange('itemsPerPackage', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Örn: 250"
                />
              </div>
            </div>

            {/* Örnekleme İstatistikleri */}
            {samplingStats && (
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">
                      Küme Örnekleme Planı
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {samplingStats.totalPackages}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Toplam Poşet
                        </p>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {samplingStats.totalItems.toLocaleString('tr-TR')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Toplam Etiket
                        </p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          {samplingStats.packagesToOpen}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Açılacak Poşet
                        </p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          ~{samplingStats.samplesPerPackage}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Poşet Başı Etiket
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-start gap-2 text-sm text-purple-700 dark:text-purple-300">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>
                        <strong>{samplingStats.packagesToOpen}</strong> rastgele poşet açılacak ve her poşetten{' '}
                        <strong>~{samplingStats.samplesPerPackage}</strong> etiket kontrol edilecek.
                        Pozisyon kodları: <span className="font-mono">PP-BB-NN</span>{' '}
                        (01=Üst, 02=Orta, 03=Alt)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Material Criteria Preview */}
        {selectedMaterial && (
          <Card className="mb-6">
            <CardHeader
              title="Kontrol Kriterleri"
              subtitle={`${selectedMaterial.name} için kontrol edilecek özellikler`}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedMaterial.criteria.map((criterion) => (
                <div
                  key={criterion.id}
                  className={`p-3 rounded-lg border ${
                    criterion.isCritical
                      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                      : 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {criterion.name}
                    </span>
                    {criterion.isCritical && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full">
                        Kritik
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {criterion.acceptanceCriteria}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Notes */}
        <Card className="mb-6">
          <TextArea
            label="Notlar"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Ek notlar..."
            rows={3}
          />
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={!samplingResult}
            icon={<ArrowRight className="w-5 h-5" />}
          >
            Kontrole Başla
          </Button>
        </div>
      </form>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title="Yeni Tedarikçi Ekle"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tedarikçi Adı"
              value={newSupplier.name}
              onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
              placeholder="Örn: ABC Ltd. Şti."
              required
            />
            <Input
              label="Kısa Kod"
              value={newSupplier.code}
              onChange={(e) => setNewSupplier({ ...newSupplier, code: e.target.value.toUpperCase() })}
              placeholder="Örn: ABC"
              required
            />
          </div>
          <Input
            label="Yetkili Kişi"
            value={newSupplier.contactPerson}
            onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
            placeholder="Ad Soyad"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Telefon"
              value={newSupplier.phone}
              onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
              placeholder="0212 555 1234"
            />
            <Input
              label="E-posta"
              type="email"
              value={newSupplier.email}
              onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
              placeholder="info@firma.com"
            />
          </div>
          <Input
            label="Adres"
            value={newSupplier.address}
            onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
            placeholder="İstanbul, Türkiye"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowSupplierModal(false)}>
              İptal
            </Button>
            <Button onClick={handleAddSupplier}>
              <Building2 className="w-4 h-4 mr-2" />
              Tedarikçi Ekle
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
