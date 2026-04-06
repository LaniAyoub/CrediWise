import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Client } from '@/types/client.types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

// ── Validation schema ────────────────────────────────────────────────────────
const clientSchema = z
  .object({
    clientType: z.enum(['PHYSICAL', 'LEGAL']),

    // Physical
    firstName: z.string().optional().or(z.literal('')),
    lastName: z.string().optional().or(z.literal('')),
    dateOfBirth: z.string().optional().or(z.literal('')),
    nationalId: z.string().optional().or(z.literal('')),
    taxIdentifier: z.string().optional().or(z.literal('')),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().or(z.literal('')),
    situationFamiliale: z
      .enum(['OTHER', 'SINGLE', 'DIVORCED', 'MARRIED', 'SEPARATED', 'WIDOWER'])
      .optional()
      .or(z.literal('')),
    nationality: z.string().optional().or(z.literal('')),
    monthlyIncome: z.string().optional().or(z.literal('')),

    // Legal
    companyName: z.string().optional().or(z.literal('')),
    sigle: z.string().optional().or(z.literal('')),
    registrationNumber: z.string().optional().or(z.literal('')),
    principalInterlocutor: z.string().optional().or(z.literal('')),

    // Contact
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    primaryPhone: z.string().optional().or(z.literal('')),
    secondaryPhone: z.string().optional().or(z.literal('')),
    addressStreet: z.string().optional().or(z.literal('')),
    addressCity: z.string().optional().or(z.literal('')),
    addressPostal: z.string().optional().or(z.literal('')),
    addressCountry: z.string().optional().or(z.literal('')),

    // Other
    // agenceId is auto-injected from manager's auth context — not in the form
    relationAvecClient: z
      .enum(['SUPPLIER', 'CLIENT', 'NEIGHBOUR', 'OTHER'])
      .optional()
      .or(z.literal('')),
    scoring: z.string().optional().or(z.literal('')),
    cycle: z.string().optional().or(z.literal('')),
    cbsId: z.string().optional().or(z.literal('')),

    // Update-only
    status: z.enum(['PROSPECT', 'ACTIVE']).optional().or(z.literal('')),
  });

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  defaultValues?: Client;
  isLoading: boolean;
  isEdit?: boolean;
}

// ── Reusable select wrapper ──────────────────────────────────────────────────
const SelectField = ({
  label,
  id,
  error,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-surface-600 mb-1.5">
      {label}
    </label>
    <select
      id={id}
      className="block w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm text-surface-800 focus-ring hover:border-surface-300 focus:border-brand-500 transition-all duration-200"
      {...rest}
    >
      {children}
    </select>
    {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
  </div>
);

// ── Section header component ─────────────────────────────────────────────────
const SectionTitle = ({ title, icon }: { title: string; icon: string }) => (
  <div className="flex items-center gap-2 pt-2 pb-1 border-b border-surface-100 mb-3">
    <span className="text-base">{icon}</span>
    <h3 className="text-sm font-semibold text-surface-700">{title}</h3>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const ClientForm = ({
  onSubmit,
  defaultValues,
  isLoading,
  isEdit = false,
}: ClientFormProps) => {
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(clientSchema) as any,
    defaultValues: defaultValues
      ? {
          clientType: defaultValues.clientType,
          status: defaultValues.status,
          firstName: defaultValues.firstName || '',
          lastName: defaultValues.lastName || '',
          dateOfBirth: defaultValues.dateOfBirth?.split('T')[0] || '',
          nationalId: defaultValues.nationalId || '',
          taxIdentifier: defaultValues.taxIdentifier || '',
          gender: defaultValues.gender ?? '',
          situationFamiliale: defaultValues.situationFamiliale ?? '',
          nationality: defaultValues.nationality || '',
          monthlyIncome: defaultValues.monthlyIncome?.toString() || '',
          companyName: defaultValues.companyName || '',
          sigle: defaultValues.sigle || '',
          registrationNumber: defaultValues.registrationNumber || '',
          principalInterlocutor: defaultValues.principalInterlocutor || '',
          email: defaultValues.email || '',
          primaryPhone: defaultValues.primaryPhone || '',
          secondaryPhone: defaultValues.secondaryPhone || '',
          addressStreet: defaultValues.addressStreet || '',
          addressCity: defaultValues.addressCity || '',
          addressPostal: defaultValues.addressPostal || '',
          addressCountry: defaultValues.addressCountry || '',
          relationAvecClient: defaultValues.relationAvecClient ?? '',
          scoring: defaultValues.scoring || '',
          cycle: defaultValues.cycle || '',
          cbsId: defaultValues.cbsId || '',
        }
      : { clientType: 'PHYSICAL' },
  });

  const clientType = watch('clientType');
  const isPhysical = clientType === 'PHYSICAL';

  // Wrap onSubmit to auto-inject agenceId from the logged-in manager
  const handleFormSubmit = (data: ClientFormData) => {
    onSubmit({ ...data, agenceId: user?.agenceId || '' });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-1">

      {/* ── Type & Status ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <SelectField
          label="Client Type"
          id="clientType"
          error={errors.clientType?.message}
          {...register('clientType')}
        >
          <option value="PHYSICAL">👤 Physical Person</option>
          <option value="LEGAL">🏢 Legal Entity</option>
        </SelectField>

        {isEdit && (
          <SelectField
            label="Status"
            id="status"
            error={errors.status?.message}
            {...register('status')}
          >
            <option value="">— keep current —</option>
            <option value="PROSPECT">Prospect</option>
            <option value="ACTIVE">Active</option>
          </SelectField>
        )}
      </div>

      {/* ── Physical Person Fields ────────────────────────────────── */}
      {isPhysical && (
        <>
          <SectionTitle title="Identity" icon="🪪" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label="First Name"
              {...register('firstName')}
              error={errors.firstName?.message}
              placeholder="Mohamed"
            />
            <Input
              label="Last Name"
              {...register('lastName')}
              error={errors.lastName?.message}
              placeholder="Alaoui"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label="Date of Birth"
              type="date"
              {...register('dateOfBirth')}
              error={errors.dateOfBirth?.message}
            />
            <SelectField
              label="Gender"
              id="gender"
              error={errors.gender?.message}
              {...register('gender')}
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </SelectField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label="National ID (CIN)"
              {...register('nationalId')}
              error={errors.nationalId?.message}
              placeholder="AB123456"
            />
            <Input
              label="Tax Identifier"
              {...register('taxIdentifier')}
              error={errors.taxIdentifier?.message}
              placeholder="ICE / IF"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <SelectField
              label="Marital Status"
              id="situationFamiliale"
              error={errors.situationFamiliale?.message}
              {...register('situationFamiliale')}
            >
              <option value="">Select status</option>
              <option value="SINGLE">Single</option>
              <option value="MARRIED">Married</option>
              <option value="DIVORCED">Divorced</option>
              <option value="SEPARATED">Separated</option>
              <option value="WIDOWER">Widower</option>
              <option value="OTHER">Other</option>
            </SelectField>
            <Input
              label="Nationality"
              {...register('nationality')}
              error={errors.nationality?.message}
              placeholder="Moroccan"
            />
          </div>
          <Input
            label="Monthly Income (MAD)"
            type="number"
            min="0"
            step="0.01"
            {...register('monthlyIncome')}
            error={errors.monthlyIncome?.message}
            placeholder="5000.00"
          />
        </>
      )}

      {/* ── Legal Entity Fields ───────────────────────────────────── */}
      {!isPhysical && (
        <>
          <SectionTitle title="Company Information" icon="🏢" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label="Company Name"
              {...register('companyName')}
              error={errors.companyName?.message}
              placeholder="Société Générale SA"
            />
            <Input
              label="Sigle / Abbreviation"
              {...register('sigle')}
              error={errors.sigle?.message}
              placeholder="SG"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label="Registration Number (RC)"
              {...register('registrationNumber')}
              error={errors.registrationNumber?.message}
              placeholder="RC 123456"
            />
            <Input
              label="Principal Interlocutor"
              {...register('principalInterlocutor')}
              error={errors.principalInterlocutor?.message}
              placeholder="Mr. Jean Dupont"
            />
          </div>
        </>
      )}

      {/* ── Contact ───────────────────────────────────────────────── */}
      <SectionTitle title="Contact" icon="📞" />
      <Input
        label="Email"
        type="email"
        {...register('email')}
        error={errors.email?.message}
        placeholder="client@example.com"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Input
          label="Primary Phone"
          {...register('primaryPhone')}
          error={errors.primaryPhone?.message}
          placeholder="+212 6XX XXX XXX"
        />
        <Input
          label="Secondary Phone"
          {...register('secondaryPhone')}
          error={errors.secondaryPhone?.message}
          placeholder="+212 5XX XXX XXX"
        />
      </div>

      {/* ── Address ───────────────────────────────────────────────── */}
      <SectionTitle title="Address" icon="📍" />
      <Input
        label="Street"
        {...register('addressStreet')}
        error={errors.addressStreet?.message}
        placeholder="12 Rue Mohamed V"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
        <Input
          label="City"
          {...register('addressCity')}
          error={errors.addressCity?.message}
          placeholder="Casablanca"
        />
        <Input
          label="Postal Code"
          {...register('addressPostal')}
          error={errors.addressPostal?.message}
          placeholder="20000"
        />
        <Input
          label="Country"
          {...register('addressCountry')}
          error={errors.addressCountry?.message}
          placeholder="Morocco"
        />
      </div>

      {/* ── Banking Info ──────────────────────────────────────────── */}
      <SectionTitle title="Banking Info" icon="🏦" />

      {/* Agence is auto-assigned from the logged-in manager */}
      {user?.agenceId && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-brand-50 border border-brand-100 px-4 py-2.5">
          <span className="text-base">🏢</span>
          <span className="text-sm text-surface-600">
            Agence automatically assigned from your account:
          </span>
          <span className="text-sm font-semibold text-brand-700">
            {user.agenceId}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <SelectField
          label="Relation avec client"
          id="relationAvecClient"
          error={errors.relationAvecClient?.message}
          {...register('relationAvecClient')}
        >
          <option value="">Select relation</option>
          <option value="CLIENT">Client</option>
          <option value="SUPPLIER">Fournisseur (Supplier)</option>
          <option value="NEIGHBOUR">Voisin (Neighbour)</option>
          <option value="OTHER">Other</option>
        </SelectField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
        <Input
          label="CBS ID"
          {...register('cbsId')}
          error={errors.cbsId?.message}
          placeholder="CBS-00001"
        />
        <Input
          label="Scoring"
          {...register('scoring')}
          error={errors.scoring?.message}
          placeholder="A+"
        />
        <Input
          label="Cycle"
          {...register('cycle')}
          error={errors.cycle?.message}
          placeholder="C1"
        />
      </div>

      {/* ── Submit ────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? 'Update Client' : 'Create Client'}
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;
