import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getAdminLeaderboard, getLeaderboard } from "../services/api";

import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";

function trendBadge(trend) {
  if (trend === undefined || trend === null || trend === "") {
    return <span className="badge badge-slate">No trend</span>;
  }

  const numeric = Number(trend);
  if (!Number.isNaN(numeric)) {
    return numeric >= 0 ? (
      <span className="badge badge-green">
        <TrendingUpOutlinedIcon sx={{ fontSize: 12 }} />
        +{numeric}
      </span>
    ) : (
      <span className="badge badge-red">
        <TrendingDownOutlinedIcon sx={{ fontSize: 12 }} />
        {numeric}
      </span>
    );
  }

  return <span className="badge badge-slate">{String(trend)}</span>;
}

export default function Leaderboard() {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = isAdminView
          ? await getAdminLeaderboard()
          : await getLeaderboard();
        setData(response);
      } catch (fetchError) {
        setError(fetchError.response?.data?.detail || "Failed to load leaderboard.");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [isAdminView]);

  const leaderboard = useMemo(() => {
    const list = data?.leaderboard || data?.items || data || [];
    return [...list].sort(
      (left, right) =>
        (right.classpulse_score ?? right.score ?? 0) - (left.classpulse_score ?? left.score ?? 0)
    );
  }, [data]);

  const departments = useMemo(() => {
    const values = new Set();
    leaderboard.forEach((teacher) => {
      if (teacher.department) values.add(teacher.department);
    });
    return Array.from(values).sort();
  }, [leaderboard]);

  const filtered = useMemo(() => {
    let list = leaderboard;

    if (deptFilter !== "all") {
      list = list.filter((teacher) => teacher.department === deptFilter);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      list = list.filter(
        (teacher) =>
          (teacher.name || "").toLowerCase().includes(query) ||
          (teacher.subject || "").toLowerCase().includes(query)
      );
    }

    return list;
  }, [deptFilter, leaderboard, search]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar variant={isAdminView ? "admin" : "teacher"} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8">
          <div className="page-header">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">Leaderboard</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {isAdminView
                  ? "University ranking sorted by ClassPulse score"
                  : "Teacher-visible leaderboard for current university performance"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-28">
              <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="card-padded text-center py-16">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="empty-state py-20">
              <EmojiEventsOutlinedIcon sx={{ fontSize: 40, color: "#94a3b8" }} />
              <p className="text-base font-semibold text-slate-500 mt-3">No leaderboard data</p>
              <p className="text-sm text-slate-400 mt-1">
                Scores will appear after teachers complete scored sessions.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
                  <SearchOutlinedIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                  <input
                    type="text"
                    placeholder="Search teacher or subject..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="bg-transparent border-0 outline-none text-sm text-slate-700 w-full placeholder-slate-400"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <FilterListOutlinedIcon sx={{ fontSize: 16, color: "#64748b" }} />
                  <select
                    value={deptFilter}
                    onChange={(event) => setDeptFilter(event.target.value)}
                    className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                        Rank
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                        Teacher
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                        Department
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                        Subject
                      </th>
                      {isAdminView && (
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                          Sessions
                        </th>
                      )}
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                        Trend
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((teacher, index) => (
                      <tr
                        key={teacher.teacher_id || teacher.id || index}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-5 py-3 text-sm text-slate-600 font-medium">
                          #{teacher.rank || index + 1}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-brand-700">
                                {(teacher.name || "?")[0].toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-slate-800">{teacher.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-600">{teacher.department || "-"}</td>
                        <td className="px-5 py-3 text-sm text-slate-600">{teacher.subject || "-"}</td>
                        {isAdminView && (
                          <td className="px-5 py-3 text-sm text-slate-600">
                            {teacher.session_count ?? 0}
                          </td>
                        )}
                        <td className="px-5 py-3 text-sm text-slate-600">{trendBadge(teacher.trend)}</td>
                        <td className="px-5 py-3 text-right">
                          <span className="font-display font-bold text-sm text-slate-800">
                            {Math.round(teacher.classpulse_score ?? teacher.score ?? 0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
