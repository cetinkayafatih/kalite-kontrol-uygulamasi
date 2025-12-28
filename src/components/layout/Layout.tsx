import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSettingsStore } from '../../store/useStore';
import { Toaster } from 'react-hot-toast';

const pageTitles: Record<string, string> = {
  '/': 'Kontrol Paneli',
  '/lot-entry': 'Yeni Parti Girişi',
  '/inspection': 'Kontrol',
  '/result': 'Kontrol Sonucu',
  '/reports': 'Raporlar',
  '/suppliers': 'Tedarikçi Yönetimi',
  '/analytics': 'Analiz & İstatistik',
  '/settings': 'Ayarlar',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { settings } = useSettingsStore();

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const pageTitle = pageTitles[location.pathname] || 'Kalite Kontrol';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={pageTitle}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: settings.darkMode ? '#1E293B' : '#fff',
            color: settings.darkMode ? '#fff' : '#1F2937',
            border: settings.darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}
