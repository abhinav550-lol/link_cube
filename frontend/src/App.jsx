// ─── App.jsx ──────────────────────────────────────────────────────────────────
// Root component: sets up AuthProvider + React Router with role-based routes.

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';

// NGO Pages
import NgoDashboard   from './pages/ngo/NgoDashboard';
import NgoVillages    from './pages/ngo/NgoVillages';
import NgoVolunteers  from './pages/ngo/NgoVolunteers';
import NgoUploads     from './pages/ngo/NgoUploads';
import NgoTasks       from './pages/ngo/NgoTasks';
import TaskDetailPage from './pages/ngo/TaskDetailPage';

// Volunteer Pages
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import VolunteerTasks     from './pages/volunteer/VolunteerTasks';
import VolunteerUploads   from './pages/volunteer/VolunteerUploads';

// Shared Pages (both roles)
import ChatPage    from './pages/ChatPage';
import QuickAskPage from './pages/QuickAskPage';

// Guards
import ProtectedRoute from './components/ProtectedRoute';

// ── Root redirect: send to correct dashboard if logged in ─────────────────────
function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'ngo' ? '/ngo/dashboard' : '/volunteer/dashboard'} replace />;
}

// ── NGO route wrapper ─────────────────────────────────────────────────────────
function NgoRoute({ children }) {
  return (
    <ProtectedRoute requiredRole="ngo">
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

// ── Volunteer route wrapper ───────────────────────────────────────────────────
function VolunteerRoute({ children }) {
  return (
    <ProtectedRoute requiredRole="volunteer">
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

// ── Shared route (any authenticated role) ─────────────────────────────────────
function SharedRoute({ children }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"        element={<RootRedirect />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/signup"  element={<Signup />} />

          {/* ── NGO routes ── */}
          <Route path="/ngo/dashboard"        element={<NgoRoute><NgoDashboard /></NgoRoute>} />
          <Route path="/ngo/villages"         element={<NgoRoute><NgoVillages /></NgoRoute>} />
          <Route path="/ngo/volunteers"       element={<NgoRoute><NgoVolunteers /></NgoRoute>} />
          <Route path="/ngo/uploads"          element={<NgoRoute><NgoUploads /></NgoRoute>} />
          <Route path="/ngo/tasks"            element={<NgoRoute><NgoTasks /></NgoRoute>} />
          <Route path="/ngo/tasks/:taskId"    element={<NgoRoute><TaskDetailPage /></NgoRoute>} />

          {/* ── Volunteer routes ── */}
          <Route path="/volunteer/dashboard"        element={<VolunteerRoute><VolunteerDashboard /></VolunteerRoute>} />
          <Route path="/volunteer/tasks"            element={<VolunteerRoute><VolunteerTasks /></VolunteerRoute>} />
          <Route path="/volunteer/tasks/:taskId"    element={<VolunteerRoute><TaskDetailPage /></VolunteerRoute>} />
          <Route path="/volunteer/uploads"          element={<VolunteerRoute><VolunteerUploads /></VolunteerRoute>} />

          {/* ── Shared routes (both roles) ── */}
          <Route path="/chat"      element={<SharedRoute><ChatPage /></SharedRoute>} />
          <Route path="/quick-ask" element={<SharedRoute><QuickAskPage /></SharedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
