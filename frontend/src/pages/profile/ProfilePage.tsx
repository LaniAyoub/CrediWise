import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { profileService } from '@/services/profile.service';
import type { Gestionnaire } from '@/types/gestionnaire.types';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  numTelephone: z.string().min(1, 'Phone is required'),
  address: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const ProfilePage = () => {
  const { t } = useTranslation('common');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Gestionnaire | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({ resolver: zodResolver(profileSchema) });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    profileService.getProfile().then((res) => {
      setProfile(res.data);
      resetProfile({
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        numTelephone: res.data.numTelephone,
        address: res.data.address || '',
        dateOfBirth: res.data.dateOfBirth?.split('T')[0] || '',
      });
    }).catch(() => {});
  }, [resetProfile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const onUpdateProfile = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    try {
      await profileService.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        numTelephone: data.numTelephone,
        ...(data.address && { address: data.address }),
        ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
      });
      toast.success(t('common.profileUpdated'));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('common.profileUpdateFailed'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onChangePassword = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      await profileService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success(t('common.passwordChanged'));
      resetPassword();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('common.passwordChangeFailed'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const initials = user
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
    : '?';

  return (
    <div className="page-container max-w-3xl mx-auto space-y-8 py-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-page-title text-surface-900 dark:text-surface-50">{t('common.profile')}</h1>
        <p className="text-body text-surface-600 dark:text-surface-400">{t('common.manageAccount')}</p>
      </div>

      {/* Profile card header - Enhanced */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-md dark:shadow-lg overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-xl">
        <div className="h-40 bg-gradient-to-r from-brand-600 via-brand-500 to-violet-500 relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-20 -mt-20" />
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center border-4 border-white shadow-2xl">
              <span className="text-white font-bold text-4xl">{initials}</span>
            </div>
          </div>
        </div>
        <div className="pt-20 px-8 pb-8">
          <div className="flex items-start justify-between gap-6 mb-8">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-surface-900 dark:text-surface-50 mb-2">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-surface-600 dark:text-surface-400 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-brand-500" />
                {user?.email}
              </p>
            </div>
            <Badge variant="info" size="md">
              {user?.role}
            </Badge>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-surface-200 dark:border-surface-700">
            <div className="space-y-1">
              <p className="text-label text-surface-600 dark:text-surface-400">{t('common.agence')}</p>
              <p className="text-base font-semibold text-surface-900 dark:text-surface-100">{profile?.agence?.libelle || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-label text-surface-600 dark:text-surface-400">{t('common.cin')}</p>
              <p className="text-base font-mono font-semibold text-surface-900 dark:text-surface-100">{profile?.cin || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Update profile form */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-lg dark:shadow-lg p-8 transition-shadow hover:shadow-xl dark:hover:shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-2xl font-bold text-surface-900 dark:text-surface-50">{t('common.personalInformation')}</h3>
        </div>
        <p className="text-base text-surface-600 dark:text-surface-400 mb-7 ml-9">{t('common.updatePersonal')}</p>
        <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label={t('common.firstName')}
              {...registerProfile('firstName')}
              error={profileErrors.firstName?.message}
            />
            <Input
              label={t('common.lastName')}
              {...registerProfile('lastName')}
              error={profileErrors.lastName?.message}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label={t('common.phone')}
              {...registerProfile('numTelephone')}
              error={profileErrors.numTelephone?.message}
              placeholder={t('placeholders.phoneNumber')}
            />
            <Input
              label={t('common.dateOfBirth')}
              type="date"
              {...registerProfile('dateOfBirth')}
              error={profileErrors.dateOfBirth?.message}
            />
          </div>
          <Input
            label={t('common.address')}
            {...registerProfile('address')}
            error={profileErrors.address?.message}
            placeholder={t('placeholders.streetAddress')}
            className="focus:ring-2 focus:ring-brand-500"
          />
          <div className="flex justify-end pt-4">
            <Button type="submit" isLoading={isUpdatingProfile}>
              {t('common.saveChanges')}
            </Button>
          </div>
        </form>
      </div>

      {/* Change password form */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-lg dark:shadow-lg p-8 transition-shadow hover:shadow-xl dark:hover:shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-2xl font-bold text-surface-900 dark:text-surface-50">{t('common.changePassword')}</h3>
        </div>
        <p className="text-base text-surface-600 dark:text-surface-400 mb-7 ml-9">{t('common.passwordInstructions')}</p>
        <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-6">
          <Input
            label={t('common.currentPassword')}
            type="password"
            {...registerPassword('currentPassword')}
            error={passwordErrors.currentPassword?.message}
            placeholder={t('placeholders.password')}
            className="focus:ring-2 focus:ring-amber-500"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label={t('common.newPassword')}
              type="password"
              {...registerPassword('newPassword')}
              error={passwordErrors.newPassword?.message}
              placeholder={t('placeholders.password')}
              className="focus:ring-2 focus:ring-amber-500"
            />
            <Input
              label={t('common.confirmPassword')}
              type="password"
              {...registerPassword('confirmPassword')}
              error={passwordErrors.confirmPassword?.message}
              placeholder={t('placeholders.password')}
              className="focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" isLoading={isChangingPassword}>
              {t('common.changePassword')}
            </Button>
          </div>
        </form>
      </div>

      {/* Sign out */}
      <div className="bg-gradient-to-br from-red-50 to-red-50/50 dark:from-red-900/20 dark:to-red-900/10 rounded-xl border border-red-200 dark:border-red-800 shadow-lg dark:shadow-lg p-8">
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <h3 className="text-2xl font-bold text-surface-900 dark:text-surface-50">{t('session')}</h3>
        </div>
        <p className="text-base text-surface-600 dark:text-surface-400 mb-6 ml-9">{t('common.signOutMessage')}</p>
        <div className="ml-9">
          <Button variant="danger" onClick={handleLogout}>
            {t('signOut')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
