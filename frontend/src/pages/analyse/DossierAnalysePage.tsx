import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { analyseService, handleAnalyseError } from '@/services/analyseService';
import { administrationService } from '@/services/administrationService';
import type { AnalyseDossier, StepClientData, StepObjetCreditData, StepRisqueClientData, StepRisqueCommercialData } from '@/types/analyse';
import type { RegleAffichage } from '@/types/regleAffichage.types';
import type { StepInfo } from '@/components/analyse/StepIndicator';
import { getStatusKey, getStatusColor } from '@/utils/statusMapping';
import StepIndicator from '@/components/analyse/StepIndicator';
import StepClientView from '@/components/analyse/steps/StepClientView';
import StepObjetCreditView from '@/components/analyse/steps/StepObjetCreditView';
import StepRisqueClientView from '@/components/analyse/steps/StepRisqueClientView';
import { StepRisqueCommercialView } from '@/components/analyse/steps/StepRisqueCommercialView';
import StepPerimetreView from '@/components/analyse/steps/StepPerimetreView';
import StepAnnexeView from '@/components/analyse/steps/StepAnnexeView';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

// ── Step mapping helpers ──────────────────────────────────────────────────────
//
// <5k mode (default / 7 steps):  visual == server  (steps 1-7)
//
// >5k mode (9 steps):
//   visual 1  = server 1  (Client)
//   visual 2  = NO server  (Périmètre — local only)
//   visual 3  = server 2  (Objet du Crédit)
//   visual 4  = server 3  (Risque Client)
//   visual 5  = server 4  (Risque Commercial)
//   visual 6  = server 5  (Risque Financier)
//   visual 7  = server 6  (Garantie)
//   visual 8  = server 7  (Proposition)
//   visual 9  = NO server  (Annexe — local only)

function serverToVisual(serverStep: number, isGt5k: boolean): number {
  if (!isGt5k) return serverStep;
  // shift every step after Client by +1 to make room for Périmètre
  return serverStep <= 1 ? serverStep : serverStep + 1;
}

function visualToServer(visualStep: number, isGt5k: boolean): number | null {
  if (!isGt5k) return visualStep;
  if (visualStep === 1) return 1;
  if (visualStep === 2) return null; // Périmètre — no server step
  if (visualStep === 9) return null; // Annexe — no server step
  return visualStep - 1;            // visual 3-8 → server 2-7
}

// All steps are always accessible — no confirmation required to navigate freely.
function accessibleUpTo(totalVisualSteps: number): number {
  return totalVisualSteps;
}

// ── Rule matching ─────────────────────────────────────────────────────────────
function applyOp(op: string | null | undefined, amount: number, bound: number): boolean {
  if (!op) return true; // no operator → treat as "passes"
  switch (op) {
    case '>=': return amount >= bound;
    case '>':  return amount >  bound;
    case '<=': return amount <= bound;
    case '<':  return amount <  bound;
    case '=':  return amount === bound;
    default:   return true;
  }
}

function findApplicableRule(
  rules: RegleAffichage[],
  productId: string | null,
  amount: number | null
): RegleAffichage | null {
  if (rules.length === 0) return null;

  for (const rule of rules) {
    // Product filter: no productId on rule → matches any product
    const matchProduct = !rule.productId || rule.productId === productId;

    // Amount bounds — each bound uses its own named operator
    const inf = rule.borneInf != null ? Number(rule.borneInf) : null;
    const sup = rule.borneSup != null ? Number(rule.borneSup) : null;
    const matchInf = inf === null || (amount != null && applyOp(rule.opInf, amount, inf));
    const matchSup = sup === null || (amount != null && applyOp(rule.opSup, amount, sup));

    if (matchProduct && matchInf && matchSup) return rule;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────

const DossierAnalysePage = () => {
  const { dossierId } = useParams<{ dossierId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('analyse');

  const [dossier, setDossier] = useState<AnalyseDossier | null>(null);
  const [step1Data, setStep1Data] = useState<StepClientData | null>(null);
  const [step2Data, setStep2Data] = useState<StepObjetCreditData | null>(null);
  const [step3Data, setStep3Data] = useState<StepRisqueClientData | null>(null);
  const [step4Data, setStep4Data] = useState<StepRisqueCommercialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appliedRule, setAppliedRule] = useState<RegleAffichage | null>(null);
  // true when the dossier was created with a rule that has since been superseded
  const [ruleIsStale, setRuleIsStale] = useState(false);

  const [activeVisualStep, setActiveVisualStep] = useState(1);
  const [perimetreConfirmed, setPerimetreConfirmed] = useState(false);

  const [isDirty, setIsDirty] = useState(false);
  const [pendingStep, setPendingStep] = useState<number | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isSavingAndGoing, setIsSavingAndGoing] = useState(false);

  const step1SaveRef = useRef<(() => Promise<void>) | null>(null);
  const step2SaveRef = useRef<(() => Promise<void>) | null>(null);
  const step3SaveRef = useRef<(() => Promise<void>) | null>(null);
  const step4SaveRef = useRef<(() => Promise<void>) | null>(null);

  const isGt5k = appliedRule?.navigation === '>5k';

  // ── Step list for the indicator ───────────────────────────────────────────
  const displaySteps = useMemo((): StepInfo[] => {
    if (!isGt5k) {
      return [
        { number: 1, label: t('steps.client') },
        { number: 2, label: t('steps.objetCredit') },
        { number: 3, label: t('steps.risqueClient') },
        { number: 4, label: t('steps.risqueCommercial') },
        { number: 5, label: t('steps.risqueFinancier') },
        { number: 6, label: t('steps.garantie') },
        { number: 7, label: t('steps.proposition') },
      ];
    }
    return [
      { number: 1, label: t('steps.client') },
      { number: 2, label: t('steps.perimetre') },
      { number: 3, label: t('steps.objetCredit') },
      { number: 4, label: t('steps.risqueClient') },
      { number: 5, label: t('steps.risqueCommercial') },
      { number: 6, label: t('steps.risqueFinancier') },
      { number: 7, label: t('steps.garantie') },
      { number: 8, label: t('steps.proposition') },
      { number: 9, label: t('steps.annexe') },
    ];
  }, [isGt5k, t]);

  // The StepIndicator "currentStep" boundary: steps < this are accessible/completed
  const indicatorCurrentStep = useMemo((): number => {
    return accessibleUpTo(displaySteps.length);
  }, [displaySteps.length]);

  // Completed visual steps (shown with checkmark)
  const completedVisualSteps = useMemo((): number[] => {
    if (!dossier) return [];
    const serverCurrent = dossier.currentStep;
    if (!isGt5k) {
      return displaySteps.map((s) => s.number).filter((n) => n < serverCurrent && n !== activeVisualStep);
    }
    const completed: number[] = [];
    for (const step of displaySteps) {
      const v = step.number;
      if (v === activeVisualStep) continue;
      const s = visualToServer(v, true);
      if (s !== null && s < serverCurrent) {
        completed.push(v);
      } else if (v === 2 && (perimetreConfirmed || serverCurrent >= 2)) {
        completed.push(v);
      }
    }
    return completed;
  }, [dossier, isGt5k, displaySteps, activeVisualStep, perimetreConfirmed]);

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    const loadDossier = async () => {
      try {
        if (!dossierId) {
          setError(t('dossier.notFound'));
          setLoading(false);
          return;
        }
        const id = parseInt(dossierId, 10);

        // ── 1. Load dossier + rules concurrently ──────────────────────────
        const [dossierResponse, rulesResponse] = await Promise.all([
          analyseService.getDossier(id),
          administrationService.listRegles().catch(() => ({ data: [] as RegleAffichage[] })),
        ]);
        const newDossier = dossierResponse.data;
        setDossier(newDossier);

        // ── 2. Load step 1 ────────────────────────────────────────────────
        let s1Data: StepClientData | null = null;
        try {
          s1Data = (await analyseService.getStep1(id)).data;
        } catch {
          try {
            s1Data = (await analyseService.previewStep1(id)).data;
          } catch (previewError) {
            setError(handleAnalyseError(previewError));
          }
        }
        setStep1Data(s1Data);

        // ── 3. Always load step 2 PREVIEW for rule determination ──────────
        //    This fetches the demande's amount + productId regardless of
        //    whether the analyst has confirmed step 2 yet.
        let s2Data: StepObjetCreditData | null = null;
        try {
          s2Data = (await analyseService.previewStep2(id)).data;
        } catch {
          // If preview fails (nouvelle_demande service down), rule falls back to default
        }

        // If step 2 is already confirmed, override with the confirmed data
        if (newDossier.currentStep > 2) {
          try {
            s2Data = (await analyseService.getStep2(id)).data;
          } catch {
            // Keep preview data
          }
        }
        setStep2Data(s2Data);

        // ── 4. Load step 3 if applicable ──────────────────────────────────
        if (newDossier.currentStep >= 3) {
          try {
            const s3Res = await analyseService
              .getStep3(id)
              .catch(() => analyseService.previewStep3(id));
            setStep3Data(s3Res.data);
          } catch {
            console.warn('Could not load step 3 data');
          }
        }

        // ── 4b. Load step 4 if applicable ─────────────────────────────────
        if (newDossier.currentStep >= 4) {
          try {
            const s4Res = await analyseService
              .getStep4(id)
              .catch(() => analyseService.previewStep4(id));
            setStep4Data(s4Res.data);
          } catch {
            console.warn('Could not load step 4 data');
          }
        }

        // ── 5. Determine navigation rule ──────────────────────────────────
        const rules = rulesResponse.data;
        const productId = s2Data?.productId ?? null;
        const amount = s2Data?.requestedAmount ?? null;
        // operation comes from the demande (not stored in step 2 snapshot); pass null
        // so rules without an operation filter still match correctly.
        const rule = findApplicableRule(rules, productId, amount);
        setAppliedRule(rule);

        // ── 5b. Record the applied rule + detect staleness ───────────────
        if (rule && rule.id) {
          administrationService
            .applyRuleToDossier(id, rule.id, rule.version)
            .catch(() => { /* non-critical */ });
        }

        // If the dossier already had a rule stored and it's no longer in the
        // active rules list, the rule has been superseded → show stale warning.
        const storedRuleId = newDossier.appliedRuleId;
        if (storedRuleId && rules.every((r) => r.id !== storedRuleId)) {
          setRuleIsStale(true);
        }

        // ── 6. Set initial visual step ────────────────────────────────────
        const gt5k = rule?.navigation === '>5k';
        const initialVisual = serverToVisual(newDossier.currentStep, gt5k);
        setActiveVisualStep(initialVisual);

        // If server already past step 1 in >5k mode, Périmètre was already done
        if (gt5k && newDossier.currentStep >= 2) {
          setPerimetreConfirmed(true);
        }

        setError(null);
      } catch (err) {
        setError(handleAnalyseError(err));
        setDossier(null);
      } finally {
        setLoading(false);
      }
    };

    loadDossier();
  }, [dossierId]);

  // ── Step navigation ───────────────────────────────────────────────────────
  const handleStepClick = (visualStep: number) => {
    if (visualStep === activeVisualStep || !dossier) return;
    // Allow navigation to any step <= indicatorCurrentStep
    if (visualStep > indicatorCurrentStep) return;

    // Use saveRef as the authoritative "has unsaved changes" check.
    // This avoids false positives from stale page-level isDirty state
    // (e.g. RHF briefly reporting isDirty=true during mount with complex schemas).
    const serverStep = visualToServer(activeVisualStep, isGt5k);
    const hasPendingSave =
      (serverStep === 1 && step1SaveRef.current != null) ||
      (serverStep === 2 && step2SaveRef.current != null) ||
      (serverStep === 3 && step3SaveRef.current != null) ||
      (serverStep === 4 && step4SaveRef.current != null);

    if (!hasPendingSave) {
      setActiveVisualStep(visualStep);
      setIsDirty(false); // keep state in sync
      return;
    }
    setPendingStep(visualStep);
    setShowLeaveDialog(true);
  };

  const handleSaveAndGo = async () => {
    setIsSavingAndGoing(true);
    try {
      const serverStep = visualToServer(activeVisualStep, isGt5k);
      if (serverStep === 1 && step1SaveRef.current) await step1SaveRef.current();
      else if (serverStep === 2 && step2SaveRef.current) await step2SaveRef.current();
      else if (serverStep === 3 && step3SaveRef.current) await step3SaveRef.current();
      else if (serverStep === 4 && step4SaveRef.current) await step4SaveRef.current();

      if (pendingStep !== null) {
        setActiveVisualStep(pendingStep);
        setIsDirty(false);
        setShowLeaveDialog(false);
        setPendingStep(null);
      }
    } catch (err) {
      console.error('Error saving before navigation:', err);
    } finally {
      setIsSavingAndGoing(false);
    }
  };

  const handleDiscardAndGo = () => {
    if (pendingStep !== null) {
      setActiveVisualStep(pendingStep);
      setIsDirty(false);
      setShowLeaveDialog(false);
      setPendingStep(null);
    }
  };

  // ── Step content renderer ─────────────────────────────────────────────────
  const renderStepContent = () => {
    if (!dossier || !step1Data) return null;

    const goBack = () => setActiveVisualStep((v) => Math.max(1, v - 1));

    // ── Visual 1: Client (same in both modes) ─────────────────────────────
    if (activeVisualStep === 1) {
      return (
        <StepClientView
          dossierId={dossier.id}
          demandeId={dossier.demandeId}
          data={step1Data}
          onConfirmed={(data) => {
            setIsDirty(false);
            setStep1Data(data);
            setDossier((prev) =>
              prev
                ? {
                    ...prev,
                    currentStep: Math.max(prev.currentStep, 2),
                    status: (data.dossierStatus || 'ANALYSE') as AnalyseDossier['status'],
                  }
                : prev
            );
            // In >5k mode → go to Périmètre; in <5k mode → go to Objet
            setActiveVisualStep(2);
          }}
          onDirtyChange={setIsDirty}
          saveRef={step1SaveRef}
        />
      );
    }

    // ── Visual 2 ─────────────────────────────────────────────────────────
    if (activeVisualStep === 2) {
      if (isGt5k) {
        // >5k: Périmètre (local only, no server step)
        return (
          <StepPerimetreView
            dossierId={dossier.id}
            onConfirmed={() => {
              setPerimetreConfirmed(true);
              setActiveVisualStep(3);
            }}
            onBack={goBack}
          />
        );
      }
      // <5k: Objet du Crédit (server step 2)
      if (!step2Data) return <LoadingSkeleton rows={3} type="text" />;
      return (
        <StepObjetCreditView
          dossierId={dossier.id}
          initialData={step2Data}
          onConfirmed={(data) => {
            setIsDirty(false);
            setStep2Data(data);
            setDossier((prev) => (prev ? { ...prev, currentStep: Math.max(prev.currentStep, 3) } : prev));
            setActiveVisualStep(3);
          }}
          onBack={goBack}
          onDirtyChange={setIsDirty}
          saveRef={step2SaveRef}
        />
      );
    }

    // ── Visual 3 ─────────────────────────────────────────────────────────
    if (activeVisualStep === 3) {
      if (isGt5k) {
        // >5k: Objet du Crédit (server step 2)
        if (!step2Data) return <LoadingSkeleton rows={3} type="text" />;
        return (
          <StepObjetCreditView
            dossierId={dossier.id}
            initialData={step2Data}
            onConfirmed={(data) => {
              setIsDirty(false);
              setStep2Data(data);
              setDossier((prev) => (prev ? { ...prev, currentStep: Math.max(prev.currentStep, 3) } : prev));
              setActiveVisualStep(4);
            }}
            onBack={goBack}
            onDirtyChange={setIsDirty}
            saveRef={step2SaveRef}
          />
        );
      }
      // <5k: Risque Client (server step 3)
      if (!step3Data) {
        analyseService.getStep3(dossier.id)
          .catch(() => analyseService.previewStep3(dossier.id))
          .then((r) => setStep3Data(r.data))
          .catch(() => null);
        return <LoadingSkeleton rows={3} type="text" />;
      }
      return (
        <StepRisqueClientView
          dossierId={dossier.id}
          initialData={step3Data}
          onSaved={(data) => setStep3Data(data)}
          onConfirmed={(data) => {
            setIsDirty(false);
            setStep3Data(data);
            setDossier((prev) => (prev ? { ...prev, currentStep: Math.max(prev.currentStep, 4) } : prev));
            setActiveVisualStep(4);
          }}
          onBack={goBack}
          onDirtyChange={setIsDirty}
          saveRef={step3SaveRef}
        />
      );
    }

    // ── Visual 4 ─────────────────────────────────────────────────────────
    if (activeVisualStep === 4 && isGt5k) {
      // >5k: Risque Client (server step 3)
      if (!step3Data) {
        analyseService.getStep3(dossier.id)
          .catch(() => analyseService.previewStep3(dossier.id))
          .then((r) => setStep3Data(r.data))
          .catch(() => null);
        return <LoadingSkeleton rows={3} type="text" />;
      }
      return (
        <StepRisqueClientView
          dossierId={dossier.id}
          initialData={step3Data}
          onSaved={(data) => setStep3Data(data)}
          onConfirmed={(data) => {
            setIsDirty(false);
            setStep3Data(data);
            setDossier((prev) => (prev ? { ...prev, currentStep: Math.max(prev.currentStep, 4) } : prev));
            setActiveVisualStep(5);
          }}
          onBack={goBack}
          onDirtyChange={setIsDirty}
          saveRef={step3SaveRef}
        />
      );
    }

    // ── Visual 4 (<5k) or Visual 5 (>5k): Risque Commercial (server step 4) ──
    const isRisqueCommercial =
      (!isGt5k && activeVisualStep === 4) || (isGt5k && activeVisualStep === 5);
    if (isRisqueCommercial) {
      // Lazy-load step4 data if not yet available
      if (!step4Data) {
        analyseService.previewStep4(dossier.id).then((r) => setStep4Data(r.data)).catch(() => null);
        return <div className="h-8 w-48 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />;
      }
      return (
        <StepRisqueCommercialView
          dossierId={dossier.id}
          initialData={step4Data}
          onSaved={(d) => setStep4Data(d)}
          onConfirmed={(d) => {
            setIsDirty(false);
            setStep4Data(d);
            setDossier((prev) => (prev ? { ...prev, currentStep: Math.max(prev.currentStep, 5) } : prev));
            setActiveVisualStep((v) => v + 1);
          }}
          onBack={goBack}
          onDirtyChange={setIsDirty}
          saveRef={step4SaveRef}
        />
      );
    }

    // ── Visual 9: Annexe (>5k final step) ────────────────────────────────
    if (activeVisualStep === 9 && isGt5k) {
      return (
        <StepAnnexeView
          dossierId={dossier.id}
          onConfirmed={() => toast.success(t('steps.annexe'))}
          onBack={goBack}
        />
      );
    }

    // ── Placeholder for not-yet-implemented steps ─────────────────────────
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
        <p className="text-sm text-blue-900 dark:text-blue-50">{t('common.nextStepsComingSoon')}</p>
      </div>
    );
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-container space-y-6">
        <div className="h-8 w-64 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />
        <div className="h-14 w-full bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />
        <LoadingSkeleton rows={3} type="text" />
      </div>
    );
  }

  if (error || !dossier || !step1Data) {
    return (
      <div className="page-container">
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 rounded-lg p-6">
          <div className="flex gap-4">
            <svg className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-rose-900 dark:text-rose-50">{error || t('dossier.notFound')}</p>
              <button onClick={() => navigate('/analyse/dossiers')} className="text-sm text-rose-700 dark:text-rose-300 hover:underline mt-2">
                {t('common.backToList')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-page-title text-surface-900 dark:text-surface-50">
            {t('dossier.title')} — {t('common.demande')} #{dossier.demandeId}
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-caption text-surface-600 dark:text-surface-400">{t('common.status')}:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dossier.status).text} ${getStatusColor(dossier.status).bg}`}>
              {t(getStatusKey(dossier.status))}
            </span>
            {/* Applied rule badge */}
            {appliedRule && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                isGt5k
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                  : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
              }`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isGt5k ? `LaF >5k — ${displaySteps.length} étapes` : `LaF <5k — ${displaySteps.length} étapes`}
                {appliedRule.version > 1 && (
                  <span className="opacity-60">v{appliedRule.version}</span>
                )}
              </span>
            )}
            {/* Stale-rule warning: the rule applied to this dossier has been superseded */}
            {ruleIsStale && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                title={t('common.staleRuleTooltip')}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {t('common.staleRule')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator
        currentStep={indicatorCurrentStep}
        activeStep={activeVisualStep}
        completedSteps={completedVisualSteps}
        onStepClick={handleStepClick}
        steps={displaySteps}
      />

      {/* Unsaved Changes Dialog */}
      <Modal
        isOpen={showLeaveDialog}
        onClose={() => { setShowLeaveDialog(false); setPendingStep(null); }}
        title={t('common.unsavedTitle')}
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-body text-surface-700 dark:text-surface-300">{t('common.unsavedMessage')}</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setShowLeaveDialog(false); setPendingStep(null); }} disabled={isSavingAndGoing}>
              {t('common.cancel')}
            </Button>
            <Button variant="outline" onClick={handleDiscardAndGo} disabled={isSavingAndGoing}>
              {t('common.discardAndGo')}
            </Button>
            <Button onClick={handleSaveAndGo} disabled={isSavingAndGoing}>
              {isSavingAndGoing ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>{t('common.saving')}</>
              ) : t('common.saveAndGo')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Step Content */}
      {renderStepContent()}
    </div>
  );
};

export default DossierAnalysePage;
