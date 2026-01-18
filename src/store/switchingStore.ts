// ISO 2859-1 Switching Rules Store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SwitchingState, SwitchingTransition } from '../types/switching';
import { createDefaultSwitchingState, evaluateSwitching } from '../utils/switchingLogic';

interface SwitchingStore {
  // State: key = `${supplierId}-${materialTypeId}`
  states: Record<string, SwitchingState>;

  // Actions
  getState: (supplierId: string, materialTypeId: string) => SwitchingState;
  updateState: (
    supplierId: string,
    materialTypeId: string,
    result: 'accepted' | 'rejected',
    lotId: string,
    lotNumber: string
  ) => { transition: SwitchingTransition | null; shouldStop: boolean };
  getHistory: (supplierId: string, materialTypeId: string) => SwitchingTransition[];
  resetState: (supplierId: string, materialTypeId: string) => void;
  clearStopFlag: (supplierId: string, materialTypeId: string) => void;

  // Tüm tedarikçilerin durumlarını getir
  getAllStatesForSupplier: (supplierId: string) => SwitchingState[];
}

// Key oluşturma yardımcı fonksiyonu
const createKey = (supplierId: string, materialTypeId: string): string => {
  return `${supplierId}-${materialTypeId}`;
};

export const useSwitchingStore = create<SwitchingStore>()(
  persist(
    (set, get) => ({
      states: {},

      getState: (supplierId, materialTypeId) => {
        const key = createKey(supplierId, materialTypeId);
        const existing = get().states[key];

        if (existing) {
          return existing;
        }

        // Yoksa yeni oluştur
        const newState = createDefaultSwitchingState(supplierId, materialTypeId);
        set((state) => ({
          states: {
            ...state.states,
            [key]: newState,
          },
        }));
        return newState;
      },

      updateState: (supplierId, materialTypeId, result, lotId, lotNumber) => {
        const key = createKey(supplierId, materialTypeId);
        const currentState = get().getState(supplierId, materialTypeId);

        const { newState, transition } = evaluateSwitching(
          currentState,
          result,
          lotId,
          lotNumber
        );

        set((state) => ({
          states: {
            ...state.states,
            [key]: newState,
          },
        }));

        return {
          transition,
          shouldStop: newState.shouldStopProduction,
        };
      },

      getHistory: (supplierId, materialTypeId) => {
        const key = createKey(supplierId, materialTypeId);
        const state = get().states[key];
        return state?.history || [];
      },

      resetState: (supplierId, materialTypeId) => {
        const key = createKey(supplierId, materialTypeId);
        const newState = createDefaultSwitchingState(supplierId, materialTypeId);

        set((state) => ({
          states: {
            ...state.states,
            [key]: newState,
          },
        }));
      },

      clearStopFlag: (supplierId, materialTypeId) => {
        const key = createKey(supplierId, materialTypeId);
        const currentState = get().states[key];

        if (currentState) {
          set((state) => ({
            states: {
              ...state.states,
              [key]: {
                ...currentState,
                shouldStopProduction: false,
                consecutiveRejects: 0,
              },
            },
          }));
        }
      },

      getAllStatesForSupplier: (supplierId) => {
        const allStates = get().states;
        return Object.values(allStates).filter(
          (state) => state.supplierId === supplierId
        );
      },
    }),
    {
      name: 'kkys-switching-store',
    }
  )
);
