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
}

const StepObjetCreditView: React.FC<StepObjetCreditViewProps> = ({
  dossierId,
  initialData,
  onConfirmed,
  onBack,
  onDirtyChange,
  saveRef,
}) => {
  const { t } = useTranslation('analyse');
  const [confirming, setConfirming] = useState(false);
  const [isComplete, setIsComplete] = useState(initialData.isComplete);
  const [confirmedAt, setConfirmedAt] = useState(initialData.confirmedAt);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      pertinenceProjet: initialData.pertinenceProjet || '',
      depenses:
        initialData.depenses.length > 0
          ? initialData.depenses
          : ([{ categorie: undefined, description: '', cout: 0 }] as unknown as Step2FormValues['depenses']),
      financementAutre: initialData.financementAutre,
    },
  });

  const depensesField = useFieldArray({ control, name: 'depenses' });
  const financementsField = useFieldArray({ control, name: 'financementAutre' });

  // Notify parent of dirty state
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Set up save ref for parent to call
  useEffect(() => {
    if (saveRef) {
      saveRef.current = async () => {
        await handleSubmit(async (values) => {
          setConfirming(true);
          try {
            const result = await analyseService.confirmStep2(dossierId, values);
            setIsComplete(true);
            setConfirmedAt(result.data.confirmedAt);
            toast.success(t('step2.confirmedSuccess'));
            onConfirmed(result.data);
          } catch (e) {
            toast.error(handleAnalyseError(e));
            throw e;
          } finally {
            setConfirming(false);
          }
        })();
      };
    }
  }, [handleSubmit, dossierId, t, onConfirmed, saveRef]);

  // Watch for live totals
  const watchedDepenses = watch('depenses');
  const watchedFinancements = watch('financementAutre');

  const coutTotalLive = watchedDepenses.reduce(
    (s, d) => s + (Number(d.cout) || 0),
    0
  );
  const totalAutresLive = watchedFinancements.reduce(
    (s, f) => s + (Number(f.montant) || 0),
    0
  );

  const montantDemande = initialData.requestedAmount ?? 0;
  const isBalancedLive =
    Math.abs(
      coutTotalLive - (montantDemande + totalAutresLive)
    ) < 0.01;
  const ecartLive = coutTotalLive - (montantDemande + totalAutresLive);

  const handleConfirm = handleSubmit(async (values) => {
    setConfirming(true);
    try {
      const result = await analyseService.confirmStep2(dossierId, values);
      setIsComplete(true);
      setConfirmedAt(result.data.confirmedAt);
      toast.success(t('step2.confirmedSuccess'));
      onConfirmed(result.data);
    } catch (e) {
      toast.error(handleAnalyseError(e));
    } finally {
      setConfirming(false);
    }
  });

  const handleEdit = () => {
    setIsComplete(false);
  };

  return (
    <div className="space-y-6">
      {/* SECTION A: Informations Crédit (Read-Only) */}
      <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-heading text-surface-900 dark:text-surface-50">
            {t('step2.sectionA')}
          </h3>
          <Badge variant="info">{t('step2.datasource')}</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Objet du Crédit */}
          <div>
            <p className="text-label text-surface-600 dark:text-surface-400 mb-1">
              {t('fields.objetCredit')}
            </p>
            <p className="text-body text-surface-900 dark:text-surface-50 bg-surface-50 dark:bg-surface-700 px-3 py-2 rounded">
              {initialData.loanPurpose || '—'}
            </p>
          </div>

          {/* Montant Demandé */}
          <div>
            <p className="text-label text-surface-600 dark:text-surface-400 mb-1">
              {t('fields.montantDemande')}
            </p>
            <p className="text-body font-medium text-emerald-600 dark:text-emerald-400 bg-surface-50 dark:bg-surface-700 px-3 py-2 rounded">
              {formatAmount(initialData.requestedAmount || 0)}
            </p>
          </div>

          {/* Durée */}
          <div>
            <p className="text-label text-surface-600 dark:text-surface-400 mb-1">
              {t('fields.dureeEnMois')}
            </p>
            <p className="text-body text-surface-900 dark:text-surface-50 bg-surface-50 dark:bg-surface-700 px-3 py-2 rounded">
              {initialData.durationMonths ? `${initialData.durationMonths} mois` : '—'}
            </p>
          </div>

          {/* Produit */}
          <div>
            <p className="text-label text-surface-600 dark:text-surface-400 mb-1">
              {t('fields.typeProduit')}
            </p>
            <p className="text-body text-surface-900 dark:text-surface-50 bg-surface-50 dark:bg-surface-700 px-3 py-2 rounded">
              {initialData.productName || '—'}
            </p>
          </div>

          {/* Capacité Remboursement */}
          <div className="sm:col-span-2">
            <p className="text-label text-surface-600 dark:text-surface-400 mb-1">
              {t('fields.capaciteRemboursement')}
            </p>
            <p className="text-body font-medium text-surface-900 dark:text-surface-50 bg-surface-50 dark:bg-surface-700 px-3 py-2 rounded">
              {formatAmount(initialData.monthlyRepaymentCapacity || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION B: Dépenses du Projet */}
      {!isComplete && (
        <DynamicListTable
          title={t('step2.sectionB')}
          showCategoryDropdown={true}
          descriptionPlaceholder={t('step2.depensePlaceholder') || 'Détail de la dépense'}
          amountLabel={t('fields.cout')}
          fields={depensesField.fields}
          register={register}
          errors={errors}
          onAppend={() =>
            depensesField.append({
              categorie: undefined as unknown as string,
              description: '',
              cout: 0,
            } as unknown as Step2FormValues['depenses'][number])
          }
          onRemove={depensesField.remove}
          appendLabel={t('step2.addDepense')}
          minRows={1}
          totalLabel={t('step2.coutTotal')}
          totalValue={coutTotalLive}
          fieldPrefix="depenses"
        />
      )}

      {isComplete && (
        <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-6 shadow-sm">
          <h3 className="text-heading text-surface-900 dark:text-surface-50 mb-4">
            {t('step2.sectionB')}
          </h3>
          <div className="space-y-3">
            {watchedDepenses.map((depense, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center px-3 py-2 bg-surface-50 dark:bg-surface-700 rounded"
              >
                <div className="flex-1">
                  <p className="text-label text-surface-600 dark:text-surface-400">
                    {depense.description}
                  </p>
                </div>
                <p className="text-body font-medium text-surface-900 dark:text-surface-50 ml-4">
                  {formatAmount(depense.cout || 0)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-surface-200 dark:border-surface-700 mt-4 pt-4 flex justify-between items-center">
            <p className="text-label font-medium text-surface-900 dark:text-surface-50">
              {t('step2.coutTotal')}
            </p>
            <p className="text-heading font-bold text-emerald-600 dark:text-emerald-400">
              {formatAmount(coutTotalLive)}
            </p>
          </div>
        </div>
      )}

      {/* SECTION C: Autres Sources de Financement */}
      {!isComplete && (
        <DynamicListTable
          title={t('step2.sectionC')}
          showCategoryDropdown={false}
          descriptionPlaceholder={t('step2.financementPlaceholder') || 'Ex: apport personnel, prêt familial…'}
          amountLabel={t('fields.montant')}
          fields={financementsField.fields}
          register={register}
          errors={errors}
          onAppend={() =>
            financementsField.append({ description: '', montant: 0 })
          }
          onRemove={financementsField.remove}
          appendLabel={t('step2.addFinancement')}
          minRows={0}
          totalLabel={t('step2.totalAutres')}
          totalValue={totalAutresLive}
          fieldPrefix="financementAutre"
        />
      )}

      {isComplete && watchedFinancements.length > 0 && (
        <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-6 shadow-sm">
          <h3 className="text-heading text-surface-900 dark:text-surface-50 mb-4">
            {t('step2.sectionC')}
          </h3>
          <div className="space-y-3">
            {watchedFinancements.map((financement, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center px-3 py-2 bg-surface-50 dark:bg-surface-700 rounded"
              >
                <div className="flex-1">
                  <p className="text-label text-surface-600 dark:text-surface-400">
                    {financement.description}
                  </p>
                </div>
                <p className="text-body font-medium text-surface-900 dark:text-surface-50 ml-4">
                  {formatAmount(financement.montant || 0)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-surface-200 dark:border-surface-700 mt-4 pt-4 flex justify-between items-center">
            <p className="text-label font-medium text-surface-900 dark:text-surface-50">
              {t('step2.totalAutres')}
            </p>
            <p className="text-heading font-bold text-emerald-600 dark:text-emerald-400">
              {formatAmount(totalAutresLive)}
            </p>
          </div>
        </div>
      )}

      {/* SECTION D: Pertinence du Projet (Project Relevance) */}
      {!isComplete && (
        <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-6 shadow-sm">
          <h3 className="text-heading text-surface-900 dark:text-surface-50 mb-4">
            {t('step2.sectionD')}
          </h3>
          <div>
            <label htmlFor="pertinenceProjet" className="block text-label text-surface-600 dark:text-surface-400 mb-2">
              {t('fields.pertinenceProjet')}
            </label>
            <textarea
              id="pertinenceProjet"
              placeholder={t('step2.pertinencePlaceholder')}
              {...register('pertinenceProjet')}
              rows={4}
              className="w-full px-3 py-2 text-body border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            {errors.pertinenceProjet && (
              <p className="text-xs text-rose-500 mt-1">
                {errors.pertinenceProjet.message}
              </p>
            )}
          </div>
        </div>
      )}

      {isComplete && initialData.pertinenceProjet && (
        <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-6 shadow-sm">
          <h3 className="text-heading text-surface-900 dark:text-surface-50 mb-4">
            {t('step2.sectionD')}
          </h3>
          <p className="text-label text-surface-600 dark:text-surface-400 mb-3">
            {t('fields.pertinenceProjet')}
          </p>
          <div className="bg-surface-50 dark:bg-surface-700 rounded-lg p-4 text-body text-surface-900 dark:text-surface-50 whitespace-pre-wrap">
            {initialData.pertinenceProjet}
          </div>
        </div>
      )}

      {/* BALANCE BANNER */}
      {!isComplete && (coutTotalLive > 0 || totalAutresLive > 0) && (
        <div
          className={`border-l-4 p-4 rounded-lg ${
            isBalancedLive
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-300'
          }`}
        >
          {isBalancedLive ? (
            <p className="text-sm font-medium">
              ✓ {t('step2.balanced')} — {formatAmount(coutTotalLive)}
            </p>
          ) : (
            <div className="text-sm space-y-1">
              <p className="font-medium">⚠ {t('step2.ecart')}</p>
              <p className="text-xs opacity-90">
                {t('step2.coutTotal')}: {formatAmount(coutTotalLive)} | {t('step2.totalAutres')}: {formatAmount(montantDemande + totalAutresLive)} | {t('fields.montant')}: {formatAmount(Math.abs(ecartLive))}
              </p>
            </div>
          )}
        </div>
      )}

      {/* STATUS BADGE & ACTIONS */}
      <div className="space-y-4">
        {isComplete && (
          <div className={`border-l-4 p-4 rounded-lg ${
            isDirty
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
              : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
          }`}>
            <p className={`text-sm font-medium ${
              isDirty
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-emerald-700 dark:text-emerald-300'
            }`}>
              {isDirty ? (
                <>⚠️ {t('common.modified')}</>
              ) : (
                <>✓ {t('common.confirmed')}</>
              )}
            </p>
          </div>
        )}

        {/* Audit Panel */}
        <AuditMetadataPanel
          confirmedAt={confirmedAt}
          confirmedBy={initialData.confirmedBy}
        />

        {/* Action Buttons */}
        {!isComplete ? (
          <div className="flex gap-3 justify-between">
            {onBack && (
              <Button
                variant="outline"
                onClick={onBack}
              >
                ← {t('common.backToList')}
              </Button>
            )}
            <Button
              onClick={handleConfirm}
              disabled={confirming}
            >
              {confirming ? t('step2.confirming') : t('step2.confirmer')}
            </Button>
          </div>
        ) : (
          <div className="flex gap-3 justify-between">
            {onBack && (
              <Button
                variant="outline"
                onClick={onBack}
              >
                ← {t('common.backToList')}
              </Button>
            )}
            {isDirty ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleEdit}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={confirming}
                >
                  {confirming ? t('step2.confirming') : t('common.saveChanges')}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={handleEdit}
              >
                {t('common.edit')}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StepObjetCreditView;
