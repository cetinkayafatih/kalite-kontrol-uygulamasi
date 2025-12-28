import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Info,
  ArrowRight,
  Plus,
  Building2
} from 'lucide-react';
import Card, { CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Input, { Select, TextArea } from '../components/common/Input';
import Modal from '../components/common/Modal';
import {
  useLotStore,
  useSupplierStore,
  useMaterialStore,
  useSettingsStore
} from '../store/useStore';
import {
  calculateSampling,
  aqlOptions,
  inspectionLevels,
} from '../data/samplingData';
import toast from 'react-hot-toast';

export default function LotEntry() {
  const navigate = useNavigate();
  const addLot = useLotStore((state) => state.addLot);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const addSupplier = useSupplierStore((state) => state.addSupplier);
  const materials = useMaterialStore((state) => state.materials);
  const { settings } = useSettingsStore();

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

  // Calculate sampling when quantity or AQL changes
  useEffect(() => {
    const quantity = parseInt(formData.quantity);
    if (quantity > 0) {
      const result = calculateSampling(quantity, formData.aql, formData.inspectionLevel);
      setSamplingResult(result);
    } else {
      setSamplingResult(null);
    }
  }, [formData.quantity, formData.aql, formData.inspectionLevel]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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

  const selectedMaterial = materials.find(m => m.id === formData.materialTypeId);

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
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    Hesaplanan Değerler
                  </h4>
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
