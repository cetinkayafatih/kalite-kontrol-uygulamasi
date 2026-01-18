import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Lot,
  Inspection,
  Supplier,
  MaterialType,
  Settings
} from '../types';
import {
  sampleSuppliers,
  materialTypes as defaultMaterialTypes,
  generateLotNumber
} from '../data/samplingData';

// ============================================
// SETTINGS STORE
// ============================================

interface SettingsState {
  settings: Settings;
  setSettings: (settings: Partial<Settings>) => void;
  toggleDarkMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        companyName: 'Kalite Kontrol Yönetim Sistemi',
        companyLogo: null,
        defaultAQL: '2.5',
        defaultInspectionLevel: 'II',
        darkMode: false,
        language: 'tr',
      },
      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      toggleDarkMode: () =>
        set((state) => ({
          settings: { ...state.settings, darkMode: !state.settings.darkMode },
        })),
    }),
    {
      name: 'settings-storage',
    }
  )
);

// ============================================
// SUPPLIER STORE
// ============================================

interface SupplierState {
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getSupplierById: (id: string) => Supplier | undefined;
}

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set, get) => ({
      suppliers: sampleSuppliers,
      addSupplier: (supplier) =>
        set((state) => ({
          suppliers: [
            ...state.suppliers,
            {
              ...supplier,
              id: uuidv4(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateSupplier: (id, supplier) =>
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === id ? { ...s, ...supplier } : s
          ),
        })),
      deleteSupplier: (id) =>
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id),
        })),
      getSupplierById: (id) => get().suppliers.find((s) => s.id === id),
    }),
    {
      name: 'supplier-storage',
    }
  )
);

// ============================================
// MATERIAL STORE
// ============================================

interface MaterialState {
  materials: MaterialType[];
  addMaterial: (material: Omit<MaterialType, 'id'>) => void;
  updateMaterial: (id: string, material: Partial<MaterialType>) => void;
  deleteMaterial: (id: string) => void;
  getMaterialById: (id: string) => MaterialType | undefined;
}

export const useMaterialStore = create<MaterialState>()(
  persist(
    (set, get) => ({
      materials: defaultMaterialTypes,
      addMaterial: (material) =>
        set((state) => ({
          materials: [
            ...state.materials,
            {
              ...material,
              id: uuidv4(),
            },
          ],
        })),
      updateMaterial: (id, material) =>
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === id ? { ...m, ...material } : m
          ),
        })),
      deleteMaterial: (id) =>
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
        })),
      getMaterialById: (id) => get().materials.find((m) => m.id === id),
    }),
    {
      name: 'material-storage',
    }
  )
);

// ============================================
// LOT STORE
// ============================================

interface LotState {
  lots: Lot[];
  currentLot: Lot | null;
  addLot: (lot: Omit<Lot, 'id' | 'lotNumber' | 'createdAt' | 'status' | 'decision' | 'defectCount'>) => Lot;
  updateLot: (id: string, lot: Partial<Lot>) => void;
  deleteLot: (id: string) => void;
  setCurrentLot: (lot: Lot | null) => void;
  getLotById: (id: string) => Lot | undefined;
  completeLot: (id: string, decision: 'accepted' | 'rejected', defectCount: number) => void;
  updateCurrentSampleIndex: (id: string, index: number) => void;
}

export const useLotStore = create<LotState>()(
  persist(
    (set, get) => ({
      lots: [],
      currentLot: null,
      addLot: (lot) => {
        const newLot: Lot = {
          ...lot,
          id: uuidv4(),
          lotNumber: generateLotNumber(),
          createdAt: new Date().toISOString(),
          status: 'pending',
          decision: null,
          defectCount: 0,
        };
        set((state) => ({
          lots: [newLot, ...state.lots],
          currentLot: newLot,
        }));
        return newLot;
      },
      updateLot: (id, lot) =>
        set((state) => ({
          lots: state.lots.map((l) => (l.id === id ? { ...l, ...lot } : l)),
          currentLot:
            state.currentLot?.id === id
              ? { ...state.currentLot, ...lot }
              : state.currentLot,
        })),
      deleteLot: (id) =>
        set((state) => ({
          lots: state.lots.filter((l) => l.id !== id),
          currentLot: state.currentLot?.id === id ? null : state.currentLot,
        })),
      setCurrentLot: (lot) => set({ currentLot: lot }),
      getLotById: (id) => get().lots.find((l) => l.id === id),
      completeLot: (id, decision, defectCount) =>
        set((state) => ({
          lots: state.lots.map((l) =>
            l.id === id
              ? {
                  ...l,
                  status: 'completed',
                  decision,
                  defectCount,
                  inspectionDate: new Date().toISOString(),
                }
              : l
          ),
          currentLot:
            state.currentLot?.id === id
              ? {
                  ...state.currentLot,
                  status: 'completed',
                  decision,
                  defectCount,
                  inspectionDate: new Date().toISOString(),
                }
              : state.currentLot,
        })),
      updateCurrentSampleIndex: (id, index) =>
        set((state) => ({
          lots: state.lots.map((l) =>
            l.id === id ? { ...l, currentSampleIndex: index } : l
          ),
          currentLot:
            state.currentLot?.id === id
              ? { ...state.currentLot, currentSampleIndex: index }
              : state.currentLot,
        })),
    }),
    {
      name: 'lot-storage',
    }
  )
);

// ============================================
// INSPECTION STORE
// ============================================

interface InspectionState {
  inspections: Inspection[];
  currentInspections: Inspection[];
  addInspection: (inspection: Omit<Inspection, 'id' | 'inspectedAt'>) => void;
  getInspectionsByLotId: (lotId: string) => Inspection[];
  clearCurrentInspections: () => void;
  setCurrentInspections: (inspections: Inspection[]) => void;
}

export const useInspectionStore = create<InspectionState>()(
  persist(
    (set, get) => ({
      inspections: [],
      currentInspections: [],
      addInspection: (inspection) => {
        const newInspection: Inspection = {
          ...inspection,
          id: uuidv4(),
          inspectedAt: new Date().toISOString(),
        };
        set((state) => ({
          inspections: [...state.inspections, newInspection],
          currentInspections: [...state.currentInspections, newInspection],
        }));
      },
      getInspectionsByLotId: (lotId) =>
        get().inspections.filter((i) => i.lotId === lotId),
      clearCurrentInspections: () => set({ currentInspections: [] }),
      setCurrentInspections: (inspections) => set({ currentInspections: inspections }),
    }),
    {
      name: 'inspection-storage',
    }
  )
);

// ============================================
// ANALYTICS HELPERS
// ============================================

export const useAnalytics = () => {
  const lots = useLotStore((state) => state.lots);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const inspections = useInspectionStore((state) => state.inspections);
  const materials = useMaterialStore((state) => state.materials);

  const getStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const completedLots = lots.filter((l) => l.status === 'completed');
    const todayLots = completedLots.filter(
      (l) => new Date(l.inspectionDate) >= today
    );
    const weeklyLots = completedLots.filter(
      (l) => new Date(l.inspectionDate) >= weekAgo
    );
    const monthlyLots = completedLots.filter(
      (l) => new Date(l.inspectionDate) >= monthAgo
    );

    const acceptedLots = completedLots.filter((l) => l.decision === 'accepted');
    const rejectedLots = completedLots.filter((l) => l.decision === 'rejected');
    const pendingLots = lots.filter((l) => l.status === 'pending');

    return {
      todayInspections: todayLots.length,
      weeklyInspections: weeklyLots.length,
      monthlyInspections: monthlyLots.length,
      acceptanceRate:
        completedLots.length > 0
          ? (acceptedLots.length / completedLots.length) * 100
          : 0,
      pendingLots: pendingLots.length,
      totalLots: lots.length,
      totalAccepted: acceptedLots.length,
      totalRejected: rejectedLots.length,
    };
  };

  const getSupplierPerformance = () => {
    return suppliers.map((supplier) => {
      const supplierLots = lots.filter(
        (l) => l.supplierId === supplier.id && l.status === 'completed'
      );
      const acceptedLots = supplierLots.filter((l) => l.decision === 'accepted');
      const totalDefects = supplierLots.reduce((sum, l) => sum + l.defectCount, 0);

      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        totalLots: supplierLots.length,
        acceptedLots: acceptedLots.length,
        rejectedLots: supplierLots.length - acceptedLots.length,
        acceptanceRate:
          supplierLots.length > 0
            ? (acceptedLots.length / supplierLots.length) * 100
            : 0,
        totalDefects,
        avgDefectsPerLot:
          supplierLots.length > 0 ? totalDefects / supplierLots.length : 0,
      };
    });
  };

  const getDefectAnalysis = () => {
    const defectCounts: Record<string, { name: string; count: number }> = {};

    inspections.forEach((inspection) => {
      inspection.defects.forEach((defect) => {
        if (!defectCounts[defect.defectTypeId]) {
          // Find defect name from materials
          let defectName = defect.defectTypeId;
          materials.forEach((material) => {
            const found = material.defectTypes.find(
              (d) => d.id === defect.defectTypeId
            );
            if (found) defectName = found.name;
          });
          defectCounts[defect.defectTypeId] = { name: defectName, count: 0 };
        }
        defectCounts[defect.defectTypeId].count++;
      });
    });

    const total = Object.values(defectCounts).reduce((sum, d) => sum + d.count, 0);

    return Object.entries(defectCounts)
      .map(([id, data]) => ({
        defectTypeId: id,
        defectName: data.name,
        count: data.count,
        percentage: total > 0 ? (data.count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getTrendData = (days: number = 30) => {
    const result: Array<{
      date: string;
      inspections: number;
      accepted: number;
      rejected: number;
      defectRate: number;
    }> = [];

    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const dayLots = lots.filter((l) => {
        if (l.status !== 'completed') return false;
        const lotDate = new Date(l.inspectionDate).toISOString().split('T')[0];
        return lotDate === dateStr;
      });

      const accepted = dayLots.filter((l) => l.decision === 'accepted').length;
      const rejected = dayLots.filter((l) => l.decision === 'rejected').length;
      const totalDefects = dayLots.reduce((sum, l) => sum + l.defectCount, 0);
      const totalSamples = dayLots.reduce((sum, l) => sum + l.sampleSize, 0);

      result.push({
        date: dateStr,
        inspections: dayLots.length,
        accepted,
        rejected,
        defectRate: totalSamples > 0 ? (totalDefects / totalSamples) * 100 : 0,
      });
    }

    return result;
  };

  return {
    getStats,
    getSupplierPerformance,
    getDefectAnalysis,
    getTrendData,
  };
};
