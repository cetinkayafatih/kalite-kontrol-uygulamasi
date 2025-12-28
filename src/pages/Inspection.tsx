import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Camera,
  Pause,
  RotateCcw,
  ChevronRight,
  Package
} from 'lucide-react';
import Card, { CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import { TextArea } from '../components/common/Input';
import Modal from '../components/common/Modal';
import { SeverityBadge } from '../components/common/Badge';
import {
  useLotStore,
  useInspectionStore,
  useMaterialStore,
  useSupplierStore
} from '../store/useStore';
import { makeDecision } from '../data/samplingData';
import toast from 'react-hot-toast';

interface DefectSelection {
  defectTypeId: string;
  description: string;
}

export default function Inspection() {
  const navigate = useNavigate();
  const location = useLocation();
  const lotId = location.state?.lotId;

  const { lots, currentLot, setCurrentLot, updateLot, completeLot, getLotById } = useLotStore();
  const { addInspection, clearCurrentInspections } = useInspectionStore();
  const materials = useMaterialStore((state) => state.materials);
  const suppliers = useSupplierStore((state) => state.suppliers);

  const [currentSampleNumber, setCurrentSampleNumber] = useState(1);
  const [defectCount, setDefectCount] = useState(0);
  const [showDefectModal, setShowDefectModal] = useState(false);
  const [selectedDefects, setSelectedDefects] = useState<DefectSelection[]>([]);
  const [notes, setNotes] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [finalDecision, setFinalDecision] = useState<'accepted' | 'rejected' | null>(null);

  // Initialize lot
  useEffect(() => {
    if (lotId) {
      const lot = getLotById(lotId);
      if (lot) {
        setCurrentLot(lot);
        if (lot.status === 'pending') {
          updateLot(lot.id, { status: 'in-progress' });
        }
        clearCurrentInspections();
      }
    }
  }, [lotId]);

  // Get material info
  const material = currentLot
    ? materials.find((m) => m.id === currentLot.materialTypeId)
    : null;

  const supplier = currentLot
    ? suppliers.find((s) => s.id === currentLot.supplierId)
    : null;

  // Calculate progress and status
  const progress = currentLot
    ? (currentSampleNumber - 1) / currentLot.sampleSize * 100
    : 0;

  const remainingToAccept = currentLot
    ? currentLot.acceptanceNumber - defectCount
    : 0;

  const currentDecision = currentLot
    ? makeDecision(defectCount, currentLot.acceptanceNumber, currentLot.rejectionNumber)
    : 'continue';

  // Handle conforming sample
  const handleConforming = () => {
    if (!currentLot) return;

    addInspection({
      lotId: currentLot.id,
      sampleNumber: currentSampleNumber,
      isDefective: false,
      defects: [],
      notes: '',
      photoBase64: null,
    });

    if (currentSampleNumber >= currentLot.sampleSize) {
      finishInspection();
    } else {
      setCurrentSampleNumber((prev) => prev + 1);
    }
  };

  // Handle defective sample
  const handleDefective = () => {
    setShowDefectModal(true);
  };

  const confirmDefect = () => {
    if (!currentLot) return;

    const newDefectCount = defectCount + 1;
    setDefectCount(newDefectCount);

    addInspection({
      lotId: currentLot.id,
      sampleNumber: currentSampleNumber,
      isDefective: true,
      defects: selectedDefects.map((d) => ({
        criterionId: '',
        defectTypeId: d.defectTypeId,
        description: d.description,
      })),
      notes,
      photoBase64,
    });

    // Check if rejection threshold reached
    if (newDefectCount >= currentLot.rejectionNumber) {
      setFinalDecision('rejected');
      setShowResultModal(true);
    } else if (currentSampleNumber >= currentLot.sampleSize) {
      finishInspection();
    } else {
      setCurrentSampleNumber((prev) => prev + 1);
    }

    // Reset modal state
    setShowDefectModal(false);
    setSelectedDefects([]);
    setNotes('');
    setPhotoBase64(null);
  };

  const finishInspection = () => {
    if (!currentLot) return;

    const decision: 'accepted' | 'rejected' =
      defectCount <= currentLot.acceptanceNumber ? 'accepted' : 'rejected';

    setFinalDecision(decision);
    setShowResultModal(true);
  };

  const completeInspection = () => {
    if (!currentLot || !finalDecision) return;

    completeLot(currentLot.id, finalDecision, defectCount);
    toast.success(
      finalDecision === 'accepted'
        ? 'Parti kabul edildi!'
        : 'Parti reddedildi.'
    );

    navigate('/result', {
      state: {
        lotId: currentLot.id,
        decision: finalDecision,
        defectCount,
        sampleSize: currentLot.sampleSize,
      },
    });
  };

  const toggleDefectType = (defectTypeId: string) => {
    setSelectedDefects((prev) => {
      const exists = prev.find((d) => d.defectTypeId === defectTypeId);
      if (exists) {
        return prev.filter((d) => d.defectTypeId !== defectTypeId);
      }
      return [...prev, { defectTypeId, description: '' }];
    });
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // No lot selected
  if (!currentLot) {
    const pendingLots = lots.filter((l) => l.status !== 'completed');

    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <div className="text-center py-8">
            <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Kontrol Edilecek Parti Seçin
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Aşağıdaki bekleyen partilerden birini seçin veya yeni parti oluşturun
            </p>

            {pendingLots.length > 0 ? (
              <div className="space-y-3 max-w-md mx-auto">
                {pendingLots.map((lot) => (
                  <button
                    key={lot.id}
                    onClick={() => {
                      setCurrentLot(lot);
                      if (lot.status === 'pending') {
                        updateLot(lot.id, { status: 'in-progress' });
                      }
                      clearCurrentInspections();
                      setCurrentSampleNumber(1);
                      setDefectCount(0);
                    }}
                    className="w-full p-4 bg-gray-50 dark:bg-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors text-left flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {lot.lotNumber}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {materials.find((m) => m.id === lot.materialTypeId)?.name} -{' '}
                        {lot.quantity.toLocaleString('tr-TR')} {materials.find((m) => m.id === lot.materialTypeId)?.unit || 'adet'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            ) : (
              <Button onClick={() => navigate('/lot-entry')}>
                Yeni Parti Girişi
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Lot Info Header */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {currentLot.lotNumber}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {supplier?.name} | {material?.name} | {currentLot.quantity.toLocaleString('tr-TR')} {material?.unit || 'adet'}
            </p>
          </div>
          <Button
            variant={isPaused ? 'primary' : 'secondary'}
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Devam Et
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Durdur
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Progress Bar */}
      <Card>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">İlerleme</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {currentSampleNumber - 1}/{currentLot.sampleSize} {material?.unit || 'adet'} (%{progress.toFixed(1)})
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Defect Counter */}
        <Card className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Hatalı</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {defectCount}
          </p>
          <div className="mt-2 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                currentDecision === 'rejected'
                  ? 'bg-red-500'
                  : defectCount > currentLot.acceptanceNumber * 0.7
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min((defectCount / currentLot.rejectionNumber) * 100, 100)}%`,
              }}
            />
          </div>
        </Card>

        {/* Status Indicator */}
        <Card
          className={`text-center ${
            currentDecision === 'accepted'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
              : currentDecision === 'rejected'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : ''
          }`}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Durum</p>
          {currentDecision === 'rejected' ? (
            <>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">RED</p>
              <p className="text-xs text-red-500 mt-1">Limit aşıldı</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {remainingToAccept}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Kabul için kalan hak
              </p>
            </>
          )}
        </Card>
      </div>

      {/* Sample Control */}
      {!isPaused && currentDecision !== 'rejected' && (
        <Card>
          <CardHeader
            title={`Numune #${currentSampleNumber}`}
            subtitle="Kontrol sonucunu işaretleyin"
          />

          {/* Criteria Checklist */}
          {material && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Kontrol Kriterleri:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {material.criteria.map((criterion) => (
                  <div
                    key={criterion.id}
                    className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                      criterion.isCritical
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : 'bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{criterion.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleConforming}
              className="flex flex-col items-center justify-center p-6 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl transition-all duration-200 group"
            >
              <CheckCircle className="w-12 h-12 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                UYGUN
              </span>
            </button>

            <button
              onClick={handleDefective}
              className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl transition-all duration-200 group"
            >
              <XCircle className="w-12 h-12 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-lg font-semibold text-red-700 dark:text-red-400">
                HATALI
              </span>
            </button>
          </div>
        </Card>
      )}

      {/* Paused State */}
      {isPaused && (
        <Card className="text-center py-8">
          <Pause className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Kontrol Duraklatıldı
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Devam etmek için yukarıdaki butona tıklayın
          </p>
        </Card>
      )}

      {/* Defect Modal */}
      <Modal
        isOpen={showDefectModal}
        onClose={() => setShowDefectModal(false)}
        title="Hata Detayları"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Hata Türü Seçin:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {material?.defectTypes.map((defect) => (
                <button
                  key={defect.id}
                  onClick={() => toggleDefectType(defect.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedDefects.find((d) => d.defectTypeId === defect.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {defect.name}
                    </span>
                    <SeverityBadge severity={defect.severity} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {defect.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <TextArea
            label="Açıklama"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Hata hakkında ek bilgi..."
            rows={2}
          />

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fotoğraf Ekle
            </p>
            <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-gray-400 transition-colors">
              {photoBase64 ? (
                <img
                  src={photoBase64}
                  alt="Captured"
                  className="h-full object-contain rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-sm">Fotoğraf Çek/Seç</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowDefectModal(false)}>
              İptal
            </Button>
            <Button
              variant="danger"
              onClick={confirmDefect}
              disabled={selectedDefects.length === 0}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Hatalı Olarak İşaretle
            </Button>
          </div>
        </div>
      </Modal>

      {/* Result Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={() => {}}
        title="Kontrol Tamamlandı"
        size="md"
        showCloseButton={false}
      >
        <div className="text-center py-4">
          {finalDecision === 'accepted' ? (
            <>
              <div className="w-20 h-20 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                PARTİ KABUL
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {defectCount} hatalı ≤ {currentLot.acceptanceNumber} kabul limiti
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                PARTİ RED
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {defectCount} hatalı ≥ {currentLot.rejectionNumber} red limiti
              </p>
            </>
          )}

          <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentSampleNumber - 1}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Kontrol Edilen</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {currentSampleNumber - 1 - defectCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Uygun</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {defectCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Hatalı</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button onClick={completeInspection} fullWidth size="lg">
              Sonuç Ekranına Git
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
