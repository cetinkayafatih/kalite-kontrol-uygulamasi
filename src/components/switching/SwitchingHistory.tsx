// Switching History Modal Component

import { ArrowRight, History, RotateCcw } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useSwitchingStore } from '../../store/switchingStore';
import { SWITCHING_LEVEL_LABELS, SWITCHING_LEVEL_COLORS } from '../../types/switching';
import { getSwitchingStatusText } from '../../utils/switchingLogic';
import { formatDateTime } from '../../data/samplingData';
import toast from 'react-hot-toast';

interface SwitchingHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
  materialTypeId: string;
  supplierName?: string;
  materialName?: string;
}

export default function SwitchingHistory({
  isOpen,
  onClose,
  supplierId,
  materialTypeId,
  supplierName,
  materialName,
}: SwitchingHistoryProps) {
  const state = useSwitchingStore((s) => s.getState(supplierId, materialTypeId));
  const resetState = useSwitchingStore((s) => s.resetState);
  const history = state.history;

  const handleReset = () => {
    if (confirm('Switching durumu sıfırlanacak. Emin misiniz?')) {
      resetState(supplierId, materialTypeId);
      toast.success('Switching durumu sıfırlandı');
      onClose();
    }
  };

  const currentLevel = state.currentLevel;
  const colors = SWITCHING_LEVEL_COLORS[currentLevel];

  const modalTitle = supplierName && materialName
    ? `${supplierName} - ${materialName}`
    : 'Kontrol Seviyesi Geçmişi';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="md"
    >
      <div className="space-y-4">
        {/* Mevcut Durum */}
        <div className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Mevcut Seviye</p>
              <p className={`text-xl font-bold ${colors.text}`}>
                {SWITCHING_LEVEL_LABELS[currentLevel]}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Durum</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getSwitchingStatusText(state)}
              </p>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {state.consecutiveAccepts}
              </p>
              <p className="text-xs text-gray-500">Ardışık Kabul</p>
            </div>
            <div className="text-center p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {state.consecutiveRejects}
              </p>
              <p className="text-xs text-gray-500">Ardışık Red</p>
            </div>
            <div className="text-center p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {state.recentResults.length}
              </p>
              <p className="text-xs text-gray-500">Son Kontrol</p>
            </div>
          </div>
        </div>

        {/* Son Sonuçlar */}
        {state.recentResults.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Son 5 Sonuç
            </p>
            <div className="flex gap-1">
              {state.recentResults.map((result, index) => (
                <span
                  key={index}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    result === 'accepted'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                >
                  {result === 'accepted' ? 'K' : 'R'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Geçiş Geçmişi */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Geçiş Geçmişi
            </p>
          </div>

          {history.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Henüz seviye geçişi yok
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[...history].reverse().map((transition) => {
                const fromColors = SWITCHING_LEVEL_COLORS[transition.fromLevel];
                const toColors = SWITCHING_LEVEL_COLORS[transition.toLevel];

                return (
                  <div
                    key={transition.id}
                    className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${fromColors.bg} ${fromColors.text}`}
                      >
                        {SWITCHING_LEVEL_LABELS[transition.fromLevel]}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${toColors.bg} ${toColors.text}`}
                      >
                        {SWITCHING_LEVEL_LABELS[transition.toLevel]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {transition.reason} • {transition.lotNumber}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDateTime(transition.timestamp)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Sıfırla
          </Button>
          <Button onClick={onClose}>
            Kapat
          </Button>
        </div>
      </div>
    </Modal>
  );
}
