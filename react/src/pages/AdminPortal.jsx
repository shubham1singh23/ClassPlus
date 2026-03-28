import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import Sidebar from "../components/Sidebar";
import { useBackendAuth } from "../services/backendAuth.jsx";
import {
  bulkCreateTeachers,
  createBatch,
  createTeacher,
  deleteTeacher,
  getAdminAnalytics,
  getBatches,
  getTeachers,
  recalculateScores,
  registerUniversity,
} from "../services/api";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import QuestionAnswerOutlinedIcon from "@mui/icons-material/QuestionAnswerOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";

const TABS = ["Teachers", "Batches", "Analytics"];

function trendBadge(trend) {
  if (trend === undefined || trend === null || trend === "") {
    return <span className="badge badge-slate">No trend</span>;
  }
  const numeric = Number(trend);
  if (!Number.isNaN(numeric)) {
    return <span className={`badge ${numeric >= 0 ? "badge-green" : "badge-red"}`}>{numeric >= 0 ? `+${numeric}` : numeric}</span>;
  }
  return <span className="badge badge-slate">{String(trend)}</span>;
}

export default function AdminPortal() {
  const { backendUser, refresh } = useBackendAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [universityName, setUniversityName] = useState("");
  const [registeringUniversity, setRegisteringUniversity] = useState(false);
  const [universityMessage, setUniversityMessage] = useState("");
  const [recalculating, setRecalculating] = useState(false);
  const [recalculateMessage, setRecalculateMessage] = useState("");

  const handleRegisterUniversity = async (event) => {
    event.preventDefault();
    if (!universityName.trim()) return;
    setRegisteringUniversity(true);
    setUniversityMessage("");
    try {
      await registerUniversity({ university_name: universityName.trim() });
      setUniversityMessage("University registered successfully.");
      await refresh();
    } catch (error) {
      setUniversityMessage(error.response?.data?.detail || "University registration failed.");
    } finally {
      setRegisteringUniversity(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    setRecalculateMessage("");
    try {
      await recalculateScores();
      setRecalculateMessage("Teacher performance records recalculated.");
    } catch (error) {
      setRecalculateMessage(error.response?.data?.detail || "Score recalculation failed.");
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar variant="admin" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8">
          <div className="page-header">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">Admin Portal</h1>
              <p className="text-sm text-slate-500 mt-0.5">University setup, teacher management, analytics, and maintenance.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 mb-6">
            <form onSubmit={handleRegisterUniversity} className="card-padded">
              <div className="flex items-center gap-2 mb-3">
                <SchoolOutlinedIcon sx={{ color: "#4d4fe6" }} />
                <h2 className="font-display font-bold text-base text-slate-900">University Registration</h2>
              </div>
              <p className="text-sm text-slate-500 mb-3">Use this after initial admin sign-up to attach the current university record.</p>
              <div className="flex gap-2 flex-wrap">
                <input className="input flex-1 min-w-[240px]" value={universityName} onChange={(e) => setUniversityName(e.target.value)} placeholder="ABC University" />
                <button type="submit" className="btn-primary btn" disabled={registeringUniversity}>
                  {registeringUniversity ? "Registering..." : "Register University"}
                </button>
              </div>
              {universityMessage && <p className="text-sm text-slate-600 mt-3">{universityMessage}</p>}
            </form>

            <div className="card-padded">
              <div className="flex items-center gap-2 mb-3">
                <AutorenewOutlinedIcon sx={{ color: "#d97706" }} />
                <h2 className="font-display font-bold text-base text-slate-900">Maintenance</h2>
              </div>
              <p className="text-sm text-slate-500 mb-3">Recalculate teacher performance after imports or historical corrections.</p>
              <button onClick={handleRecalculate} className="btn-secondary btn w-full justify-center" disabled={recalculating} type="button">
                {recalculating ? "Recalculating..." : "Refresh Scores"}
              </button>
              {recalculateMessage && <p className="text-sm text-slate-600 mt-3">{recalculateMessage}</p>}
            </div>
          </div>

          {backendUser?.needs_university_registration ? (
            <div className="card-padded">
              <p className="text-sm text-slate-500">
                Complete university registration first. The rest of the admin portal will unlock after the backend creates your university and admin teacher record.
              </p>
            </div>
          ) : (
            <>
          <div className="flex border-b border-slate-200 mb-6">
            {TABS.map((tab, index) => (
              <button key={tab} onClick={() => setActiveTab(index)} className={activeTab === index ? "tab-btn-active" : "tab-btn"} type="button">
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 0 && <TeachersTab />}
          {activeTab === 1 && <BatchesTab />}
          {activeTab === 2 && <AnalyticsTab />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function TeachersTab() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [subject, setSubject] = useState("");
  const [role, setRole] = useState("teacher");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulking, setBulking] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkError, setBulkError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await getTeachers();
      setTeachers(response.teachers || response || []);
    } catch (error) {
      console.error("Failed to fetch teachers", error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await createTeacher({
        name: name.trim(),
        email: email.trim(),
        department: department.trim() || undefined,
        subject: subject.trim() || undefined,
        role,
      });
      setShowCreate(false);
      setName("");
      setEmail("");
      setDepartment("");
      setSubject("");
      setRole("teacher");
      fetchTeachers();
    } catch (error) {
      setCreateError(error.response?.data?.detail || "Failed to create teacher.");
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
      const formData = new FormData();
      formData.append("file", bulkFile);
      const response = await bulkCreateTeachers(formData);
      setBulkResult(response);
      fetchTeachers();
    } catch (error) {
      setBulkError(error.response?.data?.detail || "Bulk upload failed.");
    } finally {
      setBulking(false);
    }
  };

  const handleDelete = async (teacherId) => {
    if (!window.confirm("Delete this teacher record?")) return;
    setDeletingId(teacherId);
    try {
      await deleteTeacher(teacherId);
      setTeachers((current) => current.filter((teacher) => teacher.id !== teacherId));
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button onClick={() => setShowCreate(true)} className="btn-primary btn btn-sm" type="button">
          <PersonAddOutlinedIcon sx={{ fontSize: 15 }} />
          Add Teacher
        </button>
        <button onClick={() => setShowBulk(true)} className="btn-secondary btn btn-sm" type="button">
          <GroupAddOutlinedIcon sx={{ fontSize: 15 }} />
          Bulk CSV Upload
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-7 h-7 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : teachers.length === 0 ? (
        <div className="empty-state py-20">
          <PeopleOutlinedIcon sx={{ fontSize: 40, color: "#94a3b8" }} />
          <p className="text-base font-semibold text-slate-500 mt-3">No teachers registered</p>
          <p className="text-sm text-slate-400 mt-1">Add teachers individually or via CSV bulk upload.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Department</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Subject</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Score</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Sessions</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">University Rank</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Trend</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher, index) => (
                <tr key={teacher.id || teacher.clerk_id || index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-brand-700">{(teacher.name || "?")[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-800 block">{teacher.name || "-"}</span>
                        <span className="text-xs text-slate-500">{teacher.email || "-"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">{teacher.department || "-"}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{teacher.subject || "-"}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-800">{Math.round(teacher.classpulse_score ?? teacher.score ?? teacher.average_score ?? 0)}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{teacher.session_count ?? 0}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{teacher.university_rank ?? "-"}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{trendBadge(teacher.trend)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleDelete(teacher.id)} className="btn-secondary btn btn-sm" type="button" disabled={deletingId === teacher.id}>
                      <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                      {deletingId === teacher.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => !creating && setShowCreate(false)}>
          <div className="modal-box" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-display font-bold text-lg text-slate-900">Add Teacher</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600" type="button"><CloseOutlinedIcon sx={{ fontSize: 20 }} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-3">
                {createError && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{createError}</div>}
                <div><label className="label">Name *</label><input className="input" required value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><label className="label">Email *</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Department</label><input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} /></div>
                  <div><label className="label">Subject</label><input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
                </div>
                <div>
                  <label className="label">Role</label>
                  <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="teacher">teacher</option>
                    <option value="dept_head">dept_head</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary btn" disabled={creating}>Cancel</button>
                <button type="submit" className="btn-primary btn" disabled={creating}>{creating ? "Creating..." : "Add Teacher"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulk && (
        <div className="modal-overlay" onClick={() => !bulking && setShowBulk(false)}>
          <div className="modal-box" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-display font-bold text-lg text-slate-900">Bulk CSV Upload</h2>
              <button onClick={() => setShowBulk(false)} className="text-slate-400 hover:text-slate-600" type="button"><CloseOutlinedIcon sx={{ fontSize: 20 }} /></button>
            </div>
            <div className="modal-body space-y-4">
              <p className="text-sm text-slate-500">Upload a CSV file with columns:
                <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded ml-1">name, email, department, subject, role?</code>
              </p>
              <input type="file" accept=".csv" onChange={(e) => setBulkFile(e.target.files?.[0] || null)} className="text-sm text-slate-600" />
              {bulkError && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{bulkError}</div>}
              {bulkResult && <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Upload complete. {bulkResult.created_count ?? bulkResult.count ?? "Teachers"} created.</div>}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowBulk(false)} className="btn-secondary btn" disabled={bulking} type="button">Close</button>
              <button onClick={handleBulkUpload} disabled={!bulkFile || bulking} className="btn-primary btn" type="button">
                <FileUploadOutlinedIcon sx={{ fontSize: 15 }} />
                {bulking ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BatchesTab() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [batchDept, setBatchDept] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await getBatches();
      setBatches(response.batches || response || []);
    } catch (error) {
      console.error("Failed to fetch batches", error);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await createBatch({
        name: batchName.trim(),
        year: batchYear.trim() || undefined,
        department: batchDept.trim() || undefined,
      });
      setShowCreate(false);
      setBatchName("");
      setBatchYear("");
      setBatchDept("");
      fetchBatches();
    } catch (error) {
      setCreateError(error.response?.data?.detail || "Failed to create batch.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setShowCreate(true)} className="btn-primary btn btn-sm" type="button">
          <AddOutlinedIcon sx={{ fontSize: 15 }} />
          Create Batch
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-7 h-7 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : batches.length === 0 ? (
        <div className="empty-state py-16">
          <SchoolOutlinedIcon sx={{ fontSize: 36, color: "#94a3b8" }} />
          <p className="text-sm font-semibold text-slate-500 mt-3">No batches created yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {batches.map((batch, index) => (
            <div key={batch.batch_id || batch.id || index} className="card-padded flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center"><SchoolOutlinedIcon sx={{ fontSize: 20, color: "#4d4fe6" }} /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{batch.name || "Unnamed Batch"}</p>
                <p className="text-xs text-slate-500">{[batch.department, batch.year].filter(Boolean).join(" - ") || "-"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Batch Code</p>
                <p className="font-mono text-sm font-semibold text-brand-700">{batch.code || batch.batch_code || "N/A"}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => !creating && setShowCreate(false)}>
          <div className="modal-box" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-display font-bold text-lg text-slate-900">Create Batch</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600" type="button"><CloseOutlinedIcon sx={{ fontSize: 20 }} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-3">
                {createError && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{createError}</div>}
                <div><label className="label">Batch Name *</label><input className="input" required value={batchName} onChange={(e) => setBatchName(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Year</label><input className="input" value={batchYear} onChange={(e) => setBatchYear(e.target.value)} /></div>
                  <div><label className="label">Department</label><input className="input" value={batchDept} onChange={(e) => setBatchDept(e.target.value)} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary btn">Cancel</button>
                <button type="submit" className="btn-primary btn" disabled={creating}>{creating ? "Creating..." : "Create Batch"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await getAdminAnalytics();
        setData(response);
      } catch (fetchError) {
        setError(fetchError.response?.data?.detail || "Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-7 h-7 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (error) {
    return <div className="card-padded text-center py-16"><p className="text-red-600 font-medium">{error}</p></div>;
  }
  if (!data) return null;

  const dailyTrend = (data.daily_trend || []).map((item) => ({
    date: item.date,
    sessions: item.sessions ?? item.session_count ?? 0,
    gotIt: Math.round((item.avg_got_it_pct ?? item.avg_got_it ?? 0) * 100),
    lost: Math.round((item.avg_lost_pct ?? item.avg_lost ?? 0) * 100),
  }));
  const departmentBreakdown = (data.department_breakdown || []).map((item) => ({
    department: item.department || item.name || "Unknown",
    score: Math.round(item.average_teacher_score ?? item.score ?? 0),
    gotIt: Math.round((item.avg_got_it_pct ?? item.avg_got_it ?? 0) * 100),
    lost: Math.round((item.avg_lost_pct ?? item.avg_lost ?? 0) * 100),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-padded text-center"><PeopleOutlinedIcon sx={{ fontSize: 20, color: "#4d4fe6" }} /><p className="stat-number mt-1">{data.teacher_count ?? 0}</p><p className="text-xs text-slate-500 mt-0.5">Teachers</p></div>
        <div className="card-padded text-center"><BarChartOutlinedIcon sx={{ fontSize: 20, color: "#16a34a" }} /><p className="stat-number mt-1">{data.session_count ?? 0}</p><p className="text-xs text-slate-500 mt-0.5">Session Volume</p></div>
        <div className="card-padded text-center"><QuestionAnswerOutlinedIcon sx={{ fontSize: 20, color: "#d97706" }} /><p className="stat-number mt-1">{data.total_questions ?? 0}</p><p className="text-xs text-slate-500 mt-0.5">Total Questions</p></div>
        <div className="card-padded text-center"><InsightsOutlinedIcon sx={{ fontSize: 20, color: "#dc2626" }} /><p className="stat-number mt-1">{Math.round(data.average_teacher_score ?? 0)}</p><p className="text-xs text-slate-500 mt-0.5">Average Teacher Score</p></div>
      </div>

      <div className="card-padded">
        <h3 className="font-display font-bold text-base text-slate-900 mb-4">Daily Comprehension Trend</h3>
        {dailyTrend.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">No daily trend data available yet.</p> : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="gotIt" stroke="#16a34a" strokeWidth={2} name="Avg Got It %" />
                <Line type="monotone" dataKey="lost" stroke="#dc2626" strokeWidth={2} name="Avg Lost %" />
                <Line type="monotone" dataKey="sessions" stroke="#4d4fe6" strokeWidth={2} name="Sessions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card-padded">
          <h3 className="font-display font-bold text-base text-slate-900 mb-4">Department Score Comparison</h3>
          {departmentBreakdown.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">No department breakdown available.</p> : (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={departmentBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="department" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" fill="#4d4fe6" name="Average Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card-padded">
          <h3 className="font-display font-bold text-base text-slate-900 mb-4">Department Comprehension Snapshot</h3>
          {departmentBreakdown.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">No department breakdown available.</p> : (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={departmentBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="department" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="gotIt" fill="#16a34a" name="Avg Got It %" />
                  <Bar dataKey="lost" fill="#dc2626" name="Avg Lost %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
