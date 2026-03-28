import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useBackendAuth } from "../services/backendAuth.jsx";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";

const teacherLinks = [
  { to: "/teacher", label: "Dashboard", icon: DashboardOutlinedIcon, exact: true },
  { to: "/teacher/report", label: "Report Card", icon: AssessmentOutlinedIcon },
  { to: "/teacher/leaderboard", label: "Leaderboard", icon: LeaderboardOutlinedIcon },
];

const adminLinks = [
  { to: "/admin", label: "Admin Portal", icon: SchoolOutlinedIcon, exact: true },
  { to: "/admin/leaderboard", label: "Leaderboard", icon: LeaderboardOutlinedIcon },
];

export default function Sidebar({ variant = "teacher" }) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { backendUser } = useBackendAuth();
  const navigate = useNavigate();
  const links = variant === "admin" ? adminLinks : teacherLinks;
  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
    : "U";
  const role = backendUser?.role || "teacher";
  const canSeeAdmin = role === "admin" || role === "dept_head";

  return (
    <aside
      className="flex flex-col h-screen bg-white border-r border-slate-200 shrink-0"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
        <div className="w-7 h-7 rounded bg-brand-700 flex items-center justify-center">
          <BoltOutlinedIcon sx={{ fontSize: 16, color: "white" }} />
        </div>
        <span className="font-display text-base font-bold text-slate-900 tracking-tight">
          ClassPulse
          <span className="text-brand-600"> Pro</span>
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto scrollbar-thin">
        <p className="section-title px-2">Navigation</p>
        {links.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-all ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon sx={{ fontSize: 18 }} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRightIcon sx={{ fontSize: 14, opacity: 0.5 }} />}
              </>
            )}
          </NavLink>
        ))}

        {canSeeAdmin && (
          <div className="mt-4">
            <p className="section-title px-2">Switch</p>
            {variant === "teacher" ? (
              <NavLink
                to="/admin"
                className="flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium text-slate-500 hover:bg-slate-50 transition-all"
              >
                <SchoolOutlinedIcon sx={{ fontSize: 18 }} />
                Admin Portal
              </NavLink>
            ) : (
              <NavLink
                to="/teacher"
                className="flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium text-slate-500 hover:bg-slate-50 transition-all"
              >
                <DashboardOutlinedIcon sx={{ fontSize: 18 }} />
                Teacher View
              </NavLink>
            )}
          </div>
        )}
      </nav>

      <div className="px-3 py-3 border-t border-slate-100">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded hover:bg-slate-50 transition-all">
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-brand-700">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress || "User"}
            </p>
            <p className="text-xs text-slate-400 truncate">{role}</p>
          </div>
          <button
            onClick={() => signOut(() => navigate("/"))}
            className="text-slate-400 hover:text-red-500 transition-colors"
            title="Sign out"
          >
            <LogoutOutlinedIcon sx={{ fontSize: 16 }} />
          </button>
        </div>
      </div>
    </aside>
  );
}
