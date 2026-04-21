import { lazy } from 'react';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const AgencesPage = lazy(() => import('@/pages/agences/AgencesPage'));
const GestionnairesPage = lazy(() => import('@/pages/gestionnaires/GestionnairesPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const DossierListPage = lazy(() => import('@/pages/analyse/DossierListPage'));
const DossierAnalysePage = lazy(() => import('@/pages/analyse/DossierAnalysePage'));

export const routes = [
  { path: '/login', component: LoginPage, isProtected: false },
  { path: '/dashboard', component: DashboardPage, isProtected: true },
  { path: '/agences', component: AgencesPage, isProtected: true },
  { path: '/gestionnaires', component: GestionnairesPage, isProtected: true },
  { path: '/profile', component: ProfilePage, isProtected: true },
  { path: '/analyse/dossiers', component: DossierListPage, isProtected: true },
  { path: '/analyse/dossiers/:dossierId', component: DossierAnalysePage, isProtected: true },
];
