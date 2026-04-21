import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { analyseService, handleAnalyseError } from '@/services/analyseService';
import type { AnalyseDossier } from '@/types/analyse';
import { getStatusKey, getStatusColor } from '@/utils/statusMapping';
import Table from '@/components/ui/Table';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

const DossierListPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('analyse');

  const [dossiers, setDossiers] = useState<AnalyseDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDossiers = async () => {
    try {
      setLoading(true);
      // Backend GET /analyses/dossiers returns all dossiers (filtered by role automatically)
      const response = await analyseService.getDossierList();
      setDossiers(response.data);
      setError(null);
    } catch (err) {
      setError(handleAnalyseError(err));
      setDossiers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossiers();
  }, []);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return '—';
    }
  };

  if (loading) {
    return (
      <div className="page-container space-y-6">
        <div className="h-8 w-64 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />
        <LoadingSkeleton rows={5} type="table" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 rounded-lg p-6">
          <p className="text-sm text-rose-900 dark:text-rose-50">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-page-title text-surface-900 dark:text-surface-50">{t('dossier.listTitle')}</h1>
        <p className="text-caption text-surface-600 dark:text-surface-400 mt-2">{t('dossier.listSubtitle')}</p>
      </div>

      {/* Table */}
      {dossiers.length === 0 ? (
        <div className="bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">{t('dossier.noFound')}</p>
        </div>
      ) : (
        <Table
          headers={[t('common.demandeNumber'), t('common.clientId'), t('common.status'), t('common.currentStep'), t('common.date')]}
          isEmpty={dossiers.length === 0}
        >
          {dossiers.map((dossier) => (
            <tr
              key={dossier.id}
              onClick={() => navigate(`/analyse/dossiers/${dossier.id}`)}
              className="hover:bg-surface-50 dark:hover:bg-surface-700/30 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 text-body font-medium">#{dossier.demandeId}</td>
              <td className="px-4 py-3 text-body font-medium text-surface-900 dark:text-surface-50">
                {dossier.clientId.slice(0, 8)}...
              </td>
              <td className="px-4 py-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColor(dossier.status).text} ${getStatusColor(dossier.status).bg}`}>
                  {t(getStatusKey(dossier.status))}
                </span>
              </td>
              <td className="px-4 py-3 text-body">{dossier.currentStep}/7</td>
              <td className="px-4 py-3 text-body text-surface-600 dark:text-surface-400">{formatDate(dossier.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
};

export default DossierListPage;
