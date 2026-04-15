import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Gestionnaire } from '@/types/gestionnaire.types';
import type { Agence } from '@/types/agence.types';
import { agenceService } from '@/services/agence.service';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import {  
  isAtLeast18YearsOld,
  isValidCIN,
  isValidTunisianPhone,
} from "@/utils/validators";

const gestionnaireSchema = z.object({
  email: z.string().email('Invalid email address'),
  cin: z.string().min(8, 'CIN is required').max(8, 'Max 20 characters'),
  numTelephone: z.string().min(8, 'Phone number is required').max(8, 'Invalid Phone number '),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
  role: z.string().min(1, 'Role is required'),
  agenceId: z.string().min(1, 'Agence is required'),
  active: z.boolean().optional(),
}).superRefine((data, ctx) => {
    // ───── Identity ─────
    if (!data.firstName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["firstName"],
        message: "First name is required",
      });
    }

    if (!data.lastName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lastName"],
        message: "Last name is required",
      });
    }

    // ───── Date of Birth (18+) ─────
    if (!data.dateOfBirth?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateOfBirth"],
        message: "Date of birth is required",
      });
    } else if (!isAtLeast18YearsOld(data.dateOfBirth)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateOfBirth"],
        message: "Manager must be at least 18 years old",
      });
    }

    // ───── CIN ─────
    if (!data.cin?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cin"],
        message: "CIN is required",
      });
    } else if (!isValidCIN(data.cin)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cin"],
        message: "CIN must be exactly 8 digits",
      });
    }

    // ───── Phone ─────
    if (!data.numTelephone?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["numTelephone"],
        message: "Phone number is required",
      });
    } else if (!isValidTunisianPhone(data.numTelephone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["numTelephone"],
        message: "Phone must be 8 digits",
      });
    }

    // ───── Address (optional but validated if filled) ─────
    if (data.address && data.address.trim().length > 0 && data.address.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "Address is too short",
      });
    }
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
  const { t } = useTranslation('gestionnaires');
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
          label={t('form.firstName')}
          {...register('firstName')}
          error={errors.firstName?.message}
          placeholder="John"
        />
        <Input
          label={t('form.lastName')}
          {...register('lastName')}
          error={errors.lastName?.message}
          placeholder="Doe"
        />
      </div>

      <Input
        label={t('form.email')}
        type="email"
        {...register('email')}
        error={errors.email?.message}
        placeholder="john@example.com"
        disabled={isEdit}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Input
          label={t('form.cin')}
          {...register('cin')}
          error={errors.cin?.message}
          placeholder={t('form.nationalId')}
          disabled={isEdit}
        />
        <Input
          label={t('form.phone')}
          {...register('numTelephone')}
          error={errors.numTelephone?.message}
          placeholder=" XX XXX XXX"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Input
          label={t('form.dateOfBirth')}
          type="date"
          {...register('dateOfBirth')}
          error={errors.dateOfBirth?.message}
        />
        <Input
          label={t('form.address')}
          {...register('address')}
          error={errors.address?.message}
          placeholder={t('form.streetAddress')}
        />
      </div>

      {!isEdit && (
        <Input
          label={t('form.password')}
          type="password"
          {...register('password')}
          error={errors.password?.message}
          placeholder={t('form.initialPassword')}
        />
      )}

      <div className="mb-6">
        <label htmlFor="role" className="block text-label text-surface-600 dark:text-surface-400 mb-2">
          {t('form.role')}
        </label>
        <select
          id="role"
          {...register('role')}
          className="block w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus-ring hover:border-surface-300 dark:hover:border-surface-600 focus:border-brand-500 dark:focus:border-brand-400 transition-all duration-200"
        >
          <option value="">{t('form.selectRole')}</option>
          <option value="CRO">{t('roles.CRO')}</option>
          <option value="BRANCH_DM">{t('roles.BRANCH_DM')}</option>
          <option value="HEAD_OFFICE_DM">{t('roles.HEAD_OFFICE_DM')}</option>
          <option value="RISK_ANALYST">{t('roles.RISK_ANALYST')}</option>
          <option value="FRONT_OFFICE">{t('roles.FRONT_OFFICE')}</option>
          <option value="READ_ONLY">{t('roles.READ_ONLY')}</option>
          <option value="SUPER_ADMIN">{t('roles.SUPER_ADMIN')}</option>
          <option value="TECH_USER">{t('roles.TECH_USER')}</option>
        </select>
        {errors.role && (
          <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.role.message}</p>
        )}
      </div>

      <div className="mb-6">
        <label htmlFor="agenceId" className="block text-label text-surface-600 dark:text-surface-400 mb-2">
          {t('form.agence')}
        </label>
        <select
          id="agenceId"
          {...register('agenceId')}
          className="block w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus-ring hover:border-surface-300 dark:hover:border-surface-600 focus:border-brand-500 dark:focus:border-brand-400 transition-all duration-200"
        >
          <option value="">{t('form.selectAgence')}</option>
          {agences.map((a) => (
            <option key={a.idBranch} value={a.idBranch}>
              {a.libelle} ({a.idBranch})
            </option>
          ))}
        </select>
        {errors.agenceId && (
          <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.agenceId.message}</p>
        )}
      </div>

      {isEdit && (
        <div className="flex items-center justify-between py-4 px-4 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 transition-colors">
          <div>
            <p className="text-sm font-medium text-surface-800 dark:text-surface-100">{t('form.accountStatus')}</p>
            <p className="text-xs text-surface-500 dark:text-surface-400">{t('form.enableDisableAccess')}</p>
          </div>
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  field.value ? 'bg-brand-500 dark:bg-brand-600' : 'bg-surface-300 dark:bg-surface-600'
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

      <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? t('buttons.update') : t('buttons.create')}
        </Button>
      </div>
    </form>
  );
};

export default GestionnaireForm;
