import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { analyseService, handleAnalyseError } from '@/services/analyseService';
import type { StepRisqueCommercialData, StepRisqueCommercialRequest, PointDeVenteDto } from '@/types/analyse';
import AuditMetadataPanel from '@/components/analyse/AuditMetadataPanel';
import Button from '@/components/ui/Button';

interface Props {
  dossierId: number;
  initialData: StepRisqueCommercialData;
  onSaved?: (data: StepRisqueCommercialData) => void;
  onConfirmed: (data: StepRisqueCommercialData) => void;
  onBack?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  saveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

const defaultPdv = (): PointDeVenteDto => ({
  type: '',
  propriete: '',
  joursOuverture: '',
  horaireOuverture: '',
  surface: null,
  emplacement: '',
});

function toFormState(data: StepRisqueCommercialData) {
  return {
    nbAnneesExperienceEmploye: data.nbAnneesExperienceEmploye ?? '',
    nbAnneesExperienceManager: data.nbAnneesExperienceManager ?? '',
    autresActivites: data.autresActivites ?? null,
    venteACredit: data.venteACredit ?? null,
    pointsDeVente: data.pointsDeVente.length > 0
      ? data.pointsDeVente.map((p) => ({
          type: p.type ?? '',
          propriete: p.propriete ?? '',
          joursOuverture: p.joursOuverture ?? '',
          horaireOuverture: p.horaireOuverture ?? '',
          surface: p.surface ?? '',
          emplacement: p.emplacement ?? '',
        }))
      : [],
    descriptionActiviteAnalyse: data.descriptionActiviteAnalyse ?? '',
  };
}

type FormState = ReturnType<typeof toFormState>;
type PdvRow = FormState['pointsDeVente'][number];

const StepRisqueCommercialView: React.FC<Props> = ({
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
  const [data, setData] = useState<StepRisqueCommercialData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

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

  const setPdvField = (index: number, key: keyof PdvRow, value: string) => {
    setForm((prev) => {
      const rows = [...prev.pointsDeVente];
      rows[index] = { ...rows[index], [key]: value };
      return { ...prev, pointsDeVente: rows };
    });
  };

  const addPdv = () => {
    setForm((prev) => ({
      ...prev,
      pointsDeVente: [...prev.pointsDeVente, { ...defaultPdv(), type: '', propriete: '', joursOuverture: '', horaireOuverture: '', surface: '', emplacement: '' }],
    }));
  };

  const removePdv = (index: number) => {
    setForm((prev) => ({
      ...prev,
      pointsDeVente: prev.pointsDeVente.filter((_, i) => i !== index),
    }));
  };

  // ── Build request ───────────────────────────────────────────────────────────

  function buildRequest(): StepRisqueCommercialRequest {
    return {
      nbAnneesExperienceEmploye: form.nbAnneesExperienceEmploye !== '' ? Number(form.nbAnneesExperienceEmploye) : null,
      nbAnneesExperienceManager: form.nbAnneesExperienceManager !== '' ? Number(form.nbAnneesExperienceManager) : null,
      autresActivites: form.autresActivites,
      venteACredit: form.venteACredit,
      pointsDeVente: form.pointsDeVente.map((row) => ({
        type: row.type,
        propriete: row.propriete,
        joursOuverture: row.joursOuverture,
        horaireOuverture: row.horaireOuverture,
        surface: row.surface !== '' && row.surface !== null ? Number(row.surface) : null,
        emplacement: row.emplacement,
      })),
      descriptionActiviteAnalyse: form.descriptionActiviteAnalyse || null,
    };
  }

  // ── Save / Confirm ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await analyseService.saveStep4(dossierId, buildRequest());
      setData(res.data);
      const next = toFormState(res.data);
      setForm(next);
      initialFormRef.current = JSON.stringify(next);
      onDirtyChange?.(false);
      onSaved?.(res.data);
      toast.success(t('step4.savedSuccess'));
    } catch (err) {
      toast.error(handleAnalyseError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const res = await analyseService.confirmStep4(dossierId, buildRequest());
      setData(res.data);
      const next = toFormState(res.data);
      setForm(next);
      initialFormRef.current = JSON.stringify(next);
      onDirtyChange?.(false);
      toast.success(t('step4.confirmedSuccess'));
      onConfirmed(res.data);
    } catch (err) {
      toast.error(handleAnalyseError(err));
    } finally {
      setIsConfirming(false);
    }
  };

  // Expose save to parent — null when clean so parent knows no dialog needed
  useEffect(() => {
    if (!saveRef) return;
    const dirty = JSON.stringify(form) !== initialFormRef.current;
    saveRef.current = dirty ? handleSave : null;
  });

  // ── Shared input class ──────────────────────────────────────────────────────
  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500';
  const labelCls = 'block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1';

  // ── Yes/No toggle ──────────────────────────────────────────────────────────
  const YesNoToggle = ({
    value,
    onChange,
  }: {
    value: boolean | null;
    onChange: (v: boolean) => void;
  }) => (
    <div className="flex gap-2">
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            value === v
              ? 'bg-primary-600 border-primary-600 text-white'
              : 'border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-primary-400'
          }`}
        >
          {v ? t('common.yes') : t('common.no')}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Section 1: Information Activités ──────────────────────────────────── */}
      <section className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
          {t('step4.sectionInfoActivites')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Nb années expérience employé */}
          <div>
            <label className={labelCls}>{t('step4.nbAnneesExperienceEmploye')}</label>
            <input
              type="number"
              min={0}
              value={form.nbAnneesExperienceEmploye}
              onChange={(e) => setField('nbAnneesExperienceEmploye', e.target.value as never)}
              placeholder="0"
              className={inputCls}
            />
          </div>

          {/* Nb années expérience manager */}
          <div>
            <label className={labelCls}>{t('step4.nbAnneesExperienceManager')}</label>
            <input
              type="number"
              min={0}
              value={form.nbAnneesExperienceManager}
              onChange={(e) => setField('nbAnneesExperienceManager', e.target.value as never)}
              placeholder="0"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Autres activités */}
          <div>
            <label className={labelCls}>{t('step4.autresActivites')}</label>
            <YesNoToggle value={form.autresActivites} onChange={(v) => setField('autresActivites', v)} />
          </div>

          {/* Vente à crédit */}
          <div>
            <label className={labelCls}>{t('step4.venteACredit')}</label>
            <YesNoToggle value={form.venteACredit} onChange={(v) => setField('venteACredit', v)} />
          </div>
        </div>
      </section>

      {/* ── Section 2: Description Activité Client – Points de vente ─────────── */}
      <section className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
            {t('step4.sectionPointsVente')}
          </h2>
        </div>

        <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300">
          {t('step4.pointsDeVenteTitle')}
        </h3>

        {/* Table */}
        {form.pointsDeVente.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-700/50 text-surface-600 dark:text-surface-400">
                  <th className="text-left px-3 py-2 font-medium border-b border-surface-200 dark:border-surface-600">{t('step4.type')}</th>
                  <th className="text-left px-3 py-2 font-medium border-b border-surface-200 dark:border-surface-600">{t('step4.propriete')}</th>
                  <th className="text-left px-3 py-2 font-medium border-b border-surface-200 dark:border-surface-600">{t('step4.joursOuverture')}</th>
                  <th className="text-left px-3 py-2 font-medium border-b border-surface-200 dark:border-surface-600">{t('step4.horaireOuverture')}</th>
                  <th className="text-left px-3 py-2 font-medium border-b border-surface-200 dark:border-surface-600">{t('step4.surface')}</th>
                  <th className="text-left px-3 py-2 font-medium border-b border-surface-200 dark:border-surface-600">{t('step4.emplacement')}</th>
                  <th className="w-10 border-b border-surface-200 dark:border-surface-600" />
                </tr>
              </thead>
              <tbody>
                {form.pointsDeVente.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-surface-100 dark:border-surface-700 last:border-0"
                  >
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={row.type}
                        onChange={(e) => setPdvField(index, 'type', e.target.value)}
                        placeholder={t('step4.typePlaceholder')}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={row.propriete}
                        onChange={(e) => setPdvField(index, 'propriete', e.target.value)}
                        placeholder={t('step4.proprietePlaceholder')}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={row.joursOuverture}
                        onChange={(e) => setPdvField(index, 'joursOuverture', e.target.value)}
                        placeholder={t('step4.joursOuverturePlaceholder')}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-1.5 w-28">
                      <input
                        type="text"
                        value={row.horaireOuverture}
                        onChange={(e) => setPdvField(index, 'horaireOuverture', e.target.value)}
                        placeholder={t('step4.horaireOuverturePlaceholder')}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-1.5 w-24">
                      <input
                        type="number"
                        min={0}
                        value={row.surface ?? ''}
                        onChange={(e) => setPdvField(index, 'surface', e.target.value)}
                        placeholder={t('step4.surfacePlaceholder')}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={row.emplacement}
                        onChange={(e) => setPdvField(index, 'emplacement', e.target.value)}
                        placeholder={t('step4.emplacementPlaceholder')}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => removePdv(index)}
                        className="text-rose-500 hover:text-rose-700 transition-colors"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-surface-500 dark:text-surface-400 italic py-2">
            {t('step4.noPointsDeVente')}
          </p>
        )}

        <button
          type="button"
          onClick={addPdv}
          className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
        >
          {t('step4.addPointDeVente')}
        </button>

        {/* Description / analyse risque commercial */}
        <div className="pt-2 border-t border-surface-200 dark:border-surface-600">
          <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            {t('step4.sectionDescription')}
          </h3>
          <textarea
            rows={5}
            value={form.descriptionActiviteAnalyse}
            onChange={(e) => setField('descriptionActiviteAnalyse', e.target.value)}
            placeholder={t('step4.descriptionActiviteAnalysePlaceholder')}
            className={`${inputCls} resize-y`}
          />
        </div>
      </section>

      {/* ── Audit panel ───────────────────────────────────────────────────────── */}
      <AuditMetadataPanel
        confirmedByName={data.confirmedByName}
        confirmedAt={data.confirmedAt}
        lastEditedBy={data.lastEditedByName ?? data.lastEditedBy}
        lastEditedAt={data.lastEditedAt}
      />

      {/* ── Action buttons ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={isSaving || isConfirming}>
            ← {t('common.back')}
          </Button>
        )}
        <div className="flex gap-3 ml-auto">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || isConfirming}
          >
            {isSaving ? t('common.saving') : t('step4.sauvegarder')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSaving || isConfirming}
          >
            {isConfirming ? t('step4.confirming') : t('step4.confirmer')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export { StepRisqueCommercialView };
