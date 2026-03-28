import axios from "axios";

let getTokenFn = null;

export function registerTokenGetter(fn) {
  getTokenFn = fn;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    try {
      const token = await getTokenFn();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      console.warn("Token fetch failed", e);
    }
  }
  return config;
});

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function createSession(payload) {
  const res = await api.post("/sessions/create", payload);
  return res.data;
}

export async function lockSession(sessionId) {
  const res = await api.post(`/sessions/${sessionId}/lock`);
  return res.data;
}

export async function endSession(sessionId) {
  const res = await api.post(`/sessions/${sessionId}/end`);
  return res.data;
}

export async function uploadSessionAudio(sessionId, formData) {
  const res = await api.post(`/sessions/${sessionId}/audio-upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function getSessionSummary(sessionId) {
  const res = await api.get(`/sessions/${sessionId}/summary`);
  return res.data;
}

// ─── Signals / Quiz ──────────────────────────────────────────────────────────

export async function pushQuiz(payload) {
  const res = await api.post("/signals/quiz/push", payload);
  return res.data;
}

export async function acknowledgeQuestion(questionId) {
  const res = await api.post(`/signals/question/${questionId}/acknowledge`);
  return res.data;
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export async function submitBoardDetect(formData) {
  const res = await api.post("/ai/board-detect", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function submitBoardOcr(formData) {
  const res = await api.post("/ai/board-ocr", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function getNotesUrl(sessionId) {
  const res = await api.get(`/ai/session/${sessionId}/notes-url`);
  return res.data;
}

export async function getVideoUrl(sessionId) {
  const res = await api.get(`/ai/session/${sessionId}/video-url`);
  return res.data;
}

export async function summariseDoubts(sessionId) {
  const res = await api.post("/ai/summarise-doubts", { session_id: sessionId });
  return res.data;
}

// ─── Teacher ─────────────────────────────────────────────────────────────────

export async function getTeacherSessions(page = 1, limit = 20) {
  const res = await api.get("/teacher/sessions", { params: { page, limit } });
  return res.data;
}

export async function getReportCard() {
  const res = await api.get("/teacher/report-card");
  return res.data;
}

export async function getLeaderboard() {
  const res = await api.get("/teacher/leaderboard");
  return res.data;
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function createTeacher(payload) {
  const res = await api.post("/admin/teachers/create", payload);
  return res.data;
}

export async function bulkCreateTeachers(formData) {
  const res = await api.post("/admin/teachers/bulk-create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function getTeachers() {
  const res = await api.get("/admin/teachers");
  return res.data;
}

export async function createBatch(payload) {
  const res = await api.post("/admin/batches/create", payload);
  return res.data;
}

export async function getAdminAnalytics() {
  const res = await api.get("/admin/analytics");
  return res.data;
}

export default api;