// ISO 2859-1 Switching Rules Store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SwitchingState, SwitchingTransition } from '../types/switching';
import { createDefaultSwitchingState, evaluateSwitching } from '../utils/switchingLogic';
import { switchingService } from '../services/supabaseService';

interface SwitchingStore {
  // State: key = `${supplierId}-${materialTypeId}`
  states: Record<string, SwitchingState>;
  isLoaded: boolean;

  // Actions
  getState: (supplierId: string, materialTypeId: string) => SwitchingState;
  updateState: (
    supplierId: string,
    materialTypeId: string,
    result: 'accepted' | 'rejected',
    lotId: string,
    lotNumber: string
  ) => Promise<{ transition: SwitchingTransition | null; shouldStop: boolean }>;
  getHistory: (supplierId: string, materialTypeId: string) => SwitchingTransition[];
  resetState: (supplierId: string, materialTypeId: string) => Promise<void>;
  clearStopFlag: (supplierId: string, materialTypeId: string) => Promise<void>;

  // Tum tedarikcilerin durumlarini getir
  getAllStatesForSupplier: (supplierId: string) => SwitchingState[];

  // Supabase sync
  loadFromSupabase: () => Promise<void>;
}

// Key olusturma yardimci fonksiyonu
const createKey = (supplierId: string, materialTypeId: string): string => {
  return `${supplierId}-${materialTypeId}`;
};

export const useSwitchingStore = create<SwitchingStore>()(
  persist(
    (set, get) => ({
      states: {},
      isLoaded: false,

      getState: (supplierId, materialTypeId) => {
        const key = createKey(supplierId, materialTypeId);
        const existing = get().states[key];

        if (existing) {
          return existing;
        }

        // Yoksa yeni olustur
        const newState = createDefaultSwitchingState(supplierId, materialTypeId);
        set((state) => ({
          states: {
            ...state.states,
            [key]: newState,
          },
        }));
        return newState;
      },

      updateState: async (supplierId, materialTypeId, result, lotId, lotNumber) => {
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

        // Sync to Supabase
        try {
          await switchingService.upsert(newState);
        } catch (error) {
          console.error('Failed to sync switching state to Supabase:', error);
        }

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

      resetState: async (supplierId, materialTypeId) => {
        const key = createKey(supplierId, materialTypeId);
        const newState = createDefaultSwitchingState(supplierId, materialTypeId);

        set((state) => ({
          states: {
            ...state.states,
            [key]: newState,
          },
        }));

        try {
          await switchingService.upsert(newState);
        } catch (error) {
          console.error('Failed to reset switching state in Supabase:', error);
        }
      },

      clearStopFlag: async (supplierId, materialTypeId) => {
        const key = createKey(supplierId, materialTypeId);
        const currentState = get().states[key];

        if (currentState) {
          const updatedState = {
            ...currentState,
            shouldStopProduction: false,
            consecutiveRejects: 0,
          };

          set((state) => ({
            states: {
              ...state.states,
              [key]: updatedState,
            },
          }));

          try {
            await switchingService.upsert(updatedState);
          } catch (error) {
            console.error('Failed to clear stop flag in Supabase:', error);
          }
        }
      },

      getAllStatesForSupplier: (supplierId) => {
        const allStates = get().states;
        return Object.values(allStates).filter(
          (state) => state.supplierId === supplierId
        );
      },

      loadFromSupabase: async () => {
        try {
          const states = await switchingService.getAll();
          const statesMap: Record<string, SwitchingState> = {};

          states.forEach((state) => {
            const key = createKey(state.supplierId, state.materialTypeId);
            statesMap[key] = state;
          });

          set({ states: statesMap, isLoaded: true });
        } catch (error) {
          console.error('Failed to load switching states from Supabase:', error);
          set({ isLoaded: true });
        }
      },
    }),
    {
      name: 'kkys-switching-store',
    }
  )
);
