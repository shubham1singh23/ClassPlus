import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { getReportCard } from "../services/api";

import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

function scoreColor(score) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function scoreRing(score) {
  if (score >= 80) return "from-green-400 to-emerald-600";
  if (score >= 60) return "from-amber-400 to-orange-600";
  return "from-red-400 to-rose-600";
}

export default function TeacherReportCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await getReportCard();
        setData(res);
      } catch (e) {
        setError(e.response?.data?.detail || "Failed to load report card.");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar variant="teacher" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-8">
          <div className="page-header">
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Report Card
            </h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-28">
              <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="card-padded text-center py-16">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : !data ? (
            <div className="empty-state py-20">
              <AssessmentOutlinedIcon
                sx={{ fontSize: 40, color: "#94a3b8" }}
              />
              <p className="text-base font-semibold text-slate-500 mt-3">
                No report card available
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Complete some sessions to generate your report.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score Hero */}
              <div className="card border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-2xl shadow-xl">
                <div className="flex items-center gap-8">
                  <div className="relative w-32 h-32 shrink-0">
                    {/* Ring */}
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60" cy="60" r="52"
                        stroke="#334155"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="60" cy="60" r="52"
                        stroke="url(#scoreGrad)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(data.score / 100) * 327} 327`}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#818cf8" />
                          <stop offset="100%" stopColor="#4d4fe6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-3xl font-bold">
                        {Math.round(data.score ?? 0)}
                      </span>
                      <span className="text-xs text-slate-400 uppercase tracking-wide">Score</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h2 className="font-display text-xl font-bold mb-1">
                      ClassPulse Score
                    </h2>
                    <p className="text-sm text-slate-400 leading-relaxed mb-4">
                      Your overall teaching effectiveness score based on student
                      engagement signals across all sessions.
                    </p>
                    <div className="flex gap-4">
                      <div className="bg-white/10 rounded-lg px-4 py-2">
                        <SchoolOutlinedIcon
                          sx={{ fontSize: 16, color: "#94a3b8" }}
                        />
                        <span className="text-sm ml-1.5">
                          {data.session_count ?? 0} sessions
                        </span>
                      </div>
                      {data.rank && (
                        <div className="bg-white/10 rounded-lg px-4 py-2">
                          <EmojiEventsOutlinedIcon
                            sx={{ fontSize: 16, color: "#fbbf24" }}
                          />
                          <span className="text-sm ml-1.5">
                            Rank #{data.rank}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Best Sessions */}
                <div className="card-padded">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUpOutlinedIcon
                      sx={{ fontSize: 18, color: "#16a34a" }}
                    />
                    <h3 className="font-display font-bold text-base text-slate-900">
                      Best Sessions
                    </h3>
                  </div>
                  {(data.best_sessions || []).length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">
                      No data yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {data.best_sessions.map((s, i) => (
                        <div
                          key={s.session_id || i}
                          className="flex items-center gap-3 bg-green-50 rounded-lg p-3"
                        >
                          <span className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {s.topic || "Untitled"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {s.date || s.created_at
                                ? new Date(
                                    s.date || s.created_at
                                  ).toLocaleDateString()
                                : ""}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-green-700">
                            {Math.round(s.score ?? s.classpulse_score ?? 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Worst Sessions */}
                <div className="card-padded">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDownOutlinedIcon
                      sx={{ fontSize: 18, color: "#dc2626" }}
                    />
                    <h3 className="font-display font-bold text-base text-slate-900">
                      Needs Improvement
                    </h3>
                  </div>
                  {(data.worst_sessions || []).length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">
                      No data yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {data.worst_sessions.map((s, i) => (
                        <div
                          key={s.session_id || i}
                          className="flex items-center gap-3 bg-red-50 rounded-lg p-3"
                        >
                          <span className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-700">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {s.topic || "Untitled"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {s.date || s.created_at
                                ? new Date(
                                    s.date || s.created_at
                                  ).toLocaleDateString()
                                : ""}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-red-700">
                            {Math.round(s.score ?? s.classpulse_score ?? 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* AI Feedback */}
              {data.feedback_text && (
                <div className="card-padded">
                  <div className="flex items-center gap-2 mb-3">
                    <SmartToyOutlinedIcon
                      sx={{ fontSize: 18, color: "#4d4fe6" }}
                    />
                    <h3 className="font-display font-bold text-base text-slate-900">
                      AI Feedback
                    </h3>
                  </div>
                  <div className="bg-brand-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed border border-brand-100">
                    {data.feedback_text}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
