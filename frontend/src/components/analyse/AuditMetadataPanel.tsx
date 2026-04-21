import React from 'react';
import { useTranslation } from 'react-i18next';

interface AuditMetadataPanelProps {
  confirmedAt?: string | null;
  confirmedBy?: string | null;
  lastEditedAt?: string | null;
  lastEditedBy?: string | null;
}

const AuditMetadataPanel: React.FC<AuditMetadataPanelProps> = ({
  confirmedAt,
  confirmedBy,
  lastEditedAt,
  lastEditedBy,
}) => {
  const { t } = useTranslation('analyse');

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const hasConfirmedData = confirmedAt || confirmedBy;
  const hasEditData = lastEditedAt || lastEditedBy;

  if (!hasConfirmedData && !hasEditData) {
    return null;
  }

  return (
    <div className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-4 space-y-3">
      <h4 className="text-label font-medium text-surface-900 dark:text-surface-50">
        {t('common.auditHistory')}
      </h4>

      {hasConfirmedData && (
        <div className="flex items-start gap-3 text-sm">
          <span className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">
            ✅
          </span>
          <div>
            <p className="text-surface-600 dark:text-surface-400">
              <span className="font-medium">{t('common.confirmedAt')}:</span>{' '}
              {formatDateTime(confirmedAt) || t('common.notYetConfirmed')}
            </p>
            {confirmedBy && (
              <p className="text-surface-600 dark:text-surface-400 mt-1">
                <span className="font-medium">{t('common.confirmedBy')}:</span> {confirmedBy}
              </p>
            )}
          </div>
        </div>
      )}

      {hasEditData && (
        <div className="flex items-start gap-3 text-sm">
          <span className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
            ✏️
          </span>
          <div>
            <p className="text-surface-600 dark:text-surface-400">
              <span className="font-medium">{t('common.lastEditedAt')}:</span>{' '}
              {formatDateTime(lastEditedAt) || t('common.notYetConfirmed')}
            </p>
            {lastEditedBy && (
              <p className="text-surface-600 dark:text-surface-400 mt-1">
                <span className="font-medium">{t('common.lastEditedBy')}:</span> {lastEditedBy}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditMetadataPanel;
