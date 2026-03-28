import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { registerTokenGetter } from "./services/api";

import LandingPage from "./pages/LandingPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import LiveSession from "./pages/LiveSession";
import SessionSummary from "./pages/SessionSummary";
import TeacherReportCard from "./pages/TeacherReportCard";
import AdminPortal from "./pages/AdminPortal";
import Leaderboard from "./pages/Leaderboard";

/* ─── Auth helpers ─────────────────────────────────────────────────────── */

function isAdminUser(user) {
  if (!user) return false;
  const role = user.publicMetadata?.role;
  if (role === "admin" || role === "dept_head") return true;
  const memberships = user.organizationMemberships || [];
  return memberships.some(
    (m) => m.role === "admin" || m.role === "org:admin"
  );
}

/* ─── Token Registration ───────────────────────────────────────────────── */

function TokenRegistrar() {
  const { getToken } = useAuth();
  useEffect(() => {
    registerTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}

/* ─── Protected Route Wrapper ──────────────────────────────────────────── */

function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/* ─── Admin Route Wrapper ──────────────────────────────────────────────── */

function AdminRoute({ children }) {
  const { user, isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  if (!isAdminUser(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold text-slate-900">
            Access Denied
          </h2>
          <p className="text-sm text-slate-500">
            You don't have admin privileges. Contact your administrator if you
            believe this is an error.
          </p>
          <a
            href="/teacher"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-700 text-white text-sm font-medium hover:bg-brand-800 transition-colors"
          >
            Go to Teacher Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
}

/* ─── App ──────────────────────────────────────────────────────────────── */

export default function App() {
  return (
    <BrowserRouter>
      <TokenRegistrar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Teacher */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/session/:id"
          element={
            <ProtectedRoute>
              <LiveSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/session/:id/summary"
          element={
            <ProtectedRoute>
              <SessionSummary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/report"
          element={
            <ProtectedRoute>
              <TeacherReportCard />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPortal />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/leaderboard"
          element={
            <AdminRoute>
              <Leaderboard />
            </AdminRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
