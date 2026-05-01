import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';

interface StepAnnexeViewProps {
  dossierId: number;
  onConfirmed: () => void;
  onBack?: () => void;
  readOnly?: boolean;
}

export const StepAnnexeView: React.FC<StepAnnexeViewProps> = ({
  onConfirmed,
  onBack,
  readOnly = false,
}) => {
  const { t } = useTranslation('analyse');

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </div>
        <h2 className="text-section-title text-surface-900 dark:text-surface-50">
          {t('steps.annexe')}
        </h2>
      </div>

      <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 p-6 text-center">
        <p className="text-sm text-indigo-800 dark:text-indigo-300">
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

export default StepAnnexeView;
