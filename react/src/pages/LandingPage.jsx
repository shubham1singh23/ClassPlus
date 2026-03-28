import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignIn, SignUp, useUser } from "@clerk/clerk-react";
import { useBackendAuth } from "../services/backendAuth.jsx";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import LiveTvOutlinedIcon from "@mui/icons-material/LiveTvOutlined";

const features = [
  {
    icon: LiveTvOutlinedIcon,
    title: "Live Sessions",
    desc: "Real-time student engagement tracking with instant confusion signals.",
  },
  {
    icon: InsightsOutlinedIcon,
    title: "AI Insights",
    desc: "Board detection, auto-notes, and smart doubt summarisation.",
  },
  {
    icon: SchoolOutlinedIcon,
    title: "Analytics",
    desc: "Comprehensive report cards, leaderboards, and trend analysis.",
  },
];

export default function LandingPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { loading, backendUser, error } = useBackendAuth();
  const navigate = useNavigate();
  const [mode, setMode] = React.useState("signin");

  useEffect(() => {
    if (isLoaded && !loading && isSignedIn && user) {
      if (backendUser?.needs_university_registration) {
        navigate("/admin", { replace: true });
        return;
      }
      if (backendUser?.can_access_admin) {
        navigate("/admin", { replace: true });
        return;
      }
      if (backendUser?.can_access_teacher) {
        navigate("/teacher", { replace: true });
      }
    }
  }, [backendUser, isLoaded, isSignedIn, loading, navigate, user]);

  if (!isLoaded || (isSignedIn && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isSignedIn && (backendUser?.can_access_teacher || backendUser?.can_access_admin || backendUser?.needs_university_registration)) {
    return null;
  }

  if (isSignedIn && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md text-center space-y-3">
          <h2 className="font-display text-xl font-bold text-slate-900">
            {error ? "Backend Authentication Failed" : "Backend Access Not Ready"}
          </h2>
          <p className="text-sm text-slate-500">
            {error
              ? `The frontend could not validate your Clerk session with the backend.${error.status ? ` Status: ${error.status}.` : ""} ${error.message}`
              : "Your Clerk session is active, but this account is not fully set up in the backend yet. If you are the first university admin, open `/admin` to register the university. If you are a teacher, ask your admin to create your teacher account from the admin portal."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50 flex flex-col">
      {/* Navbar */}
      <header className="w-full px-6 lg:px-10 py-4 flex items-center justify-between border-b border-slate-100 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center shadow-sm">
            <BoltOutlinedIcon sx={{ fontSize: 18, color: "white" }} />
          </div>
          <span className="font-display text-lg font-bold text-slate-900 tracking-tight">
            ClassPulse<span className="text-brand-600"> Pro</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode("signin")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mode === "signin"
                ? "bg-brand-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mode === "signup"
                ? "bg-brand-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Sign Up
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-6 py-12 lg:py-0 max-w-6xl mx-auto w-full">
        {/* Left — Hero */}
        <div className="flex-1 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            AI-Powered Classroom Intelligence
          </div>

          <h1 className="font-display text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
            Transform Every<br />
            <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
              Lecture Into Data
            </span>
          </h1>

          <p className="text-slate-500 text-base lg:text-lg leading-relaxed max-w-md">
            Real-time confusion tracking, AI-powered board detection, smart
            quizzes, and session analytics — all in one platform for modern
            educators.
          </p>

          {/* Feature pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-brand-200 transition-all duration-300 cursor-default"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center mb-2.5 group-hover:bg-brand-100 transition-colors">
                  <Icon sx={{ fontSize: 18, color: "#4d4fe6" }} />
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1">
                  {title}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Auth */}
        <div className="w-full max-w-sm shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 p-1">
            {mode === "signin" ? (
              <SignIn
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-0 !rounded-xl",
                  },
                }}
              />
            ) : (
              <SignUp
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-0 !rounded-xl",
                  },
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100">
        © {new Date().getFullYear()} ClassPulse Pro — Built for modern educators
      </footer>
    </div>
  );
}
