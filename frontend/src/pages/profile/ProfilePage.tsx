import React, { useEffect, useState } from 'react';
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
      toast.success('Profile updated successfully');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update profile');
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
      toast.success('Password changed successfully');
      resetPassword();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const initials = user
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
    : '?';

  return (
    <div className="page-container max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Profile</h1>
        <p className="text-surface-500 mt-1">Manage your account information</p>
      </div>

      {/* Profile card header */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-brand-600 via-brand-500 to-violet-500 relative">
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center border-4 border-white shadow-lg">
              <span className="text-white font-bold text-2xl">{initials}</span>
            </div>
          </div>
        </div>
        <div className="pt-16 px-6 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-surface-900">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-surface-500">{user?.email}</p>
            </div>
            <Badge variant="info" size="md">{user?.role}</Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">Agence</p>
              <p className="text-surface-700">{profile?.agence?.libelle || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">CIN</p>
              <p className="font-mono text-surface-700">{profile?.cin || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Update profile form */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-6">
        <h3 className="text-lg font-semibold text-surface-900 mb-1">Personal Information</h3>
        <p className="text-sm text-surface-500 mb-5">Update your name, phone, address and date of birth</p>
        <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label="First Name"
              {...registerProfile('firstName')}
              error={profileErrors.firstName?.message}
            />
            <Input
              label="Last Name"
              {...registerProfile('lastName')}
              error={profileErrors.lastName?.message}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label="Phone Number"
              {...registerProfile('numTelephone')}
              error={profileErrors.numTelephone?.message}
              placeholder="+216 XX XXX XXX"
            />
            <Input
              label="Date of Birth"
              type="date"
              {...registerProfile('dateOfBirth')}
              error={profileErrors.dateOfBirth?.message}
            />
          </div>
          <Input
            label="Address"
            {...registerProfile('address')}
            error={profileErrors.address?.message}
            placeholder="Street address"
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isUpdatingProfile}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Change password form */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-6">
        <h3 className="text-lg font-semibold text-surface-900 mb-1">Change Password</h3>
        <p className="text-sm text-surface-500 mb-5">Choose a strong password of at least 8 characters</p>
        <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-1">
          <Input
            label="Current Password"
            type="password"
            {...registerPassword('currentPassword')}
            error={passwordErrors.currentPassword?.message}
            placeholder="••••••••"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label="New Password"
              type="password"
              {...registerPassword('newPassword')}
              error={passwordErrors.newPassword?.message}
              placeholder="••••••••"
            />
            <Input
              label="Confirm New Password"
              type="password"
              {...registerPassword('confirmPassword')}
              error={passwordErrors.confirmPassword?.message}
              placeholder="••••••••"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isChangingPassword}>
              Change Password
            </Button>
          </div>
        </form>
      </div>

      {/* Sign out */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-6">
        <h3 className="text-lg font-semibold text-surface-900 mb-1">Session</h3>
        <p className="text-sm text-surface-500 mb-4">Sign out of your account on this device</p>
        <Button variant="danger" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;
