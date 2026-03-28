import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Sidebar from "../components/Sidebar";
import ConfusionHeatmap from "../components/ConfusionHeatmap";
import VideoPlayer from "../components/VideoPlayer";
import { getNotesUrl, getSessionSummary, getVideoUrl } from "../services/api";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import QuestionAnswerOutlinedIcon from "@mui/icons-material/QuestionAnswerOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import SignalCellularAltOutlinedIcon from "@mui/icons-material/SignalCellularAltOutlined";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";

function pct(value) {
  return Math.round((value || 0) * 100);
}

export default function SessionSummary() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notesState, setNotesState] = useState({ loading: false, ready: false, url: null });
  const [videoState, setVideoState] = useState({ loading: false, ready: false, url: null });
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      try {
        const response = await getSessionSummary(sessionId);
        setData(response);
        setError(null);
      } catch (fetchError) {
        setError(fetchError.response?.data?.detail || "Failed to load summary.");
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [sessionId]);

  useEffect(() => {
    let notesTimer = null;
    let videoTimer = null;

    const pollNotes = async () => {
      setNotesState((current) => ({ ...current, loading: true }));
      try {
        const response = await getNotesUrl(sessionId);
        const url = response.url || response.notes_url || null;
        const ready = Boolean(url) && response.status !== 202;
        setNotesState({ loading: false, ready, url });
        if (!ready) {
          notesTimer = window.setTimeout(pollNotes, 5000);
        }
      } catch (errorValue) {
        setNotesState((current) => ({ ...current, loading: false }));
      }
    };

    const pollVideo = async () => {
      setVideoState((current) => ({ ...current, loading: true }));
      try {
        const response = await getVideoUrl(sessionId);
        const url = response.url || response.video_url || null;
        const ready = Boolean(url) && response.status !== 202;
        setVideoState({ loading: false, ready, url });
        if (!ready) {
          videoTimer = window.setTimeout(pollVideo, 5000);
        }
      } catch (errorValue) {
        setVideoState((current) => ({ ...current, loading: false }));
      }
    };

    pollNotes();
    pollVideo();

    return () => {
      if (notesTimer) window.clearTimeout(notesTimer);
      if (videoTimer) window.clearTimeout(videoTimer);
    };
  }, [sessionId]);

  const chartData = useMemo(
    () =>
      (data?.snapshots || []).map((snapshot, index) => ({
        time: snapshot.time || snapshot.timestamp || `T${index + 1}`,
        "Got It": pct(snapshot.got_it_pct),
        "Sort Of": pct(snapshot.sort_of_pct),
        Lost: pct(snapshot.lost_pct),
      })),
    [data]
  );

  const quizChartData = useMemo(
    () =>
      (data?.quizzes || []).map((quiz, index) => ({
        name: `Quiz ${index + 1}`,
        accuracy: Math.round((quiz.accuracy || 0) * 100),
        responseCount: quiz.response_count || 0,
        correctCount: quiz.correct_count || 0,
        question: quiz.question || quiz.quiz_data?.question || `Quiz ${index + 1}`,
      })),
    [data]
  );

  const trollFlags = data?.troll_flags || [];
  const session = data?.session || {};
  const questions = data?.questions || [];
  const processingMessage = location.state?.processing;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar variant="teacher" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8">
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
              <button onClick={() => navigate("/teacher")} className="btn-secondary btn">
                Go to Dashboard
              </button>
            </div>
          ) : (
            <>
              <div className="page-header">
                <div>
                  <h1 className="font-display text-2xl font-bold text-slate-900">
                    {session.topic || "Session Summary"}
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {session.started_at
                      ? new Date(session.started_at).toLocaleString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Session summary"}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => notesState.url && window.open(notesState.url, "_blank")}
                    disabled={!notesState.ready}
                    className="btn-secondary btn btn-sm"
                  >
                    <DescriptionOutlinedIcon sx={{ fontSize: 15 }} />
                    {notesState.ready ? "Open Notes" : "Notes Processing"}
                  </button>
                  <button
                    onClick={() => videoState.url && setVideoUrl(videoState.url)}
                    disabled={!videoState.ready}
                    className="btn-secondary btn btn-sm"
                  >
                    <PlayCircleOutlineIcon sx={{ fontSize: 15 }} />
                    {videoState.ready ? "Open Video" : "Video Processing"}
                  </button>
                </div>
              </div>

              {(processingMessage || !notesState.ready || !videoState.ready) && (
                <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 mb-6">
                  <p className="text-sm font-semibold text-brand-700">Post-session assets are asynchronous</p>
                  <p className="text-xs text-brand-600">
                    This page keeps polling the notes and video endpoints until the backend stops returning
                    HTTP 202 and provides asset URLs.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="card-padded text-center">
                  <SignalCellularAltOutlinedIcon sx={{ fontSize: 20, color: "#4d4fe6" }} />
                  <p className="stat-number mt-1">{data?.total_signals ?? 0}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Total Signals</p>
                </div>
                <div className="card-padded text-center">
                  <QuestionAnswerOutlinedIcon sx={{ fontSize: 20, color: "#d97706" }} />
                  <p className="stat-number mt-1">{questions.length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Questions</p>
                </div>
                <div className="card-padded text-center">
                  <TimelineOutlinedIcon sx={{ fontSize: 20, color: "#16a34a" }} />
                  <p className="stat-number mt-1">{(data?.snapshots || []).length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Snapshots</p>
                </div>
                <div className="card-padded text-center">
                  <SmartToyOutlinedIcon sx={{ fontSize: 20, color: "#64748b" }} />
                  <p className="stat-number mt-1">{(data?.quizzes || []).length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Quizzes</p>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="card-padded mb-6">
                  <h3 className="font-display font-bold text-base text-slate-900 mb-4">
                    Comprehension Timeline
                  </h3>
                  <div style={{ width: "100%", height: 280 }}>
                    <ResponsiveContainer>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 100]} unit="%" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Got It" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Sort Of" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Lost" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <ConfusionHeatmap heatmap={data?.heatmap || []} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <div className="card-padded">
                  <h3 className="font-display font-bold text-base text-slate-900 mb-4">
                    Questions ({questions.length})
                  </h3>
                  {questions.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">
                      No questions were recorded for this session.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                      {questions.map((question, index) => (
                        <div
                          key={question.question_id || question.id || index}
                          className={`border rounded-lg p-3 text-sm ${
                            question.acknowledged
                              ? "bg-green-50 border-green-200 text-green-800"
                              : "bg-white border-slate-200 text-slate-700"
                          }`}
                        >
                          <span className="font-medium text-slate-500 mr-2">
                            #{question.question_id || question.id || index + 1}
                          </span>
                          {question.text ||
                            question.content ||
                            question.cluster_summaries?.[0]?.summary ||
                            "Question"}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card-padded">
                  <h3 className="font-display font-bold text-base text-slate-900 mb-4">
                    Troll Report
                  </h3>
                  {trollFlags.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">
                      No troll flags were reported for this session.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                      {trollFlags.map((flag, index) => (
                        <div key={flag.id || index} className="border border-red-200 bg-red-50 rounded-lg p-3">
                          <p className="text-sm font-semibold text-red-700">
                            {flag.reason || flag.label || "Troll activity detected"}
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            {flag.device_token || flag.student_id || "Unknown source"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="card-padded mb-6">
                <h3 className="font-display font-bold text-base text-slate-900 mb-4">
                  Quiz Performance
                </h3>
                {quizChartData.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">
                    No quiz data was stored for this session.
                  </p>
                ) : (
                  <>
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <BarChart data={quizChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 100]} unit="%" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="accuracy" fill="#4d4fe6" name="Accuracy %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid gap-3 mt-4">
                      {quizChartData.map((quiz, index) => (
                        <div key={index} className="bg-slate-50 rounded-lg p-3">
                          <p className="text-sm font-semibold text-slate-800">{quiz.question}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {quiz.correctCount}/{quiz.responseCount} correct - {quiz.accuracy}% accuracy
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {videoUrl && <VideoPlayer url={videoUrl} onClose={() => setVideoUrl(null)} />}
    </div>
  );
}
