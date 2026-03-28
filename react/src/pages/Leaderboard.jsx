import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import { getLeaderboard } from "../services/api";

import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

const medalColors = [
  "from-yellow-400 to-amber-500",
  "from-slate-300 to-slate-400",
  "from-amber-600 to-amber-700",
];

const medalEmojis = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetch() {
      try {
        const res = await getLeaderboard();
        setData(res);
      } catch (e) {
        setError(e.response?.data?.detail || "Failed to load leaderboard.");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const leaderboard = data?.leaderboard || [];

  const departments = useMemo(() => {
    const depts = new Set();
    leaderboard.forEach((t) => {
      if (t.department) depts.add(t.department);
    });
    return Array.from(depts).sort();
  }, [leaderboard]);

  const filtered = useMemo(() => {
    let list = leaderboard;
    if (deptFilter !== "all") {
      list = list.filter((t) => t.department === deptFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          (t.name || "").toLowerCase().includes(q) ||
          (t.subject || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [leaderboard, deptFilter, search]);

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar variant="admin" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
          <div className="page-header">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">
                Leaderboard
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Top teachers by ClassPulse score
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
              <EmojiEventsOutlinedIcon
                sx={{ fontSize: 40, color: "#94a3b8" }}
              />
              <p className="text-base font-semibold text-slate-500 mt-3">
                No leaderboard data
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Scores will appear after teachers complete sessions.
              </p>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
                  <SearchOutlinedIcon
                    sx={{ fontSize: 16, color: "#94a3b8" }}
                  />
                  <input
                    type="text"
                    placeholder="Search teacher or subject…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent border-0 outline-none text-sm text-slate-700 w-full placeholder-slate-400"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <FilterListOutlinedIcon
                    sx={{ fontSize: 16, color: "#64748b" }}
                  />
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Top 3 Podium */}
              {top3.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {top3.map((t, i) => (
                    <div
                      key={t.rank || i}
                      className={`card p-5 text-center relative overflow-hidden ${
                        i === 0
                          ? "border-amber-300 bg-gradient-to-b from-amber-50 to-white shadow-md"
                          : ""
                      }`}
                    >
                      {/* Medal */}
                      <div className="text-3xl mb-2">
                        {medalEmojis[i] || ""}
                      </div>
                      <div
                        className={`w-14 h-14 rounded-full bg-gradient-to-br ${
                          medalColors[i] || "from-slate-200 to-slate-300"
                        } flex items-center justify-center mx-auto mb-3 shadow-sm`}
                      >
                        <span className="text-white font-display font-bold text-lg">
                          {(t.name || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <p className="font-semibold text-sm text-slate-800 truncate">
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {[t.department, t.subject]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                      <p
                        className={`font-display text-2xl font-bold mt-3 ${
                          i === 0 ? "text-amber-600" : "text-slate-700"
                        }`}
                      >
                        {Math.round(t.classpulse_score ?? 0)}
                      </p>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">
                        Score
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Table */}
              {rest.length > 0 && (
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
                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                          Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rest.map((t, i) => (
                        <tr
                          key={t.rank || i + 4}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-5 py-3 text-sm text-slate-600 font-medium">
                            #{t.rank || i + 4}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-brand-700">
                                  {(t.name || "?")[0].toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-slate-800">
                                {t.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-600">
                            {t.department || "—"}
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-600">
                            {t.subject || "—"}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="font-display font-bold text-sm text-slate-800">
                              {Math.round(t.classpulse_score ?? 0)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
