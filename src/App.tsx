import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import LotEntry from './pages/LotEntry';
import Inspection from './pages/Inspection';
import Result from './pages/Result';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import Login from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import {
  initializeFromSupabase,
  useSyncStore,
  useSupplierStore,
  useMaterialStore,
  useLotStore,
  useInspectionStore,
} from './store/useStore';
import { useSwitchingStore } from './store/switchingStore';
import { Loader2, CloudOff, RefreshCw } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Yukleniyor...
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Veritabani baglantisi kuruluyor
        </p>
      </div>
    </div>
  );
}

function OfflineBanner() {
  const { sync, setOnline } = useSyncStore();

  const handleRetry = async () => {
    setOnline(true);
    await initializeFromSupabase();
    await useSwitchingStore.getState().loadFromSupabase();
  };

  if (sync.isOnline) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <CloudOff className="w-4 h-4" />
          <span className="text-sm">
            Veritabani baglantisi yok - Cevrimdisi calisiyor
          </span>
        </div>
        <button
          onClick={handleRetry}
          className="flex items-center gap-1 text-sm text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200"
        >
          <RefreshCw className="w-3 h-3" />
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { sync } = useSyncStore();

  useEffect(() => {
    async function init() {
      try {
        // Tüm store'ların localStorage'dan hydrate olmasını bekle
        const waitForHydration = () => {
          return new Promise<void>((resolve) => {
            const checkHydration = () => {
              const allHydrated =
                useSupplierStore.getState()._hasHydrated &&
                useMaterialStore.getState()._hasHydrated &&
                useLotStore.getState()._hasHydrated &&
                useInspectionStore.getState()._hasHydrated;

              if (allHydrated) {
                resolve();
              } else {
                setTimeout(checkHydration, 10);
              }
            };
            checkHydration();
          });
        };

        await waitForHydration();

        // Sadece localStorage'da lot verisi yoksa Supabase'den çek
        const existingLots = useLotStore.getState().lots;
        if (existingLots.length === 0) {
          await initializeFromSupabase();
          await useSwitchingStore.getState().loadFromSupabase();
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    }

    init();
  }, []);

  if (!isInitialized || sync.isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <OfflineBanner />
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="lot-entry" element={<LotEntry />} />
            <Route path="inspection" element={<Inspection />} />
            <Route path="result" element={<Result />} />
            <Route path="reports" element={<Reports />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
