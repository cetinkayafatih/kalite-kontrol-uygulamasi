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
import {
  supplierService,
  materialService,
  lotService,
  inspectionService,
  settingsService,
  type AuditUser
} from '../services/supabaseService';

// ============================================
// SUPABASE SYNC STATE
// ============================================

interface SyncState {
  isOnline: boolean;
  isLoading: boolean;
  lastSyncedAt: string | null;
  error: string | null;
}

interface SyncStore {
  sync: SyncState;
  setOnline: (online: boolean) => void;
  setLoading: (loading: boolean) => void;
  setSynced: () => void;
  setError: (error: string | null) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  sync: {
    isOnline: true,
    isLoading: false,
    lastSyncedAt: null,
    error: null,
  },
  setOnline: (online) => set((state) => ({ sync: { ...state.sync, isOnline: online } })),
  setLoading: (loading) => set((state) => ({ sync: { ...state.sync, isLoading: loading } })),
  setSynced: () => set((state) => ({ sync: { ...state.sync, lastSyncedAt: new Date().toISOString(), error: null } })),
  setError: (error) => set((state) => ({ sync: { ...state.sync, error } })),
}));

// ============================================
// SETTINGS STORE
// ============================================

interface SettingsState {
  settings: Settings;
  isLoaded: boolean;
  setSettings: (settings: Partial<Settings>) => void;
  toggleDarkMode: () => void;
  loadFromSupabase: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: {
        companyName: 'Kalite Kontrol Yonetim Sistemi',
        companyLogo: null,
        defaultAQL: '2.5',
        defaultInspectionLevel: 'II',
        darkMode: false,
        language: 'tr',
      },
      isLoaded: false,
      setSettings: async (newSettings) => {
        const updatedSettings = { ...get().settings, ...newSettings };
        set({ settings: updatedSettings });

        // Sync to Supabase
        try {
          await settingsService.update(newSettings);
        } catch (error) {
          console.error('Failed to sync settings to Supabase:', error);
        }
      },
      toggleDarkMode: async () => {
        const newDarkMode = !get().settings.darkMode;
        set((state) => ({
          settings: { ...state.settings, darkMode: newDarkMode },
        }));

        try {
          await settingsService.update({ darkMode: newDarkMode });
        } catch (error) {
          console.error('Failed to sync dark mode to Supabase:', error);
        }
      },
      loadFromSupabase: async () => {
        try {
          const settings = await settingsService.get();
          if (settings) {
            set({ settings, isLoaded: true });
          } else {
            set({ isLoaded: true });
          }
        } catch (error) {
          console.error('Failed to load settings from Supabase:', error);
          set({ isLoaded: true });
        }
      },
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
  isLoaded: boolean;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>, user?: AuditUser | null) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>, user?: AuditUser | null) => Promise<void>;
  deleteSupplier: (id: string, user?: AuditUser | null) => Promise<void>;
  getSupplierById: (id: string) => Supplier | undefined;
  loadFromSupabase: () => Promise<void>;
}

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set, get) => ({
      suppliers: sampleSuppliers,
      isLoaded: false,
      addSupplier: async (supplier, user) => {
        const newSupplier: Supplier = {
          ...supplier,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };

        // Optimistic update
        set((state) => ({
          suppliers: [...state.suppliers, newSupplier],
        }));

        // Sync to Supabase
        try {
          const created = await supplierService.create(supplier, user);
          // Update with server-generated ID
          set((state) => ({
            suppliers: state.suppliers.map((s) =>
              s.id === newSupplier.id ? created : s
            ),
          }));
        } catch (error) {
          console.error('Failed to sync supplier to Supabase:', error);
        }
      },
      updateSupplier: async (id, supplier, user) => {
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === id ? { ...s, ...supplier } : s
          ),
        }));

        try {
          await supplierService.update(id, supplier, user);
        } catch (error) {
          console.error('Failed to update supplier in Supabase:', error);
        }
      },
      deleteSupplier: async (id, user) => {
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id),
        }));

        try {
          await supplierService.delete(id, user);
        } catch (error) {
          console.error('Failed to delete supplier from Supabase:', error);
        }
      },
      getSupplierById: (id) => get().suppliers.find((s) => s.id === id),
      loadFromSupabase: async () => {
        try {
          const suppliers = await supplierService.getAll();
          if (suppliers.length > 0) {
            set({ suppliers, isLoaded: true });
          } else {
            // If no suppliers in DB, seed with defaults
            for (const supplier of sampleSuppliers) {
              try {
                await supplierService.create(supplier);
              } catch (e) {
                // Ignore duplicate errors
              }
            }
            set({ isLoaded: true });
          }
        } catch (error) {
          console.error('Failed to load suppliers from Supabase:', error);
          set({ isLoaded: true });
        }
      },
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
  isLoaded: boolean;
  addMaterial: (material: Omit<MaterialType, 'id'>, user?: AuditUser | null) => Promise<void>;
  updateMaterial: (id: string, material: Partial<MaterialType>, user?: AuditUser | null) => Promise<void>;
  deleteMaterial: (id: string, user?: AuditUser | null) => Promise<void>;
  getMaterialById: (id: string) => MaterialType | undefined;
  loadFromSupabase: () => Promise<void>;
}

// Varsayılan malzeme tiplerinden eksik hata türlerini tamamla
const mergeWithDefaults = (materials: MaterialType[]): MaterialType[] => {
  return materials.map((material) => {
    const defaultMaterial = defaultMaterialTypes.find(
      (dm) => dm.id === material.id || dm.code === material.code
    );
    if (defaultMaterial) {
      // Varsayılan hata türlerini ekle (eksik olanları)
      const existingDefectIds = new Set(material.defectTypes.map((d) => d.id));
      const missingDefects = defaultMaterial.defectTypes.filter(
        (d) => !existingDefectIds.has(d.id)
      );
      // Varsayılan kriterleri ekle (eksik olanları)
      const existingCriteriaIds = new Set(material.criteria.map((c) => c.id));
      const missingCriteria = defaultMaterial.criteria.filter(
        (c) => !existingCriteriaIds.has(c.id)
      );
      return {
        ...material,
        defectTypes: [...material.defectTypes, ...missingDefects],
        criteria: [...material.criteria, ...missingCriteria],
      };
    }
    return material;
  });
};

export const useMaterialStore = create<MaterialState>()(
  persist(
    (set, get) => ({
      materials: defaultMaterialTypes,
      isLoaded: false,
      addMaterial: async (material, user) => {
        const newMaterial: MaterialType = {
          ...material,
          id: uuidv4(),
        };

        set((state) => ({
          materials: [...state.materials, newMaterial],
        }));

        try {
          const created = await materialService.create(material, user);
          set((state) => ({
            materials: state.materials.map((m) =>
              m.id === newMaterial.id ? created : m
            ),
          }));
        } catch (error) {
          console.error('Failed to sync material to Supabase:', error);
        }
      },
      updateMaterial: async (id, material, user) => {
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === id ? { ...m, ...material } : m
          ),
        }));

        try {
          await materialService.update(id, material, user);
        } catch (error) {
          console.error('Failed to update material in Supabase:', error);
        }
      },
      deleteMaterial: async (id, user) => {
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
        }));

        try {
          await materialService.delete(id, user);
        } catch (error) {
          console.error('Failed to delete material from Supabase:', error);
        }
      },
      getMaterialById: (id) => get().materials.find((m) => m.id === id),
      loadFromSupabase: async () => {
        try {
          const materials = await materialService.getAll();
          if (materials.length > 0) {
            // Eksik hata türlerini ve kriterleri tamamla
            const mergedMaterials = mergeWithDefaults(materials);
            set({ materials: mergedMaterials, isLoaded: true });
          } else {
            // Seed with defaults
            for (const material of defaultMaterialTypes) {
              try {
                await materialService.create(material);
              } catch (e) {
                // Ignore duplicate errors
              }
            }
            set({ materials: defaultMaterialTypes, isLoaded: true });
          }
        } catch (error) {
          console.error('Failed to load materials from Supabase:', error);
          // Hata durumunda varsayılanları kullan
          set({ materials: defaultMaterialTypes, isLoaded: true });
        }
      },
    }),
    {
      name: 'material-storage',
      // localStorage'dan yüklenirken eksik verileri tamamla
      merge: (persistedState: unknown, currentState: MaterialState) => {
        const state = persistedState as Partial<MaterialState> | undefined;
        if (state?.materials) {
          return {
            ...currentState,
            ...state,
            materials: mergeWithDefaults(state.materials),
          };
        }
        return { ...currentState, ...state };
      },
    }
  )
);

// ============================================
// LOT STORE
// ============================================

interface LotState {
  lots: Lot[];
  currentLot: Lot | null;
  isLoaded: boolean;
  addLot: (lot: Omit<Lot, 'id' | 'lotNumber' | 'createdAt' | 'status' | 'decision' | 'defectCount'>, user?: AuditUser | null) => Promise<Lot>;
  updateLot: (id: string, lot: Partial<Lot>, user?: AuditUser | null) => Promise<void>;
  deleteLot: (id: string, user?: AuditUser | null) => Promise<void>;
  setCurrentLot: (lot: Lot | null) => void;
  getLotById: (id: string) => Lot | undefined;
  completeLot: (id: string, decision: 'accepted' | 'rejected', defectCount: number, user?: AuditUser | null) => Promise<void>;
  updateCurrentSampleIndex: (id: string, index: number, user?: AuditUser | null) => Promise<void>;
  loadFromSupabase: () => Promise<void>;
}

export const useLotStore = create<LotState>()(
  persist(
    (set, get) => ({
      lots: [],
      currentLot: null,
      isLoaded: false,
      addLot: async (lot, user) => {
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

        try {
          const created = await lotService.create({
            ...lot,
            lotNumber: newLot.lotNumber,
          }, user);
          set((state) => ({
            lots: state.lots.map((l) => (l.id === newLot.id ? created : l)),
            currentLot: state.currentLot?.id === newLot.id ? created : state.currentLot,
          }));
          return created;
        } catch (error) {
          console.error('Failed to sync lot to Supabase:', error);
          return newLot;
        }
      },
      updateLot: async (id, lot, user) => {
        set((state) => ({
          lots: state.lots.map((l) => (l.id === id ? { ...l, ...lot } : l)),
          currentLot:
            state.currentLot?.id === id
              ? { ...state.currentLot, ...lot }
              : state.currentLot,
        }));

        try {
          await lotService.update(id, lot, user);
        } catch (error) {
          console.error('Failed to update lot in Supabase:', error);
        }
      },
      deleteLot: async (id, user) => {
        set((state) => ({
          lots: state.lots.filter((l) => l.id !== id),
          currentLot: state.currentLot?.id === id ? null : state.currentLot,
        }));

        try {
          await lotService.delete(id, user);
        } catch (error) {
          console.error('Failed to delete lot from Supabase:', error);
        }
      },
      setCurrentLot: (lot) => set({ currentLot: lot }),
      getLotById: (id) => get().lots.find((l) => l.id === id),
      completeLot: async (id, decision, defectCount, user) => {
        const updatedData = {
          status: 'completed' as const,
          decision,
          defectCount,
          inspectionDate: new Date().toISOString(),
        };

        set((state) => ({
          lots: state.lots.map((l) =>
            l.id === id ? { ...l, ...updatedData } : l
          ),
          currentLot:
            state.currentLot?.id === id
              ? { ...state.currentLot, ...updatedData }
              : state.currentLot,
        }));

        try {
          await lotService.complete(id, decision, defectCount, user);
        } catch (error) {
          console.error('Failed to complete lot in Supabase:', error);
        }
      },
      updateCurrentSampleIndex: async (id, index, user) => {
        set((state) => ({
          lots: state.lots.map((l) =>
            l.id === id ? { ...l, currentSampleIndex: index } : l
          ),
          currentLot:
            state.currentLot?.id === id
              ? { ...state.currentLot, currentSampleIndex: index }
              : state.currentLot,
        }));

        try {
          await lotService.update(id, { currentSampleIndex: index }, user);
        } catch (error) {
          console.error('Failed to update sample index in Supabase:', error);
        }
      },
      loadFromSupabase: async () => {
        try {
          const lots = await lotService.getAll();
          set({ lots, isLoaded: true });
        } catch (error) {
          console.error('Failed to load lots from Supabase:', error);
          set({ isLoaded: true });
        }
      },
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
  isLoaded: boolean;
  addInspection: (inspection: Omit<Inspection, 'id' | 'inspectedAt'>, user?: AuditUser | null) => Promise<void>;
  getInspectionsByLotId: (lotId: string) => Inspection[];
  clearCurrentInspections: () => void;
  setCurrentInspections: (inspections: Inspection[]) => void;
  loadFromSupabase: () => Promise<void>;
}

export const useInspectionStore = create<InspectionState>()(
  persist(
    (set, get) => ({
      inspections: [],
      currentInspections: [],
      isLoaded: false,
      addInspection: async (inspection, user) => {
        const newInspection: Inspection = {
          ...inspection,
          id: uuidv4(),
          inspectedAt: new Date().toISOString(),
        };

        set((state) => ({
          inspections: [...state.inspections, newInspection],
          currentInspections: [...state.currentInspections, newInspection],
        }));

        try {
          const created = await inspectionService.create(inspection, user);
          set((state) => ({
            inspections: state.inspections.map((i) =>
              i.id === newInspection.id ? created : i
            ),
            currentInspections: state.currentInspections.map((i) =>
              i.id === newInspection.id ? created : i
            ),
          }));
        } catch (error) {
          console.error('Failed to sync inspection to Supabase:', error);
        }
      },
      getInspectionsByLotId: (lotId) =>
        get().inspections.filter((i) => i.lotId === lotId),
      clearCurrentInspections: () => set({ currentInspections: [] }),
      setCurrentInspections: (inspections) => set({ currentInspections: inspections }),
      loadFromSupabase: async () => {
        try {
          const inspections = await inspectionService.getAll();
          set({ inspections, isLoaded: true });
        } catch (error) {
          console.error('Failed to load inspections from Supabase:', error);
          set({ isLoaded: true });
        }
      },
    }),
    {
      name: 'inspection-storage',
    }
  )
);

// ============================================
// NOTIFICATION STORE
// ============================================

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [
        {
          id: '1',
          type: 'info',
          title: 'Hoş Geldiniz',
          message: 'Kalite Kontrol Sistemine hoş geldiniz.',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: uuidv4(),
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Max 50 notifications
        }));
      },
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
      clearAll: () => set({ notifications: [] }),
      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: 'notification-storage',
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

// ============================================
// INITIALIZE ALL STORES FROM SUPABASE
// ============================================

export async function initializeFromSupabase(): Promise<void> {
  const syncStore = useSyncStore.getState();
  syncStore.setLoading(true);

  try {
    await Promise.all([
      useSettingsStore.getState().loadFromSupabase(),
      useSupplierStore.getState().loadFromSupabase(),
      useMaterialStore.getState().loadFromSupabase(),
      useLotStore.getState().loadFromSupabase(),
      useInspectionStore.getState().loadFromSupabase(),
    ]);

    syncStore.setSynced();
    syncStore.setOnline(true);
  } catch (error) {
    console.error('Failed to initialize from Supabase:', error);
    syncStore.setError('Veritabani baglantisi kurulamadi');
    syncStore.setOnline(false);
  } finally {
    syncStore.setLoading(false);
  }
}
