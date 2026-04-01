import { lazy } from 'react';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const AgencesPage = lazy(() => import('@/pages/agences/AgencesPage'));
const GestionnairesPage = lazy(() => import('@/pages/gestionnaires/GestionnairesPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));

export const routes = [
  { path: '/login', component: LoginPage, isProtected: false },
  { path: '/dashboard', component: DashboardPage, isProtected: true },
  { path: '/agences', component: AgencesPage, isProtected: true },
  { path: '/gestionnaires', component: GestionnairesPage, isProtected: true },
  { path: '/profile', component: ProfilePage, isProtected: true },
];
