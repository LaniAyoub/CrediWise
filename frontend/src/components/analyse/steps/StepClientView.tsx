import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { analyseService, handleAnalyseError } from '@/services/analyseService';
import { getStatusKey } from '@/utils/statusMapping';
import type { StepClientData } from '@/types/analyse';
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
  const [isConfirmed, setIsConfirmed] = useState(data.isComplete);
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
  const effectiveDemandeId = demandeId ?? data.demandeId;

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

      {/* ── Card 4: Historique de Crédit ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        <CardHeader
          title={t('step1.creditHistory')}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-surface-50 dark:bg-surface-700/40 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{data.nombreDemandesPassees}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{t('step1.totalDemandes')}</p>
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

          {data.nombreDemandesPassees === 0 ? (
            <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-6">{t('step1.noHistory')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    {[t('step1.demandeNumber'), t('step1.amount'), t('step1.status'), t('step1.date')].map((h) => (
                      <th key={h} className="text-left py-2 px-2 text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.historiqueCredits.map((item, idx) => (
                    <tr key={idx} className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors">
                      <td className="py-3 px-2 text-surface-900 dark:text-surface-50">{item.demandeId}</td>
                      <td className="py-3 px-2 text-surface-900 dark:text-surface-50">{item.requestedAmount}</td>
                      <td className="py-3 px-2">
                        <Badge variant={item.status === 'DISBURSE' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {t(getStatusKey(item.status as any))}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-surface-500 dark:text-surface-400">{fmtDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
