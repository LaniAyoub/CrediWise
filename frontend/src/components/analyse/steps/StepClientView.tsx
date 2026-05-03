import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { analyseService, handleAnalyseError } from '@/services/analyseService';
import { getStatusKey } from '@/utils/statusMapping';
import type { StepClientData, ScoringResult, DecisionType } from '@/types/analyse';
import AuditMetadataPanel from '@/components/analyse/AuditMetadataPanel';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface StepClientViewProps {
  dossierId: number;
  demandeId?: number | null;
  data: StepClientData;
  onConfirmed: (data: StepClientData) => void;
  onDirtyChange?: (dirty: boolean) => void;
  saveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  readOnly?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  if (
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
  ) age--;
  return age >= 0 ? age : null;
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR'); } catch { return '—'; }
}

// ── Scoring helpers ───────────────────────────────────────────────────────────
const DECISION_COLORS: Record<DecisionType, string> = {
  ACCEPTE:   'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  A_ETUDIER: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  REFUSE:    'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
};

const DECISION_BANNER: Record<DecisionType, string> = {
  ACCEPTE:   'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200',
  A_ETUDIER: 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200',
  REFUSE:    'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200',
};

const DECISION_ICON: Record<DecisionType, React.ReactNode> = {
  ACCEPTE: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  A_ETUDIER: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  REFUSE: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// Score gauge: colored zones (REFUSE 0-305, A_ETUDIER 305-375, ACCEPTE 375-1000)
const ScoreGauge = ({ score }: { score: number }) => {
  const pct = Math.min(100, Math.max(0, score / 10));
  const markerColor = score >= 375 ? 'bg-emerald-600' : score >= 305 ? 'bg-amber-500' : 'bg-rose-600';
  return (
    <div className="space-y-2">
      {/* Bar */}
      <div className="relative h-5 rounded-full overflow-hidden flex">
        <div className="h-full bg-rose-200 dark:bg-rose-900/50"   style={{ width: '30.5%' }} />
        <div className="h-full bg-amber-200 dark:bg-amber-900/50" style={{ width: '7%' }} />
        <div className="h-full bg-emerald-200 dark:bg-emerald-900/50" style={{ width: '62.5%' }} />
        {/* Marker */}
        <div
          className={`absolute top-1 bottom-1 w-1 rounded-full ${markerColor} shadow`}
          style={{ left: `calc(${pct}% - 2px)` }}
        />
      </div>
      {/* Score value + threshold labels */}
      <div className="relative text-[10px] text-surface-500 dark:text-surface-400 select-none" style={{ height: '20px' }}>
        <span className="absolute left-0">0</span>
        <span className="absolute" style={{ left: '30.5%', transform: 'translateX(-50%)' }}>305</span>
        <span className="absolute" style={{ left: '37.5%', transform: 'translateX(-50%)' }}>375</span>
        <span className="absolute right-0">1000</span>
        {/* Floating score value */}
        <span
          className="absolute -top-6 text-xs font-bold text-surface-800 dark:text-surface-100 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded px-1"
          style={{ left: `clamp(0px, calc(${pct}% - 16px), calc(100% - 40px))` }}
        >
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
};

// ── Info row component ────────────────────────────────────────────────────────
const InfoRow = ({ label, value, wide = false }: { label: string; value: React.ReactNode; wide?: boolean }) => (
  <div className={wide ? 'col-span-2' : ''}>
    <p className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-0.5">
      {label}
    </p>
    <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
      {value === null || value === undefined || value === '' ? '—' : value}
    </p>
  </div>
);

// ── Editable text area ────────────────────────────────────────────────────────
const EditableArea = ({
  value,
  onChange,
  placeholder,
  readOnly,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  readOnly: boolean;
  label: string;
}) => (
  <div>
    <p className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-1.5">
      {label}
    </p>
    <textarea
      value={value}
      onChange={(e) => !readOnly && onChange(e.target.value)}
      readOnly={readOnly}
      placeholder={readOnly ? '' : placeholder}
      rows={2}
      className={`w-full px-3 py-2 text-sm border rounded-lg text-surface-900 dark:text-surface-50 bg-white dark:bg-surface-700 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none transition-colors resize-none ${
        readOnly
          ? 'border-transparent cursor-default'
          : 'border-surface-300 dark:border-surface-600 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
      }`}
    />
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const StepClientView: React.FC<StepClientViewProps> = ({
  dossierId,
  demandeId,
  data,
  onConfirmed,
  onDirtyChange,
  saveRef,
  readOnly = false,
}) => {
  const { t } = useTranslation('analyse');

  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Scoring state
  const [scoring, setScoring] = useState<ScoringResult | null>(null);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [scoringError, setScoringError] = useState<string | null>(null);

  const effectiveDemandeId = demandeId ?? data.demandeId;
  const [isConfirmed, setIsConfirmed] = useState(data.isComplete ?? data.isConfirmed ?? false);
  const [confirmedAt, setConfirmedAt] = useState(data.confirmedAt);
  const [confirmedByName, setConfirmedByName] = useState(data.confirmedByName);

  // Editable fields
  const [locationActivite, setLocationActivite] = useState(data.location || '');
  const [locationDomicile, setLocationDomicile] = useState(data.locationDomicile || '');
  const [dateVisite, setDateVisite] = useState(data.dateVisite || '');
  const [dateFinalisation, setDateFinalisation] = useState(data.dateFinalisation || '');

  // Saved snapshots for dirty detection
  const [savedActivite, setSavedActivite] = useState(data.location || '');
  const [savedDomicile, setSavedDomicile] = useState(data.locationDomicile || '');
  const [savedDateVisite, setSavedDateVisite] = useState(data.dateVisite || '');
  const [savedDateFinalisation, setSavedDateFinalisation] = useState(data.dateFinalisation || '');

  const isDirty = !readOnly && (
    locationActivite !== savedActivite ||
    locationDomicile !== savedDomicile ||
    dateVisite !== savedDateVisite ||
    dateFinalisation !== savedDateFinalisation
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  const buildPayload = () => ({
    location: locationActivite || null,
    locationDomicile: locationDomicile || null,
    dateVisite: dateVisite || null,
    dateFinalisation: dateFinalisation || null,
  });

  // Scoring
  const canScore = !!(
    data.dateOfBirth &&
    data.monthlyIncome != null &&
    data.requestedAmount != null &&
    data.durationMonths != null
  );

  const computeScore = useCallback(async () => {
    if (!canScore) return;
    setScoringLoading(true);
    setScoringError(null);
    try {
      const requestDate = (data.dateDemande || data.demandeCreatedAt || new Date().toISOString()).split('T')[0];
      const res = await analyseService.computeScoring({
        demandeId: effectiveDemandeId ?? data.demandeId,
        clientId: data.clientId,
        dateOfBirth: data.dateOfBirth!.split('T')[0],
        requestDate,
        maritalStatus: data.situationFamiliale || null,
        monthlyIncome: data.monthlyIncome!,
        requestedAmount: data.requestedAmount!,
        durationMonths: data.durationMonths!,
        bankingRestriction: data.bankingRestriction ?? false,
        legalIssueOrAccountBlocked: data.legalIssueOrAccountBlocked ?? false,
      });
      setScoring(res.data);
    } catch {
      setScoringError(t('step1.scoring.error'));
    } finally {
      setScoringLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canScore, data, effectiveDemandeId, t]);

  // Load saved scoring from DB on mount; fallback to compute if not found
  useEffect(() => {
    if (!canScore || !effectiveDemandeId) return;

    const loadScoring = async () => {
      setScoringLoading(true);
      setScoringError(null);
      try {
        const res = await analyseService.getScoring(effectiveDemandeId);
        setScoring(res.data);
      } catch (err: any) {
        // 404 means scoring hasn't been calculated yet — compute it
        if (err.response?.status === 404) {
          computeScore();
        } else {
          setScoringError(t('step1.scoring.error'));
        }
      } finally {
        setScoringLoading(false);
      }
    };

    loadScoring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const result = await analyseService.saveStep1(dossierId, buildPayload());
      setSavedActivite(result.data.location || '');
      setSavedDomicile(result.data.locationDomicile || '');
      setSavedDateVisite(result.data.dateVisite || '');
      setSavedDateFinalisation(result.data.dateFinalisation || '');
      toast.success(t('common.saved', 'Enregistré'));
    } catch (e) {
      toast.error(handleAnalyseError(e));
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId, locationActivite, locationDomicile, dateVisite, dateFinalisation, t]);

  useEffect(() => {
    if (saveRef) saveRef.current = isDirty ? async () => { await handleSave(); } : null;
  }, [isDirty, saveRef, handleSave]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const result = await analyseService.confirmerStep1(dossierId, buildPayload());
      setIsConfirmed(true);
      setConfirmedAt(result.data.confirmedAt);
      setConfirmedByName(result.data.confirmedByName);
      setSavedActivite(result.data.location || '');
      setSavedDomicile(result.data.locationDomicile || '');
      setSavedDateVisite(result.data.dateVisite || '');
      setSavedDateFinalisation(result.data.dateFinalisation || '');
      toast.success(t('step1.confirmedSuccess'));
      onConfirmed(result.data);
    } catch (e) {
      toast.error(handleAnalyseError(e));
    } finally {
      setConfirming(false);
    }
  };

  const age = calcAge(data.dateOfBirth);

  // ── Card header helper ──────────────────────────────────────────────────────
  const CardHeader = ({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) => (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-100 dark:border-surface-700/60 bg-surface-50/50 dark:bg-surface-800/30">
      <div className="flex items-center gap-2.5">
        <span className="text-brand-500 dark:text-brand-400">{icon}</span>
        <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      {data.warningMessage && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 flex gap-3">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-amber-700 dark:text-amber-300">{data.warningMessage}</p>
        </div>
      )}

      {/* ── Card 1: Informations Client ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        <CardHeader
          title={t('step1.clientInfo')}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
            <InfoRow label={t('step1.idClient')} value={data.clientId} />
            <InfoRow label={t('step1.idDemande')} value={effectiveDemandeId ?? '—'} />
            <InfoRow label={t('step1.nom')} value={data.lastName} />
            <InfoRow label={t('step1.prenom')} value={data.firstName} />
            <InfoRow label={t('step1.sexe')} value={data.gender} />
            <InfoRow
              label={t('step1.age')}
              value={age !== null ? `${age} ans` : '—'}
            />
            <InfoRow label={t('step1.secteurActivite')} value={data.businessSectorName} />
            <InfoRow label={t('step1.activite')} value={data.businessActivityGroupName} />
            <InfoRow label={t('step1.sousActivite')} value={data.businessActivityName} />
          </div>
        </div>
      </div>

      {/* ── Card 2: Informations Générales ───────────────────────────────────── */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        <CardHeader
          title={t('step1.generalInformation')}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        >
          {isConfirmed && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {t('common.confirmed')}
            </span>
          )}
        </CardHeader>
        <div className="p-5">
          {!data.agenceDataAvailable && (
            <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
              <p className="text-xs text-amber-700 dark:text-amber-300">{t('step1.agenceUnavailable')}</p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 mb-5">
            <InfoRow label={t('step1.agence')} value={data.agenceLibelle} />
            <InfoRow label={t('step1.gestionnaire')} value={data.assignedManagerName} />
            <InfoRow label={t('step1.cycle')} value={data.cycle} />
            <InfoRow label={t('step1.segment')} value={data.segmentName} />
            <InfoRow label={t('step1.dateDemande')} value={fmtDate(data.demandeCreatedAt)} />
          </div>

          {/* Editable dates */}
          {!readOnly && (
            <div className="pt-4 border-t border-surface-100 dark:border-surface-700/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-1.5">
                  {t('step1.dateVisite')}
                </label>
                <input
                  type="date"
                  value={dateVisite}
                  onChange={(e) => setDateVisite(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-1.5">
                  {t('step1.dateFinalisation')}
                </label>
                <input
                  type="date"
                  value={dateFinalisation}
                  onChange={(e) => setDateFinalisation(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
          )}
          {readOnly && (dateVisite || dateFinalisation) && (
            <div className="pt-4 border-t border-surface-100 dark:border-surface-700/60 grid grid-cols-2 gap-x-6 gap-y-4">
              <InfoRow label={t('step1.dateVisite')} value={fmtDate(dateVisite)} />
              <InfoRow label={t('step1.dateFinalisation')} value={fmtDate(dateFinalisation)} />
            </div>
          )}
        </div>
      </div>

      {/* ── Card 3: Localisation Client ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        <CardHeader
          title={t('step1.localisationClient')}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EditableArea
            label={t('step1.domicileClient')}
            value={locationDomicile}
            onChange={setLocationDomicile}
            placeholder={t('step1.domicilePlaceholder')}
            readOnly={readOnly}
          />
          <EditableArea
            label={t('step1.activiteClient')}
            value={locationActivite}
            onChange={setLocationActivite}
            placeholder={t('step1.activitePlaceholder')}
            readOnly={readOnly}
          />
        </div>
      </div>

      {/* ── Card 4: Scoring Crédit ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        <CardHeader
          title={t('step1.scoring.title')}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        >
          <button
            type="button"
            onClick={computeScore}
            disabled={scoringLoading || !canScore}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {scoringLoading ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('step1.scoring.computing')}
              </>
            ) : scoring ? t('step1.scoring.recompute') : t('step1.scoring.compute')}
          </button>
        </CardHeader>

        <div className="p-5">
          {/* Missing data warning */}
          {!canScore && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-amber-700 dark:text-amber-300">{t('step1.scoring.missingData')}</p>
            </div>
          )}

          {/* Loading spinner */}
          {scoringLoading && (
            <div className="flex items-center justify-center py-10 gap-3 text-sm text-surface-500 dark:text-surface-400">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('step1.scoring.computing')}
            </div>
          )}

          {/* Error */}
          {!scoringLoading && scoringError && (
            <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 rounded-lg p-3">
              <svg className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-rose-700 dark:text-rose-300">{scoringError}</p>
            </div>
          )}

          {/* Scoring result */}
          {!scoringLoading && !scoringError && scoring && (
            <div className="space-y-5">

              {/* ── Final decision banner ── */}
              <div className={`flex items-center gap-4 p-4 rounded-xl border-2 ${DECISION_BANNER[scoring.decisionSysteme]}`}>
                <div className="flex-shrink-0">{DECISION_ICON[scoring.decisionSysteme]}</div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-70">{t('step1.scoring.finalDecision')}</p>
                  <p className="text-xl font-bold mt-0.5">{t(`step1.scoring.decisions.${scoring.decisionSysteme}`)}</p>
                  <p className="text-xs mt-1 opacity-80">{t(`step1.scoring.decisionExpl.${scoring.decisionSysteme}`)}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-3xl font-black">{Math.round(scoring.scoreAjuste)}</p>
                  <p className="text-xs opacity-70">/ 1000</p>
                </div>
              </div>

              {/* ── Score gauge ── */}
              <div>
                <p className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-3">
                  {t('step1.scoring.scoreAjuste')}
                </p>
                <ScoreGauge score={scoring.scoreAjuste} />
                <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-3 text-center">{t('step1.scoring.thresholds')}</p>
              </div>

              {/* ── Two columns: DRG + Score details ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* DRG table */}
                <div>
                  <p className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-2">
                    {t('step1.scoring.drgTitle')}
                  </p>
                  <div className="rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
                    {(
                      [
                        { key: 'drgAge',        label: t('step1.scoring.drgAge'),        expl: t('step1.scoring.drgAgeExpl'),        val: scoring.drgAge },
                        { key: 'drgAnciennete', label: t('step1.scoring.drgAnciennete'), expl: t('step1.scoring.drgAncienneteExpl'), val: scoring.drgAnciennete },
                        { key: 'drgBudget',     label: t('step1.scoring.drgBudget'),     expl: t('step1.scoring.drgBudgetExpl'),     val: scoring.drgBudget },
                        { key: 'drgFichage',    label: t('step1.scoring.drgFichage'),    expl: t('step1.scoring.drgFichageExpl'),    val: scoring.drgFichage },
                        { key: 'drgOffre',      label: t('step1.scoring.drgOffre'),      expl: t('step1.scoring.drgOffreExpl'),      val: scoring.drgOffre },
                      ] as const
                    ).map((row, i) => (
                      <div key={row.key} className={`flex items-center justify-between px-3 py-2 gap-2 ${i > 0 ? 'border-t border-surface-100 dark:border-surface-700' : ''}`}>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-surface-800 dark:text-surface-100 truncate">{row.label}</p>
                          <p className="text-[10px] text-surface-400 dark:text-surface-500 truncate">{row.expl}</p>
                        </div>
                        <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${DECISION_COLORS[row.val]}`}>
                          {t(`step1.scoring.decisions.${row.val}`)}
                        </span>
                      </div>
                    ))}
                    {/* Combined DRG */}
                    <div className="flex items-center justify-between px-3 py-2 gap-2 border-t-2 border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700/40">
                      <p className="text-xs font-bold text-surface-800 dark:text-surface-100">{t('step1.scoring.decisionDRG')}</p>
                      <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${DECISION_COLORS[scoring.decisionDRG]}`}>
                        {t(`step1.scoring.decisions.${scoring.decisionDRG}`)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score details */}
                <div>
                  <p className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-2">
                    {t('step1.scoring.dssTitle')} — {t('step1.scoring.scoreDetails.title')}
                  </p>
                  <div className="rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
                    {Object.entries(scoring.scoreDetails).map(([key, val], i) => (
                      <div key={key} className={`flex items-center justify-between px-3 py-2 gap-2 ${i > 0 ? 'border-t border-surface-100 dark:border-surface-700' : ''}`}>
                        <p className="text-xs text-surface-700 dark:text-surface-300 truncate">
                          {t(`step1.scoring.scoreDetails.${key}`, key)}
                        </p>
                        <span className={`flex-shrink-0 text-xs font-mono font-semibold ${val > 0 ? 'text-emerald-600 dark:text-emerald-400' : val < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-surface-400 dark:text-surface-500'}`}>
                          {val > 0 ? '+' : ''}{val.toFixed(5)}
                        </span>
                      </div>
                    ))}
                    {/* DSS decision */}
                    <div className="flex items-center justify-between px-3 py-2 gap-2 border-t-2 border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700/40">
                      <p className="text-xs font-bold text-surface-800 dark:text-surface-100">{t('step1.scoring.decisionDSS')}</p>
                      <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${DECISION_COLORS[scoring.decisionDSS]}`}>
                        {t(`step1.scoring.decisions.${scoring.decisionDSS}`)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Not yet computed */}
          {!scoringLoading && !scoringError && !scoring && canScore && (
            <p className="text-sm text-surface-400 dark:text-surface-500 text-center py-8">
              {t('step1.scoring.compute')} →
            </p>
          )}
        </div>
      </div>

      {/* Audit panel */}
      {isConfirmed && (confirmedAt || confirmedByName) && (
        <AuditMetadataPanel confirmedAt={confirmedAt} confirmedByName={confirmedByName} />
      )}

      {/* Action buttons */}
      {!readOnly && (
        <div className="flex items-center justify-end gap-3 pt-1">
          {isDirty && (
            <Button variant="outline" onClick={() => {
              setLocationActivite(savedActivite);
              setLocationDomicile(savedDomicile);
              setDateVisite(savedDateVisite);
              setDateFinalisation(savedDateFinalisation);
            }} disabled={saving || confirming}>
              {t('common.cancel')}
            </Button>
          )}
          <Button variant="outline" onClick={handleSave} disabled={saving || confirming || !isDirty}>
            {saving ? t('common.saving', 'Enregistrement...') : t('common.save', 'Enregistrer')}
          </Button>
          <Button onClick={handleConfirm} disabled={confirming || saving}>
            {confirming ? t('step1.confirming') : isConfirmed ? t('step1.reconfirm') : t('step1.confirmer')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default StepClientView;
