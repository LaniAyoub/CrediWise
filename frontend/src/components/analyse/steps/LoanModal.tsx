import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import type { PretCoursDto } from '@/types/analyse';
import { pretCoursSchema } from './step3Schema';

interface LoanModalProps {
  isOpen: boolean;
  initialValues?: PretCoursDto;
  onSave: (loan: PretCoursDto) => void;
  onClose: () => void;
}

export const LoanModal: React.FC<LoanModalProps> = ({ isOpen, initialValues, onSave, onClose }) => {
  const { t } = useTranslation('analyse');
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(pretCoursSchema),
    defaultValues: initialValues || { nomInstitution: '', objet: '', dureeEnMois: 0, montantInitial: 0, encoursSolde: 0, montantEcheance: 0, nombreEcheancesRestantes: 0, nombreEcheancesRetard: 0, joursRetardMax: 0 },
  });

  useEffect(() => {
    if (isOpen) reset(initialValues || { nomInstitution: '', objet: '', dureeEnMois: 0, montantInitial: 0, encoursSolde: 0, montantEcheance: 0, nombreEcheancesRestantes: 0, nombreEcheancesRetard: 0, joursRetardMax: 0 });
  }, [isOpen, initialValues, reset]);

  if (!isOpen) return null;
  const onSubmit = handleSubmit((values) => { onSave(values as PretCoursDto); });
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{initialValues ? t('step3.loanModal.edit') : t('step3.loanModal.add')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">×</button>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('step3.nomInstitution')}</label>
              <input type="text" {...register('nomInstitution')} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              {errors.nomInstitution && <p className="text-red-500 text-xs mt-1">{String(errors.nomInstitution?.message)}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('step3.objetPret')}</label>
              <input type="text" {...register('objet')} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              {errors.objet && <p className="text-red-500 text-xs mt-1">{String(errors.objet?.message)}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('step3.dureeEnMois')}</label>
              <input type="number" step="1" {...register('dureeEnMois', { valueAsNumber: true })} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('step3.montantInitial')}</label>
              <input type="number" step="0.01" {...register('montantInitial', { valueAsNumber: true })} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('step3.encoursSolde')}</label>
              <input type="number" step="0.01" {...register('encoursSolde', { valueAsNumber: true })} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('step3.montantEcheance')}</label>
              <input type="number" step="0.01" {...register('montantEcheance', { valueAsNumber: true })} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('step3.echeancesRetard')}</label>
              <input type="number" step="1" {...register('nombreEcheancesRetard', { valueAsNumber: true })} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('step3.echeancesRestantes')}</label>
              <input type="number" step="1" {...register('nombreEcheancesRestantes', { valueAsNumber: true })} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('step3.joursRetardMax')}</label>
              <input type="number" step="1" {...register('joursRetardMax', { valueAsNumber: true })} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 -mx-6 -mb-5 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">{t('common.cancel')}</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">{t('common.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
