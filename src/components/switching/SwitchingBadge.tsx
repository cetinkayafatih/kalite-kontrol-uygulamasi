// Switching Level Badge Component

import { useState } from 'react';
import { Shield, AlertTriangle, ChevronDown } from 'lucide-react';
import type { SwitchingLevel, SwitchingState } from '../../types/switching';
import { SWITCHING_LEVEL_LABELS, SWITCHING_LEVEL_COLORS } from '../../types/switching';
import { getSwitchingStatusText } from '../../utils/switchingLogic';
import { useSwitchingStore } from '../../store/switchingStore';
import SwitchingHistory from './SwitchingHistory';

interface SwitchingBadgeProps {
  supplierId: string;
  materialTypeId: string;
  supplierName?: string;
  materialName?: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function SwitchingBadge({
  supplierId,
  materialTypeId,
  supplierName,
  materialName,
  showDetails = true,
  size = 'md',
}: SwitchingBadgeProps) {
  const [showHistory, setShowHistory] = useState(false);
  const state = useSwitchingStore((s) => s.getState(supplierId, materialTypeId));

  if (!supplierId || !materialTypeId) return null;

  const level = state.currentLevel;
  const colors = SWITCHING_LEVEL_COLORS[level];
  const label = SWITCHING_LEVEL_LABELS[level];
  const statusText = getSwitchingStatusText(state);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <>
      <button
        onClick={() => setShowHistory(true)}
        className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-all hover:shadow-md ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]}`}
        title={statusText}
      >
        {state.shouldStopProduction ? (
          <AlertTriangle className={`${iconSizes[size]} text-red-500 animate-pulse`} />
        ) : (
          <Shield className={iconSizes[size]} />
        )}
        <span>{label}</span>
        {showDetails && (
          <ChevronDown className={`${iconSizes[size]} opacity-50`} />
        )}
      </button>

      {/* History Modal */}
      <SwitchingHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        supplierId={supplierId}
        materialTypeId={materialTypeId}
        supplierName={supplierName}
        materialName={materialName}
      />
    </>
  );
}

// Kompakt versiyon - sadece simge
export function SwitchingIcon({
  level,
  shouldStop,
}: {
  level: SwitchingLevel;
  shouldStop?: boolean;
}) {
  const colors = SWITCHING_LEVEL_COLORS[level];

  if (shouldStop) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30">
        <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${colors.bg}`}
    >
      <Shield className={`w-4 h-4 ${colors.text}`} />
    </span>
  );
}

// Inline durum göstergesi
export function SwitchingStatus({
  state,
}: {
  state: SwitchingState;
}) {
  const colors = SWITCHING_LEVEL_COLORS[state.currentLevel];
  const statusText = getSwitchingStatusText(state);

  return (
    <div className={`flex items-center gap-2 text-sm ${colors.text}`}>
      <SwitchingIcon level={state.currentLevel} shouldStop={state.shouldStopProduction} />
      <span>{statusText}</span>
    </div>
  );
}
