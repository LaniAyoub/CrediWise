import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { analyseService, handleAnalyseError } from '@/services/analyseService';
import type { StepRisqueFinancierData, StepRisqueFinancierRequest } from '@/types/analyse';
import AuditMetadataPanel from '@/components/analyse/AuditMetadataPanel';
import Button from '@/components/ui/Button';

interface Props {
  dossierId: number;
  initialData: StepRisqueFinancierData;
  onSaved?: (data: StepRisqueFinancierData) => void;
  onConfirmed: (data: StepRisqueFinancierData) => void;
  onBack?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  saveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

function toFormState(data: StepRisqueFinancierData) {
  return {
    notes: data.notes ?? '',
  };
}

type FormState = ReturnType<typeof toFormState>;

const StepRisqueFinancierView: React.FC<Props> = ({
  dossierId,
  initialData,
  onSaved,
  onConfirmed,
  onBack,
  onDirtyChange,
  saveRef,
}) => {
  const { t } = useTranslation('analyse');

  const [form, setForm] = useState<FormState>(() => toFormState(initialData));
  const [data, setData] = useState<StepRisqueFinancierData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const initialFormRef = useRef(JSON.stringify(toFormState(initialData)));

  // Track dirty
  useEffect(() => {
    const dirty = JSON.stringify(form) !== initialFormRef.current;
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [form, onDirtyChange]);

  // Re-sync when parent refreshes data
  useEffect(() => {
    const next = toFormState(initialData);
    setForm(next);
    setData(initialData);
    initialFormRef.current = JSON.stringify(next);
  }, [initialData]);

  // ── Form helpers ────────────────────────────────────────────────────────────

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ── Build request ───────────────────────────────────────────────────────────

  function buildRequest(): StepRisqueFinancierRequest {
    return {
      notes: form.notes || null,
    };
  }

  // ── Save / Confirm ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await analyseService.saveStep5(dossierId, buildRequest());
      setData(res.data);
      const next = toFormState(res.data);
      setForm(next);
      initialFormRef.current = JSON.stringify(next);
      onDirtyChange?.(false);
      onSaved?.(res.data);
      toast.success(t('step5.savedSuccess'));
    } catch (err) {
      toast.error(handleAnalyseError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const res = await analyseService.confirmStep5(dossierId, buildRequest());
      setData(res.data);
      const next = toFormState(res.data);
      setForm(next);
      initialFormRef.current = JSON.stringify(next);
      onDirtyChange?.(false);
      toast.success(t('step5.confirmedSuccess'));
      onConfirmed(res.data);
    } catch (err) {
      toast.error(handleAnalyseError(err));
    } finally {
      setIsConfirming(false);
    }
  };

  // Expose save to parent
  useEffect(() => {
    if (!saveRef) return;
    const dirty = JSON.stringify(form) !== initialFormRef.current;
    saveRef.current = dirty ? handleSave : null;
  });

  // ── Shared input class ──────────────────────────────────────────────────────
  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-green-500';

  // ── Tab definitions ────────────────────────────────────────────────────────
  const tabs = [
    { label: t('step5.tabMargeStock'), id: 'marge-stock' },
    { label: t('step5.tabChoixMethodes'), id: 'choix-methodes' },
    { label: t('step5.tabMethodes'), id: 'methodes' },
    { label: t('step5.tabHypothesesRetenues'), id: 'hypotheses' },
    { label: t('step5.tabCompteResultat'), id: 'compte-resultat' },
    { label: t('step5.tabBilan'), id: 'bilan' },
    { label: t('step5.tabRatios'), id: 'ratios' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === index
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        {activeTab === 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-50">
              {tabs[0].label}
            </h3>
            <p className="text-sm text-surface-600 dark:text-surface-400 italic">
              {t('common.sectionInDevelopment', { defaultValue: 'Cette section est en cours de développement' })}
            </p>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-50">
              {tabs[1].label}
            </h3>
            <p className="text-sm text-surface-600 dark:text-surface-400 italic">
              {t('common.sectionInDevelopment', { defaultValue: 'Cette section est en cours de développement' })}
            </p>
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-50">
              {tabs[2].label}
            </h3>
            <p className="text-sm text-surface-600 dark:text-surface-400 italic">
              {t('common.sectionInDevelopment', { defaultValue: 'Cette section est en cours de développement' })}
            </p>
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-50">
              {tabs[3].label}
            </h3>
            <p className="text-sm text-surface-600 dark:text-surface-400 italic">
              {t('common.sectionInDevelopment', { defaultValue: 'Cette section est en cours de développement' })}
            </p>
          </div>
        )}

        {activeTab === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-50">
              {tabs[4].label}
            </h3>
            <p className="text-sm text-surface-600 dark:text-surface-400 italic">
              {t('common.sectionInDevelopment', { defaultValue: 'Cette section est en cours de développement' })}
            </p>
          </div>
        )}

        {activeTab === 5 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-50">
              {tabs[5].label}
            </h3>
            <p className="text-sm text-surface-600 dark:text-surface-400 italic">
              {t('common.sectionInDevelopment', { defaultValue: 'Cette section est en cours de développement' })}
            </p>
          </div>
        )}

        {activeTab === 6 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-50">
              {tabs[6].label}
            </h3>
            <p className="text-sm text-surface-600 dark:text-surface-400 italic">
              {t('common.sectionInDevelopment', { defaultValue: 'Cette section est en cours de développement' })}
            </p>
          </div>
        )}
      </div>

      {/* General notes field (visible in all tabs) */}
      <section className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">{t('common.notes', { defaultValue: 'Notes' })}</h3>
        <textarea
          rows={4}
          value={form.notes}
          onChange={(e) => setField('notes', e.target.value)}
          placeholder={t('common.notesPlaceholder', { defaultValue: 'Ajouter des notes...' })}
          className={`${inputCls} resize-none`}
        />
      </section>

      {/* Audit metadata */}
      <AuditMetadataPanel
        confirmedByName={data.confirmedByName}
        confirmedAt={data.confirmedAt}
        lastEditedBy={data.lastEditedByName}
        lastEditedAt={data.lastEditedAt}
      />

      {/* Action buttons */}
      <div className="flex gap-3 justify-between">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-50"
          >
            ← {t('common.back', { defaultValue: 'Retour' })}
          </button>
        )}
        <div className="flex gap-3 ml-auto">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaving || isConfirming}
          >
            💾 {t('step5.sauvegarder', { defaultValue: 'Sauvegarder le brouillon' })}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            isLoading={isConfirming}
            disabled={isSaving || isConfirming}
          >
            {t('step5.confirmer', { defaultValue: 'Confirmer et continuer' })} →
          </Button>
        </div>
      </div>
    </div>
  );
};

export { StepRisqueFinancierView };
