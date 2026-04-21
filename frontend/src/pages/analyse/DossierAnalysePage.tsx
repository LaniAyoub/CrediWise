import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { analyseService, handleAnalyseError } from '@/services/analyseService';
import type { AnalyseDossier, StepClientData, StepObjetCreditData } from '@/types/analyse';
import { getStatusKey, getStatusColor } from '@/utils/statusMapping';
import StepIndicator from '@/components/analyse/StepIndicator';
import StepClientView from '@/components/analyse/steps/StepClientView';
import StepObjetCreditView from '@/components/analyse/steps/StepObjetCreditView';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const DossierAnalysePage = () => {
  const { dossierId } = useParams<{ dossierId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('analyse');

  const [dossier, setDossier] = useState<AnalyseDossier | null>(null);
  const [step1Data, setStep1Data] = useState<StepClientData | null>(null);
  const [step2Data, setStep2Data] = useState<StepObjetCreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step navigation state
  const [activeStep, setActiveStep] = useState(1);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingStep, setPendingStep] = useState<number | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isSavingAndGoing, setIsSavingAndGoing] = useState(false);

  // Ref to trigger child form save
  const step2SaveRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const loadDossier = async () => {
      try {
        if (!dossierId) {
          setError(t('dossier.notFound'));
          setLoading(false);
          return;
        }

        const dossierResponse = await analyseService.getDossier(parseInt(dossierId, 10));
        const newDossier = dossierResponse.data;
        setDossier(newDossier);

        // Load step 1 data
        try {
          const stepResponse = await analyseService.getStep1(parseInt(dossierId, 10));
          setStep1Data(stepResponse.data);
        } catch {
          // If getStep1 fails, try preview
          try {
            const previewResponse = await analyseService.previewStep1(parseInt(dossierId, 10));
            setStep1Data(previewResponse.data);
          } catch (previewError) {
            setError(handleAnalyseError(previewError));
          }
        }

        // Load step 2 data if dossier has reached step 2
        if (newDossier.currentStep >= 2) {
          try {
            if (newDossier.currentStep > 2) {
              // Already completed, fetch saved data
              const step2Response = await analyseService.getStep2(parseInt(dossierId, 10));
              setStep2Data(step2Response.data);
            } else {
              // On step 2, try to get saved data first, then preview
              try {
                const step2Response = await analyseService.getStep2(parseInt(dossierId, 10));
                setStep2Data(step2Response.data);
              } catch {
                const previewResponse = await analyseService.previewStep2(parseInt(dossierId, 10));
                setStep2Data(previewResponse.data);
              }
            }
          } catch (step2Error) {
            // Log but don't block on step 2 load error
            console.warn('Failed to load step 2 data:', step2Error);
          }
        }

        // Set activeStep to current step on load
        setActiveStep(newDossier.currentStep);
        setError(null);
      } catch (err) {
        setError(handleAnalyseError(err));
        setDossier(null);
      } finally {
        setLoading(false);
      }
    };

    loadDossier();
  }, [dossierId, t]);

  const handleConfirmer = async () => {
    if (!dossierId) return;

    setConfirming(true);
    try {
      const result = await analyseService.confirmerStep1(parseInt(dossierId, 10));
      setStep1Data(result.data);

      // Update dossier with new status from response
      if (dossier) {
        setDossier({
          ...dossier,
          currentStep: 2,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: (result.data.dossierStatus || 'ANALYSE') as any,
        });
      }

      toast.success(t('step1.confirmedSuccess'));
    } catch (err) {
      toast.error(handleAnalyseError(err));
    } finally {
      setConfirming(false);
    }
  };

  const handleStepClick = (step: number) => {
    // Ignore if clicking current step
    if (step === activeStep) return;

    // Only allow clicking steps that have been reached (step <= currentStep on server)
    if (!dossier || step > dossier.currentStep) return;

    // If no changes, navigate immediately
    if (!isDirty) {
      setActiveStep(step);
      return;
    }

    // If dirty, show confirmation dialog
    setPendingStep(step);
    setShowLeaveDialog(true);
  };

  const handleSaveAndGo = async () => {
    setIsSavingAndGoing(true);
    try {
      // Call the appropriate save handler based on current step
      if (activeStep === 1) {
        // Step 1: confirm and save
        await handleConfirmer();
      } else if (activeStep === 2 && step2SaveRef.current) {
        // Step 2: save via ref
        await step2SaveRef.current();
      }

      // Navigate to pending step after save
      if (pendingStep !== null) {
        setActiveStep(pendingStep);
        setIsDirty(false);
        setShowLeaveDialog(false);
        setPendingStep(null);
      }
    } catch (err) {
      console.error('Error saving before navigation:', err);
      // Error is already shown via toast by child components
    } finally {
      setIsSavingAndGoing(false);
    }
  };

  const handleDiscardAndGo = () => {
    if (pendingStep !== null) {
      setActiveStep(pendingStep);
      setIsDirty(false);
      setShowLeaveDialog(false);
      setPendingStep(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container space-y-6">
        <div className="h-8 w-64 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />
        <div className="h-14 w-full bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />
        <LoadingSkeleton rows={3} type="text" />
      </div>
    );
  }

  if (error || !dossier || !step1Data || (dossier.currentStep >= 2 && !step2Data)) {
    return (
      <div className="page-container">
        {error || !dossier || !step1Data ? (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 rounded-lg p-6">
            <div className="flex gap-4">
              <svg className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-rose-900 dark:text-rose-50">{error || t('dossier.notFound')}</p>
                <button
                  onClick={() => navigate('/analyse/dossiers')}
                  className="text-sm text-rose-700 dark:text-rose-300 hover:underline mt-2"
                >
                  {t('common.backToList')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <LoadingSkeleton rows={3} type="text" />
        )}
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
          <div className="flex items-center gap-2 mt-2">
            <span className="text-caption text-surface-600 dark:text-surface-400">
              {t('common.status')}:
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dossier.status).text} ${getStatusColor(dossier.status).bg}`}>
              {t(getStatusKey(dossier.status))}
            </span>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator
        currentStep={dossier.currentStep}
        completedSteps={[1, 2, 3, 4, 5, 6, 7].filter((n) => n < dossier.currentStep)}
        onStepClick={handleStepClick}
      />

      {/* Unsaved Changes Dialog */}
      <Modal
        isOpen={showLeaveDialog}
        onClose={() => {
          setShowLeaveDialog(false);
          setPendingStep(null);
        }}
        title={t('common.unsavedTitle')}
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-body text-surface-700 dark:text-surface-300">
            {t('common.unsavedMessage')}
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowLeaveDialog(false);
                setPendingStep(null);
              }}
              disabled={isSavingAndGoing}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="outline"
              onClick={handleDiscardAndGo}
              disabled={isSavingAndGoing}
            >
              {t('common.discardAndGo')}
            </Button>
            <Button
              onClick={handleSaveAndGo}
              disabled={isSavingAndGoing}
            >
              {isSavingAndGoing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Saving...
                </>
              ) : (
                t('common.saveAndGo')
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Step Content */}
      {activeStep === 1 && (
        <StepClientView
          data={step1Data!}
          onConfirmer={handleConfirmer}
          isConfirming={confirming}
          onDirtyChange={setIsDirty}
        />
      )}

      {activeStep === 2 && step2Data && (
        <StepObjetCreditView
          dossierId={dossier!.id}
          initialData={step2Data}
          onConfirmed={(data) => {
            setStep2Data(data);
            setDossier((prev) =>
              prev ? { ...prev, currentStep: 3 } : prev
            );
            setActiveStep(3);
          }}
          onBack={() => handleStepClick(1)}
          onDirtyChange={setIsDirty}
          saveRef={step2SaveRef}
        />
      )}

      {activeStep > 2 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
          <p className="text-sm text-blue-900 dark:text-blue-50">{t('common.nextStepsComingSoon')}</p>
        </div>
      )}
    </div>
  );
};

export default DossierAnalysePage;
