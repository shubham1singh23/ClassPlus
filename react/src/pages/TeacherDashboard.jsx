import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import Sidebar from "../components/Sidebar";
import { createSession, getTeacherSessions } from "../services/api";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import WifiOffOutlinedIcon from "@mui/icons-material/WifiOffOutlined";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TeacherDashboard() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create session form
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState("online");
  const [cameraMode, setCameraMode] = useState("front");
  const [createError, setCreateError] = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTeacherSessions(page, 20);
      const list = data.sessions || data || [];
      setSessions(Array.isArray(list) ? list : []);
      setHasMore(Array.isArray(list) && list.length === 20);
    } catch (e) {
      console.error("Failed to fetch sessions", e);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const payload = { topic: topic.trim() || undefined, mode };
      if (mode === "online") payload.camera_mode = cameraMode;
      const res = await createSession(payload);
      setShowModal(false);
      navigate(`/teacher/session/${res.session_id}`, { state: res });
    } catch (err) {
      setCreateError(
        err.response?.data?.detail || "Failed to create session."
      );
    } finally {
      setCreating(false);
    }
  };

  const orgName =
    user?.organizationMemberships?.[0]?.organization?.name ||
    user?.publicMetadata?.university_name ||
    null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar variant="teacher" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">
                Welcome back,{" "}
                <span className="text-brand-600">
                  {user?.firstName || "Teacher"}
                </span>
              </h1>
              {orgName && (
                <p className="text-sm text-slate-500 mt-0.5">{orgName}</p>
              )}
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary btn"
            >
              <AddOutlinedIcon sx={{ fontSize: 16 }} />
              Create Session
            </button>
          </div>

          {/* Session History */}
          <div className="mt-6">
            <p className="section-title">Session History</p>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-7 h-7 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="empty-state py-20">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <FolderOutlinedIcon
                    sx={{ fontSize: 26, color: "#94a3b8" }}
                  />
                </div>
                <p className="text-base font-semibold text-slate-500 mb-1">
                  No sessions yet
                </p>
                <p className="text-sm text-slate-400 max-w-xs">
                  Create your first session to start tracking student engagement
                  in real time.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-3">
                  {sessions.map((s) => (
                    <button
                      key={s.session_id || s.id}
                      onClick={() =>
                        navigate(
                          `/teacher/session/${s.session_id || s.id}/summary`
                        )
                      }
                      className="card p-4 flex items-center gap-4 hover:shadow-md hover:border-brand-200 transition-all text-left w-full group"
                    >
                      {/* Date block */}
                      <div className="w-12 h-12 rounded-xl bg-brand-50 flex flex-col items-center justify-center shrink-0">
                        <CalendarTodayOutlinedIcon
                          sx={{ fontSize: 16, color: "#4d4fe6" }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {s.topic || "Untitled Session"}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <AccessTimeOutlinedIcon sx={{ fontSize: 12 }} />
                            {formatDate(s.created_at || s.started_at)}
                            {s.created_at &&
                              ` at ${formatTime(s.created_at)}`}
                          </span>
                          {s.total_signals !== undefined && (
                            <span className="flex items-center gap-1">
                              <PeopleOutlineIcon sx={{ fontSize: 12 }} />
                              {s.total_signals} signals
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mode badge */}
                      <span
                        className={`badge ${
                          s.mode === "offline" ? "badge-slate" : "badge-blue"
                        }`}
                      >
                        {s.mode === "offline" ? (
                          <WifiOffOutlinedIcon sx={{ fontSize: 12 }} />
                        ) : (
                          <WifiOutlinedIcon sx={{ fontSize: 12 }} />
                        )}
                        {s.mode || "online"}
                      </span>

                      <ArrowForwardOutlinedIcon
                        sx={{ fontSize: 16, color: "#94a3b8" }}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-ghost btn btn-sm disabled:opacity-40"
                  >
                    <ChevronLeftIcon sx={{ fontSize: 16 }} />
                    Previous
                  </button>
                  <span className="text-xs text-slate-500">Page {page}</span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore}
                    className="btn-ghost btn btn-sm disabled:opacity-40"
                  >
                    Next
                    <ChevronRightIcon sx={{ fontSize: 16 }} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Create Session Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => !creating && setShowModal(false)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-display font-bold text-lg text-slate-900">
                New Session
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <CloseOutlinedIcon sx={{ fontSize: 20 }} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-4">
                {createError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {createError}
                  </div>
                )}

                <div>
                  <label className="label">Topic (optional)</label>
                  <input
                    className="input"
                    placeholder="e.g. Linked Lists, Thermodynamics…"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Mode</label>
                  <div className="flex gap-2">
                    {["online", "offline"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          mode === m
                            ? "border-brand-300 bg-brand-50 text-brand-700"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {m === "online" ? (
                          <WifiOutlinedIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <WifiOffOutlinedIcon sx={{ fontSize: 16 }} />
                        )}
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {mode === "online" && (
                  <div>
                    <label className="label">Camera</label>
                    <div className="flex gap-2">
                      {["front", "rear"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCameraMode(c)}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            cameraMode === c
                              ? "border-brand-300 bg-brand-50 text-brand-700"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <CameraAltOutlinedIcon sx={{ fontSize: 15 }} />
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary btn"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    "Start Session"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
