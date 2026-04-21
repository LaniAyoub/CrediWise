import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getStatusKey } from '@/utils/statusMapping';
import type { StepClientData } from '@/types/analyse';
import AuditMetadataPanel from '@/components/analyse/AuditMetadataPanel';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface StepClientViewProps {
  data: StepClientData;
  onConfirmer: () => void;
  isConfirming: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}

const StepClientView: React.FC<StepClientViewProps> = ({ data, onConfirmer, isConfirming, onDirtyChange }) => {
  const { t } = useTranslation(['analyse', 'clients']);
  const [location, setLocation] = useState<string>(data.location || '');

  // Notify parent of dirty state
  useEffect(() => {
    const isDirty = location !== (data.location || '');
    onDirtyChange?.(isDirty);
  }, [location, data.location, onDirtyChange]);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return '—';
    }
  };

  const formatCurrency = (value: number | null | string): string => {
    if (value === null || value === undefined || value === '') return '—';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '—';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND',
      maximumFractionDigits: 2,
    }).format(num);
  };

  const renderFieldGrid = (
    fields: Array<{ label: string; value: string | number | boolean | null }>
  ) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {fields.map((field, idx) => (
          <div key={idx}>
            <p className="text-label text-surface-600 dark:text-surface-400 mb-1">{field.label}</p>
            <p className="text-body text-surface-900 dark:text-surface-50">
              {field.value === null || field.value === '' || field.value === undefined
                ? '—'
                : typeof field.value === 'boolean'
                  ? field.value
                    ? t('common.yes')
                    : t('common.no')
                  : field.value}
            </p>
          </div>
        ))}
      </div>
    );
  };

  // Build client fields dynamically based on type
  const buildClientFields = () => {
    const fields: Array<{ label: string; value: string | number | boolean | null }> = [
      { label: t('clients:detailLabels.id'), value: data.clientId },
      { label: t('clients:form.clientType'), value: data.clientType },
      { label: t('clients:form.status'), value: data.status },
    ];

    // Physical person fields (PHYSICAL clients)
    if (data.clientType === 'PHYSICAL') {
      fields.push(
        { label: t('clients:form.firstName'), value: data.firstName },
        { label: t('clients:form.lastName'), value: data.lastName },
        { label: t('clients:form.dateOfBirth'), value: formatDate(data.dateOfBirth) },
        { label: t('clients:form.nationalId'), value: data.nationalId },
        { label: t('clients:form.taxIdentifier'), value: data.taxIdentifier },
        { label: t('clients:form.gender'), value: data.gender },
        { label: t('clients:form.maritalStatus'), value: data.maritalStatus },
        { label: t('clients:form.nationality'), value: data.nationality },
        { label: t('clients:form.monthlyIncome'), value: formatCurrency(data.monthlyIncome) }
      );
    }

    // Legal entity fields (LEGAL clients)
    if (data.clientType === 'LEGAL') {
      fields.push(
        { label: t('clients:form.companyName'), value: data.companyName },
        { label: t('clients:form.sigle'), value: data.sigle },
        { label: t('clients:form.registrationNumber'), value: data.registrationNumber },
        { label: t('clients:form.principalInterlocutor'), value: data.principalInterlocutor }
      );
    }

    // Contact & address fields (all clients)
    fields.push(
      { label: t('clients:form.email'), value: data.email },
      { label: t('clients:form.primaryPhone'), value: data.primaryPhone },
      { label: t('clients:form.secondaryPhone'), value: data.secondaryPhone },
      { label: t('clients:form.street'), value: data.addressStreet },
      { label: t('clients:form.city'), value: data.addressCity },
      { label: t('clients:form.postalCode'), value: data.addressPostal },
      { label: t('clients:form.country'), value: data.addressCountry },
      { label: t('clients:detailLabels.accountNumber'), value: data.accountNumber },
      { label: t('clients:form.accountType'), value: data.accountTypeName || data.accountTypeCustomName },
      { label: t('clients:detailLabels.segment'), value: data.segmentName },
      { label: t('clients:detailLabels.businessSector'), value: data.businessSectorName },
      { label: t('clients:detailLabels.businessActivity'), value: data.businessActivityName },
      { label: t('clients:detailLabels.riskLevel'), value: data.ifcLevelOfRisk },
      { label: t('clients:form.scoring'), value: data.scoring },
      { label: t('clients:form.cycle'), value: data.cycle }
    );

    return fields;
  };

  const clientFields = buildClientFields();

  return (
    <div className="space-y-6">
      {/* Warning banner */}
      {data.warningMessage && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 flex gap-3">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-amber-700 dark:text-amber-300">{data.warningMessage}</p>
        </div>
      )}

      {/* Client Information Card */}
      <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-heading text-surface-900 dark:text-surface-50">{t('step1.clientInfo')}</h3>
        </div>
        {renderFieldGrid(clientFields)}
      </div>

      {/* General Information Card */}
      <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-heading text-surface-900 dark:text-surface-50">{t('step1.generalInformation') || 'General Information'}</h3>
        </div>

        {/* Agency Libellé */}
        {data.agenceDataAvailable ? (
          <div className="mb-4">
            <p className="text-label text-surface-600 dark:text-surface-400 mb-1">{t('step1.agenceInfo')}</p>
            <p className="text-body text-surface-900 dark:text-surface-50">{data.agenceLibelle || '—'}</p>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-700 dark:text-amber-300">{t('step1.agenceUnavailable')}</p>
          </div>
        )}

        {/* Assigned Manager Name */}
        <div className="border-t border-surface-200 dark:border-surface-700 pt-4 mb-4">
          <p className="text-label text-surface-600 dark:text-surface-400 mb-1">{t('analyse:common.status') === 'analyse:common.status' ? 'Assigned Manager' : t('analyse:common.status')}</p>
          <p className="text-body text-surface-900 dark:text-surface-50">{data.assignedManagerName || '—'}</p>
        </div>

        {/* Request Creation Date */}
        <div className="border-t border-surface-200 dark:border-surface-700 pt-4 mb-4">
          <p className="text-label text-surface-600 dark:text-surface-400 mb-1">{t('common.date')}</p>
          <p className="text-body text-surface-900 dark:text-surface-50">{data.demandeCreatedAt ? formatDate(data.demandeCreatedAt) : '—'}</p>
        </div>

        {/* Dossier Status */}
        <div className="border-t border-surface-200 dark:border-surface-700 pt-4 mb-4">
          <p className="text-label text-surface-600 dark:text-surface-400 mb-1">{t('common.status')}</p>
          <p className="text-body text-surface-900 dark:text-surface-50">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.dossierStatus ? t(getStatusKey(data.dossierStatus as any)) : '—'}
          </p>
        </div>

        {/* Location Input - Only show when not complete */}
        {!data.isComplete && (
          <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
            <label className="block text-label text-surface-600 dark:text-surface-400 mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location or address for this analysis..."
              className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Credit History Card */}
      <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-heading text-surface-900 dark:text-surface-50">{t('step1.creditHistory')}</h3>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{data.nombreDemandesPassees}</p>
            <p className="text-xs text-surface-600 dark:text-surface-400 mt-1">{t('step1.totalDemandes')}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.nombreDemandesApprouvees}</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">{t('step1.approved')}</p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{data.nombreDemandesRejetees}</p>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">{t('step1.rejected')}</p>
          </div>
        </div>

        {/* History Table */}
        {data.nombreDemandesPassees === 0 ? (
          <p className="text-sm text-surface-600 dark:text-surface-400 text-center py-8">{t('step1.noHistory')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="text-left py-2 px-2 text-surface-600 dark:text-surface-400 font-medium">{t('step1.demandeNumber')}</th>
                  <th className="text-left py-2 px-2 text-surface-600 dark:text-surface-400 font-medium">{t('step1.amount')}</th>
                  <th className="text-left py-2 px-2 text-surface-600 dark:text-surface-400 font-medium">{t('step1.status')}</th>
                  <th className="text-left py-2 px-2 text-surface-600 dark:text-surface-400 font-medium">{t('step1.date')}</th>
                </tr>
              </thead>
              <tbody>
                {data.historiqueCredits.map((item, idx) => (
                  <tr key={idx} className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/30">
                    <td className="py-3 px-2">{item.demandeId}</td>
                    <td className="py-3 px-2">{item.requestedAmount}</td>
                    <td className="py-3 px-2">
                      <Badge
                        variant={
                          item.status === 'ANALYSE' || item.status === 'DISBURSE'
                            ? 'success'
                            : item.status === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {t(getStatusKey(item.status as any))}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-surface-600 dark:text-surface-400">{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STATUS & AUDIT PANEL */}
      <div className="space-y-4">
        {data.isComplete && (
          <div className={`border-l-4 p-4 rounded-lg ${
            location !== (data.location || '')
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
              : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
          }`}>
            <p className={`text-sm font-medium ${
              location !== (data.location || '')
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-emerald-700 dark:text-emerald-300'
            }`}>
              {location !== (data.location || '')
                ? <>⚠️ {t('common.modified')}</>
                : <>✓ {t('common.confirmed')}</>
              }
            </p>
          </div>
        )}

        {/* Audit Panel */}
        <AuditMetadataPanel
          confirmedAt={data.confirmedAt}
          confirmedBy={data.confirmedBy}
        />

        {/* Action Buttons */}
        {!data.isComplete && (
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onConfirmer}
              disabled={isConfirming}
              className="w-full sm:w-auto"
            >
              {isConfirming ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('step1.confirming')}
                </>
              ) : (
                <>
                  {t('step1.confirmer')} →
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepClientView;
