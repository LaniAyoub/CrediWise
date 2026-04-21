import { Navigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context';
import MainLayout from '@/components/layout/MainLayout';

const ProtectedRoute = () => {
  const { t } = useTranslation('common');
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-sm">CW</span>
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">{t('common.loadingApp')}</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? (
    <MainLayout>
      <Outlet />
    </MainLayout>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default ProtectedRoute;
