import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

/**
 * Renders children only if the user's role is in allowedRoles.
 * Otherwise redirects to /dashboard.
 */
const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { user } = useAuth();
  const userRole = user?.role || '';

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
