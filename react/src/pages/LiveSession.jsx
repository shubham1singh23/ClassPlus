import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";

import Sidebar from "../components/Sidebar";
import SessionCode from "../components/SessionCode";
import LiveSignalBar from "../components/LiveSignalBar";
import QuestionQueue from "../components/QuestionQueue";
import QuizPanel from "../components/QuizPanel";

import {
  lockSession,
  endSession,
  uploadSessionAudio,
  acknowledgeQuestion,
  submitBoardDetect,
  submitBoardOcr,
  summariseDoubts,
} from "../services/api";
import { subscribeToSession } from "../services/realtimeChannel";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import TextSnippetOutlinedIcon from "@mui/icons-material/TextSnippetOutlined";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import WifiOffOutlinedIcon from "@mui/icons-material/WifiOffOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

const TABS = ["Questions", "Quiz", "Doubt Summary"];

export default function LiveSession() {
  const { id: sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const sessionData = location.state;

  // If no state (direct reload), show fallback
  const [hasState] = useState(!!sessionData);

  const [activeTab, setActiveTab] = useState(0);
  const [locked, setLocked] = useState(false);
  const [ended, setEnded] = useState(false);
  const [locking, setLocking] = useState(false);
  const [ending, setEnding] = useState(false);

  // Signals
  const [signal, setSignal] = useState({
    gotIt: 0,
    sortOf: 0,
    lost: 0,
    reliableCount: 0,
    totalCount: 0,
  });

  // Questions
  const [questions, setQuestions] = useState([]);

  // Quiz responses
  const [quizResponses, setQuizResponses] = useState({});

  // Board
  const [boardResult, setBoardResult] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [boardLoading, setBoardLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const boardFileRef = useRef(null);
  const ocrFileRef = useRef(null);

  // Audio upload
  const [audioFile, setAudioFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Doubt summary
  const [doubtSummary, setDoubtSummary] = useState(null);
  const [doubtLoading, setDoubtLoading] = useState(false);

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return;
    const cleanup = subscribeToSession(sessionId, {
      onSignalUpdate: (payload) => {
        if (payload) {
          setSignal({
            gotIt: payload.got_it_pct ?? payload.gotIt ?? 0,
            sortOf: payload.sort_of_pct ?? payload.sortOf ?? 0,
            lost: payload.lost_pct ?? payload.lost ?? 0,
            reliableCount: payload.reliable_count ?? payload.reliableCount ?? 0,
            totalCount: payload.raw_count ?? payload.totalCount ?? 0,
          });
        }
      },
      onQuestionClusters: (payload) => {
        if (payload?.clusters || payload?.cluster_summaries) {
          const clusters = payload.clusters || payload.cluster_summaries || [];
          setQuestions((prev) => {
            const existing = [...prev];
            clusters.forEach((c) => {
              const idx = existing.findIndex(
                (q) => q.cluster_id === c.cluster_id
              );
              if (idx >= 0) {
                existing[idx] = { ...existing[idx], ...c };
              } else {
                existing.push({
                  question_id: c.cluster_id,
                  cluster_id: c.cluster_id,
                  cluster_summaries: [c],
                  acknowledged: false,
                });
              }
            });
            return existing;
          });
        }
      },
      onQuizPush: () => {
        setQuizResponses({});
      },
      onQuizResponse: (payload) => {
        if (payload?.selected_index !== undefined) {
          setQuizResponses((prev) => ({
            ...prev,
            [payload.selected_index]:
              (prev[payload.selected_index] || 0) + 1,
          }));
        }
      },
    });
    return cleanup;
  }, [sessionId]);

  const handleLock = useCallback(async () => {
    setLocking(true);
    try {
      await lockSession(sessionId);
      setLocked(true);
    } catch (e) {
      console.error("Lock failed", e);
    } finally {
      setLocking(false);
    }
  }, [sessionId]);

  const handleEnd = useCallback(async () => {
    if (!window.confirm("End this session? This cannot be undone.")) return;
    setEnding(true);
    try {
      await endSession(sessionId);
      setEnded(true);
    } catch (e) {
      console.error("End failed", e);
    } finally {
      setEnding(false);
    }
  }, [sessionId]);

  const handleAcknowledge = useCallback(
    async (qid) => {
      try {
        await acknowledgeQuestion(qid);
        setQuestions((prev) =>
          prev.map((q) =>
            (q.question_id || q.id) === qid
              ? { ...q, acknowledged: true }
              : q
          )
        );
      } catch (e) {
        console.error("Acknowledge failed", e);
      }
    },
    []
  );

  const handleBoardDetect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBoardLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("session_id", sessionId);
      const res = await submitBoardDetect(fd);
      setBoardResult(res);
    } catch (err) {
      console.error("Board detect failed", err);
    } finally {
      setBoardLoading(false);
    }
  };

  const handleBoardOcr = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("session_id", sessionId);
      const res = await submitBoardOcr(fd);
      setOcrResult(res);
    } catch (err) {
      console.error("Board OCR failed", err);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleAudioUpload = async () => {
    if (!audioFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", audioFile);
      await uploadSessionAudio(sessionId, fd);
      setUploadSuccess(true);
      setAudioFile(null);
    } catch (e) {
      console.error("Audio upload failed", e);
    } finally {
      setUploading(false);
    }
  };

  const handleDoubtSummary = async () => {
    setDoubtLoading(true);
    try {
      const res = await summariseDoubts(sessionId);
      setDoubtSummary(res);
    } catch (e) {
      console.error("Doubt summary failed", e);
    } finally {
      setDoubtLoading(false);
    }
  };

  // Fallback screen
  if (!hasState) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar variant="teacher" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md mx-auto px-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
              <WarningAmberOutlinedIcon
                sx={{ fontSize: 32, color: "#d97706" }}
              />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Live Session Metadata Missing
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              This page requires session data that is set when you create a
              session. If you refreshed or navigated directly, the data is lost.
            </p>
            <button
              onClick={() => navigate("/teacher")}
              className="btn-primary btn"
            >
              <ArrowBackOutlinedIcon sx={{ fontSize: 16 }} />
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isOnline = sessionData.mode !== "offline";
  const livekitToken = sessionData.livekit_token;
  const livekitUrl =
    sessionData.livekit_url ||
    import.meta.env.VITE_LIVEKIT_URL ||
    "";
  const joinCode = sessionData.join_code;
  const expiresAt = sessionData.code_expires_at;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar variant="teacher" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-xl font-bold text-slate-900">
                {sessionData.topic || "Live Session"}
              </h1>
              <span
                className={`badge ${
                  ended
                    ? "badge-slate"
                    : locked
                    ? "badge-amber"
                    : "badge-green"
                }`}
              >
                {ended ? "Ended" : locked ? "Locked" : "Active"}
              </span>
              <span
                className={`badge ${
                  isOnline ? "badge-blue" : "badge-slate"
                }`}
              >
                {isOnline ? (
                  <WifiOutlinedIcon sx={{ fontSize: 12 }} />
                ) : (
                  <WifiOffOutlinedIcon sx={{ fontSize: 12 }} />
                )}
                {sessionData.mode || "online"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!ended && !locked && (
                <button
                  onClick={handleLock}
                  disabled={locking}
                  className="btn-secondary btn btn-sm"
                >
                  <LockOutlinedIcon sx={{ fontSize: 14 }} />
                  {locking ? "Locking…" : "Lock"}
                </button>
              )}
              {!ended && (
                <button
                  onClick={handleEnd}
                  disabled={ending}
                  className="btn-danger btn btn-sm"
                >
                  <StopCircleOutlinedIcon sx={{ fontSize: 14 }} />
                  {ending ? "Ending…" : "End Session"}
                </button>
              )}
              {ended && (
                <button
                  onClick={() =>
                    navigate(`/teacher/session/${sessionId}/summary`)
                  }
                  className="btn-primary btn btn-sm"
                >
                  View Summary
                </button>
              )}
            </div>
          </div>

          {/* Lost alert */}
          {signal.lost > 0.4 && !ended && (
            <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-pulse">
              <WarningAmberOutlinedIcon
                sx={{ fontSize: 20, color: "#dc2626" }}
              />
              <div>
                <p className="text-sm font-semibold text-red-700">
                  High confusion detected!
                </p>
                <p className="text-xs text-red-600">
                  {Math.round(signal.lost * 100)}% of students report being
                  lost. Consider pausing to clarify.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-1 space-y-4">
              <SessionCode joinCode={joinCode} sessionId={sessionId} />

              {expiresAt && (
                <div className="card-padded flex items-center gap-2 text-xs text-slate-500">
                  <AccessTimeOutlinedIcon sx={{ fontSize: 14 }} />
                  Code expires:{" "}
                  {new Date(expiresAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}

              {/* LiveKit or Offline badge */}
              {isOnline && livekitToken && livekitUrl && !ended ? (
                <div className="card overflow-hidden" style={{ minHeight: 240 }}>
                  <LiveKitRoom
                    serverUrl={livekitUrl}
                    token={livekitToken}
                    connect={true}
                    audio={true}
                    video={true}
                    style={{ height: "100%" }}
                  >
                    <VideoConference />
                    <RoomAudioRenderer />
                  </LiveKitRoom>
                </div>
              ) : !isOnline ? (
                <div className="card-padded flex flex-col items-center gap-2 py-8">
                  <WifiOffOutlinedIcon
                    sx={{ fontSize: 28, color: "#94a3b8" }}
                  />
                  <p className="text-sm font-medium text-slate-500">
                    Offline Mode
                  </p>
                  <p className="text-xs text-slate-400 text-center max-w-xs">
                    Upload audio after session ends for AI processing.
                  </p>
                </div>
              ) : null}

              {/* Board Detect / OCR */}
              <div className="card-padded space-y-3">
                <p className="section-title">Board AI</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => boardFileRef.current?.click()}
                    disabled={boardLoading}
                    className="btn-secondary btn btn-sm flex-1"
                  >
                    <CameraAltOutlinedIcon sx={{ fontSize: 14 }} />
                    {boardLoading ? "Detecting…" : "Detect"}
                  </button>
                  <input
                    ref={boardFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBoardDetect}
                  />

                  <button
                    onClick={() => ocrFileRef.current?.click()}
                    disabled={ocrLoading}
                    className="btn-secondary btn btn-sm flex-1"
                  >
                    <TextSnippetOutlinedIcon sx={{ fontSize: 14 }} />
                    {ocrLoading ? "Reading…" : "OCR"}
                  </button>
                  <input
                    ref={ocrFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBoardOcr}
                  />
                </div>

                {boardResult && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-xs text-green-700">
                    Board detected: {boardResult.detected ? "Yes" : "No"}
                    {boardResult.confidence &&
                      ` (${Math.round(boardResult.confidence * 100)}%)`}
                  </div>
                )}
                {ocrResult && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-800 max-h-32 overflow-y-auto scrollbar-thin whitespace-pre-wrap">
                    {ocrResult.text || ocrResult.ocr_text || "No text found."}
                  </div>
                )}
              </div>

              {/* Offline audio upload */}
              {!isOnline && (
                <div className="card-padded space-y-3">
                  <p className="section-title">Audio Upload</p>
                  {uploadSuccess ? (
                    <div className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      ✓ Audio uploaded successfully
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setAudioFile(e.target.files?.[0])}
                        className="text-xs text-slate-600"
                      />
                      {audioFile && (
                        <button
                          onClick={handleAudioUpload}
                          disabled={uploading}
                          className="btn-primary btn btn-sm w-full justify-center"
                        >
                          <CloudUploadOutlinedIcon sx={{ fontSize: 14 }} />
                          {uploading ? "Uploading…" : "Upload Audio"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-2 space-y-4">
              <LiveSignalBar
                gotIt={signal.gotIt}
                sortOf={signal.sortOf}
                lost={signal.lost}
                reliableCount={signal.reliableCount}
                totalCount={signal.totalCount}
              />

              {/* Tabs */}
              <div className="card">
                <div className="flex border-b border-slate-100 px-4">
                  {TABS.map((tab, i) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(i)}
                      className={
                        activeTab === i ? "tab-btn-active" : "tab-btn"
                      }
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="p-4" style={{ minHeight: 280 }}>
                  {activeTab === 0 && (
                    <QuestionQueue
                      questions={questions}
                      onAcknowledge={handleAcknowledge}
                      onRefresh={() =>
                        summariseDoubts(sessionId).then((res) => {
                          if (res?.clusters || res?.cluster_summaries) {
                            const clusters =
                              res.clusters || res.cluster_summaries || [];
                            setQuestions((prev) => {
                              const updated = [...prev];
                              clusters.forEach((c) => {
                                const idx = updated.findIndex(
                                  (q) => q.cluster_id === c.cluster_id
                                );
                                if (idx >= 0) {
                                  updated[idx] = { ...updated[idx], ...c };
                                } else {
                                  updated.push({
                                    question_id: c.cluster_id,
                                    cluster_id: c.cluster_id,
                                    cluster_summaries: [c],
                                    acknowledged: false,
                                  });
                                }
                              });
                              return updated;
                            });
                          }
                        })
                      }
                    />
                  )}

                  {activeTab === 1 && (
                    <QuizPanel
                      sessionId={sessionId}
                      liveResponses={quizResponses}
                    />
                  )}

                  {activeTab === 2 && (
                    <div className="space-y-3">
                      <button
                        onClick={handleDoubtSummary}
                        disabled={doubtLoading}
                        className="btn-secondary btn btn-sm"
                      >
                        {doubtLoading
                          ? "Summarising…"
                          : "Refresh Doubt Summary"}
                      </button>
                      {doubtSummary ? (
                        <div className="card p-4 space-y-2">
                          {doubtSummary.summary && (
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {doubtSummary.summary}
                            </p>
                          )}
                          {doubtSummary.clusters &&
                            doubtSummary.clusters.map((c, i) => (
                              <div
                                key={i}
                                className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700"
                              >
                                <span className="font-semibold text-slate-800">
                                  Cluster {i + 1}
                                </span>
                                : {c.summary || c.text || JSON.stringify(c)}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400 text-center py-8">
                          Click refresh to generate a summary of all student
                          doubts.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
