import React, { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { analyseService, handleAnalyseError } from '@/services/analyseService';
import type { StepObjetCreditData } from '@/types/analyse';
import { step2Schema, type Step2FormValues } from './step2Schema';
import DynamicListTable from './DynamicListTable';
import AuditMetadataPanel from '@/components/analyse/AuditMetadataPanel';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatAmount } from '@/utils/formatAmount';

interface StepObjetCreditViewProps {
  dossierId: number;
  initialData: StepObjetCreditData;
  onConfirmed: (data: StepObjetCreditData) => void;
  onBack?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  saveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  readOnly?: boolean;
}

const StatusBadge = ({ isConfirmed, isDirty, labels }: { isConfirmed: boolean; isDirty: boolean; labels: { modified: string; confirmed: string } }) => {
  if (!isConfirmed) return null;
  if (isDirty) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
        {labels.modified}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
      {labels.confirmed}
    </span>
  );
};

// Used only for appending new rows — categorie intentionally empty (user must select)
const defaultDepense = {
  description: '',
  cout: 0,
} as unknown as Step2FormValues['depenses'][number];

const StepObjetCreditView: React.FC<StepObjetCreditViewProps> = ({
  dossierId,
  initialData,
  onConfirmed,
  onBack,
  onDirtyChange,
  saveRef,
  readOnly = false,
}) => {
  const { t } = useTranslation('analyse');
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(initialData.isConfirmed);
  const [confirmedAt, setConfirmedAt] = useState(initialData.confirmedAt);
  const [confirmedByName, setConfirmedByName] = useState(initialData.confirmedByName);

  const buildDefaults = (data: StepObjetCreditData): Step2FormValues => ({
    pertinenceProjet: data.pertinenceProjet || '',
    // Normalize to pure form types — no fake rows, no extra API fields
    depenses: data.depenses.map(d => ({
      id: d.id ?? undefined,
      description: d.description || '',
      cout: Number(d.cout) || 0,
    })),
    financementAutre: (data.autresFinancements ?? data.financementAutre ?? []).map(f => ({
      id: f.id ?? undefined,
      description: f.description || '',
      montant: Number(f.montant) || 0,
    })),
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: buildDefaults(initialData),
  });

  const depensesField = useFieldArray({ control, name: 'depenses' });
  const financementsField = useFieldArray({ control, name: 'financementAutre' });

  // Notify parent of dirty state (readOnly views never have unsaved changes)
  useEffect(() => {
    onDirtyChange?.(readOnly ? false : isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, readOnly, onDirtyChange]);

  const toRequest = (values: import('./step2Schema').Step2FormValues): import('@/types/analyse').StepObjetCreditRequest => ({
    pertinenceProjet: values.pertinenceProjet,
    depenses: values.depenses.map(d => ({ description: d.description, cout: d.cout })),
    autresFinancements: values.financementAutre.map(f => ({ description: f.description, montant: f.montant })),
  });

  // Save draft — does NOT confirm, does NOT advance step
  const handleSave = handleSubmit(async (values) => {
    setSaving(true);
    try {
      const result = await analyseService.saveStep2(dossierId, toRequest(values));
      reset(buildDefaults(result.data));
      toast.success(t('common.saved', 'Saved'));
    } catch (e) {
      toast.error(handleAnalyseError(e));
    } finally {
      setSaving(false);
    }
  });

  // Set up save ref — only when dirty and editable so parent knows whether to show modal
  useEffect(() => {
    if (saveRef) {
      saveRef.current = (!readOnly && isDirty) ? async () => { await handleSave(); } : null;
    }
  }, [isDirty, readOnly, saveRef, handleSave]);

  // Live totals
  const watchedDepenses = watch('depenses');
  const watchedFinancements = watch('financementAutre');

  const coutTotalLive = watchedDepenses.reduce((s, d) => s + (Number(d.cout) || 0), 0);
  const totalAutresLive = watchedFinancements.reduce((s, f) => s + (Number(f.montant) || 0), 0);

  const montantDemande = initialData.requestedAmount ?? 0;
  const isBalancedLive =
    Math.abs(coutTotalLive - (montantDemande + totalAutresLive)) < 0.01;
  const ecartLive = coutTotalLive - (montantDemande + totalAutresLive);

  const handleConfirm = handleSubmit(async (values) => {
    setConfirming(true);
    try {
      const result = await analyseService.confirmStep2(dossierId, toRequest(values));
      setIsConfirmed(true);
      setConfirmedAt(result.data.confirmedAt);
      setConfirmedByName(result.data.confirmedByName);
      reset(buildDefaults(result.data));
      toast.success(t('step2.confirmedSuccess'));
      onConfirmed(result.data);
    } catch (e) {
      toast.error(handleAnalyseError(e));
    } finally {
      setConfirming(false);
    }
  });

  // Cancel reverts form to last confirmed state (defaultValues)
  const handleCancel = () => reset();

  // Auto-resize textarea behavior for pertinenceProjet
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const resize = () => {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 600) + 'px'; // limit max height
    };
    resize();
    const observer = new MutationObserver(resize);
    observer.observe(el, { childList: true, characterData: true, subtree: true });
    window.addEventListener('resize', resize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 600) + 'px';
  };

  return (
    <div className="space-y-5">
      {/* SECTION A: Credit Info (read-only snapshot) */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-700/60">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-surface-400 dark:text-surface-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
              {t('step2.sectionA')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge
              isConfirmed={isConfirmed}
              isDirty={isDirty}
              labels={{ modified: t('common.modified'), confirmed: t('common.confirmed') }}
            />
            <Badge variant="info">{t('step2.datasource')}</Badge>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1 uppercase tracking-wide">
                {t('fields.typeObjet')}
              </p>
              <p className="text-sm text-surface-900 dark:text-surface-50 bg-surface-50 dark:bg-surface-700/40 px-3 py-2 rounded-lg">
                {initialData.assetType || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1 uppercase tracking-wide">
                {t('fields.montantDemande')}
              </p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-surface-50 dark:bg-surface-700/40 px-3 py-2 rounded-lg">
                {formatAmount(initialData.requestedAmount || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1 uppercase tracking-wide">
                {t('fields.dureeEnMois')}
              </p>
              <p className="text-sm text-surface-900 dark:text-surface-50 bg-surface-50 dark:bg-surface-700/40 px-3 py-2 rounded-lg">
                {initialData.durationMonths ? `${initialData.durationMonths} mois` : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B & C: Project Analysis Section */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-100 dark:border-surface-700/60">
          <svg className="w-4 h-4 text-surface-400 dark:text-surface-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
            {t('step2.sectionAnalyseProjet')}
          </h3>
        </div>
        <div className="p-6 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column: Project Expenses */}
            <div className="bg-surface-50 dark:bg-surface-700/20 rounded-lg p-6">
              <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-4">
                {t('step2.sectionB')}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700">
                      <th className="text-left text-label text-surface-600 dark:text-surface-400 font-medium pb-3 px-3">
                        {t('fields.depense')}
                      </th>
                      <th className="text-right text-label text-surface-600 dark:text-surface-400 font-medium pb-3 px-3">
                        {t('fields.cout')}
                      </th>
                      <th className="w-12 pb-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {depensesField.fields.map((field, index) => (
                      <React.Fragment key={field.id}>
                        <tr className="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors">
                          <td className="px-3 py-4">
                            <input
                              type="text"
                              placeholder={readOnly ? '' : 'Détail de la dépense'}
                              disabled={readOnly}
                              {...register(`depenses.${index}.description`)}
                              className={`w-full px-3 py-2 text-body border rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${readOnly ? 'border-transparent cursor-default' : 'border-surface-300 dark:border-surface-600'}`}
                            />
                          </td>
                          <td className="px-3 py-4 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              disabled={readOnly}
                              {...register(`depenses.${index}.cout` as const, { valueAsNumber: true })}
                              className={`w-full px-3 py-2 text-body border rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500 ${readOnly ? 'border-transparent cursor-default' : 'border-surface-300 dark:border-surface-600'}`}
                            />
                          </td>
                          <td className="px-3 py-4 text-center">
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => depensesField.remove(index)}
                                className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => depensesField.append(defaultDepense)}
                  className="mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  + {t('step2.addDepense')}
                </button>
              )}
              <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                  {t('step2.coutTotal')}: <span className="text-emerald-600 dark:text-emerald-400">{formatAmount(coutTotalLive)}</span>
                </p>
              </div>
            </div>

            {/* Right column: Other Financing */}
            <div className="bg-surface-50 dark:bg-surface-700/20 rounded-lg p-6">
              <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-4">
                {t('step2.sectionC')}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700">
                      <th className="text-left text-label text-surface-600 dark:text-surface-400 font-medium pb-3 px-3">
                        {t('fields.description')}
                      </th>
                      <th className="text-right text-label text-surface-600 dark:text-surface-400 font-medium pb-3 px-3">
                        {t('fields.montant')}
                      </th>
                      <th className="w-12 pb-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {financementsField.fields.map((field, index) => (
                      <React.Fragment key={field.id}>
                        <tr className="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors">
                          <td className="px-3 py-4">
                            <input
                              type="text"
                              placeholder={readOnly ? '' : 'Ex: apport personnel, prêt familial…'}
                              disabled={readOnly}
                              {...register(`financementAutre.${index}.description`)}
                              className={`w-full px-3 py-2 text-body border rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${readOnly ? 'border-transparent cursor-default' : 'border-surface-300 dark:border-surface-600'}`}
                            />
                          </td>
                          <td className="px-3 py-4 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              disabled={readOnly}
                              {...register(`financementAutre.${index}.montant` as const, { valueAsNumber: true })}
                              className={`w-full px-3 py-2 text-body border rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500 ${readOnly ? 'border-transparent cursor-default' : 'border-surface-300 dark:border-surface-600'}`}
                            />
                          </td>
                          <td className="px-3 py-4 text-center">
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => financementsField.remove(index)}
                                className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => financementsField.append({ description: '', montant: 0 })}
                  className="mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  + {t('step2.addFinancement')}
                </button>
              )}
              <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                  {t('step2.totalAutres')}: <span className="text-emerald-600 dark:text-emerald-400">{formatAmount(totalAutresLive)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION D: Project Relevance (always editable) */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-100 dark:border-surface-700/60">
          <svg className="w-4 h-4 text-surface-400 dark:text-surface-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
            {t('step2.sectionD')}
          </h3>
        </div>
        <div className="p-6">
          <label
            htmlFor="pertinenceProjet"
            className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-2 uppercase tracking-wide"
          >
            {t('fields.pertinenceProjet')}
          </label>
          <textarea
            id="pertinenceProjet"
            placeholder={readOnly ? '' : t('step2.pertinencePlaceholder')}
            rows={2}
            onInput={handleTextareaInput}
            disabled={readOnly}
            className={`w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 overflow-hidden ${readOnly ? 'border-transparent cursor-default' : 'border border-surface-300 dark:border-surface-600'}`}
            ref={(el) => {
              textareaRef.current = el;
              register('pertinenceProjet').ref?.(el);
            }}
          />
          {errors.pertinenceProjet && (
            <p className="text-xs text-rose-500 mt-1">{errors.pertinenceProjet.message}</p>
          )}
        </div>
      </div>

      {/* Balance Banner */}
      {(coutTotalLive > 0 || totalAutresLive > 0) && (
        <div
          className={`border-l-4 px-5 py-4 rounded-xl transition-colors ${
            isBalancedLive
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
          }`}
        >
          {isBalancedLive ? (
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              ✓ {t('step2.balanced')} — {formatAmount(coutTotalLive)}
            </p>
          ) : (
            <div className="text-sm space-y-1">
              <p className="font-medium text-amber-700 dark:text-amber-300">
                ⚠ {t('step2.ecart')}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t('step2.coutTotal')}: {formatAmount(coutTotalLive)} ·{' '}
                {t('step2.totalAutres')}: {formatAmount(montantDemande + totalAutresLive)} ·{' '}
                Écart: {formatAmount(Math.abs(ecartLive))}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Audit Metadata Panel */}
      {isConfirmed && (confirmedAt || confirmedByName) && (
        <AuditMetadataPanel
          confirmedAt={confirmedAt}
          confirmedByName={confirmedByName}
        />
      )}

      {/* Action Buttons — matches Step 1/3 pattern */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              ← {t('common.back')}
            </Button>
          )}
        </div>

        {!readOnly && (
          <div className="flex gap-3">
            {isDirty && (
              <Button variant="outline" onClick={handleCancel} disabled={saving || confirming}>
                {t('common.cancel')}
              </Button>
            )}

            {isDirty && (
              <Button variant="outline" onClick={handleSave} disabled={saving || confirming}>
                {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
              </Button>
            )}

            <Button onClick={handleConfirm} disabled={confirming || saving}>
              {confirming
                ? t('step2.confirming')
                : isConfirmed
                  ? t('step2.reconfirm', 'Re-confirm')
                  : t('step2.confirmer')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepObjetCreditView;
