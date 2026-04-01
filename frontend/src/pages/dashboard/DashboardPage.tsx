import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { agenceService } from '@/services/agence.service';
import { gestionnaireService } from '@/services/gestionnaire.service';
import Card from '@/components/ui/Card';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Button from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import type { Agence } from '@/types/agence.types';
import type { Gestionnaire } from '@/types/gestionnaire.types';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agences, setAgences] = useState<Agence[]>([]);
  const [gestionnaires, setGestionnaires] = useState<Gestionnaire[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agRes, gRes] = await Promise.allSettled([
          agenceService.getAll(),
          gestionnaireService.getAll(),
        ]);
        if (agRes.status === 'fulfilled') setAgences(agRes.value.data);
        if (gRes.status === 'fulfilled') setGestionnaires(gRes.value.data);
      } catch {
        // errors handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeManagers = gestionnaires.filter((g) => g.active).length;
  const inactiveManagers = gestionnaires.filter((g) => !g.active).length;
  const activeAgences = agences.filter((a) => a.active).length;

  return (
    <div className="page-container space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">
            Welcome back, {user?.firstName || 'User'} 👋
          </h1>
          <p className="text-surface-500 mt-1">
            Here's an overview of your branch management system
          </p>
        </div>
        <div className="flex gap-3">
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
            New Agence
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
            New Manager
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      {loading ? (
        <LoadingSkeleton type="card" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card
            title="Total Agences"
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
            title="Total Gestionnaires"
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
            title="Active Managers"
            value={activeManagers}
            subtitle="Currently active"
            color="emerald"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <Card
            title="Inactive Managers"
            value={inactiveManagers}
            subtitle="Deactivated"
            color="rose"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            }
          />
        </div>
      )}

      {/* Quick overview tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Agences */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-800">Recent Agences</h3>
            <button
              onClick={() => navigate('/agences')}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View all →
            </button>
          </div>
          <div className="divide-y divide-surface-100">
            {loading ? (
              <div className="p-6">
                <LoadingSkeleton type="text" rows={3} />
              </div>
            ) : agences.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-surface-400">
                No agences found
              </div>
            ) : (
              agences.slice(0, 5).map((agence) => (
                <div
                  key={agence.idBranch}
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-surface-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-surface-800">{agence.libelle}</p>
                    <p className="text-xs text-surface-400">{agence.idBranch}</p>
                  </div>
                  <span
                    className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                      agence.active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-surface-100 text-surface-500'
                    }`}
                  >
                    {agence.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Gestionnaires */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-800">Recent Gestionnaires</h3>
            <button
              onClick={() => navigate('/gestionnaires')}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View all →
            </button>
          </div>
          <div className="divide-y divide-surface-100">
            {loading ? (
              <div className="p-6">
                <LoadingSkeleton type="text" rows={3} />
              </div>
            ) : gestionnaires.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-surface-400">
                No gestionnaires found
              </div>
            ) : (
              gestionnaires.slice(0, 5).map((g) => (
                <div
                  key={g.id}
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-surface-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                      <span className="text-brand-700 text-xs font-bold">
                        {g.firstName?.[0]}{g.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-800">
                        {g.firstName} {g.lastName}
                      </p>
                      <p className="text-xs text-surface-400">{g.email}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                      g.active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-surface-100 text-surface-500'
                    }`}
                  >
                    {g.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
