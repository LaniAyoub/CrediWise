import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { agenceService } from '@/services/agence.service';
import { gestionnaireService } from '@/services/gestionnaire.service';
import { clientService } from '@/services/client.service';
import { demandeService } from '@/services/demande.service';
import Card from '@/components/ui/Card';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Button from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import type { Agence } from '@/types/agence.types';
import type { Gestionnaire } from '@/types/gestionnaire.types';
import type { Client } from '@/types/client.types';
import type { Demande } from '@/types/demande.types';

const ADMIN_ROLES = ['SUPER_ADMIN', 'TECH_USER'];

const DashboardPage = () => {
  const { t } = useTranslation('dashboard');
  const commonT = useTranslation('common').t;
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = ADMIN_ROLES.includes(user?.role || '');

  const [loading, setLoading] = useState(true);

  // Admin data
  const [agences, setAgences] = useState<Agence[]>([]);
  const [gestionnaires, setGestionnaires] = useState<Gestionnaire[]>([]);

  // Manager / all-user data
  const [clients, setClients] = useState<Client[]>([]);
  const [demandes, setDemandes] = useState<Demande[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises: Promise<unknown>[] = [
          clientService.getAll({ page: 0, size: 200 }).then((r) => setClients(r.data)),
          demandeService.getAll({ page: 0, size: 200 }).then((r) => setDemandes(r.data)),
        ];

        if (isAdmin) {
          promises.push(
            agenceService.getAll().then((r) => setAgences(r.data)),
            gestionnaireService.getAll().then((r) => setGestionnaires(r.data)),
          );
        }

        await Promise.allSettled(promises);
      } catch {
        // errors handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  // ── Client analytics ──────────────────────────────────────────────────────
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'ACTIVE').length;
  const prospectClients = clients.filter((c) => c.status === 'PROSPECT').length;
  const physicalClients = clients.filter((c) => c.clientType === 'PHYSICAL').length;
  const legalClients = clients.filter((c) => c.clientType === 'LEGAL').length;
  const myClients = clients.filter((c) => c.assignedManagerId === user?.id);

  // ── Demande analytics ──────────────────────────────────────────────────────
  const totalDemandes = demandes.length;
  const draftDemandes = demandes.filter((d) => d.status === 'DRAFT').length;
  const submittedDemandes = demandes.filter((d) => d.status === 'SUBMITTED').length;
  const validatedDemandes = demandes.filter((d) => d.status === 'VALIDATED').length;
  const rejectedDemandes = demandes.filter((d) => d.status === 'REJECTED').length;

  // ── Admin analytics ───────────────────────────────────────────────────────
  const activeManagers = gestionnaires.filter((g) => g.active).length;
  const inactiveManagers = gestionnaires.filter((g) => !g.active).length;
  const activeAgences = agences.filter((a) => a.active).length;

  // ── Recent clients (top 5) ────────────────────────────────────────────────
  const recentClients = [...clients]
    .sort((a, b) => {
      const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dB - dA;
    })
    .slice(0, 5);

  // ── Recent demandes (top 5) ────────────────────────────────────────────────
  const recentDemandes = [...demandes]
    .sort((a, b) => {
      const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dB - dA;
    })
    .slice(0, 5);

  const clientDisplayName = (c: Client): string => {
    if (c.clientType === 'PHYSICAL') {
      return [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';
    }
    return c.companyName || '—';
  };

  return (
    <div className="page-container space-y-6">
      {/* Welcome - Modern Design System */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-page-title">
            {t('welcome', { name: user?.firstName || 'User' })}
          </h1>
          <p className="text-caption mt-2">
            {isAdmin ? t('adminOverview') : t('userOverview')}
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/agences')}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                {commonT('common.add')} {commonT('navigation.agences')}
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/gestionnaires')}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                {commonT('common.add')} {commonT('navigation.gestionnaires')}
              </Button>
            </>
          )}
          <Button
            variant={isAdmin ? 'outline' : 'primary'}
            size="sm"
            onClick={() => navigate('/clients')}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          >
            {commonT('navigation.clients')}
          </Button>
        </div>
      </div>

      {/* ── Stats cards ────────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSkeleton type="card" />
      ) : (
        <>
          {/* ── Client stats (visible to ALL roles) ───────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card
              title={t('stats.totalClients')}
              value={totalClients}
              subtitle={`${activeClients} active · ${prospectClients} prospects`}
              color="brand"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <Card
              title={t('stats.totalRequests')}
              value={totalDemandes}
              subtitle={`${submittedDemandes} submitted · ${validatedDemandes} approved`}
              color="brand"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <Card
              title={t('stats.myClients')}
              value={myClients.length}
              subtitle={t('stats.myClientsSubtitle', { name: user?.firstName || 'you' })}
              color="violet"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
            <Card
              title={t('stats.draftDemandes')}
              value={draftDemandes}
              subtitle={t('subtitles.draftStats', { rejected: rejectedDemandes })}
              color="amber"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* ── Admin-only stats (agences + gestionnaires) ─────────────────── */}
          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Card
                title={t('stats.totalBranches')}
                value={agences.length}
                subtitle={`${activeAgences} active`}
                color="brand"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
              />
              <Card
                title={t('stats.totalManagers')}
                value={gestionnaires.length}
                subtitle="All managers"
                color="violet"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
              <Card
                title={t('stats.activeManagers')}
                value={activeManagers}
                subtitle={t('stats.activeManagersSubtitle')}
                color="emerald"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <Card
                title={t('stats.inactiveManagers')}
                value={inactiveManagers}
                subtitle={t('stats.inactiveManagersSubtitle')}
                color="rose"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                }
              />
            </div>
          )}
        </>
      )}

      {/* ── Quick overview panels ──────────────────────────────────────────── */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>

        {/* Recent Clients — visible to all */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm dark:shadow-md overflow-hidden lg:col-span-1 transition-colors">
          <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-100">{t('sections.recentClients')}</h3>
            <button
              onClick={() => navigate('/clients')}
              className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              {t('viewAll')}
            </button>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-700">
            {loading ? (
              <div className="p-6">
                <LoadingSkeleton type="text" rows={3} />
              </div>
            ) : recentClients.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-surface-400 dark:text-surface-500">
                {t('sections.noClients')}
              </div>
            ) : (
              recentClients.map((c) => (
                <div
                  key={c.id}
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40 flex items-center justify-center">
                      <span className="text-brand-700 dark:text-brand-300 text-xs font-bold">
                        {c.clientType === 'PHYSICAL'
                          ? `${c.firstName?.[0] ?? ''}${c.lastName?.[0] ?? ''}`.toUpperCase()
                          : (c.companyName?.[0] ?? 'C').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-800 dark:text-surface-200">
                        {clientDisplayName(c)}
                      </p>
                      <p className="text-xs text-surface-400 dark:text-surface-500">
                        {c.primaryPhone || c.email || '—'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Demandes — visible to all */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm dark:shadow-md overflow-hidden lg:col-span-1 transition-colors">
          <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-100">{t('sections.recentDemandes')}</h3>
            <button
              onClick={() => navigate('/demandes')}
              className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              {t('viewAll')}
            </button>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-700">
            {loading ? (
              <div className="p-6">
                <LoadingSkeleton type="text" rows={3} />
              </div>
            ) : recentDemandes.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-surface-400 dark:text-surface-500">
                {t('sections.noDemandes')}
              </div>
            ) : (
              recentDemandes.map((d) => (
                <div
                  key={d.id}
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/40 dark:to-sky-800/40 flex items-center justify-center">
                      <span className="text-sky-700 dark:text-sky-300 text-xs font-bold">📋</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">
                        {d.firstName && d.lastName
                          ? `${d.firstName} ${d.lastName}`
                          : d.companyName || '—'}
                      </p>
                      <p className="text-xs text-surface-400 truncate">
                        {d.productName ? `${d.productName} - TND ${d.requestedAmount || '—'}` : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span
                      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                        d.status === 'VALIDATED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : d.status === 'SUBMITTED'
                            ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                            : d.status === 'DRAFT'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                      }`}
                    >
                      {d.status}
                    </span>
                    <button
                      onClick={() => navigate(`/demandes/${d.id}`)}
                      className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t('portfolio.viewDetails')}
                    >
                      →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Client Portfolio — visible to non-admin managers */}
        {!isAdmin && (
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm dark:shadow-md overflow-hidden lg:col-span-1 transition-colors">
            <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-700">
              <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-100">{t('sections.myPortfolio')}</h3>
            </div>
            <div className="p-6 space-y-5">
              {/* Manager info card */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
                </div>
                <div>
                  <p className="font-semibold text-surface-900 dark:text-surface-50">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">{user?.email} · {user?.role}</p>
                  {user?.agenceId && (
                    <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-0.5">{t('portfolio.agence')}: {user.agenceId}</p>
                  )}
                </div>
              </div>

              {/* Portfolio breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-500 dark:text-surface-400">{t('portfolio.myAssignedClients')}</span>
                  <span className="text-sm font-bold text-surface-800 dark:text-surface-100">{myClients.length}</span>
                </div>
                <div className="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-brand-500 to-brand-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: totalClients ? `${(myClients.length / totalClients) * 100}%` : '0%' }}
                  />
                </div>
                <p className="text-xs text-surface-400 dark:text-surface-500">
                  {totalClients ? Math.round((myClients.length / totalClients) * 100) : 0}{t('portfolio.percentOfTotal')}
                </p>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-3 text-center">
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {myClients.filter((c) => c.status === 'ACTIVE').length}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('portfolio.active')}</p>
                </div>
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-3 text-center">
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                    {myClients.filter((c) => c.status === 'PROSPECT').length}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">{t('portfolio.prospects')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin: Recent Agences */}
        {isAdmin && (
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm dark:shadow-md overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-100">{t('sections.recentAgences')}</h3>
              <button
                onClick={() => navigate('/agences')}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
              >
                {t('viewAll')}
              </button>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-700">
              {loading ? (
                <div className="p-6">
                  <LoadingSkeleton type="text" rows={3} />
                </div>
              ) : agences.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-surface-400">
                  {t('sections.noAgences')}
                </div>
              ) : (
                agences.slice(0, 5).map((agence) => (
                  <div
                    key={agence.idBranch}
                    className="px-6 py-3.5 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-surface-800 dark:text-surface-200">{agence.libelle}</p>
                      <p className="text-xs text-surface-400 dark:text-surface-500">{agence.idBranch}</p>
                    </div>
                    <span
                      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                        agence.active
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400'
                      }`}
                    >
                      {agence.active ? commonT('common.active') : commonT('common.inactive')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Admin: Recent Gestionnaires */}
        {isAdmin && (
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm dark:shadow-md overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-100">{t('sections.recentGestionnaires')}</h3>
              <button
                onClick={() => navigate('/gestionnaires')}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
              >
                {t('viewAll')}
              </button>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-700">
              {loading ? (
                <div className="p-6">
                  <LoadingSkeleton type="text" rows={3} />
                </div>
              ) : gestionnaires.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-surface-400">
                  {t('sections.noGestionnaires')}
                </div>
              ) : (
                gestionnaires.slice(0, 5).map((g) => (
                  <div
                    key={g.id}
                    className="px-6 py-3.5 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40 flex items-center justify-center">
                        <span className="text-brand-700 dark:text-brand-300 text-xs font-bold">
                          {g.firstName?.[0]}{g.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-800 dark:text-surface-200">
                          {g.firstName} {g.lastName}
                        </p>
                        <p className="text-xs text-surface-400 dark:text-surface-500">{g.email}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                        g.active
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400'
                      }`}
                    >
                      {g.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
