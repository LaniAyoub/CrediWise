import React, { useState, useEffect } from 'react';
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
  const [isConfirmed, setIsConfirmed] = useState(initialData.isComplete);
  const [confirmedAt, setConfirmedAt] = useState(initialData.confirmedAt);
  const [confirmedByName, setConfirmedByName] = useState(initialData.confirmedByName);

  const buildDefaults = (data: StepObjetCreditData): Step2FormValues => ({
    pertinenceProjet: data.pertinenceProjet || '',
    // Normalize to pure form types — no fake rows, no extra API fields
    depenses: data.depenses.map(d => ({
      id: d.id,
      categorie: d.categorie,
      description: d.description || '',
      cout: Number(d.cout) || 0,
    })),
    financementAutre: data.financementAutre.map(f => ({
      id: f.id,
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

  // Save draft — does NOT confirm, does NOT advance step
  const handleSave = handleSubmit(async (values) => {
    setSaving(true);
    try {
      const result = await analyseService.saveStep2(dossierId, values);
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
      const result = await analyseService.confirmStep2(dossierId, values);
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
                {t('fields.objetCredit')}
              </p>
              <p className="text-sm text-surface-900 dark:text-surface-50 bg-surface-50 dark:bg-surface-700/40 px-3 py-2 rounded-lg">
                {initialData.loanPurpose || '—'}
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
            <div>
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1 uppercase tracking-wide">
                {t('fields.typeProduit')}
              </p>
              <p className="text-sm text-surface-900 dark:text-surface-50 bg-surface-50 dark:bg-surface-700/40 px-3 py-2 rounded-lg">
                {initialData.productName || '—'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1 uppercase tracking-wide">
                {t('fields.capaciteRemboursement')}
              </p>
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-50 bg-surface-50 dark:bg-surface-700/40 px-3 py-2 rounded-lg">
                {formatAmount(initialData.monthlyRepaymentCapacity || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: Project Expenses */}
      <DynamicListTable
        title={t('step2.sectionB')}
        showCategoryDropdown={true}
        descriptionPlaceholder={t('step2.depensePlaceholder') || 'Détail de la dépense'}
        amountLabel={t('fields.cout')}
        fields={depensesField.fields}
        register={register}
        errors={errors}
        onAppend={() =>
          depensesField.append(defaultDepense)
        }
        onRemove={depensesField.remove}
        appendLabel={t('step2.addDepense')}
        minRows={1}
        totalLabel={t('step2.coutTotal')}
        totalValue={coutTotalLive}
        fieldPrefix="depenses"
        readOnly={readOnly}
      />

      {/* SECTION C: Other Financing */}
      <DynamicListTable
        title={t('step2.sectionC')}
        showCategoryDropdown={false}
        descriptionPlaceholder={t('step2.financementPlaceholder') || 'Ex: apport personnel, prêt familial…'}
        amountLabel={t('fields.montant')}
        fields={financementsField.fields}
        register={register}
        errors={errors}
        onAppend={() => financementsField.append({ description: '', montant: 0 })}
        onRemove={financementsField.remove}
        appendLabel={t('step2.addFinancement')}
        minRows={0}
        totalLabel={t('step2.totalAutres')}
        totalValue={totalAutresLive}
        fieldPrefix="financementAutre"
        readOnly={readOnly}
      />

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
            {...register('pertinenceProjet')}
            rows={4}
            disabled={readOnly}
            className={`w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none ${readOnly ? 'border-transparent cursor-default' : 'border border-surface-300 dark:border-surface-600'}`}
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
