import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { analyseService, handleAnalyseError } from '@/services/analyseService';
import type { StepRisqueClientData, StepRisqueClientRequest } from '@/types/analyse';
import {
  step3Schema,
  type Step3FormValues,
  SITUATIONS_FAMILIALES,
  SITUATIONS_LOGEMENT,
  NOTES_CENTRALE_RISQUE,
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
const defaultEnquete = { lienAvecClient: '', contact: '', nomComplet: '', amplitude: '', opinion: '' };
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
    referenceFamiliales: data.referenceFamiliales.length > 0
      ? data.referenceFamiliales.map(r => ({ ...r }))
      : [{ ...defaultRef }],
    enquetesMoralite: data.enquetesMoralite.map(e => ({
      lienAvecClient: e.lienAvecClient,
      contact: e.contact,
      nomComplet: e.nomComplet,
      amplitude: e.amplitude ?? '',
      opinion: e.opinion,
    })),
    avisComite: data.avisComite ?? '',
    pretsCours: data.pretsCours.map(p => ({ ...p })),
    analyseCredit: data.analyseCredit ?? '',
    comptesBancaires: [],
    analyseComptes: undefined,
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
      amplitude: e.amplitude || undefined,
    })),
    avisComite: values.avisComite || undefined,
    pretsCours: values.pretsCours,
    analyseCredit: values.analyseCredit || undefined,
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

  const isConfirmed = serverData.isComplete;
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

      {/* ── Section 1: Situation personnelle ── */}
      <SectionCard
        icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        title={t('step3.sectionPersonnel')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </SectionCard>

      {/* ── Section 2: Références familiales ── */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-700/60">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-surface-400 dark:text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
              {t('step3.sectionReferences')}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => refsField.append({ ...defaultRef })}
            className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            + {t('step3.addReference')}
          </button>
        </div>
        <div className="p-6 space-y-4">
          {getErr('referenceFamiliales') && (
            <p className="text-sm text-rose-600 dark:text-rose-400">{getErr('referenceFamiliales')}</p>
          )}
          {refsField.fields.map((field, i) => (
            <div key={field.id} className="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">
                  {t('step3.reference')} {i + 1}
                </span>
                {refsField.fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => refsField.remove(i)}
                    className="text-surface-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                    aria-label="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t('step3.prenom')} *</label>
                  <input type="text" {...register(`referenceFamiliales.${i}.prenom`)} className={inputClass} />
                  <FieldErr msg={getErr(`referenceFamiliales.${i}.prenom`)} />
                </div>
                <div>
                  <label className={labelClass}>{t('step3.nom')} *</label>
                  <input type="text" {...register(`referenceFamiliales.${i}.nom`)} className={inputClass} />
                  <FieldErr msg={getErr(`referenceFamiliales.${i}.nom`)} />
                </div>
                <div>
                  <label className={labelClass}>{t('step3.telephone')} *</label>
                  <input type="text" {...register(`referenceFamiliales.${i}.telephone`)} className={inputClass} />
                  <FieldErr msg={getErr(`referenceFamiliales.${i}.telephone`)} />
                </div>
                <div>
                  <label className={labelClass}>{t('step3.lienParente')} *</label>
                  <input type="text" {...register(`referenceFamiliales.${i}.lienParente`)} className={inputClass} placeholder={t('step3.lienParentePlaceholder')} />
                  <FieldErr msg={getErr(`referenceFamiliales.${i}.lienParente`)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Enquêtes de moralité ── */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-700/60">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-surface-400 dark:text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
              {t('step3.sectionEnquetes')}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => enquetesField.append({ ...defaultEnquete })}
            className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            + {t('step3.addEnquete')}
          </button>
        </div>
        <div className="p-6 space-y-4">
          {enquetesField.fields.length === 0 && (
            <p className="text-sm text-surface-500 dark:text-surface-400 italic">
              {t('step3.noEnquetes')}
            </p>
          )}
          {enquetesField.fields.map((field, i) => (
            <div key={field.id} className="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">
                  {t('step3.enquete')} {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => enquetesField.remove(i)}
                  className="text-surface-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                  aria-label="Supprimer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t('step3.lienAvecClient')} *</label>
                  <input type="text" {...register(`enquetesMoralite.${i}.lienAvecClient`)} className={inputClass} placeholder={t('step3.lienAvecClientPlaceholder')} />
                  <FieldErr msg={getErr(`enquetesMoralite.${i}.lienAvecClient`)} />
                </div>
                <div>
                  <label className={labelClass}>{t('step3.contact')} *</label>
                  <input type="text" {...register(`enquetesMoralite.${i}.contact`)} className={inputClass} />
                  <FieldErr msg={getErr(`enquetesMoralite.${i}.contact`)} />
                </div>
                <div>
                  <label className={labelClass}>{t('step3.nomComplet')} *</label>
                  <input type="text" {...register(`enquetesMoralite.${i}.nomComplet`)} className={inputClass} />
                  <FieldErr msg={getErr(`enquetesMoralite.${i}.nomComplet`)} />
                </div>
                <div>
                  <label className={labelClass}>{t('step3.amplitude')}</label>
                  <input type="text" {...register(`enquetesMoralite.${i}.amplitude`)} className={inputClass} placeholder={t('step3.amplitudePlaceholder')} />
                  <FieldErr msg={getErr(`enquetesMoralite.${i}.amplitude`)} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t('step3.opinion')} *</label>
                  <textarea {...register(`enquetesMoralite.${i}.opinion`)} rows={2} className={inputClass} />
                  <FieldErr msg={getErr(`enquetesMoralite.${i}.opinion`)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 4: Analyse de risque ── */}
      <SectionCard
        icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        title={t('step3.sectionAnalyseRisque')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="flex items-end">
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
          <div>
            <label className={labelClass}>{t('step3.avisComite')}</label>
            <textarea
              {...register('avisComite')}
              rows={3}
              placeholder={t('step3.avisComitePlaceholder')}
              className={inputClass + ' resize-none'}
            />
            <FieldErr msg={errors.avisComite?.message} />
          </div>
        </div>
      </SectionCard>

      {/* ── Section 5: Prêts en cours ── */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-700/60">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-surface-400 dark:text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
              {t('step3.sectionPretsCours')}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => pretsField.append({ ...defaultPret })}
            className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            + {t('step3.addPret')}
          </button>
        </div>
        <div className="p-6 space-y-4">
          {pretsField.fields.length === 0 && (
            <p className="text-sm text-surface-500 dark:text-surface-400 italic">
              {t('step3.noPrets')}
            </p>
          )}
          {pretsField.fields.map((field, i) => (
            <div key={field.id} className="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">
                  {t('step3.pret')} {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => pretsField.remove(i)}
                  className="text-surface-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                  aria-label="Supprimer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>{t('step3.nomInstitution')} *</label>
                  <input type="text" {...register(`pretsCours.${i}.nomInstitution`)} className={inputClass} />
                  <FieldErr msg={getErr(`pretsCours.${i}.nomInstitution`)} />
                </div>
                <div>
                  <label className={labelClass}>{t('step3.objetPret')} *</label>
                  <input type="text" {...register(`pretsCours.${i}.objet`)} className={inputClass} />
                  <FieldErr msg={getErr(`pretsCours.${i}.objet`)} />
                </div>
                <div>
                  <label className={labelClass}>{t('step3.dureeEnMois')} *</label>
                  <input type="number" min="1" {...register(`pretsCours.${i}.dureeEnMois`, { valueAsNumber: true })} className={inputClass} />
                  <FieldErr msg={getErr(`pretsCours.${i}.dureeEnMois`)} />
                </div>
                <div>
                  <label className={labelClass}>{t('step3.montantInitial')}</label>
                  <input type="number" step="0.01" min="0" {...register(`pretsCours.${i}.montantInitial`, { valueAsNumber: true })} className={inputClass} />
                  <FieldErr msg={getErr(`pretsCours.${i}.montantInitial`)} />
                </div>
                <div>
                  <label className={labelClass}>{t('step3.encoursSolde')}</label>
                  <input type="number" step="0.01" min="0" {...register(`pretsCours.${i}.encoursSolde`, { valueAsNumber: true })} className={inputClass} />
                  <FieldErr msg={getErr(`pretsCours.${i}.encoursSolde`)} />
                </div>
                <div>
                  <label className={labelClass}>{t('step3.montantEcheance')}</label>
                  <input type="number" step="0.01" min="0" {...register(`pretsCours.${i}.montantEcheance`, { valueAsNumber: true })} className={inputClass} />
                  <FieldErr msg={getErr(`pretsCours.${i}.montantEcheance`)} />
                </div>
                <div>
                  <label className={labelClass}>{t('step3.echeancesRestantes')}</label>
                  <input type="number" min="0" {...register(`pretsCours.${i}.nombreEcheancesRestantes`, { valueAsNumber: true })} className={inputClass} />
                  <FieldErr msg={getErr(`pretsCours.${i}.nombreEcheancesRestantes`)} />
                </div>
                <div>
                  <label className={labelClass}>{t('step3.echeancesRetard')}</label>
                  <input type="number" min="0" {...register(`pretsCours.${i}.nombreEcheancesRetard`, { valueAsNumber: true })} className={inputClass} />
                  <FieldErr msg={getErr(`pretsCours.${i}.nombreEcheancesRetard`)} />
                </div>
                <div>
                  <label className={labelClass}>{t('step3.joursRetardMax')}</label>
                  <input type="number" min="0" {...register(`pretsCours.${i}.joursRetardMax`, { valueAsNumber: true })} className={inputClass} />
                  <FieldErr msg={getErr(`pretsCours.${i}.joursRetardMax`)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 6: Analyse crédit ── */}
      <SectionCard
        icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        title={t('step3.sectionAnalyseCredit')}
      >
        <textarea
          {...register('analyseCredit')}
          rows={5}
          placeholder={t('step3.analyseCreditPlaceholder')}
          className={inputClass + ' resize-none'}
        />
        <FieldErr msg={errors.analyseCredit?.message} />
      </SectionCard>

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
