import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import Sidebar from "../components/Sidebar";
import { createSession, getTeacherSessions } from "../services/api";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import WifiOffOutlinedIcon from "@mui/icons-material/WifiOffOutlined";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";

const LIVE_SESSION_STORAGE_KEY = "classpulse.liveSession";

function formatDateTime(iso) {
  if (!iso) return "Not started";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pct(value) {
  return `${Math.round((value || 0) * 100)}%`;
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
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState("online");
  const [cameraMode, setCameraMode] = useState("camera");
  const [createError, setCreateError] = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTeacherSessions(page, 20);
      const list = Array.isArray(data?.sessions) ? data.sessions : [];
      setSessions(list);
      setHasMore((data?.page || page) * (data?.limit || 20) < (data?.total || 0));
    } catch (error) {
      console.error("Failed to fetch sessions", error);
      setSessions([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const payload = {
        topic: topic.trim() || "Untitled Session",
        mode,
      };

      if (mode === "online") {
        payload.camera_mode = cameraMode;
      }

      const res = await createSession(payload);
      const sessionState = {
        ...res,
        topic: payload.topic,
        mode: payload.mode,
        camera_mode: payload.camera_mode,
      };

      window.sessionStorage.setItem(
        LIVE_SESSION_STORAGE_KEY,
        JSON.stringify(sessionState)
      );

      setShowModal(false);
      navigate(`/teacher/session/${res.session_id}`, { state: sessionState });
    } catch (error) {
      setCreateError(error.response?.data?.detail || "Failed to create session.");
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
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8">
          <div className="page-header">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">
                Welcome back,{" "}
                <span className="text-brand-600">{user?.firstName || "Teacher"}</span>
              </h1>
              {orgName && <p className="text-sm text-slate-500 mt-0.5">{orgName}</p>}
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary btn">
              <AddOutlinedIcon sx={{ fontSize: 16 }} />
              Create Session
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => navigate("/teacher/report")}
              className="card-padded text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2">
                <AssessmentOutlinedIcon sx={{ color: "#4d4fe6" }} />
                <span className="font-semibold text-slate-900">Teacher Report Card</span>
              </div>
              <p className="text-sm text-slate-500">
                Review your ClassPulse score, AI feedback, and university ranking.
              </p>
            </button>

            <button
              onClick={() => navigate("/teacher/leaderboard")}
              className="card-padded text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2">
                <LeaderboardOutlinedIcon sx={{ color: "#d97706" }} />
                <span className="font-semibold text-slate-900">Teacher Leaderboard</span>
              </div>
              <p className="text-sm text-slate-500">
                Compare scores, department standing, and peer performance.
              </p>
            </button>

            <div className="card-padded">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">
                Session History
              </p>
              <p className="font-display text-3xl font-bold text-slate-900">
                {sessions.length}
              </p>
              <p className="text-sm text-slate-500 mt-1">Recent sessions loaded on this page.</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="section-title">Session History</p>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-7 h-7 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="empty-state py-20">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <FolderOutlinedIcon sx={{ fontSize: 26, color: "#94a3b8" }} />
                </div>
                <p className="text-base font-semibold text-slate-500 mb-1">No sessions yet</p>
                <p className="text-sm text-slate-400 max-w-xs">
                  Create your first session to start tracking student engagement in real time.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-3">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => navigate(`/teacher/session/${session.id}/summary`)}
                      className="card p-4 hover:shadow-md hover:border-brand-200 transition-all text-left w-full group"
                    >
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                          <CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: "#4d4fe6" }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                              <p className="text-sm font-semibold text-slate-800 truncate">
                                {session.topic || "Untitled Session"}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <AccessTimeOutlinedIcon sx={{ fontSize: 12 }} />
                                  {formatDateTime(session.started_at || session.ended_at)}
                                </span>
                                <span>
                                  {session.question_count || 0} questions
                                </span>
                                <span>{session.snapshot_count || 0} snapshots</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`badge ${
                                  session.mode === "offline" ? "badge-slate" : "badge-blue"
                                }`}
                              >
                                {session.mode === "offline" ? (
                                  <WifiOffOutlinedIcon sx={{ fontSize: 12 }} />
                                ) : (
                                  <WifiOutlinedIcon sx={{ fontSize: 12 }} />
                                )}
                                {session.mode || "online"}
                              </span>

                              {session.camera_mode && (
                                <span className="badge badge-slate">
                                  <CameraAltOutlinedIcon sx={{ fontSize: 12 }} />
                                  {session.camera_mode}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
                            <div className="bg-slate-50 rounded-lg px-3 py-2">
                              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                                Avg Got It
                              </p>
                              <p className="text-sm font-semibold text-green-700">
                                {pct(session.avg_got_it_pct)}
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded-lg px-3 py-2">
                              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                                Avg Lost
                              </p>
                              <p className="text-sm font-semibold text-red-700">
                                {pct(session.avg_lost_pct)}
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded-lg px-3 py-2">
                              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                                Started
                              </p>
                              <p className="text-sm font-semibold text-slate-700">
                                {session.started_at
                                  ? new Date(session.started_at).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "--"}
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded-lg px-3 py-2">
                              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                                Ended
                              </p>
                              <p className="text-sm font-semibold text-slate-700">
                                {session.ended_at
                                  ? new Date(session.ended_at).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Live / Processing"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <ArrowForwardOutlinedIcon
                            sx={{ fontSize: 16, color: "#94a3b8" }}
                            className="group-hover:translate-x-0.5 transition-transform"
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="btn-ghost btn btn-sm disabled:opacity-40"
                  >
                    <ChevronLeftIcon sx={{ fontSize: 16 }} />
                    Previous
                  </button>
                  <span className="text-xs text-slate-500">Page {page}</span>
                  <button
                    onClick={() => setPage((current) => current + 1)}
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

      {showModal && (
        <div className="modal-overlay" onClick={() => !creating && setShowModal(false)}>
          <div className="modal-box" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-display font-bold text-lg text-slate-900">New Session</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                type="button"
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
                  <label className="label">Topic</label>
                  <input
                    className="input"
                    placeholder="e.g. Newton's Laws"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Mode</label>
                  <div className="flex gap-2">
                    {["online", "offline"].map((modeOption) => (
                      <button
                        key={modeOption}
                        type="button"
                        onClick={() => setMode(modeOption)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          mode === modeOption
                            ? "border-brand-300 bg-brand-50 text-brand-700"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {modeOption === "online" ? (
                          <WifiOutlinedIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <WifiOffOutlinedIcon sx={{ fontSize: 16 }} />
                        )}
                        {modeOption.charAt(0).toUpperCase() + modeOption.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {mode === "online" && (
                  <div>
                    <label className="label">Teaching Input</label>
                    <div className="flex gap-2">
                      {["camera", "screen_share"].map((cameraOption) => (
                        <button
                          key={cameraOption}
                          type="button"
                          onClick={() => setCameraMode(cameraOption)}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            cameraMode === cameraOption
                              ? "border-brand-300 bg-brand-50 text-brand-700"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <CameraAltOutlinedIcon sx={{ fontSize: 15 }} />
                          {cameraOption === "screen_share" ? "Screen Share" : "Camera"}
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
                <button type="submit" className="btn-primary btn" disabled={creating}>
                  {creating ? "Creating..." : "Start Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
