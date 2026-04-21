import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './context';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleGuard from './components/layout/RoleGuard';
import { Toaster } from 'react-hot-toast';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const AgencesPage = lazy(() => import('./pages/agences/AgencesPage'));
const GestionnairesPage = lazy(() => import('./pages/gestionnaires/GestionnairesPage'));
const ClientsPage = lazy(() => import('./pages/clients/ClientsPage'));
const DemandesPage = lazy(() => import('./pages/demandes/DemandesPage'));
const DossierListPage = lazy(() => import('./pages/analyse/DossierListPage'));
const DossierAnalysePage = lazy(() => import('./pages/analyse/DossierAnalysePage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));

// Roles allowed to manage agences & gestionnaires
const ADMIN_ROLES = ['SUPER_ADMIN', 'TECH_USER'];

// Loading fallback
const PageLoader = () => {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-surface-400">{t('common.loading')}</span>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            style: { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' },
          },
          error: {
            style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
          },
        }}
      />
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/agences"
                element={
                  <RoleGuard allowedRoles={ADMIN_ROLES}>
                    <AgencesPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/gestionnaires"
                element={
                  <RoleGuard allowedRoles={ADMIN_ROLES}>
                    <GestionnairesPage />
                  </RoleGuard>
                }
              />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/demandes" element={<DemandesPage />} />
              <Route path="/analyse/dossiers" element={<DossierListPage />} />
              <Route path="/analyse/dossiers/:dossierId" element={<DossierAnalysePage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
