import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Camera,
  Pause,
  RotateCcw,
  ChevronRight,
  Package,
  Layers
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
import { useSwitchingStore } from '../store/switchingStore';
import { makeDecision } from '../data/samplingData';
import { SWITCHING_LEVEL_LABELS } from '../types/switching';
import SwitchingBadge from '../components/switching/SwitchingBadge';
import StopProductionModal from '../components/switching/StopProductionModal';
import { storageService } from '../services/supabaseService';
import toast from 'react-hot-toast';

interface DefectSelection {
  defectTypeId: string;
  description: string;
}

export default function Inspection() {
  const navigate = useNavigate();
  const location = useLocation();
  const lotId = location.state?.lotId;

  const { lots, currentLot, setCurrentLot, updateLot, completeLot, getLotById, updateCurrentSampleIndex } = useLotStore();
  const { addInspection, clearCurrentInspections } = useInspectionStore();
  const materials = useMaterialStore((state) => state.materials);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const updateSwitchingState = useSwitchingStore((state) => state.updateState);

  const [currentSampleNumber, setCurrentSampleNumber] = useState(1);
  const [defectCount, setDefectCount] = useState(0);
  const [showDefectModal, setShowDefectModal] = useState(false);
  const [selectedDefects, setSelectedDefects] = useState<DefectSelection[]>([]);
  const [notes, setNotes] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [finalDecision, setFinalDecision] = useState<'accepted' | 'rejected' | null>(null);
  const [showStopModal, setShowStopModal] = useState(false);

  // Initialize lot
  useEffect(() => {
    if (lotId) {
      // Belirli bir parti ID'si ile geldiyse, o partiyi yükle
      const lot = getLotById(lotId);
      if (lot) {
        setCurrentLot(lot);
        if (lot.status === 'pending') {
          updateLot(lot.id, { status: 'in-progress' });
        }
        clearCurrentInspections();
      }
    } else {
      // lotId yoksa (sidebar'dan direkt tıklandıysa), currentLot'u temizle
      // Kullanıcı bekleyen partilerden seçim yapmalı
      setCurrentLot(null);
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
      photoUrl: null,
    });

    if (currentSampleNumber >= currentLot.sampleSize) {
      finishInspection();
    } else {
      const nextIndex = currentSampleNumber;
      setCurrentSampleNumber((prev) => prev + 1);
      // Store'da güncel indeksi kaydet
      updateCurrentSampleIndex(currentLot.id, nextIndex);
    }
  };

  // Handle defective sample
  const handleDefective = () => {
    setShowDefectModal(true);
  };

  const confirmDefect = async () => {
    if (!currentLot) return;

    setIsUploading(true);

    try {
      // Fotoğraf varsa Supabase Storage'a yükle
      let photoUrl: string | null = null;
      if (photoFile) {
        try {
          photoUrl = await storageService.uploadPhoto(
            photoFile,
            currentLot.id,
            currentSampleNumber
          );
        } catch (uploadError) {
          console.error('Fotoğraf yüklenemedi:', uploadError);
          toast.error('Fotoğraf yüklenemedi, kayıt fotoğrafsız devam ediyor');
        }
      }

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
        photoBase64: null, // Artık base64 kullanmıyoruz
        photoUrl, // Yeni: Storage URL
      });

      // Check if rejection threshold reached
      if (newDefectCount >= currentLot.rejectionNumber) {
        setFinalDecision('rejected');
        setShowResultModal(true);
      } else if (currentSampleNumber >= currentLot.sampleSize) {
        finishInspection();
      } else {
        const nextIndex = currentSampleNumber;
        setCurrentSampleNumber((prev) => prev + 1);
        // Store'da güncel indeksi kaydet
        updateCurrentSampleIndex(currentLot.id, nextIndex);
      }

      // Reset modal state
      setShowDefectModal(false);
      setSelectedDefects([]);
      setNotes('');
      setPhotoBase64(null);
      setPhotoFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const finishInspection = () => {
    if (!currentLot) return;

    const decision: 'accepted' | 'rejected' =
      defectCount <= currentLot.acceptanceNumber ? 'accepted' : 'rejected';

    setFinalDecision(decision);
    setShowResultModal(true);
  };

  const completeInspection = async () => {
    if (!currentLot || !finalDecision) return;

    await completeLot(currentLot.id, finalDecision, defectCount);

    // Switching kurallarini guncelle
    const { transition, shouldStop } = await updateSwitchingState(
      currentLot.supplierId,
      currentLot.materialTypeId,
      finalDecision,
      currentLot.id,
      currentLot.lotNumber
    );

    // Seviye degisimi bildirimi
    if (transition) {
      const fromLabel = SWITCHING_LEVEL_LABELS[transition.fromLevel as keyof typeof SWITCHING_LEVEL_LABELS];
      const toLabel = SWITCHING_LEVEL_LABELS[transition.toLevel as keyof typeof SWITCHING_LEVEL_LABELS];
      toast(
        `Kontrol seviyesi degisti: ${fromLabel} → ${toLabel}`,
        {
          icon: transition.toLevel === 'tightened' ? '⚠️' : transition.toLevel === 'reduced' ? '✅' : 'ℹ️',
          duration: 5000,
        }
      );
    }

    toast.success(
      finalDecision === 'accepted'
        ? 'Parti kabul edildi!'
        : 'Parti reddedildi.'
    );

    // Uretim durdurma uyarisi
    if (shouldStop) {
      setShowStopModal(true);
    } else {
      navigate('/result', {
        state: {
          lotId: currentLot.id,
          decision: finalDecision,
          defectCount,
          sampleSize: currentLot.sampleSize,
        },
      });
    }
  };

  const handleStopModalClose = () => {
    setShowStopModal(false);
    navigate('/result', {
      state: {
        lotId: currentLot?.id,
        decision: finalDecision,
        defectCount,
        sampleSize: currentLot?.sampleSize,
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
      // Dosyayı sakla (Supabase'e yüklemek için)
      setPhotoFile(file);

      // Önizleme için base64'e çevir
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

            {pendingLots.length > 0 ? (
              <>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Kontrol Edilecek Parti Seçin
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Aşağıdaki bekleyen partilerden birini seçin
                </p>
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
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                  <Button variant="secondary" onClick={() => navigate('/lot-entry')}>
                    Yeni Parti Oluştur
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Bekleyen Parti Yok
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Kontrol yapılacak bekleyen parti bulunmuyor. Yeni bir parti oluşturun.
                </p>
                <Button onClick={() => navigate('/lot-entry')}>
                  Yeni Parti Oluştur
                </Button>
              </>
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
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {currentLot.lotNumber}
              </h2>
              {supplier && material && (
                <SwitchingBadge
                  supplierId={currentLot.supplierId}
                  materialTypeId={currentLot.materialTypeId}
                  supplierName={supplier.name}
                  materialName={material.name}
                  size="sm"
                />
              )}
            </div>
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
          {/* Position Code Display - Küme örneklemesi için */}
          {currentLot.samplePositions && currentLot.samplePositions.length > 0 && (
            <div className="mb-6">
              {(() => {
                const currentPosition = currentLot.samplePositions[currentSampleNumber - 1];
                if (!currentPosition) return null;

                // Bu poşetten kaç numune alınacağını hesapla
                // Aynı poşetten önceki numuneleri say (pozisyon listesinde sırayla)
                const allPositions = currentLot.samplePositions;
                let samplesInPackageTotal = 0;
                let currentIndexInPackage = 0;

                for (let i = 0; i < allPositions.length; i++) {
                  const pos = allPositions[i];
                  if (pos.pallet === currentPosition.pallet && pos.package === currentPosition.package) {
                    samplesInPackageTotal++;
                    if (i < currentSampleNumber - 1) {
                      // Bu pozisyon şu anki numuneden önce geliyorsa
                      currentIndexInPackage++;
                    } else if (i === currentSampleNumber - 1) {
                      // Bu tam şu anki numune
                      currentIndexInPackage++;
                    }
                  }
                }

                const samplesInPackage = { length: samplesInPackageTotal };

                // Sonraki pozisyon
                const nextPosition = currentLot.samplePositions[currentSampleNumber];
                const isNewPackageNext = nextPosition && (
                  nextPosition.pallet !== currentPosition.pallet ||
                  nextPosition.package !== currentPosition.package
                );

                return (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                        Numune {currentSampleNumber} / {currentLot.sampleSize}
                      </span>
                      <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                        Poşetten: {currentIndexInPackage}/{samplesInPackage.length}
                      </span>
                    </div>

                    {/* Pozisyon Kodu */}
                    <div className="text-center py-4">
                      <div className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-purple-100 dark:border-purple-700">
                        <Package className="w-6 h-6 text-purple-500" />
                        <span className="text-3xl font-mono font-bold text-gray-900 dark:text-white tracking-wider">
                          {currentPosition.code}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Palet {currentPosition.pallet}</span>
                        <span>•</span>
                        <span>Poşet {currentPosition.package}</span>
                      </div>
                    </div>

                    {/* Pozisyon Etiketi */}
                    <div className={`text-center py-3 rounded-lg mt-3 ${
                      currentPosition.position === '01'
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : currentPosition.position === '02'
                        ? 'bg-amber-100 dark:bg-amber-900/30'
                        : 'bg-emerald-100 dark:bg-emerald-900/30'
                    }`}>
                      <Layers className={`w-5 h-5 mx-auto mb-1 ${
                        currentPosition.position === '01'
                          ? 'text-blue-600 dark:text-blue-400'
                          : currentPosition.position === '02'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`} />
                      <span className={`text-lg font-bold ${
                        currentPosition.position === '01'
                          ? 'text-blue-700 dark:text-blue-300'
                          : currentPosition.position === '02'
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {currentPosition.positionLabel}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {currentPosition.position === '01' && 'Yığının en üstünden alın'}
                        {currentPosition.position === '02' && 'Yığının ortasından alın'}
                        {currentPosition.position === '03' && 'Yığının en altından alın'}
                      </p>
                    </div>

                    {/* Sonraki pozisyon bilgisi */}
                    {nextPosition && (
                      <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700 text-center text-sm text-gray-500 dark:text-gray-400">
                        Sonraki: <span className="font-mono font-medium">{nextPosition.code}</span>
                        {isNewPackageNext && (
                          <span className="ml-2 text-purple-600 dark:text-purple-400">
                            (yeni poşet)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {!currentLot.samplePositions && (
            <CardHeader
              title={`Numune #${currentSampleNumber}`}
              subtitle="Kontrol sonucunu işaretleyin"
            />
          )}

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
            <Button variant="secondary" onClick={() => setShowDefectModal(false)} disabled={isUploading}>
              İptal
            </Button>
            <Button
              variant="danger"
              onClick={confirmDefect}
              disabled={selectedDefects.length === 0 || isUploading}
              loading={isUploading}
            >
              <XCircle className="w-4 h-4 mr-2" />
              {isUploading ? 'Yükleniyor...' : 'Hatalı Olarak İşaretle'}
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

      {/* Stop Production Modal - 5 ardışık RED */}
      {currentLot && supplier && material && (
        <StopProductionModal
          isOpen={showStopModal}
          onClose={handleStopModalClose}
          supplierId={currentLot.supplierId}
          supplierName={supplier.name}
          materialTypeId={currentLot.materialTypeId}
          materialName={material.name}
        />
      )}
    </div>
  );
}
