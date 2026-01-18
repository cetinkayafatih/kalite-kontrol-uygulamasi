// ISO 2859-1 Switching Rules Tipleri

export type SwitchingLevel = 'normal' | 'tightened' | 'reduced';

export interface SwitchingState {
  supplierId: string;
  materialTypeId: string;
  currentLevel: SwitchingLevel;
  consecutiveAccepts: number;
  consecutiveRejects: number;
  recentResults: ('accepted' | 'rejected')[];  // Son 5 lot sonucu
  history: SwitchingTransition[];
  lastUpdated: string;
  shouldStopProduction: boolean;  // 5 ardışık RED durumu
}

export interface SwitchingTransition {
  id: string;
  fromLevel: SwitchingLevel;
  toLevel: SwitchingLevel;
  reason: string;
  lotId: string;
  lotNumber: string;
  timestamp: string;
}

// Türkçe seviye isimleri
export const SWITCHING_LEVEL_LABELS: Record<SwitchingLevel, string> = {
  normal: 'Normal',
  tightened: 'Sıkılaştırılmış',
  reduced: 'Gevşetilmiş',
};

// Seviye renkleri
export const SWITCHING_LEVEL_COLORS: Record<SwitchingLevel, { bg: string; text: string; border: string }> = {
  normal: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
  },
  tightened: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
  },
  reduced: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
  },
};

// Örneklem çarpanları
export const SAMPLE_MULTIPLIERS: Record<SwitchingLevel, number> = {
  normal: 1.0,
  tightened: 1.0,  // Aynı örneklem, düşük Ac
  reduced: 0.4,    // %40 örneklem
};
