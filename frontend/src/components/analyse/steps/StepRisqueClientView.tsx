import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { analyseService, handleAnalyseError } from '@/services/analyseService';
import type { StepRisqueClientData, StepRisqueClientRequest, EnqueteMoralite } from '@/types/analyse';
import {
  step3Schema,
  type Step3FormValues,
  SITUATIONS_FAMILIALES,
  SITUATIONS_LOGEMENT,
  SITUATION_FAMILIALE_LABELS,
  SITUATION_LOGEMENT_LABELS,
  NOTE_RISQUE_CONFIG,
} from './step3Schema';
import AuditMetadataPanel from '@/components/analyse/AuditMetadataPanel';
import Button from '@/components/ui/Button';

interface StepRisqueClientViewProps {
  dossierId: number;
  initialData: StepRisqueClientData;
  onSaved?: (data: StepRisqueClientData) => void;
  onConfirmed: (data: StepRisqueClientData) => void;
  onPrevious?: () => void;
  onBack?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  saveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

const defaultRef = { prenom: '', nom: '', telephone: '', lienParente: '' };
const defaultEnquete = { lienAvecClient: '', contact: '', nomComplet: '', idAmplitude: '', amplitude: '', opinion: '' };
const defaultPret = {
  nomInstitution: '', objet: '', dureeEnMois: 0,
  montantInitial: 0, encoursSolde: 0, montantEcheance: 0,
  nombreEcheancesRestantes: 0, nombreEcheancesRetard: 0, joursRetardMax: 0,
};

function toFormValues(data: StepRisqueClientData): Step3FormValues {
  return {
    // Selects: use '' for null/undefined so the empty <option value=""> round-trips correctly
    situationFamiliale: (data.situationFamiliale ?? '') as Step3FormValues['situationFamiliale'],
    situationLogement: (data.situationLogement ?? '') as Step3FormValues['situationLogement'],
    noteCentraleRisque: (data.noteCentraleRisque ?? '') as Step3FormValues['noteCentraleRisque'],
    // Numbers: use null so setValueAs(null) → null, matching the RHF stored value
    dureeSejour: data.dureeSejour ?? null,
    ancienneteQuartier: data.ancienneteQuartier ?? null,
    nombrePersonnesCharge: data.nombrePersonnesCharge ?? null,
    nombreEnfants: data.nombreEnfants ?? null,
    nombreCreditsAnterieurs: data.nombreCreditsAnterieurs ?? null,
    // Checkbox: use false so unchecked checkbox (false) round-trips correctly
    estGarant: data.estGarant ?? false,
    referenceFamiliales: (data.referenceFamiliales ?? data.references ?? []).length > 0
      ? (data.referenceFamiliales ?? data.references ?? []).map(r => ({ ...r }))
      : [{ ...defaultRef }],
    enquetesMoralite: (data.enquetesMoralite ?? data.enquetes ?? []).map((e: EnqueteMoralite) => ({
      lienAvecClient: e.lienAvecClient,
      contact: e.contact,
      nomComplet: e.nomComplet,
      idAmplitude: (e as EnqueteMoralite & { idAmplitude?: string }).idAmplitude ?? '',
      amplitude: e.amplitude ?? '',
      opinion: e.opinion,
    })),
    avisComite: data.avisComite ?? '',
    pretsCours: data.pretsCours.map(p => ({
      id: p.id,
      nomInstitution: p.nomInstitution ?? '',
      objet: p.objet ?? '',
      dureeEnMois: p.dureeEnMois ?? 0,
      montantInitial: p.montantInitial ?? 0,
      encoursSolde: p.encoursSolde ?? 0,
      montantEcheance: p.montantEcheance ?? 0,
      nombreEcheancesRestantes: p.nombreEcheancesRestantes ?? 0,
      nombreEcheancesRetard: p.nombreEcheancesRetard ?? 0,
      joursRetardMax: p.joursRetardMax ?? 0,
    })),
    analyseCredit: data.analyseCredit ?? '',
    comptesBancaires: (data.comptesBancaires ?? []).map(c => ({
      id: c.id,
      banqueImf: c.banqueImf ?? '',
      typeCompte: c.typeCompte ?? '',
      solde: c.solde ?? null,
    })),
    analyseComptes: data.analyseComptes ?? '',
  };
}

function toRequest(values: Step3FormValues): StepRisqueClientRequest {
  return {
    // Selects: '' means no selection → send undefined
    situationFamiliale: (values.situationFamiliale || undefined) as StepRisqueClientRequest['situationFamiliale'],
    situationLogement: (values.situationLogement || undefined) as StepRisqueClientRequest['situationLogement'],
    noteCentraleRisque: (values.noteCentraleRisque || undefined) as StepRisqueClientRequest['noteCentraleRisque'],
    // Numbers: null from empty input → send undefined
    dureeSejour: values.dureeSejour ?? undefined,
    ancienneteQuartier: values.ancienneteQuartier ?? undefined,
    nombrePersonnesCharge: values.nombrePersonnesCharge ?? undefined,
    nombreEnfants: values.nombreEnfants ?? undefined,
    nombreCreditsAnterieurs: values.nombreCreditsAnterieurs ?? undefined,
    estGarant: values.estGarant ?? undefined,
    referenceFamiliales: values.referenceFamiliales,
    enquetesMoralite: values.enquetesMoralite.map(e => ({
      ...e,
      idAmplitude: e.idAmplitude || undefined,
      amplitude: e.amplitude || undefined,
    })),
    avisComite: values.avisComite || undefined,
    pretsCours: values.pretsCours,
    analyseCredit: values.analyseCredit || undefined,
    comptesBancaires: values.comptesBancaires,
    analyseComptes: values.analyseComptes || undefined,
  };
}

const inputClass =
  'w-full px-3 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500';

const labelClass =
  'block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1 uppercase tracking-wide';

const StepRisqueClientView: React.FC<StepRisqueClientViewProps> = ({
  dossierId,
  initialData,
  onSaved,
  onConfirmed,
  onPrevious,
  onBack,
  onDirtyChange,
  saveRef,
}) => {
  const { t } = useTranslation('analyse');
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [serverData, setServerData] = useState(initialData);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<Step3FormValues>({
    resolver: zodResolver(step3Schema),
    defaultValues: toFormValues(initialData),
  });

  const refsField = useFieldArray({ control, name: 'referenceFamiliales' });
  const enquetesField = useFieldArray({ control, name: 'enquetesMoralite' });
  const pretsField = useFieldArray({ control, name: 'pretsCours' });
  const comptesField = useFieldArray({ control, name: 'comptesBancaires' });

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  // saveRef triggers a draft save when navigating away — only set when dirty
  useEffect(() => {
    if (!saveRef) return;
    if (!isDirty) {
      saveRef.current = null;
      return;
    }
    saveRef.current = async () => {
      await handleSubmit(async (values) => {
        setSaving(true);
        try {
          const result = await analyseService.saveStep3(dossierId, toRequest(values));
          setServerData(result.data);
          reset(toFormValues(result.data));
          onSaved?.(result.data);
        } catch (e) {
          toast.error(handleAnalyseError(e));
          throw e;
        } finally {
          setSaving(false);
        }
      })();
    };
  }, [isDirty, handleSubmit, dossierId, saveRef, reset]);

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 600) + 'px';
  };

  const handleSave = handleSubmit(async (values) => {
    setSaving(true);
    try {
      const result = await analyseService.saveStep3(dossierId, toRequest(values));
      setServerData(result.data);
      reset(toFormValues(result.data));
      toast.success(t('step3.savedSuccess'));
      onSaved?.(result.data);
    } catch (e) {
      toast.error(handleAnalyseError(e));
    } finally {
      setSaving(false);
    }
  });

  const handleConfirm = handleSubmit(async (values) => {
    setConfirming(true);
    try {
      const result = await analyseService.confirmStep3(dossierId, toRequest(values));
      setServerData(result.data);
      reset(toFormValues(result.data));
      toast.success(t('step3.confirmedSuccess'));
      onConfirmed(result.data);
    } catch (e) {
      toast.error(handleAnalyseError(e));
    } finally {
      setConfirming(false);
    }
  });

  const handleCancel = () => reset(toFormValues(serverData));

  const isConfirmed = serverData.isComplete ?? serverData.isConfirmed ?? false;
  const watchedEstGarant = watch('estGarant');

  const SectionCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
    icon, title, children,
  }) => (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-100 dark:border-surface-700/60">
        <span className="text-surface-400 dark:text-surface-500 flex-shrink-0">{icon}</span>
        <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  const FieldErr: React.FC<{ msg?: string }> = ({ msg }) =>
    msg ? <p className="text-xs text-rose-500 mt-1">{msg}</p> : null;

  const getErr = (path: string): string | undefined => {
    const parts = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cur: any = errors;
    for (const p of parts) cur = cur?.[p];
    return cur?.message as string | undefined;
  };

  return (
    <div className="space-y-5">

      {/* ── Section 1: Stabilité et situation familiale ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <svg className="w-5 h-5 text-surface-600 dark:text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50">{t('step3.section1')}</h2>
        </div>

        {/* Subsection 1.1: Situation du client | Subsection 1.2: Références familiales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Situation du client */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-700/60">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">{t('step3.section1_1')}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelClass}>{t('step3.situationFamiliale')} *</label>
                <select {...register('situationFamiliale')} className={inputClass}>
                  <option value="">—</option>
                  {SITUATIONS_FAMILIALES.map((v) => (
                    <option key={v} value={v}>{SITUATION_FAMILIALE_LABELS[v]}</option>
                  ))}
                </select>
                <FieldErr msg={errors.situationFamiliale?.message} />
              </div>
              <div>
                <label className={labelClass}>{t('step3.situationLogement')} *</label>
                <select {...register('situationLogement')} className={inputClass}>
                  <option value="">—</option>
                  {SITUATIONS_LOGEMENT.map((v) => (
                    <option key={v} value={v}>{SITUATION_LOGEMENT_LABELS[v]}</option>
                  ))}
                </select>
                <FieldErr msg={errors.situationLogement?.message} />
              </div>
              <div>
                <label className={labelClass}>{t('step3.dureeSejour')}</label>
                <input type="number" min="0" {...register('dureeSejour', { setValueAs: (v) => v === '' || v == null ? null : Number(v) })} className={inputClass} />
                <FieldErr msg={errors.dureeSejour?.message} />
              </div>
              <div>
                <label className={labelClass}>{t('step3.ancienneteQuartier')}</label>
                <input type="number" min="0" {...register('ancienneteQuartier', { setValueAs: (v) => v === '' || v == null ? null : Number(v) })} className={inputClass} />
                <FieldErr msg={errors.ancienneteQuartier?.message} />
              </div>
              <div>
                <label className={labelClass}>{t('step3.nombrePersonnesCharge')}</label>
                <input type="number" min="0" {...register('nombrePersonnesCharge', { setValueAs: (v) => v === '' || v == null ? null : Number(v) })} className={inputClass} />
                <FieldErr msg={errors.nombrePersonnesCharge?.message} />
              </div>
              <div>
                <label className={labelClass}>{t('step3.nombreEnfants')}</label>
                <input type="number" min="0" {...register('nombreEnfants', { setValueAs: (v) => v === '' || v == null ? null : Number(v) })} className={inputClass} />
                <FieldErr msg={errors.nombreEnfants?.message} />
              </div>
            </div>
          </div>

          {/* Références familiales — Table view */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-700/60">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                {t('step3.section1_2')}
              </h3>
              <button
                type="button"
                onClick={() => refsField.append({ ...defaultRef })}
                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                + {t('step3.addReference')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-700/50">
                    <th className="text-left text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">{t('step3.prenom')} *</th>
                    <th className="text-left text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">{t('step3.nom')} *</th>
                    <th className="text-left text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">{t('step3.telephone')} *</th>
                    <th className="text-left text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">{t('step3.lienParente')} *</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {refsField.fields.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-surface-500 dark:text-surface-400 italic">{t('step3.noReferences')}</td></tr>
                  ) : (
                    refsField.fields.map((field, i) => (
                      <tr key={field.id} className="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                        <td className="px-4 py-3">
                          <input type="text" {...register(`referenceFamiliales.${i}.prenom`)} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          {getErr(`referenceFamiliales.${i}.prenom`) && <p className="text-xs text-rose-500 mt-1">{getErr(`referenceFamiliales.${i}.prenom`)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <input type="text" {...register(`referenceFamiliales.${i}.nom`)} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          {getErr(`referenceFamiliales.${i}.nom`) && <p className="text-xs text-rose-500 mt-1">{getErr(`referenceFamiliales.${i}.nom`)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <input type="text" {...register(`referenceFamiliales.${i}.telephone`)} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          {getErr(`referenceFamiliales.${i}.telephone`) && <p className="text-xs text-rose-500 mt-1">{getErr(`referenceFamiliales.${i}.telephone`)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <input type="text" {...register(`referenceFamiliales.${i}.lienParente`)} placeholder={t('step3.lienParentePlaceholder')} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          {getErr(`referenceFamiliales.${i}.lienParente`) && <p className="text-xs text-rose-500 mt-1">{getErr(`referenceFamiliales.${i}.lienParente`)}</p>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => refsField.remove(i)}
                            disabled={refsField.fields.length <= 1}
                            className={`inline-flex items-center justify-center text-surface-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors ${refsField.fields.length <= 1 ? 'cursor-not-allowed opacity-50' : ''}`}
                            aria-label="Supprimer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Moralité et transparence ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <svg className="w-5 h-5 text-surface-600 dark:text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50">{t('step3.section2')}</h2>
        </div>

        {/* Enquêtes de réputation — Table view */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-700/60">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
              {t('step3.section2_1')}
            </h3>
            <button
              type="button"
              onClick={() => enquetesField.append({ ...defaultEnquete })}
              className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              + {t('step3.addEnquete')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-700/50">
                  <th className="text-left text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">{t('step3.lienAvecClient')} *</th>
                  <th className="text-left text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">{t('step3.contact')} *</th>
                  <th className="text-left text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">{t('step3.nomComplet')} *</th>
                  <th className="text-left text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">{t('step3.amplitude')}</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {enquetesField.fields.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-surface-500 dark:text-surface-400 italic">{t('step3.noEnquetes')}</td></tr>
                ) : (
                  enquetesField.fields.map((field, i) => (
                    <React.Fragment key={field.id}>
                      <tr className="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                        <td className="px-4 py-3">
                          <input type="text" {...register(`enquetesMoralite.${i}.lienAvecClient`)} placeholder={t('step3.lienAvecClientPlaceholder')} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          {getErr(`enquetesMoralite.${i}.lienAvecClient`) && <p className="text-xs text-rose-500 mt-1">{getErr(`enquetesMoralite.${i}.lienAvecClient`)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <input type="text" {...register(`enquetesMoralite.${i}.contact`)} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          {getErr(`enquetesMoralite.${i}.contact`) && <p className="text-xs text-rose-500 mt-1">{getErr(`enquetesMoralite.${i}.contact`)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <input type="text" {...register(`enquetesMoralite.${i}.nomComplet`)} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          {getErr(`enquetesMoralite.${i}.nomComplet`) && <p className="text-xs text-rose-500 mt-1">{getErr(`enquetesMoralite.${i}.nomComplet`)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <input type="text" {...register(`enquetesMoralite.${i}.amplitude`)} placeholder={t('step3.amplitudePlaceholder')} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          {getErr(`enquetesMoralite.${i}.amplitude`) && <p className="text-xs text-rose-500 mt-1">{getErr(`enquetesMoralite.${i}.amplitude`)}</p>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => enquetesField.remove(i)}
                            className="inline-flex items-center justify-center text-surface-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            aria-label="Supprimer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                      {/* Opinion row — full width below the table row */}
                      <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-700/30">
                        <td colSpan={5} className="px-4 py-3">
                          <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-2 uppercase tracking-wide">{t('step3.opinion')} *</label>
                          <textarea {...register(`enquetesMoralite.${i}.opinion`)} rows={2} onInput={handleTextareaInput} className="w-full px-3 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                          {getErr(`enquetesMoralite.${i}.opinion`) && <p className="text-xs text-rose-500 mt-1">{getErr(`enquetesMoralite.${i}.opinion`)}</p>}
                          <input type="hidden" {...register(`enquetesMoralite.${i}.idAmplitude`)} />
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Avis CC sub-section inside Moralité et transparence */}
          <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg border border-surface-100 dark:border-surface-600 p-4">
            <label className={labelClass}>{t('step3.avisComite')}</label>
            <textarea
              {...register('avisComite')}
              rows={4}
              onInput={handleTextareaInput}
              placeholder={t('step3.avisComitePlaceholder')}
              className={inputClass + ' resize-none'}
            />
            <FieldErr msg={errors.avisComite?.message} />
          </div>
        </div>
      </div>

      {/* ── Section 3: Historique crédit ── */}
      <SectionCard
        icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        title={t('step3.sectionAnalyseRisque')}
      >
        <div className="space-y-4">
          <div>
            <label className={labelClass}>{t('step3.nombreCreditsAnterieurs')}</label>
            <input type="number" min="0" {...register('nombreCreditsAnterieurs', { setValueAs: (v) => v === '' || v == null ? null : Number(v) })} className={inputClass} />
            <FieldErr msg={errors.nombreCreditsAnterieurs?.message} />
          </div>
          <div>
            <label className={labelClass}>{t('step3.noteCentraleRisque')}</label>
            <select {...register('noteCentraleRisque')} className={inputClass}>
              <option value="">— {t('step3.noteCentraleRisqueNone')}</option>
              {Object.entries(NOTE_RISQUE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <FieldErr msg={errors.noteCentraleRisque?.message} />
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('estGarant')}
                className="w-4 h-4 rounded border-surface-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-surface-700 dark:text-surface-300">
                {t('step3.estGarant')}
              </span>
            </label>
            {watchedEstGarant !== undefined && (
              <span className={`ml-3 text-xs font-medium px-2 py-0.5 rounded-full ${
                watchedEstGarant
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
              }`}>
                {watchedEstGarant ? t('common.yes') : t('common.no')}
              </span>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Section 4 & 5: Liste crédits en cours ou récents ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <svg className="w-5 h-5 text-surface-600 dark:text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50">{t('step3.sectionPretsCours')}</h2>
        </div>

        {/* Combined card for Credits and Analysis */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
          {/* Credits section */}
          <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-700/60">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                {t('step3.sectionPretsCours')}
              </h3>
              <button
                type="button"
                onClick={() => pretsField.append({ ...defaultPret })}
                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                + {t('step3.addPret')}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-700/50">
                  <th className="text-left text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">{t('step3.nomInstitution')} *</th>
                  <th className="text-left text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">{t('step3.objetPret')} *</th>
                  <th className="text-right text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">{t('step3.dureeEnMois')} *</th>
                  <th className="text-right text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">{t('step3.encoursSolde')}</th>
                  <th className="text-right text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">{t('step3.montantEcheance')}</th>
                  <th className="text-right text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">{t('step3.echeancesRetard')}</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {pretsField.fields.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-surface-500 dark:text-surface-400 italic">{t('step3.noPrets')}</td></tr>
                ) : (
                  pretsField.fields.map((field, i) => (
                    <React.Fragment key={field.id}>
                      <tr className="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                        <td className="px-4 py-3">
                          <input type="text" {...register(`pretsCours.${i}.nomInstitution`)} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          {getErr(`pretsCours.${i}.nomInstitution`) && <p className="text-xs text-rose-500 mt-1">{getErr(`pretsCours.${i}.nomInstitution`)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <input type="text" {...register(`pretsCours.${i}.objet`)} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          {getErr(`pretsCours.${i}.objet`) && <p className="text-xs text-rose-500 mt-1">{getErr(`pretsCours.${i}.objet`)}</p>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input type="number" min="1" {...register(`pretsCours.${i}.dureeEnMois`, { valueAsNumber: true })} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          {getErr(`pretsCours.${i}.dureeEnMois`) && <p className="text-xs text-rose-500 mt-1">{getErr(`pretsCours.${i}.dureeEnMois`)}</p>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input type="number" step="0.01" min="0" {...register(`pretsCours.${i}.encoursSolde`, { valueAsNumber: true })} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          {getErr(`pretsCours.${i}.encoursSolde`) && <p className="text-xs text-rose-500 mt-1">{getErr(`pretsCours.${i}.encoursSolde`)}</p>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input type="number" step="0.01" min="0" {...register(`pretsCours.${i}.montantEcheance`, { valueAsNumber: true })} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          {getErr(`pretsCours.${i}.montantEcheance`) && <p className="text-xs text-rose-500 mt-1">{getErr(`pretsCours.${i}.montantEcheance`)}</p>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input type="number" min="0" {...register(`pretsCours.${i}.nombreEcheancesRetard`, { valueAsNumber: true })} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          {getErr(`pretsCours.${i}.nombreEcheancesRetard`) && <p className="text-xs text-rose-500 mt-1">{getErr(`pretsCours.${i}.nombreEcheancesRetard`)}</p>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => pretsField.remove(i)}
                            className="inline-flex items-center justify-center text-surface-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            aria-label="Supprimer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                      {/* Expanded details row */}
                      <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-700/30">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1 uppercase tracking-wide">{t('step3.montantInitial')}</label>
                              <input type="number" step="0.01" min="0" {...register(`pretsCours.${i}.montantInitial`, { valueAsNumber: true })} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                              {getErr(`pretsCours.${i}.montantInitial`) && <p className="text-xs text-rose-500 mt-1">{getErr(`pretsCours.${i}.montantInitial`)}</p>}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1 uppercase tracking-wide">{t('step3.echeancesRestantes')}</label>
                              <input type="number" min="0" {...register(`pretsCours.${i}.nombreEcheancesRestantes`, { valueAsNumber: true })} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                              {getErr(`pretsCours.${i}.nombreEcheancesRestantes`) && <p className="text-xs text-rose-500 mt-1">{getErr(`pretsCours.${i}.nombreEcheancesRestantes`)}</p>}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1 uppercase tracking-wide">{t('step3.joursRetardMax')}</label>
                              <input type="number" min="0" {...register(`pretsCours.${i}.joursRetardMax`, { valueAsNumber: true })} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                              {getErr(`pretsCours.${i}.joursRetardMax`) && <p className="text-xs text-rose-500 mt-1">{getErr(`pretsCours.${i}.joursRetardMax`)}</p>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Analyse crédit sub-section */}
          <div className="p-6 border-t border-surface-200 dark:border-surface-700">
            <label className={labelClass}>{t('step3.sectionAnalyseCredit')}</label>
            <textarea
              {...register('analyseCredit')}
              rows={4}
              onInput={handleTextareaInput}
              placeholder={t('step3.analyseCreditPlaceholder')}
              className={inputClass + ' resize-none'}
            />
            <FieldErr msg={errors.analyseCredit?.message} />
          </div>
        </div>
      </div>

      {/* ── Section 6: Compte Bancaire Du Client ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <svg className="w-5 h-5 text-surface-600 dark:text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50">Compte Bancaire Du Client</h2>
        </div>

        {/* Combined card for Comptes, Total, and Analysis */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
          {/* Comptes section */}
          <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-700/60">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                Comptes Bancaires
              </h3>
              <button
                type="button"
                onClick={() => comptesField.append({ banqueImf: '', typeCompte: '', solde: null })}
                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                + Ajouter un compte
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-700/50">
                  <th className="text-left text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">Banque / IMF *</th>
                  <th className="text-left text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">Type de compte *</th>
                  <th className="text-right text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3">Solde (DT)</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {comptesField.fields.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-surface-500 dark:text-surface-400 italic">{t('step3.noComptes')}</td></tr>
                ) : (
                  comptesField.fields.map((field, i) => (
                    <tr key={field.id} className="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <input type="text" {...register(`comptesBancaires.${i}.banqueImf`)} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        {getErr(`comptesBancaires.${i}.banqueImf`) && <p className="text-xs text-rose-500 mt-1">{getErr(`comptesBancaires.${i}.banqueImf`)}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" {...register(`comptesBancaires.${i}.typeCompte`)} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        {getErr(`comptesBancaires.${i}.typeCompte`) && <p className="text-xs text-rose-500 mt-1">{getErr(`comptesBancaires.${i}.typeCompte`)}</p>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input type="number" step="0.01" min="0" {...register(`comptesBancaires.${i}.solde`, { valueAsNumber: true })} className="w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        {getErr(`comptesBancaires.${i}.solde`) && <p className="text-xs text-rose-500 mt-1">{getErr(`comptesBancaires.${i}.solde`)}</p>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => comptesField.remove(i)}
                          className="inline-flex items-center justify-center text-surface-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          aria-label="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Total Solde and Analysis section */}
          <div className="p-6 space-y-4 border-t border-surface-200 dark:border-surface-700">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 p-4">
              <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                Total Solde:
                <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-2">
                  {(watch('comptesBancaires') || [])
                    .reduce((sum, compte) => sum + (compte.solde || 0), 0)
                    .toFixed(2)} DT
                </span>
              </p>
            </div>

            {/* Analyse description sub-section */}
            <div>
              <label className={labelClass}>Analyse de l'utilisation des comptes par le client</label>
              <textarea
                {...register('analyseComptes')}
                rows={4}
                onInput={handleTextareaInput}
                placeholder={t('step3.analyseComptesPlaceholder')}
                className={inputClass + ' resize-none'}
              />
              <FieldErr msg={errors.analyseComptes?.message} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Audit Panel ── */}
      {(serverData.confirmedAt || serverData.confirmedByName || serverData.lastEditedAt) && (
        <AuditMetadataPanel
          confirmedAt={serverData.confirmedAt}
          confirmedByName={serverData.confirmedByName}
          lastEditedAt={serverData.lastEditedAt}
          lastEditedBy={serverData.lastEditedByName}
        />
      )}

      {/* ── Action Buttons ── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          {(onPrevious || onBack) && (
            <Button variant="outline" onClick={onPrevious || onBack}>
              ← {t('common.back')}
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          {isDirty && (
            <Button variant="outline" onClick={handleCancel} disabled={saving || confirming}>
              {t('common.cancel')}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving || confirming}
          >
            {saving ? t('common.saving') : t('step3.sauvegarder')}
          </Button>

          {isConfirmed && isDirty ? (
            <Button onClick={handleConfirm} disabled={saving || confirming}>
              {confirming ? t('step3.confirming') : t('common.saveChanges')}
            </Button>
          ) : !isConfirmed ? (
            <Button onClick={handleConfirm} disabled={saving || confirming}>
              {confirming ? t('step3.confirming') : t('step3.confirmer')}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default StepRisqueClientView;
