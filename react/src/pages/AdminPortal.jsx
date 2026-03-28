import React, { useEffect, useState, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import Sidebar from "../components/Sidebar";
import {
  getTeachers,
  createTeacher,
  bulkCreateTeachers,
  createBatch,
  getAdminAnalytics,
} from "../services/api";

import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import QuestionAnswerOutlinedIcon from "@mui/icons-material/QuestionAnswerOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const TABS = ["Teachers", "Batches", "Analytics"];

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar variant="admin" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
          <div className="page-header">
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Admin Portal
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={activeTab === i ? "tab-btn-active" : "tab-btn"}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 0 && <TeachersTab />}
          {activeTab === 1 && <BatchesTab />}
          {activeTab === 2 && <AnalyticsTab />}
        </div>
      </main>
    </div>
  );
}

/* ─── Teachers Tab ─────────────────────────────────────────────────────── */

function TeachersTab() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);

  // Create form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [subject, setSubject] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Bulk
  const [bulkFile, setBulkFile] = useState(null);
  const [bulking, setBulking] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkError, setBulkError] = useState(null);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await getTeachers();
      setTeachers(res.teachers || res || []);
    } catch (e) {
      console.error("Failed to fetch teachers", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await createTeacher({
        name: name.trim(),
        email: email.trim(),
        department: department.trim() || undefined,
        subject: subject.trim() || undefined,
      });
      setShowCreate(false);
      setName("");
      setEmail("");
      setDepartment("");
      setSubject("");
      fetchTeachers();
    } catch (err) {
      setCreateError(
        err.response?.data?.detail || "Failed to create teacher."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulking(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const fd = new FormData();
      fd.append("file", bulkFile);
      const res = await bulkCreateTeachers(fd);
      setBulkResult(res);
      fetchTeachers();
    } catch (e) {
      setBulkError(
        e.response?.data?.detail || "Bulk upload failed."
      );
    } finally {
      setBulking(false);
    }
  };

  return (
    <>
      {/* Actions */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary btn btn-sm"
        >
          <PersonAddOutlinedIcon sx={{ fontSize: 15 }} />
          Add Teacher
        </button>
        <button
          onClick={() => setShowBulk(true)}
          className="btn-secondary btn btn-sm"
        >
          <GroupAddOutlinedIcon sx={{ fontSize: 15 }} />
          Bulk CSV Upload
        </button>
        <button className="btn-disabled btn btn-sm" disabled title="Coming Soon">
          <DeleteOutlineIcon sx={{ fontSize: 15 }} />
          Delete
          <span className="coming-soon-badge">Coming Soon</span>
        </button>
        <button className="btn-disabled btn btn-sm" disabled title="Coming Soon">
          <BlockOutlinedIcon sx={{ fontSize: 15 }} />
          Deactivate
          <span className="coming-soon-badge">Coming Soon</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : teachers.length === 0 ? (
        <div className="empty-state py-20">
          <PeopleOutlinedIcon sx={{ fontSize: 40, color: "#94a3b8" }} />
          <p className="text-base font-semibold text-slate-500 mt-3">
            No teachers registered
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Add teachers individually or via CSV bulk upload.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                  Email
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                  Department
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                  Subject
                </th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(teachers) ? teachers : []).map((t, i) => (
                <tr
                  key={t.id || t.clerk_id || i}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-brand-700">
                          {(t.name || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-800">
                        {t.name || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {t.email || "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {t.department || "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {t.subject || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Teacher Modal */}
      {showCreate && (
        <div
          className="modal-overlay"
          onClick={() => !creating && setShowCreate(false)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-display font-bold text-lg text-slate-900">
                Add Teacher
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <CloseOutlinedIcon sx={{ fontSize: 20 }} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-3">
                {createError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {createError}
                  </div>
                )}
                <div>
                  <label className="label">Name *</label>
                  <input
                    className="input"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Jane Smith"
                  />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input
                    className="input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@university.edu"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Department</label>
                    <input
                      className="input"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Computer Science"
                    />
                  </div>
                  <div>
                    <label className="label">Subject</label>
                    <input
                      className="input"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Data Structures"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
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
                  {creating ? "Creating…" : "Add Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulk && (
        <div
          className="modal-overlay"
          onClick={() => !bulking && setShowBulk(false)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-display font-bold text-lg text-slate-900">
                Bulk CSV Upload
              </h2>
              <button
                onClick={() => setShowBulk(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <CloseOutlinedIcon sx={{ fontSize: 20 }} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <p className="text-sm text-slate-500">
                Upload a CSV file with columns:{" "}
                <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                  name, email, department, subject
                </code>
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setBulkFile(e.target.files?.[0])}
                className="text-sm text-slate-600"
              />
              {bulkError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {bulkError}
                </div>
              )}
              {bulkResult && (
                <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  ✓ Upload complete.{" "}
                  {bulkResult.created_count !== undefined &&
                    `${bulkResult.created_count} teachers created.`}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowBulk(false)}
                className="btn-secondary btn"
                disabled={bulking}
              >
                Close
              </button>
              <button
                onClick={handleBulkUpload}
                disabled={!bulkFile || bulking}
                className="btn-primary btn"
              >
                <FileUploadOutlinedIcon sx={{ fontSize: 15 }} />
                {bulking ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Batches Tab ──────────────────────────────────────────────────────── */

function BatchesTab() {
  const [batches, setBatches] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [batchDept, setBatchDept] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await createBatch({
        name: batchName.trim(),
        year: batchYear.trim() || undefined,
        department: batchDept.trim() || undefined,
      });
      setBatches((prev) => [...prev, res.batch || res]);
      setShowCreate(false);
      setBatchName("");
      setBatchYear("");
      setBatchDept("");
    } catch (e) {
      setCreateError(e.response?.data?.detail || "Failed to create batch.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary btn btn-sm"
        >
          <AddOutlinedIcon sx={{ fontSize: 15 }} />
          Create Batch
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5">
        <InfoOutlinedIcon sx={{ fontSize: 16, color: "#d97706", marginTop: "2px" }} />
        <p className="text-sm text-amber-800">
          Batch listing API is not available yet in backend. Only batches
          created during this session are shown below.
        </p>
      </div>

      {batches.length === 0 ? (
        <div className="empty-state py-16">
          <SchoolOutlinedIcon sx={{ fontSize: 36, color: "#94a3b8" }} />
          <p className="text-sm font-semibold text-slate-500 mt-3">
            No batches created yet
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {batches.map((b, i) => (
            <div key={b.batch_id || i} className="card-padded flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <SchoolOutlinedIcon sx={{ fontSize: 20, color: "#4d4fe6" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {b.name || "Unnamed Batch"}
                </p>
                <p className="text-xs text-slate-500">
                  {[b.department, b.year].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <span className="badge-green badge">Created</span>
            </div>
          ))}
        </div>
      )}

      {/* Create Batch Modal */}
      {showCreate && (
        <div
          className="modal-overlay"
          onClick={() => !creating && setShowCreate(false)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-display font-bold text-lg text-slate-900">
                Create Batch
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <CloseOutlinedIcon sx={{ fontSize: 20 }} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-3">
                {createError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {createError}
                  </div>
                )}
                <div>
                  <label className="label">Batch Name *</label>
                  <input
                    className="input"
                    required
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="CSE 2024-A"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Year</label>
                    <input
                      className="input"
                      value={batchYear}
                      onChange={(e) => setBatchYear(e.target.value)}
                      placeholder="2024"
                    />
                  </div>
                  <div>
                    <label className="label">Department</label>
                    <input
                      className="input"
                      value={batchDept}
                      onChange={(e) => setBatchDept(e.target.value)}
                      placeholder="CSE"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="btn-secondary btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn"
                  disabled={creating}
                >
                  {creating ? "Creating…" : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Analytics Tab ────────────────────────────────────────────────────── */

function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await getAdminAnalytics();
        setData(res);
      } catch (e) {
        setError(e.response?.data?.detail || "Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-padded text-center py-16">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const dailyTrend = (data.daily_trend || []).map((d) => ({
    date: d.date,
    Sessions: d.sessions,
    "Got It %": Math.round((d.avg_got_it || 0) * 100),
    "Lost %": Math.round((d.avg_lost || 0) * 100),
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-padded text-center">
          <BarChartOutlinedIcon sx={{ fontSize: 20, color: "#4d4fe6" }} />
          <p className="stat-number mt-1">{data.session_count ?? 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Sessions</p>
        </div>
        <div className="card-padded text-center">
          <TrendingUpOutlinedIcon sx={{ fontSize: 20, color: "#16a34a" }} />
          <p className="stat-number mt-1">
            {Math.round((data.avg_got_it_pct || 0) * 100)}%
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Avg Got It</p>
        </div>
        <div className="card-padded text-center">
          <TrendingUpOutlinedIcon sx={{ fontSize: 20, color: "#dc2626" }} />
          <p className="stat-number mt-1">
            {Math.round((data.avg_lost_pct || 0) * 100)}%
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Avg Lost</p>
        </div>
        <div className="card-padded text-center">
          <QuestionAnswerOutlinedIcon sx={{ fontSize: 20, color: "#d97706" }} />
          <p className="stat-number mt-1">{data.total_questions ?? 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Questions</p>
        </div>
      </div>

      {/* Daily Trend */}
      {dailyTrend.length > 0 ? (
        <div className="card-padded">
          <h3 className="font-display font-bold text-base text-slate-900 mb-4">
            Daily Trend
          </h3>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="Sessions"
                  stroke="#4d4fe6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="Got It %"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="Lost %"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card-padded text-sm text-slate-400 text-center py-8">
          No daily trend data available yet.
        </div>
      )}

      {/* Coming soon cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-padded opacity-60">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-display font-bold text-base text-slate-600">
              Department Comparison
            </h3>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
          <p className="text-sm text-slate-400">
            Compare engagement metrics across departments.
          </p>
        </div>
        <div className="card-padded opacity-60">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-display font-bold text-base text-slate-600">
              Time-Slot Heatmap
            </h3>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
          <p className="text-sm text-slate-400">
            Visualize session engagement by time of day.
          </p>
        </div>
      </div>
    </div>
  );
}
