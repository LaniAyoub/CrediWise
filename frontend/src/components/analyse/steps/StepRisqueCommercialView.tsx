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
    nbSalariesPermanents: (data as any).nbSalariesPermanents ?? '',
    nbSalariesFamiliaux: (data as any).nbSalariesFamiliaux ?? '',
    nbSalariesSaisonniers: (data as any).nbSalariesSaisonniers ?? '',
    nbTotalPointsDeVente: (data as any).nbTotalPointsDeVente ?? '',
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
    
    listeExclusionAdvans: data.listeExclusionAdvans ?? null,
    regleAlcoolTabac: data.regleAlcoolTabac ?? null,
    regleMedicamentsNonReglementes: data.regleMedicamentsNonReglementes ?? null,
    travailForceOuEnfants: data.travailForceOuEnfants ?? null,
    risqueSanteSecuriteEmployes: data.risqueSanteSecuriteEmployes ?? null,
    impactNegatifEnvironnement: data.impactNegatifEnvironnement ?? null,
    activiteVulnerableClimat: data.activiteVulnerableClimat ?? null,
    activiteZoneExposeeClimat: data.activiteZoneExposeeClimat ?? null,
    exigencesLegalesSpecifiques: data.exigencesLegalesSpecifiques ?? '',
    clientConformite: data.clientConformite ?? null,
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

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 600) + 'px';
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
      
      listeExclusionAdvans: form.listeExclusionAdvans,
      regleAlcoolTabac: form.regleAlcoolTabac,
      regleMedicamentsNonReglementes: form.regleMedicamentsNonReglementes,
      travailForceOuEnfants: form.travailForceOuEnfants,
      risqueSanteSecuriteEmployes: form.risqueSanteSecuriteEmployes,
      impactNegatifEnvironnement: form.impactNegatifEnvironnement,
      activiteVulnerableClimat: form.activiteVulnerableClimat,
      activiteZoneExposeeClimat: form.activiteZoneExposeeClimat,
      exigencesLegalesSpecifiques: form.exigencesLegalesSpecifiques || null,
      clientConformite: form.clientConformite,
      
      ...(form as any).nbSalariesPermanents !== '' && { nbSalariesPermanents: Number((form as any).nbSalariesPermanents) },
      ...(form as any).nbSalariesFamiliaux !== '' && { nbSalariesFamiliaux: Number((form as any).nbSalariesFamiliaux) },
      ...(form as any).nbSalariesSaisonniers !== '' && { nbSalariesSaisonniers: Number((form as any).nbSalariesSaisonniers) },
      ...(form as any).nbTotalPointsDeVente !== '' && { nbTotalPointsDeVente: Number((form as any).nbTotalPointsDeVente) },
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, saveRef]);

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
          className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
            value === v
              ? 'bg-green-600 border-green-600 text-white shadow-md'
              : 'bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-green-400 dark:hover:border-green-400'
          }`}
        >
          {v ? t('common.yes') : t('common.no')}
        </button>
      ))}
    </div>
  );

  const YesNoNaToggle = ({
    value,
    onChange,
  }: {
    value: string | null;
    onChange: (v: string) => void;
  }) => (
    <div className="flex gap-2">
      {(['OUI', 'NON', 'NA'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
            value === v
              ? 'bg-green-600 border-green-600 text-white shadow-md'
              : 'bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-green-400 dark:hover:border-green-400'
          }`}
        >
          {v === 'OUI' ? t('common.yes') : v === 'NON' ? t('common.no') : 'NA'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Conformite PSE section moved below Section 2 */}

      {/* ── Section 1: Information Activités ──────────────────────────────────── */}
      <section className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
          {t('step4.sectionInfoActivites')}
        </h2>

        {/* First row: Experience fields (larger) */}
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

        {/* Second row: Employees & sales points (compact number inputs) - 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Nb salariés permanents */}
          <div>
            <label className={labelCls}>{t('step4.nbSalariesPermanents')}</label>
            <input
              type="number"
              min={0}
              value={(form as any).nbSalariesPermanents}
              onChange={(e) => setField('nbSalariesPermanents' as any, e.target.value as never)}
              placeholder="0"
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Dont salariés familiaux */}
          <div>
            <label className={labelCls}>{t('step4.nbSalariesFamiliaux')}</label>
            <input
              type="number"
              min={0}
              value={(form as any).nbSalariesFamiliaux}
              onChange={(e) => setField('nbSalariesFamiliaux' as any, e.target.value as never)}
              placeholder="0"
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Nb salariés saisonniers */}
          <div>
            <label className={labelCls}>{t('step4.nbSalariesSaisonniers')}</label>
            <input
              type="number"
              min={0}
              value={(form as any).nbSalariesSaisonniers}
              onChange={(e) => setField('nbSalariesSaisonniers' as any, e.target.value as never)}
              placeholder="0"
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Nb total points de vente */}
          <div>
            <label className={labelCls}>{t('step4.nbTotalPointsDeVente')}</label>
            <input
              type="number"
              min={0}
              value={(form as any).nbTotalPointsDeVente}
              onChange={(e) => setField('nbTotalPointsDeVente' as any, e.target.value as never)}
              placeholder="0"
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Third row: Yes/No toggles */}
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
            onInput={handleTextareaInput}
            placeholder={t('step4.descriptionActiviteAnalysePlaceholder')}
            className={`${inputCls} resize-none`}
          />
        </div>
      </section>

      {/* ── Section 3: Conformite Avec la PSE, Les taxes et la reglementation ── */}
      <section className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6 space-y-6">
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
          {t('step4.conformitePse')}
        </h2>

        {/* 1. Risque environnemental et social */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-surface-800 dark:text-surface-100 border-b border-surface-200 dark:border-surface-700 pb-2">
            {t('step4.risqueES')}
          </h3>
          
          {/* Niveau de risque secteur */}
          <div className="flex items-center gap-4 py-2">
            <span className="text-sm text-surface-600 dark:text-surface-400">{t('step4.niveauRisqueSecteur')}</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase ${
              data.ifcLevelOfRisk?.toLowerCase() === 'elevé' || data.ifcLevelOfRisk?.toLowerCase() === 'eleve' || data.ifcLevelOfRisk?.toLowerCase() === 'high'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                : data.ifcLevelOfRisk?.toLowerCase() === 'medium' || data.ifcLevelOfRisk?.toLowerCase() === 'moyen'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400'
            }`}>
              {data.ifcLevelOfRisk || t('step4.nonRenseigne')}
            </span>
            {(data.ifcLevelOfRisk?.toLowerCase() === 'elevé' || data.ifcLevelOfRisk?.toLowerCase() === 'eleve' || data.ifcLevelOfRisk?.toLowerCase() === 'high') && (
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 animate-pulse">
                ⚠️ {t('step4.analyseObligatoireES')}
              </span>
            )}
          </div>

          {/* Liste Exclusion */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-surface-700 dark:text-surface-300">{t('step4.listeExclusion')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center bg-surface-50 dark:bg-surface-800/50 p-3 rounded-lg">
              <span className="text-xs text-surface-700 dark:text-surface-300">{t('step4.q_listeExclusionAdvans')}</span>
              <YesNoToggle value={form.listeExclusionAdvans} onChange={(v) => setField('listeExclusionAdvans', v)} />
              
              <span className="text-xs text-surface-700 dark:text-surface-300">{t('step4.q_regleAlcoolTabac')}</span>
              <YesNoNaToggle value={form.regleAlcoolTabac} onChange={(v) => setField('regleAlcoolTabac', v)} />
              
              <span className="text-xs text-surface-700 dark:text-surface-300">{t('step4.q_regleMedicamentsNonReglementes')}</span>
              <YesNoNaToggle value={form.regleMedicamentsNonReglementes} onChange={(v) => setField('regleMedicamentsNonReglementes', v)} />
            </div>
          </div>

          {/* Autres Risques E&S */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-surface-700 dark:text-surface-300">{t('step4.autresRisquesES')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center bg-surface-50 dark:bg-surface-800/50 p-3 rounded-lg">
              <span className="text-xs text-surface-700 dark:text-surface-300">{t('step4.q_travailForceOuEnfants')}</span>
              <YesNoToggle value={form.travailForceOuEnfants} onChange={(v) => setField('travailForceOuEnfants', v)} />
              
              <span className="text-xs text-surface-700 dark:text-surface-300">{t('step4.q_risqueSanteSecuriteEmployes')}</span>
              <YesNoToggle value={form.risqueSanteSecuriteEmployes} onChange={(v) => setField('risqueSanteSecuriteEmployes', v)} />
              
              <span className="text-xs text-surface-700 dark:text-surface-300">{t('step4.q_impactNegatifEnvironnement')}</span>
              <YesNoToggle value={form.impactNegatifEnvironnement} onChange={(v) => setField('impactNegatifEnvironnement', v)} />
            </div>
          </div>

          {/* Questions climatiques */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-surface-700 dark:text-surface-300">{t('step4.questionsClimatiques')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center bg-surface-50 dark:bg-surface-800/50 p-3 rounded-lg">
              <span className="text-xs text-surface-700 dark:text-surface-300">{t('step4.q_activiteVulnerableClimat')}</span>
              <YesNoToggle value={form.activiteVulnerableClimat} onChange={(v) => setField('activiteVulnerableClimat', v)} />
              
              <span className="text-xs text-surface-700 dark:text-surface-300">{t('step4.q_activiteZoneExposeeClimat')}</span>
              <YesNoToggle value={form.activiteZoneExposeeClimat} onChange={(v) => setField('activiteZoneExposeeClimat', v)} />
            </div>
          </div>
        </div>

        {/* 2. Exigences Légales */}
        <div className="space-y-4 pt-4 border-t border-surface-200 dark:border-surface-700">
          <h3 className="text-sm font-medium text-surface-800 dark:text-surface-100">
            {t('step4.exigencesLegales')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>{t('step4.exigencesLegalesSpecifiques')}</label>
              <textarea
                rows={2}
                value={form.exigencesLegalesSpecifiques}
                onChange={(e) => setField('exigencesLegalesSpecifiques', e.target.value)}
                onInput={handleTextareaInput}
                placeholder={t('step4.exigencesLegalesSpecifiquesPlaceholder')}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className={labelCls}>{t('step4.q_clientConformite')}</label>
              <YesNoToggle value={form.clientConformite} onChange={(v) => setField('clientConformite', v)} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Audit panel ───────────────────────────────────────────────────────── */}
      <AuditMetadataPanel
        confirmedByName={data.confirmedByName}
        confirmedAt={data.confirmedAt}
        lastEditedBy={data.lastEditedByName}
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
