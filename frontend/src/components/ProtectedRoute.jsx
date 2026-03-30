// ─── ProtectedRoute ───────────────────────────────────────────────────────────
// Guards routes by auth + role. Redirects to /login if unauthenticated.

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

/**
 * ProtectedRoute
 * @param {string} requiredRole - 'ngo' | 'volunteer' | undefined (any role)
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → redirect to their correct dashboard
  if (requiredRole && user.role !== requiredRole) {
    const fallback = user.role === 'ngo' ? '/ngo/dashboard' : '/volunteer/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
