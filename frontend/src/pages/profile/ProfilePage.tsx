import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
    : '?';

  return (
    <div className="page-container max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Profile</h1>
        <p className="text-surface-500 mt-1">Your account information</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-card overflow-hidden">
        {/* Header gradient */}
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

          <hr className="my-6 border-surface-100" />

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                User ID
              </p>
              <p className="text-sm font-mono text-surface-700 break-all">{user?.id}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                Email
              </p>
              <p className="text-sm text-surface-700">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                First Name
              </p>
              <p className="text-sm text-surface-700">{user?.firstName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                Last Name
              </p>
              <p className="text-sm text-surface-700">{user?.lastName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                Role
              </p>
              <p className="text-sm text-surface-700">{user?.role}</p>
            </div>
            {user?.agenceId && (
              <div>
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                  Agence ID
                </p>
                <p className="text-sm font-mono text-surface-700">{user.agenceId}</p>
              </div>
            )}
          </div>

          <hr className="my-6 border-surface-100" />

          <div className="flex gap-3">
            <Button variant="danger" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
