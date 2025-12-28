import { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  Phone,
  Mail,
  MapPin,
  User,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import {
  useSupplierStore,
  useLotStore,
  useAnalytics
} from '../store/useStore';
import toast from 'react-hot-toast';

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSupplierStore();
  const lots = useLotStore((state) => state.lots);
  const { getSupplierPerformance } = useAnalytics();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    isActive: true,
  });

  const supplierPerformance = getSupplierPerformance();

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  const getPerformance = (supplierId: string) =>
    supplierPerformance.find((p) => p.supplierId === supplierId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      toast.error('Ad ve kod zorunludur');
      return;
    }

    if (editingId) {
      updateSupplier(editingId, formData);
      toast.success('Tedarikçi güncellendi');
    } else {
      addSupplier(formData);
      toast.success('Tedarikçi eklendi');
    }

    handleCloseModal();
  };

  const handleEdit = (supplier: typeof suppliers[0]) => {
    setFormData({
      name: supplier.name,
      code: supplier.code,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      isActive: supplier.isActive,
    });
    setEditingId(supplier.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    const hasLots = lots.some((l) => l.supplierId === id);
    if (hasLots) {
      toast.error('Bu tedarikçiye ait partiler var. Önce partileri silin.');
      return;
    }
    deleteSupplier(id);
    toast.success('Tedarikçi silindi');
    setShowDeleteConfirm(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      isActive: true,
    });
  };

  const getScoreColor = (rate: number) => {
    if (rate >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (rate >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tedarikçi ara..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Tedarikçi
        </Button>
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((supplier) => {
          const performance = getPerformance(supplier.id);
          return (
            <Card key={supplier.id} hover className="relative">
              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-1">
                <button
                  onClick={() => handleEdit(supplier)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(supplier.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {supplier.code.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {supplier.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {supplier.code}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {supplier.contactPerson && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{supplier.contactPerson}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{supplier.address}</span>
                  </div>
                )}
              </div>

              {/* Performance Stats */}
              {performance && performance.totalLots > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Performans
                    </span>
                    <span className={`text-lg font-bold ${getScoreColor(performance.acceptanceRate)}`}>
                      %{performance.acceptanceRate.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        performance.acceptanceRate >= 90
                          ? 'bg-emerald-500'
                          : performance.acceptanceRate >= 70
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${performance.acceptanceRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      {performance.acceptedLots} Kabul
                    </span>
                    <span className="flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-500" />
                      {performance.rejectedLots} Red
                    </span>
                    <span>{performance.totalLots} Toplam</span>
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="mt-4">
                <Badge variant={supplier.isActive ? 'success' : 'default'}>
                  {supplier.isActive ? 'Aktif' : 'Pasif'}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredSuppliers.length === 0 && (
        <Card className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Tedarikçi bulunamadı
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Yeni tedarikçi ekleyerek başlayın
          </p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Tedarikçi
          </Button>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingId ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tedarikçi Adı"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Örn: ABC Ltd. Şti."
              required
            />
            <Input
              label="Kısa Kod"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Örn: ABC"
              required
            />
          </div>

          <Input
            label="Yetkili Kişi"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            placeholder="Ad Soyad"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Telefon"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0212 555 1234"
            />
            <Input
              label="E-posta"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="info@firma.com"
            />
          </div>

          <Input
            label="Adres"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="İstanbul, Türkiye"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
              Aktif Tedarikçi
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              İptal
            </Button>
            <Button type="submit">
              {editingId ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Tedarikçi Sil"
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Bu tedarikçiyi silmek istediğinize emin misiniz?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
            İptal
          </Button>
          <Button
            variant="danger"
            onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
          >
            Sil
          </Button>
        </div>
      </Modal>
    </div>
  );
}
