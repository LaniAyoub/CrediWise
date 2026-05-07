import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './context';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleGuard from './components/layout/RoleGuard';
import { Toaster } from 'react-hot-toast';

// Lazy-loaded pages
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const AgencesPage = lazy(() => import('./pages/agences/AgencesPage'));
const GestionnairesPage = lazy(() => import('./pages/gestionnaires/GestionnairesPage'));
const ClientsPage = lazy(() => import('./pages/clients/ClientsPage'));
const DemandesPage = lazy(() => import('./pages/demandes/DemandesPage'));
const DossierListPage = lazy(() => import('./pages/analyse/DossierListPage'));
const DossierAnalysePage = lazy(() => import('./pages/analyse/DossierAnalysePage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const AdministrationPage = lazy(() => import('./pages/administration/AdministrationPage'));

// Roles allowed to manage agences & gestionnaires
const ADMIN_ROLES = ['SUPER_ADMIN', 'TECH_USER'];

// Roles allowed to access client records
// Mirrors DemandeResource / ClientResource @RolesAllowed on the backend.
const CLIENT_ROLES = [
  'FRONT_OFFICE', 'CRO', 'BRANCH_DM', 'HEAD_OFFICE_DM',
  'RISK_ANALYST', 'SUPER_ADMIN', 'READ_ONLY', 'TECH_USER',
];

// Roles allowed to access demandes (credit requests)
const DEMANDE_ROLES = [
  'FRONT_OFFICE', 'CRO', 'BRANCH_DM', 'HEAD_OFFICE_DM',
  'RISK_ANALYST', 'SUPER_ADMIN', 'READ_ONLY', 'TECH_USER',
];

// Roles allowed to view the analysis dossier list and detail pages
// Analysts, decision-makers, and admins only — not read-only or tech users
// for the full dossier workflow.
const ANALYSE_ROLES = [
  'CRO', 'BRANCH_DM', 'HEAD_OFFICE_DM', 'RISK_ANALYST', 'SUPER_ADMIN', 'FRONT_OFFICE',
];

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
              <Route
                path="/administration"
                element={
                  <RoleGuard allowedRoles={['SUPER_ADMIN']}>
                    <AdministrationPage />
                  </RoleGuard>
                }
              />
              {/* G-018 fix: /clients, /demandes, /analyse/dossiers now require specific roles */}
              <Route
                path="/clients"
                element={
                  <RoleGuard allowedRoles={CLIENT_ROLES}>
                    <ClientsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/demandes"
                element={
                  <RoleGuard allowedRoles={DEMANDE_ROLES}>
                    <DemandesPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/analyse/dossiers"
                element={
                  <RoleGuard allowedRoles={ANALYSE_ROLES}>
                    <DossierListPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/analyse/dossiers/:dossierId"
                element={
                  <RoleGuard allowedRoles={ANALYSE_ROLES}>
                    <DossierAnalysePage />
                  </RoleGuard>
                }
              />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
