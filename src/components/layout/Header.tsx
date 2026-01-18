import { Menu, Moon, Sun, User, LogOut, Home, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSettingsStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import NotificationDropdown from '../common/NotificationDropdown';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const { settings, toggleDarkMode } = useSettingsStore();
  const { user, signOut } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
  };

  const isHomePage = location.pathname === '/';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Breadcrumb */}
          <nav className="hidden sm:flex items-center gap-2 text-sm">
            <Link
              to="/"
              className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Ana Sayfa</span>
            </Link>
            {!isHomePage && title && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {title}
                </span>
              </>
            )}
          </nav>

          {/* Mobile title */}
          {title && (
            <h1 className="sm:hidden text-lg font-semibold text-gray-800 dark:text-white">
              {title}
            </h1>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <NotificationDropdown />

          {/* Theme toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            {settings.darkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            title="Çıkış Yap"
          >
            <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* User menu */}
          <div className="flex items-center gap-3 pl-3 ml-2 border-l border-gray-200 dark:border-slate-700">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {user?.email?.split('@')[0] || 'Kullanıcı'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Yönetici</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
