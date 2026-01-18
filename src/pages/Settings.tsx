import { useState, useRef } from 'react';
import {
  Save,
  Download,
  Upload,
  Sun,
  Moon,
  Globe,
  AlertTriangle
} from 'lucide-react';
import Card, { CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Input, { Select } from '../components/common/Input';
import Modal from '../components/common/Modal';
import {
  useSettingsStore,
  useLotStore,
  useSupplierStore,
  useMaterialStore,
  useInspectionStore
} from '../store/useStore';
import { aqlOptions, inspectionLevels } from '../data/samplingData';
import toast from 'react-hot-toast';

export default function Settings() {
  const { settings, setSettings, toggleDarkMode } = useSettingsStore();
  const lots = useLotStore((state) => state.lots);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const materials = useMaterialStore((state) => state.materials);
  const inspections = useInspectionStore((state) => state.inspections);

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [defaultAQL, setDefaultAQL] = useState(settings.defaultAQL);
  const [defaultLevel, setDefaultLevel] = useState<'I' | 'II' | 'III'>(settings.defaultInspectionLevel);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = () => {
    setSettings({
      companyName,
      defaultAQL,
      defaultInspectionLevel: defaultLevel as 'I' | 'II' | 'III',
    });
    toast.success('Ayarlar kaydedildi');
  };

  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      settings,
      lots,
      suppliers,
      materials,
      inspections,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kkys_yedek_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Veriler dışa aktarıldı');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        // Validate structure
        if (!data.version || !data.lots || !data.suppliers) {
          throw new Error('Geçersiz yedek dosyası');
        }

        // Import data
        if (data.settings) {
          setSettings(data.settings);
        }

        // For stores with persist, we need to update localStorage directly
        // and reload the page
        localStorage.setItem(
          'lot-storage',
          JSON.stringify({ state: { lots: data.lots, currentLot: null } })
        );
        localStorage.setItem(
          'supplier-storage',
          JSON.stringify({ state: { suppliers: data.suppliers } })
        );
        localStorage.setItem(
          'material-storage',
          JSON.stringify({ state: { materials: data.materials } })
        );
        localStorage.setItem(
          'inspection-storage',
          JSON.stringify({
            state: { inspections: data.inspections, currentInspections: [] },
          })
        );

        toast.success('Veriler içe aktarıldı. Sayfa yenileniyor...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        toast.error('Dosya okunamadı: Geçersiz format');
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetData = () => {
    localStorage.removeItem('lot-storage');
    localStorage.removeItem('supplier-storage');
    localStorage.removeItem('inspection-storage');

    toast.success('Veriler sıfırlandı. Sayfa yenileniyor...');
    setTimeout(() => window.location.reload(), 1500);
    setShowResetConfirm(false);
  };

  const stats = {
    lots: lots.length,
    suppliers: suppliers.length,
    materials: materials.length,
    inspections: inspections.length,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Company Settings */}
      <Card>
        <CardHeader
          title="Firma Bilgileri"
          subtitle="Raporlarda görünecek bilgiler"
        />
        <div className="space-y-4">
          <Input
            label="Firma Adı"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Kalite Kontrol Yönetim Sistemi"
          />
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings}>
              <Save className="w-4 h-4 mr-2" />
              Kaydet
            </Button>
          </div>
        </div>
      </Card>

      {/* Default Parameters */}
      <Card>
        <CardHeader
          title="Varsayılan Parametreler"
          subtitle="Yeni parti girişlerinde kullanılacak değerler"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Varsayılan AQL"
            value={defaultAQL}
            onChange={(e) => setDefaultAQL(e.target.value)}
            options={aqlOptions}
          />
          <Select
            label="Varsayılan Muayene Seviyesi"
            value={defaultLevel}
            onChange={(e) => setDefaultLevel(e.target.value as 'I' | 'II' | 'III')}
            options={inspectionLevels}
          />
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleSaveSettings}>
            <Save className="w-4 h-4 mr-2" />
            Kaydet
          </Button>
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader
          title="Görünüm"
          subtitle="Tema ve dil ayarları"
        />
        <div className="space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <div className="flex items-center gap-3">
              {settings.darkMode ? (
                <Moon className="w-5 h-5 text-blue-500" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {settings.darkMode ? 'Koyu Tema' : 'Açık Tema'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Göz yorgunluğunu azaltır
                </p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`
                relative w-14 h-7 rounded-full transition-colors duration-200
                ${settings.darkMode ? 'bg-blue-600' : 'bg-gray-300'}
              `}
            >
              <span
                className={`
                  absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                  ${settings.darkMode ? 'translate-x-7' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Dil</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Arayüz dili
                </p>
              </div>
            </div>
            <Select
              value={settings.language}
              onChange={(e) =>
                setSettings({ language: e.target.value as 'tr' | 'en' })
              }
              options={[
                { value: 'tr', label: 'Türkçe' },
                { value: 'en', label: 'English' },
              ]}
              className="w-32"
            />
          </div>
        </div>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader
          title="Veri Yönetimi"
          subtitle="Yedekleme ve geri yükleme"
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.lots}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Parti</p>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.suppliers}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tedarikçi</p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.materials}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Malzeme</p>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.inspections}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Kontrol</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Export */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Veri Yedekleme
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tüm verileri JSON formatında indir
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Dışa Aktar
            </Button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Veri Geri Yükleme
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Yedek dosyasından verileri geri yükle
                </p>
              </div>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                İçe Aktar
              </Button>
            </div>
          </div>

          {/* Reset */}
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Verileri Sıfırla
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tüm parti ve kontrol verilerini sil
                </p>
              </div>
            </div>
            <Button variant="danger" onClick={() => setShowResetConfirm(true)}>
              Sıfırla
            </Button>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card>
        <CardHeader
          title="Hakkında"
          subtitle="Sistem bilgileri"
        />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="text-gray-500 dark:text-gray-400">Uygulama</span>
            <span className="font-medium text-gray-900 dark:text-white">
              Kalite Kontrol Yönetim Sistemi (KKYS)
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="text-gray-500 dark:text-gray-400">Versiyon</span>
            <span className="font-medium text-gray-900 dark:text-white">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="text-gray-500 dark:text-gray-400">Standart</span>
            <span className="font-medium text-gray-900 dark:text-white">ISO 2859-1</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500 dark:text-gray-400">Geliştirici</span>
            <span className="font-medium text-gray-900 dark:text-white">
              Üniversite Bitirme Projesi
            </span>
          </div>
        </div>
      </Card>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Verileri Sıfırla"
        size="sm"
      >
        <div className="text-center py-4">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Bu işlem geri alınamaz!
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Tüm parti, kontrol ve tedarikçi verileri silinecek.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setShowResetConfirm(false)}>
              İptal
            </Button>
            <Button variant="danger" onClick={handleResetData}>
              Evet, Sıfırla
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
