import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  onMenuToggle: () => void;
}

// Note: breadcrumb labels are translated dynamically now
const getBreadcrumbLabel = (t: any, segment: string): string => {
  const labelMap: Record<string, string> = {
    dashboard: t('navigation.dashboard'),
    agences: t('navigation.agences'),
    gestionnaires: t('navigation.gestionnaires'),
    clients: t('navigation.clients'),
    demandes: t('navigation.demandes'),
    profile: t('navigation.profile'),
  };
  return labelMap[segment] || segment;
};

const Header = ({ onMenuToggle }: HeaderProps) => {
  const { t } = useTranslation('common');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Build breadcrumbs
  const segments = location.pathname.split('/').filter(Boolean);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || user.email.charAt(0).toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 backdrop-blur-sm transition-colors">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: Menu button + Breadcrumbs */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-surface-500 hover:bg-surface-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm">
            <span className="text-surface-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </span>
            {segments.map((seg, i) => (
              <React.Fragment key={seg}>
                <svg className="w-3.5 h-3.5 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span
                  className={`font-medium ${
                    i === segments.length - 1 ? 'text-surface-800 dark:text-surface-100' : 'text-surface-400 dark:text-surface-500'
                  }`}
                >
                  {getBreadcrumbLabel(t, seg)}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Right: Language Switcher + User menu */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-surface-800 dark:text-surface-50 leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-surface-400 dark:text-surface-500">{user?.role}</p>
            </div>
            <svg
              className={`w-4 h-4 text-surface-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 shadow-lg dark:shadow-xl py-1.5 animate-slide-up transition-colors">
              <div className="px-4 py-2.5 border-b border-surface-100 dark:border-surface-700">
                <p className="text-sm font-semibold text-surface-800 dark:text-surface-50">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-surface-400 dark:text-surface-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/profile');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t('navigation.profile')}
              </button>
              <hr className="my-1 border-surface-100 dark:border-surface-700" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {t('navigation.logout')}
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
