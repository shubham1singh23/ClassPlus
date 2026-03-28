import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import Sidebar from "../components/Sidebar";
import ConfusionHeatmap from "../components/ConfusionHeatmap";
import VideoPlayer from "../components/VideoPlayer";
import {
  getSessionSummary,
  getNotesUrl,
  getVideoUrl,
} from "../services/api";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import QuestionAnswerOutlinedIcon from "@mui/icons-material/QuestionAnswerOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SignalCellularAltOutlinedIcon from "@mui/icons-material/SignalCellularAltOutlined";

export default function SessionSummary() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [notesLoading, setNotesLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const res = await getSessionSummary(sessionId);
        setData(res);
      } catch (e) {
        setError(e.response?.data?.detail || "Failed to load summary.");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [sessionId]);

  const handleNotesUrl = async () => {
    setNotesLoading(true);
    try {
      const res = await getNotesUrl(sessionId);
      if (res?.url || res?.notes_url) {
        window.open(res.url || res.notes_url, "_blank");
      }
    } catch (e) {
      console.error("Notes URL fetch failed", e);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleVideoUrl = async () => {
    setVideoLoading(true);
    try {
      const res = await getVideoUrl(sessionId);
      if (res?.url || res?.video_url) {
        setVideoUrl(res.url || res.video_url);
      }
    } catch (e) {
      console.error("Video URL fetch failed", e);
    } finally {
      setVideoLoading(false);
    }
  };

  // Prepare chart data from snapshots
  const chartData = (data?.snapshots || []).map((s, i) => ({
    time: s.time || s.timestamp || `T${i + 1}`,
    "Got It": Math.round((s.got_it_pct || 0) * 100),
    "Sort Of": Math.round((s.sort_of_pct || 0) * 100),
    Lost: Math.round((s.lost_pct || 0) * 100),
  }));

  const session = data?.session || {};
  const questions = data?.questions || [];
  const totalSignals = data?.total_signals ?? 0;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar variant="teacher" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
          {/* Back */}
          <button
            onClick={() => navigate("/teacher")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-5"
          >
            <ArrowBackOutlinedIcon sx={{ fontSize: 16 }} />
            Back to Dashboard
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-28">
              <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="card-padded text-center py-16">
              <p className="text-red-600 font-medium mb-2">{error}</p>
              <button
                onClick={() => navigate("/teacher")}
                className="btn-secondary btn"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="page-header">
                <div>
                  <h1 className="font-display text-2xl font-bold text-slate-900">
                    {session.topic || "Session Summary"}
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {session.created_at
                      ? new Date(session.created_at).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          }
                        )
                      : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleNotesUrl}
                    disabled={notesLoading}
                    className="btn-secondary btn btn-sm"
                  >
                    <DescriptionOutlinedIcon sx={{ fontSize: 15 }} />
                    {notesLoading ? "Loading…" : "Notes PDF"}
                  </button>
                  <button
                    onClick={handleVideoUrl}
                    disabled={videoLoading}
                    className="btn-secondary btn btn-sm"
                  >
                    <PlayCircleOutlineIcon sx={{ fontSize: 15 }} />
                    {videoLoading ? "Loading…" : "View Recording"}
                  </button>
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="card-padded text-center">
                  <SignalCellularAltOutlinedIcon
                    sx={{ fontSize: 20, color: "#4d4fe6" }}
                  />
                  <p className="stat-number mt-1">{totalSignals}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Total Signals
                  </p>
                </div>
                <div className="card-padded text-center">
                  <QuestionAnswerOutlinedIcon
                    sx={{ fontSize: 20, color: "#d97706" }}
                  />
                  <p className="stat-number mt-1">{questions.length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Questions</p>
                </div>
                <div className="card-padded text-center">
                  <TimelineOutlinedIcon
                    sx={{ fontSize: 20, color: "#16a34a" }}
                  />
                  <p className="stat-number mt-1">
                    {(data?.snapshots || []).length}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Snapshots</p>
                </div>
                <div className="card-padded text-center">
                  <InfoOutlinedIcon
                    sx={{ fontSize: 20, color: "#64748b" }}
                  />
                  <p className="stat-number mt-1 capitalize">
                    {session.mode || "—"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Mode</p>
                </div>
              </div>

              {/* Signal Timeline Chart */}
              {chartData.length > 0 && (
                <div className="card-padded mb-6">
                  <h3 className="font-display font-bold text-base text-slate-900 mb-4">
                    Signal Timeline
                  </h3>
                  <div style={{ width: "100%", height: 280 }}>
                    <ResponsiveContainer>
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e2e8f0"
                        />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          domain={[0, 100]}
                          unit="%"
                        />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="Got It"
                          stroke="#16a34a"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Sort Of"
                          stroke="#d97706"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Lost"
                          stroke="#dc2626"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Confusion Heatmap */}
              <div className="mb-6">
                <ConfusionHeatmap heatmap={data?.heatmap || []} />
              </div>

              {/* Questions */}
              <div className="card-padded mb-6">
                <h3 className="font-display font-bold text-base text-slate-900 mb-4">
                  Questions ({questions.length})
                </h3>
                {questions.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">
                    No questions were asked during this session.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                    {questions.map((q, i) => (
                      <div
                        key={q.question_id || q.id || i}
                        className={`border rounded-lg p-3 text-sm ${
                          q.acknowledged
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-white border-slate-200 text-slate-700"
                        }`}
                      >
                        <span className="font-medium text-slate-500 mr-2">
                          #{q.question_id || q.id || i + 1}
                        </span>
                        {q.text ||
                          q.content ||
                          q.cluster_summaries?.[0]?.summary ||
                          "Question"}
                        {q.acknowledged && (
                          <span className="ml-2 text-xs text-green-600 font-medium">
                            ✓ Acknowledged
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quiz Summary placeholder */}
              <div className="card-padded">
                <h3 className="font-display font-bold text-base text-slate-900 mb-3">
                  Quiz Summary
                </h3>
                <div className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-lg">
                  Quiz summary data is not available in post-session view. Quiz
                  analytics are visible during the live session only.
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {videoUrl && (
        <VideoPlayer url={videoUrl} onClose={() => setVideoUrl(null)} />
      )}
    </div>
  );
}
