import React, { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { registerTokenGetter } from "./services/api";
import { BackendAuthProvider, useBackendAuth } from "./services/backendAuth.jsx";

import LandingPage from "./pages/LandingPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import LiveSession from "./pages/LiveSession";
import SessionSummary from "./pages/SessionSummary";
import TeacherReportCard from "./pages/TeacherReportCard";
import AdminPortal from "./pages/AdminPortal";
import Leaderboard from "./pages/Leaderboard";

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AccessState({ title, message, href, label }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="text-center space-y-3 max-w-md">
        <h2 className="font-display text-xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{message}</p>
        {href && label && (
          <a
            href={href}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-700 text-white text-sm font-medium hover:bg-brand-800 transition-colors"
          >
            {label}
          </a>
        )}
      </div>
    </div>
  );
}

function TokenRegistrar() {
  const { getToken } = useAuth();

  useEffect(() => {
    registerTokenGetter(() => getToken());
  }, [getToken]);

  return null;
}

function TeacherRoute({ children }) {
  const { isSignedIn, isLoaded } = useUser();
  const { loading, backendUser, error } = useBackendAuth();

  if (!isLoaded || loading) return <AuthLoadingScreen />;
  if (!isSignedIn) return <Navigate to="/" replace />;

  if (error) {
    return (
      <AccessState
        title="Backend Authentication Failed"
        message={`The frontend could not validate your Clerk session with the backend.${error?.status ? ` Status: ${error.status}.` : ""} ${error?.message || ""}`}
        href="/"
        label="Return Home"
      />
    );
  }

  if (backendUser?.needs_university_registration) {
    return <Navigate to="/admin" replace />;
  }

  if (backendUser?.needs_teacher_record) {
    return (
      <AccessState
        title="No Teacher Record Yet"
        message="Your Clerk account is valid, but the backend does not have a teacher record for it yet. Ask your university admin to invite you through the admin portal."
        href="/"
        label="Return Home"
      />
    );
  }

  if (!backendUser?.can_access_teacher) {
    return (
      <AccessState
        title="Access Denied"
        message="This account does not have teacher access in the backend."
        href="/"
        label="Return Home"
      />
    );
  }

  return children;
}

function AdminRoute({ children }) {
  const { isSignedIn, isLoaded } = useUser();
  const { loading, backendUser, error } = useBackendAuth();

  if (!isLoaded || loading) return <AuthLoadingScreen />;
  if (!isSignedIn) return <Navigate to="/" replace />;

  if (error) {
    return (
      <AccessState
        title="Backend Authentication Failed"
        message={`The frontend could not validate your Clerk session with the backend.${error?.status ? ` Status: ${error.status}.` : ""} ${error?.message || ""}`}
        href="/"
        label="Return Home"
      />
    );
  }

  if (backendUser?.needs_university_registration) {
    return children;
  }

  if (!backendUser?.can_access_admin) {
    return (
      <AccessState
        title="Admin Access Required"
        message="This area is only available to university admins and department heads recognized by the backend."
        href="/teacher"
        label="Go to Teacher Dashboard"
      />
    );
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/teacher"
        element={
          <TeacherRoute>
            <TeacherDashboard />
          </TeacherRoute>
        }
      />
      <Route
        path="/teacher/session/:id"
        element={
          <TeacherRoute>
            <LiveSession />
          </TeacherRoute>
        }
      />
      <Route
        path="/teacher/session/:id/summary"
        element={
          <TeacherRoute>
            <SessionSummary />
          </TeacherRoute>
        }
      />
      <Route
        path="/teacher/report"
        element={
          <TeacherRoute>
            <TeacherReportCard />
          </TeacherRoute>
        }
      />
      <Route
        path="/teacher/leaderboard"
        element={
          <TeacherRoute>
            <Leaderboard />
          </TeacherRoute>
        }
      />

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TokenRegistrar />
      <BackendAuthProvider>
        <AppRoutes />
      </BackendAuthProvider>
    </BrowserRouter>
  );
}
