import React from 'react';
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
        label="Branch ID"
        {...register('idBranch')}
        error={errors.idBranch?.message}
        placeholder="e.g. BR001"
        disabled={isEdit}
      />
      <Input
        label="Label (Libellé)"
        {...register('libelle')}
        error={errors.libelle?.message}
        placeholder="Branch name"
      />
      <Input
        label="Description (Wording)"
        {...register('wording')}
        error={errors.wording?.message}
        placeholder="Optional description"
      />
      <div className="mb-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('isActive')}
            className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm font-medium text-surface-600">Active</span>
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? 'Update Agence' : 'Create Agence'}
        </Button>
      </div>
    </form>
  );
};

export default AgenceForm;
