import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';

interface StepPerimetreViewProps {
  dossierId: number;
  onConfirmed: () => void;
  onBack?: () => void;
  readOnly?: boolean;
}

export const StepPerimetreView: React.FC<StepPerimetreViewProps> = ({
  onConfirmed,
  onBack,
  readOnly = false,
}) => {
  const { t } = useTranslation('analyse');

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
          <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h2 className="text-section-title text-surface-900 dark:text-surface-50">
          {t('steps.perimetre')}
        </h2>
      </div>

      <div className="rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 p-6 text-center">
        <p className="text-sm text-teal-800 dark:text-teal-300">
          {t('common.nextStepsComingSoon')}
        </p>
      </div>

      {!readOnly && (
        <div className="flex justify-between pt-2">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              {t('common.back')}
            </Button>
          )}
          <Button onClick={onConfirmed} className="ml-auto">
            {t('common.confirmAndContinue')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default StepPerimetreView;
