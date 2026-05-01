import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatAmount } from '@/utils/formatAmount';
import type { PretCoursDto } from '@/types/analyse';

interface LoansTableProps {
  loans: PretCoursDto[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
  readOnly?: boolean;
}

export const LoansTable: React.FC<LoansTableProps> = ({ loans, onEdit, onDelete, onAdd, readOnly = false }) => {
  const { t } = useTranslation('analyse');
  const totalEncours = loans.reduce((sum, l) => sum + (l.encoursSolde || 0), 0);
  const totalMensualite = loans.reduce((sum, l) => sum + (l.montantEcheance || 0), 0);

  if (loans.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center italic py-6">{t('step3.noPrets')}</p>
        {!readOnly && (
          <button onClick={onAdd} className="w-full px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
            + {t('step3.addPret')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Institution</th>
              <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Objet</th>
              <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Durée</th>
              <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Init.</th>
              <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Solde</th>
              <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Éch.</th>
              {!readOnly && <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loans.map((loan, idx) => (
              <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="py-2 px-2 text-gray-900 dark:text-white">{loan.nomInstitution}</td>
                <td className="py-2 px-2 text-gray-900 dark:text-white">{loan.objet}</td>
                <td className="py-2 px-2 text-gray-900 dark:text-white">{loan.dureeEnMois}m</td>
                <td className="py-2 px-2 text-gray-900 dark:text-white text-right">{formatAmount(loan.montantInitial)}</td>
                <td className="py-2 px-2 text-gray-900 dark:text-white text-right">{formatAmount(loan.encoursSolde)}</td>
                <td className="py-2 px-2 text-gray-900 dark:text-white text-right">{formatAmount(loan.montantEcheance)}</td>
                {!readOnly && (
                  <td className="py-2 px-2 flex gap-2">
                    <button onClick={() => onEdit(idx)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">✏️</button>
                    <button onClick={() => onDelete(idx)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">×</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">{t('fields.totalEncours')}:</span>
          <span className="font-medium text-gray-900 dark:text-white">{formatAmount(totalEncours)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">{t('fields.totalEcheancesMois')}:</span>
          <span className="font-medium text-gray-900 dark:text-white">{formatAmount(totalMensualite)}</span>
        </div>
      </div>
      {!readOnly && (
        <button onClick={onAdd} className="w-full px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
          + {t('step3.addPret')}
        </button>
      )}
    </div>
  );
};
