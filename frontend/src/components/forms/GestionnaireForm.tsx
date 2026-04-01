import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Gestionnaire } from '@/types/gestionnaire.types';
import type { Agence } from '@/types/agence.types';
import { agenceService } from '@/services/agence.service';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const gestionnaireSchema = z.object({
  email: z.string().email('Invalid email address'),
  cin: z.string().min(1, 'CIN is required').max(20, 'Max 20 characters'),
  numTelephone: z.string().min(1, 'Phone number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
  role: z.string().min(1, 'Role is required'),
  agenceId: z.string().min(1, 'Agence is required'),
  active: z.boolean().optional(),
});

type GestionnaireFormData = z.infer<typeof gestionnaireSchema>;

interface GestionnaireFormProps {
  onSubmit: (data: GestionnaireFormData) => void;
  defaultValues?: Gestionnaire;
  isLoading: boolean;
  isEdit?: boolean;
}

const GestionnaireForm = ({
  onSubmit,
  defaultValues,
  isLoading,
  isEdit = false,
}: GestionnaireFormProps) => {
  const [agences, setAgences] = useState<Agence[]>([]);

  useEffect(() => {
    agenceService.getAll().then((res) => setAgences(res.data)).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<GestionnaireFormData>({
    resolver: zodResolver(gestionnaireSchema),
    defaultValues: defaultValues
      ? {
          email: defaultValues.email,
          cin: defaultValues.cin,
          numTelephone: defaultValues.numTelephone,
          firstName: defaultValues.firstName,
          lastName: defaultValues.lastName,
          dateOfBirth: defaultValues.dateOfBirth?.split('T')[0] || '',
          address: defaultValues.address || '',
          role: defaultValues.role,
          agenceId: defaultValues.agence?.idBranch || '',
          active: defaultValues.active,
        }
      : { role: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Input
          label="First Name"
          {...register('firstName')}
          error={errors.firstName?.message}
          placeholder="John"
        />
        <Input
          label="Last Name"
          {...register('lastName')}
          error={errors.lastName?.message}
          placeholder="Doe"
        />
      </div>

      <Input
        label="Email"
        type="email"
        {...register('email')}
        error={errors.email?.message}
        placeholder="john@example.com"
        disabled={isEdit}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Input
          label="CIN"
          {...register('cin')}
          error={errors.cin?.message}
          placeholder="National ID"
          disabled={isEdit}
        />
        <Input
          label="Phone Number"
          {...register('numTelephone')}
          error={errors.numTelephone?.message}
          placeholder="+212 6XX XXX XXX"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Input
          label="Date of Birth"
          type="date"
          {...register('dateOfBirth')}
          error={errors.dateOfBirth?.message}
        />
        <Input
          label="Address"
          {...register('address')}
          error={errors.address?.message}
          placeholder="Street address"
        />
      </div>

      {!isEdit && (
        <Input
          label="Password"
          type="password"
          {...register('password')}
          error={errors.password?.message}
          placeholder="Initial password"
        />
      )}

      <div className="mb-4">
        <label htmlFor="role" className="block text-sm font-medium text-surface-600 mb-1.5">
          Role
        </label>
        <select
          id="role"
          {...register('role')}
          className="block w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm text-surface-800 focus-ring hover:border-surface-300 focus:border-brand-500 transition-all duration-200"
        >
          <option value="">Select a role</option>
          <option value="CRO">Client Relationship Officer</option>
          <option value="BRANCH_DM">Branch Decision Maker</option>
          <option value="HEAD_OFFICE_DM">Head Office Decision Maker</option>
          <option value="RISK_ANALYST">Credit Risk Analyst</option>
          <option value="FRONT_OFFICE">Front Office</option>
          <option value="READ_ONLY">Read Only User</option>
          <option value="SUPER_ADMIN">Super Administrator</option>
          <option value="TECH_USER">Tech User</option>
        </select>
        {errors.role && (
          <p className="mt-1.5 text-xs text-red-500">{errors.role.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="agenceId" className="block text-sm font-medium text-surface-600 mb-1.5">
          Agence
        </label>
        <select
          id="agenceId"
          {...register('agenceId')}
          className="block w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm text-surface-800 focus-ring hover:border-surface-300 focus:border-brand-500 transition-all duration-200"
        >
          <option value="">Select an agence</option>
          {agences.map((a) => (
            <option key={a.idBranch} value={a.idBranch}>
              {a.libelle} ({a.idBranch})
            </option>
          ))}
        </select>
        {errors.agenceId && (
          <p className="mt-1.5 text-xs text-red-500">{errors.agenceId.message}</p>
        )}
      </div>

      {isEdit && (
        <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-surface-200 bg-surface-50">
          <div>
            <p className="text-sm font-medium text-surface-800">Account Status</p>
            <p className="text-xs text-surface-500">Enable or disable this manager's access</p>
          </div>
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  field.value ? 'bg-brand-500' : 'bg-surface-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    field.value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            )}
          />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? 'Update Manager' : 'Create Manager'}
        </Button>
      </div>
    </form>
  );
};

export default GestionnaireForm;
