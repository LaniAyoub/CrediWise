import React from 'react';
import { useTranslation } from 'react-i18next';

interface StepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, completedSteps, onStepClick }) => {
  const { t } = useTranslation('analyse');

  const steps = [
    { number: 1, label: t('steps.client') },
    { number: 2, label: t('steps.objetCredit') },
    { number: 3, label: t('steps.risqueClient') },
    { number: 4, label: t('steps.risqueCommercial') },
    { number: 5, label: t('steps.risqueFinancier') },
    { number: 6, label: t('steps.garantie') },
    { number: 7, label: t('steps.proposition') },
  ];

  const getStepState = (stepNumber: number): 'active' | 'completed' | 'accessible' | 'locked' => {
    if (stepNumber === currentStep) return 'active';
    if (completedSteps.includes(stepNumber)) return 'completed';
    if (stepNumber < currentStep) return 'accessible';
    return 'locked';
  };

  const getStepClasses = (stepNumber: number): string => {
    const state = getStepState(stepNumber);
    const baseClasses = 'flex-1 py-3 px-2 sm:px-4 text-center text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer';

    switch (state) {
      case 'active':
        return `${baseClasses} bg-emerald-500 text-white shadow-md`;
      case 'completed':
        return `${baseClasses} bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-900/40`;
      case 'accessible':
        return `${baseClasses} bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 cursor-pointer hover:bg-surface-200 dark:hover:bg-surface-600`;
      case 'locked':
        return `${baseClasses} bg-surface-50 dark:bg-surface-800 text-surface-400 dark:text-surface-600 cursor-not-allowed opacity-50`;
    }
  };

  const handleStepClick = (stepNumber: number) => {
    const state = getStepState(stepNumber);
    if (state !== 'locked') {
      onStepClick(stepNumber);
    }
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-2 sm:p-4 shadow-sm">
      <div className="flex gap-1 sm:gap-2">
        {steps.map((step) => (
          <button
            key={step.number}
            onClick={() => handleStepClick(step.number)}
            className={getStepClasses(step.number)}
            disabled={getStepState(step.number) === 'locked'}
            title={step.label}
          >
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              {getStepState(step.number) === 'completed' && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden font-bold">{step.number}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="sm:hidden text-center text-xs text-surface-500 dark:text-surface-400 mt-2">
        {t('step')} {currentStep}/{steps.length}
      </div>
    </div>
  );
};

export default StepIndicator;
