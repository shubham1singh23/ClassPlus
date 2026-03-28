import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";

import Sidebar from "../components/Sidebar";
import SessionCode from "../components/SessionCode";
import LiveSignalBar from "../components/LiveSignalBar";
import QuestionQueue from "../components/QuestionQueue";
import QuizPanel from "../components/QuizPanel";
import {
  acknowledgeQuestion,
  endSession,
  lockSession,
  submitBoardDetect,
  submitBoardOcr,
  summariseDoubts,
  uploadSessionAudio,
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
import MicOutlinedIcon from "@mui/icons-material/MicOutlined";
import StopOutlinedIcon from "@mui/icons-material/StopOutlined";

const LIVE_SESSION_STORAGE_KEY = "classpulse.liveSession";
const TABS = ["Questions", "Quiz", "Doubt Summary"];

function mergeQuestion(previousQuestions, payload) {
  const questionId = payload?.question_id || payload?.id;
  if (!questionId) return previousQuestions;

  const clusterSummaries =
    payload?.cluster_summaries ||
    payload?.clusters ||
    previousQuestions.find((question) => question.question_id === questionId)?.cluster_summaries ||
    [];

  const nextQuestion = {
    question_id: questionId,
    acknowledged:
      previousQuestions.find((question) => question.question_id === questionId)?.acknowledged || false,
    text: payload?.text || payload?.content || "",
    cluster_summaries: clusterSummaries,
  };

  const remaining = previousQuestions.filter((question) => question.question_id !== questionId);
  return [nextQuestion, ...remaining];
}

function fileFromBlob(blob, fileName) {
  return new File([blob], fileName, {
    type: blob.type || "application/octet-stream",
    lastModified: Date.now(),
  });
}

export default function LiveSession() {
  const { id: sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const persistedSession = useMemo(() => {
    const raw = window.sessionStorage.getItem(LIVE_SESSION_STORAGE_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      return parsed?.session_id === sessionId ? parsed : null;
    } catch {
      return null;
    }
  }, [sessionId]);
  const sessionData = location.state || persistedSession;

  const [activeTab, setActiveTab] = useState(0);
  const [locked, setLocked] = useState(false);
  const [ended, setEnded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [locking, setLocking] = useState(false);
  const [ending, setEnding] = useState(false);
  const [signal, setSignal] = useState({
    gotIt: 0,
    sortOf: 0,
    lost: 0,
    reliableCount: 0,
    totalCount: 0,
  });
  const [questions, setQuestions] = useState([]);
  const [quizResponses, setQuizResponses] = useState({});
  const [doubtSummary, setDoubtSummary] = useState([]);
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [boardResult, setBoardResult] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [boardLoading, setBoardLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [audioStatus, setAudioStatus] = useState("");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);

  const audioRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const boardPreviewRef = useRef(null);
  const boardStreamRef = useRef(null);
  const boardFileRef = useRef(null);
  const ocrFileRef = useRef(null);

  useEffect(() => {
    if (sessionData) {
      window.sessionStorage.setItem(LIVE_SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    }
  }, [sessionData]);

  useEffect(() => {
    if (!sessionId) return undefined;

    const cleanup = subscribeToSession(sessionId, {
      onSignalUpdate: (payload) => {
        const live = payload?.live || payload || {};
        setSignal({
          gotIt: live.got_it_pct ?? 0,
          sortOf: live.sort_of_pct ?? 0,
          lost: live.lost_pct ?? 0,
          reliableCount: live.reliable_count ?? 0,
          totalCount: live.raw_count ?? 0,
        });
      },
      onQuestionClusters: (payload) => {
        setQuestions((previous) => mergeQuestion(previous, payload));
        if (payload?.cluster_summaries?.length) {
          setDoubtSummary(payload.cluster_summaries);
        }
      },
      onQuizResponse: (payload) => {
        if (payload?.selected_index === undefined) return;
        setQuizResponses((previous) => ({
          ...previous,
          [payload.selected_index]: (previous[payload.selected_index] || 0) + 1,
        }));
      },
    });

    return cleanup;
  }, [sessionId]);

  const isOnline = sessionData?.mode !== "offline";
  const livekitToken = sessionData?.livekit_token;
  const livekitUrl = sessionData?.livekit_url || import.meta.env.VITE_LIVEKIT_URL || "";
  const joinCode = sessionData?.join_code;
  const qrData = sessionData?.qr_data;
  const expiresAt = sessionData?.code_expires_at;
  const boardPreviewEnabled = sessionData?.camera_mode === "camera";

  useEffect(() => {
    if (!boardPreviewEnabled || !navigator.mediaDevices?.getUserMedia) return undefined;

    let active = true;

    async function startPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        boardStreamRef.current = stream;
        if (boardPreviewRef.current) {
          boardPreviewRef.current.srcObject = stream;
        }
        setPreviewReady(true);
      } catch (error) {
        console.error("Board preview unavailable", error);
        setPreviewReady(false);
      }
    }

    startPreview();

    return () => {
      active = false;
      if (boardStreamRef.current) {
        boardStreamRef.current.getTracks().forEach((track) => track.stop());
        boardStreamRef.current = null;
      }
    };
  }, [boardPreviewEnabled]);

  const startAudioRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setAudioStatus("Browser audio recording is not available here.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.start();
      audioRecorderRef.current = recorder;
      setRecordingAudio(true);
      setAudioStatus("Recording in progress.");
    } catch (error) {
      console.error("Audio recording failed", error);
      setAudioStatus("Microphone access failed.");
    }
  }, []);

  const stopAudioRecording = useCallback(() => {
    if (!audioRecorderRef.current) return Promise.resolve(null);

    return new Promise((resolve) => {
      const recorder = audioRecorderRef.current;
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = fileFromBlob(blob, `session-${sessionId}.webm`);
        setAudioFile(file);
        setRecordingAudio(false);
        setAudioStatus("Recording saved. Ready to upload.");
        audioRecorderRef.current = null;

        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }

        resolve(file);
      };
      recorder.stop();
    });
  }, [sessionId]);

  const uploadAudioFile = useCallback(
    async (file) => {
      if (!file) return;

      setUploadingAudio(true);
      setAudioStatus("Uploading audio...");

      try {
        const formData = new FormData();
        formData.append("file", file);
        await uploadSessionAudio(sessionId, formData);
        setAudioStatus("Audio uploaded successfully.");
      } catch (error) {
        console.error("Audio upload failed", error);
        setAudioStatus("Audio upload failed. You can retry from this page.");
        throw error;
      } finally {
        setUploadingAudio(false);
      }
    },
    [sessionId]
  );

  const handleLock = useCallback(async () => {
    setLocking(true);
    try {
      await lockSession(sessionId);
      setLocked(true);
    } catch (error) {
      console.error("Lock failed", error);
    } finally {
      setLocking(false);
    }
  }, [sessionId]);

  const handleEnd = useCallback(async () => {
    if (!window.confirm("End this session? Notes and video generation will continue asynchronously.")) {
      return;
    }

    setEnding(true);
    setProcessing(true);

    try {
      if (!isOnline) {
        const recordedFile = recordingAudio ? await stopAudioRecording() : audioFile;
        if (recordedFile) {
          await uploadAudioFile(recordedFile);
        }
      }

      await endSession(sessionId);
      setEnded(true);
      window.sessionStorage.removeItem(LIVE_SESSION_STORAGE_KEY);
      navigate(`/teacher/session/${sessionId}/summary`, {
        replace: true,
        state: { processing: true },
      });
    } catch (error) {
      console.error("End failed", error);
      setProcessing(false);
    } finally {
      setEnding(false);
    }
  }, [audioFile, isOnline, navigate, recordingAudio, sessionId, stopAudioRecording, uploadAudioFile]);

  const handleAcknowledge = useCallback(async (questionId) => {
    try {
      await acknowledgeQuestion(questionId);
      setQuestions((previous) =>
        previous.map((question) =>
          question.question_id === questionId
            ? { ...question, acknowledged: true }
            : question
        )
      );
    } catch (error) {
      console.error("Acknowledge failed", error);
    }
  }, []);

  const runDoubtRefresh = useCallback(async () => {
    setDoubtLoading(true);
    try {
      const response = await summariseDoubts(sessionId);
      const summaries =
        response?.cluster_summaries || response?.clusters || response?.summary?.clusters || [];
      if (summaries.length) {
        setDoubtSummary(summaries);
      }
      if (response?.question_id) {
        setQuestions((previous) => mergeQuestion(previous, response));
      }
    } catch (error) {
      console.error("Doubt summary failed", error);
    } finally {
      setDoubtLoading(false);
    }
  }, [sessionId]);

  const uploadBoardImage = useCallback(
    async (kind, file) => {
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("session_id", sessionId);

      if (kind === "detect") {
        setBoardLoading(true);
        try {
          const response = await submitBoardDetect(formData);
          setBoardResult(response);
        } catch (error) {
          console.error("Board detect failed", error);
        } finally {
          setBoardLoading(false);
        }
        return;
      }

      setOcrLoading(true);
      try {
        const response = await submitBoardOcr(formData);
        setOcrResult(response);
      } catch (error) {
        console.error("Board OCR failed", error);
      } finally {
        setOcrLoading(false);
      }
    },
    [sessionId]
  );

  const capturePreviewFrame = useCallback(
    async (kind) => {
      const video = boardPreviewRef.current;
      if (!video || !video.videoWidth || !video.videoHeight) return;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = fileFromBlob(blob, `board-${kind}-${Date.now()}.png`);
        await uploadBoardImage(kind, file);
      }, "image/png");
    },
    [uploadBoardImage]
  );

  if (!sessionData) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar variant="teacher" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md mx-auto px-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
              <WarningAmberOutlinedIcon sx={{ fontSize: 32, color: "#d97706" }} />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Live Session Metadata Missing
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              This live session can only be opened from the create-session flow because the
              backend does not expose a session bootstrap endpoint yet.
            </p>
            <button onClick={() => navigate("/teacher")} className="btn-primary btn">
              <ArrowBackOutlinedIcon sx={{ fontSize: 16 }} />
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar variant="teacher" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-xl font-bold text-slate-900">
                {sessionData.topic || "Live Session"}
              </h1>
              <span className={`badge ${ended ? "badge-slate" : locked ? "badge-amber" : "badge-green"}`}>
                {ended ? "Ended" : locked ? "Locked" : "Active"}
              </span>
              <span className={`badge ${isOnline ? "badge-blue" : "badge-slate"}`}>
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
                <button onClick={handleLock} disabled={locking} className="btn-secondary btn btn-sm">
                  <LockOutlinedIcon sx={{ fontSize: 14 }} />
                  {locking ? "Locking..." : "Lock Session"}
                </button>
              )}
              {!ended && (
                <button onClick={handleEnd} disabled={ending} className="btn-danger btn btn-sm">
                  <StopCircleOutlinedIcon sx={{ fontSize: 14 }} />
                  {ending ? "Ending..." : "End Session"}
                </button>
              )}
            </div>
          </div>

          {signal.lost > 0.4 && !ended && (
            <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <WarningAmberOutlinedIcon sx={{ fontSize: 20, color: "#dc2626" }} />
              <div>
                <p className="text-sm font-semibold text-red-700">High confusion detected</p>
                <p className="text-xs text-red-600">
                  {Math.round(signal.lost * 100)}% lost. Consider slowing down or re-explaining the topic.
                </p>
              </div>
            </div>
          )}

          {processing && (
            <div className="mb-4 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-brand-700">Session processing started</p>
              <p className="text-xs text-brand-600">
                Notes and video generation are asynchronous. The summary page will keep polling.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <SessionCode
                joinCode={joinCode}
                qrData={qrData}
                codeExpiresAt={expiresAt}
                sessionId={sessionId}
              />

              {isOnline && livekitToken && livekitUrl && !ended ? (
                <div className="card overflow-hidden" style={{ minHeight: 240 }}>
                  <LiveKitRoom
                    serverUrl={livekitUrl}
                    token={livekitToken}
                    connect
                    audio
                    video
                    style={{ height: "100%" }}
                  >
                    <VideoConference />
                    <RoomAudioRenderer />
                  </LiveKitRoom>
                </div>
              ) : (
                <div className="card-padded flex flex-col items-center gap-2 py-8">
                  <WifiOffOutlinedIcon sx={{ fontSize: 28, color: "#94a3b8" }} />
                  <p className="text-sm font-medium text-slate-500">
                    {isOnline ? "LiveKit credentials unavailable" : "Offline Mode"}
                  </p>
                  <p className="text-xs text-slate-400 text-center max-w-xs">
                    {isOnline
                      ? "The backend did not return LiveKit credentials for this session."
                      : "Record the classroom audio in the browser, then upload it at the end for post-session AI features."}
                  </p>
                </div>
              )}

              <div className="card-padded space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="section-title !mb-0">Board AI</p>
                  {previewReady && (
                    <span className="text-xs text-green-600 font-medium">Preview ready</span>
                  )}
                </div>

                {boardPreviewEnabled && (
                  <div className="space-y-2">
                    <video
                      ref={boardPreviewRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full rounded-lg border border-slate-200 bg-slate-900 aspect-video object-cover"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => capturePreviewFrame("detect")}
                        disabled={!previewReady || boardLoading}
                        className="btn-secondary btn btn-sm justify-center"
                        type="button"
                      >
                        <CameraAltOutlinedIcon sx={{ fontSize: 14 }} />
                        {boardLoading ? "Detecting..." : "Capture Detect"}
                      </button>
                      <button
                        onClick={() => capturePreviewFrame("ocr")}
                        disabled={!previewReady || ocrLoading}
                        className="btn-secondary btn btn-sm justify-center"
                        type="button"
                      >
                        <TextSnippetOutlinedIcon sx={{ fontSize: 14 }} />
                        {ocrLoading ? "Reading..." : "Capture OCR"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => boardFileRef.current?.click()}
                    disabled={boardLoading}
                    className="btn-secondary btn btn-sm flex-1"
                    type="button"
                  >
                    <CloudUploadOutlinedIcon sx={{ fontSize: 14 }} />
                    Upload Detect
                  </button>
                  <input
                    ref={boardFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => uploadBoardImage("detect", event.target.files?.[0])}
                  />

                  <button
                    onClick={() => ocrFileRef.current?.click()}
                    disabled={ocrLoading}
                    className="btn-secondary btn btn-sm flex-1"
                    type="button"
                  >
                    <CloudUploadOutlinedIcon sx={{ fontSize: 14 }} />
                    Upload OCR
                  </button>
                  <input
                    ref={ocrFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => uploadBoardImage("ocr", event.target.files?.[0])}
                  />
                </div>

                {boardResult && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-xs text-green-700">
                    Board detected: {boardResult.detected ? "Yes" : "No"}
                    {boardResult.confidence !== undefined &&
                      ` (${Math.round(boardResult.confidence * 100)}%)`}
                    {boardResult.region && (
                      <div className="mt-1 text-green-800">
                        Region: {JSON.stringify(boardResult.region)}
                      </div>
                    )}
                  </div>
                )}

                {ocrResult && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-800 max-h-32 overflow-y-auto scrollbar-thin whitespace-pre-wrap">
                    {ocrResult.text || ocrResult.ocr_text || "No text found."}
                  </div>
                )}
              </div>

              {!isOnline && (
                <div className="card-padded space-y-3">
                  <p className="section-title !mb-0">Offline Audio</p>
                  <p className="text-sm text-slate-500">
                    Browser recording is required for offline session uploads.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {!recordingAudio ? (
                      <button
                        onClick={startAudioRecording}
                        className="btn-primary btn btn-sm justify-center"
                        type="button"
                      >
                        <MicOutlinedIcon sx={{ fontSize: 14 }} />
                        Start Recording
                      </button>
                    ) : (
                      <button
                        onClick={stopAudioRecording}
                        className="btn-danger btn btn-sm justify-center"
                        type="button"
                      >
                        <StopOutlinedIcon sx={{ fontSize: 14 }} />
                        Stop Recording
                      </button>
                    )}

                    <button
                      onClick={() => uploadAudioFile(audioFile)}
                      disabled={!audioFile || uploadingAudio}
                      className="btn-secondary btn btn-sm justify-center"
                      type="button"
                    >
                      <CloudUploadOutlinedIcon sx={{ fontSize: 14 }} />
                      {uploadingAudio ? "Uploading..." : "Upload Audio"}
                    </button>
                  </div>

                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(event) => setAudioFile(event.target.files?.[0] || null)}
                    className="text-xs text-slate-600"
                  />

                  {audioFile && (
                    <p className="text-xs text-slate-500">
                      Ready: {audioFile.name}
                    </p>
                  )}

                  {audioStatus && (
                    <div className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
                      {audioStatus}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-4">
              <LiveSignalBar
                gotIt={signal.gotIt}
                sortOf={signal.sortOf}
                lost={signal.lost}
                reliableCount={signal.reliableCount}
                totalCount={signal.totalCount}
              />

              <div className="card">
                <div className="flex border-b border-slate-100 px-4">
                  {TABS.map((tab, index) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(index)}
                      className={activeTab === index ? "tab-btn-active" : "tab-btn"}
                      type="button"
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
                      onRefresh={runDoubtRefresh}
                      refreshing={doubtLoading}
                    />
                  )}

                  {activeTab === 1 && (
                    <QuizPanel sessionId={sessionId} liveResponses={quizResponses} />
                  )}

                  {activeTab === 2 && (
                    <div className="space-y-3">
                      <button
                        onClick={runDoubtRefresh}
                        disabled={doubtLoading}
                        className="btn-secondary btn btn-sm"
                        type="button"
                      >
                        {doubtLoading ? "Refreshing..." : "Refresh Doubt Summary"}
                      </button>

                      {doubtSummary.length > 0 ? (
                        <div className="space-y-2">
                          {doubtSummary.map((cluster, index) => (
                            <div key={`${cluster.cluster_id}-${index}`} className="card p-4">
                              <div className="flex items-center justify-between gap-3 mb-1">
                                <p className="text-sm font-semibold text-slate-800">
                                  Cluster {cluster.cluster_id ?? index + 1}
                                </p>
                                {cluster.count !== undefined && (
                                  <span className="badge badge-slate">{cluster.count} students</span>
                                )}
                              </div>
                              <p className="text-sm text-slate-700">
                                {cluster.summary || cluster.text || "No summary returned yet."}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400 text-center py-8">
                          Realtime cluster summaries will appear here when the backend emits them,
                          or after you manually refresh.
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
