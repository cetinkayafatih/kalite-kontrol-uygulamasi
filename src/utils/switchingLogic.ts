// ISO 2859-1 Switching Rules Mantığı

import type { SwitchingLevel, SwitchingState, SwitchingTransition } from '../types/switching';
import { SAMPLE_MULTIPLIERS, SWITCHING_LEVEL_LABELS } from '../types/switching';

// Varsayılan switching state
export function createDefaultSwitchingState(
  supplierId: string,
  materialTypeId: string
): SwitchingState {
  return {
    supplierId,
    materialTypeId,
    currentLevel: 'normal',
    consecutiveAccepts: 0,
    consecutiveRejects: 0,
    recentResults: [],
    history: [],
    lastUpdated: new Date().toISOString(),
    shouldStopProduction: false,
  };
}

// Switching kurallarını değerlendir
export function evaluateSwitching(
  state: SwitchingState,
  newResult: 'accepted' | 'rejected',
  lotId: string,
  lotNumber: string
): { newState: SwitchingState; transition: SwitchingTransition | null } {
  const updatedState = { ...state };

  // Son 5 sonucu güncelle
  updatedState.recentResults = [...state.recentResults, newResult].slice(-5);

  // Ardışık sayaçları güncelle
  if (newResult === 'accepted') {
    updatedState.consecutiveAccepts = state.consecutiveAccepts + 1;
    updatedState.consecutiveRejects = 0;
  } else {
    updatedState.consecutiveRejects = state.consecutiveRejects + 1;
    updatedState.consecutiveAccepts = 0;
  }

  updatedState.lastUpdated = new Date().toISOString();

  // Switching kurallarını uygula
  let transition: SwitchingTransition | null = null;
  const previousLevel = state.currentLevel;

  switch (state.currentLevel) {
    case 'normal':
      // 10 ardışık KABUL → Gevşetilmiş
      if (updatedState.consecutiveAccepts >= 10) {
        updatedState.currentLevel = 'reduced';
        transition = createTransition(previousLevel, 'reduced', '10 ardışık kabul', lotId, lotNumber);
        updatedState.consecutiveAccepts = 0;
      }
      // Son 5 lottan 2+ RED → Sıkılaştırılmış
      else if (countRejects(updatedState.recentResults) >= 2) {
        updatedState.currentLevel = 'tightened';
        transition = createTransition(previousLevel, 'tightened', 'Son 5 lottan 2+ red', lotId, lotNumber);
        updatedState.recentResults = [];
      }
      break;

    case 'tightened':
      // 5 ardışık RED → Üretim durdurulmalı
      if (updatedState.consecutiveRejects >= 5) {
        updatedState.shouldStopProduction = true;
        // Seviye değişmez ama uyarı verilir
      }
      // 5 ardışık KABUL → Normal
      else if (updatedState.consecutiveAccepts >= 5) {
        updatedState.currentLevel = 'normal';
        updatedState.shouldStopProduction = false;
        transition = createTransition(previousLevel, 'normal', '5 ardışık kabul', lotId, lotNumber);
        updatedState.consecutiveAccepts = 0;
        updatedState.recentResults = [];
      }
      break;

    case 'reduced':
      // 1 RED → Normal
      if (newResult === 'rejected') {
        updatedState.currentLevel = 'normal';
        transition = createTransition(previousLevel, 'normal', 'Red alındı', lotId, lotNumber);
        updatedState.recentResults = [];
      }
      break;
  }

  // Geçiş geçmişine ekle
  if (transition) {
    updatedState.history = [...state.history, transition];
  }

  return { newState: updatedState, transition };
}

// Red sayısını hesapla
function countRejects(results: ('accepted' | 'rejected')[]): number {
  return results.filter(r => r === 'rejected').length;
}

// Geçiş kaydı oluştur
function createTransition(
  fromLevel: SwitchingLevel,
  toLevel: SwitchingLevel,
  reason: string,
  lotId: string,
  lotNumber: string
): SwitchingTransition {
  return {
    id: `trans-${Date.now()}`,
    fromLevel,
    toLevel,
    reason,
    lotId,
    lotNumber,
    timestamp: new Date().toISOString(),
  };
}

// Seviyeye göre örneklem boyutunu ayarla
export function getAdjustedSampleSize(baseSize: number, level: SwitchingLevel): number {
  const multiplier = SAMPLE_MULTIPLIERS[level];
  const adjusted = Math.round(baseSize * multiplier);
  return Math.max(adjusted, 2); // Minimum 2 numune
}

// Seviyeye göre kabul sayısını ayarla
export function getAdjustedAcceptance(
  baseAcceptance: number,
  baseRejection: number,
  level: SwitchingLevel
): { acceptance: number; rejection: number } {
  if (level === 'tightened') {
    // Sıkılaştırılmışta Ac düşer
    const newAcceptance = Math.max(0, baseAcceptance - 1);
    return {
      acceptance: newAcceptance,
      rejection: newAcceptance + 1,
    };
  }

  // Normal ve Gevşetilmiş'te aynı
  return {
    acceptance: baseAcceptance,
    rejection: baseRejection,
  };
}

// Geçiş sebebi metni
export function getTransitionText(transition: SwitchingTransition): string {
  const from = SWITCHING_LEVEL_LABELS[transition.fromLevel];
  const to = SWITCHING_LEVEL_LABELS[transition.toLevel];
  return `${from} → ${to}: ${transition.reason}`;
}

// Seviye durumu özeti
export function getSwitchingStatusText(state: SwitchingState): string {
  const level = SWITCHING_LEVEL_LABELS[state.currentLevel];

  if (state.shouldStopProduction) {
    return `${level} - ⚠️ Üretim durdurulmalı`;
  }

  if (state.currentLevel === 'normal') {
    if (state.consecutiveAccepts > 0) {
      return `${level} - ${state.consecutiveAccepts}/10 ardışık kabul`;
    }
    const rejects = countRejects(state.recentResults);
    if (rejects > 0) {
      return `${level} - ${rejects}/2 red (son 5 lot)`;
    }
  }

  if (state.currentLevel === 'tightened') {
    if (state.consecutiveAccepts > 0) {
      return `${level} - ${state.consecutiveAccepts}/5 ardışık kabul`;
    }
    if (state.consecutiveRejects > 0) {
      return `${level} - ${state.consecutiveRejects}/5 ardışık red`;
    }
  }

  return level;
}
