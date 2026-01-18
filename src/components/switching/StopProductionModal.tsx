// Stop Production Warning Modal

import { AlertTriangle, XCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useSwitchingStore } from '../../store/switchingStore';

interface StopProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
  supplierName: string;
  materialTypeId: string;
  materialName: string;
}

export default function StopProductionModal({
  isOpen,
  onClose,
  supplierId,
  supplierName,
  materialTypeId,
  materialName,
}: StopProductionModalProps) {
  const clearStopFlag = useSwitchingStore((s) => s.clearStopFlag);

  const handleAcknowledge = () => {
    clearStopFlag(supplierId, materialTypeId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Kapatma butonu yok
      title=""
      size="md"
      showCloseButton={false}
    >
      <div className="text-center py-4">
        {/* Warning Icon */}
        <div className="w-24 h-24 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center animate-pulse">
          <AlertTriangle className="w-14 h-14 text-red-500" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
          ÜRETİM DURDURULMALI
        </h2>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          5 ardışık parti reddedildi!
        </p>

        {/* Details */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tedarikçi</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {supplierName}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Malzeme</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {materialName}
              </p>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
            Yapılması Gerekenler:
          </p>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Tedarikçi ile acil görüşme yapın</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Kök neden analizi isteyin</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Düzeltici faaliyet planı talep edin</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Yeni parti kabul etmeden önce onay alın</span>
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleAcknowledge}
            variant="danger"
            fullWidth
            size="lg"
          >
            <XCircle className="w-5 h-5 mr-2" />
            Anladım, Tedarikçi ile İletişime Geçeceğim
          </Button>
        </div>
      </div>
    </Modal>
  );
}
