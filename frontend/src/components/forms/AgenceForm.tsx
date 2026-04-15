import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Agence } from '@/types/agence.types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const agenceCreateSchema = z.object({
  idBranch: z.string().min(1, 'Branch ID is required').max(10, 'Max 10 characters'),
  libelle: z.string().min(1, 'Label is required').max(100, 'Max 100 characters'),
  wording: z.string().max(200, 'Max 200 characters').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

type AgenceFormData = z.infer<typeof agenceCreateSchema>;

interface AgenceFormProps {
  onSubmit: (data: AgenceFormData) => void;
  defaultValues?: Agence;
  isLoading: boolean;
  isEdit?: boolean;
}

const AgenceForm = ({ onSubmit, defaultValues, isLoading, isEdit = false }: AgenceFormProps) => {
  const { t } = useTranslation('agences');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AgenceFormData>({
    resolver: zodResolver(agenceCreateSchema),
    defaultValues: defaultValues
      ? {
          idBranch: defaultValues.idBranch,
          libelle: defaultValues.libelle,
          wording: defaultValues.wording || '',
          isActive: defaultValues.active,
        }
      : { isActive: true },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
      <Input
        label={t('form.branchId')}
        {...register('idBranch')}
        error={errors.idBranch?.message}
        placeholder="e.g. BR001"
        disabled={isEdit}
      />
      <Input
        label={t('form.label')}
        {...register('libelle')}
        error={errors.libelle?.message}
        placeholder={t('form.branchNamePlaceholder')}
      />
      <Input
        label={t('form.description')}
        {...register('wording')}
        error={errors.wording?.message}
        placeholder={t('form.descriptionPlaceholder')}
      />
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            {...register('isActive')}
            className="w-4 h-4 rounded border-surface-300 dark:border-surface-600 text-brand-600 dark:text-brand-500 focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 transition-colors"
          />
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300 group-hover:text-surface-800 dark:group-hover:text-surface-200 transition-colors">{t('form.active')}</span>
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? t('buttons.update') : t('buttons.create')}
        </Button>
      </div>
    </form>
  );
};

export default AgenceForm;
