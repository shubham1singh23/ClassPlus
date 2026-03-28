import React, { useState } from "react";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { pushQuiz } from "../services/api";

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function QuizPanel({ sessionId, liveResponses = {} }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pushedQuiz, setPushedQuiz] = useState(null);
  const [error, setError] = useState(null);

  const addOption = () => {
    if (options.length < 4) setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (idx) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
    if (correctIndex === idx) setCorrectIndex(null);
    if (correctIndex > idx) setCorrectIndex((c) => c - 1);
  };

  const updateOption = (idx, val) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? val : o)));
  };

  const handlePush = async () => {
    if (!question.trim() || options.some((o) => !o.trim())) {
      setError("Fill in the question and all options.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await pushQuiz({
        session_id: sessionId,
        question,
        options,
        correct_index: correctIndex,
      });
      setPushedQuiz(res.quiz || res);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to push quiz.");
    } finally {
      setLoading(false);
    }
  };

  const totalResponses = Object.values(liveResponses).reduce((a, b) => a + b, 0);

  if (pushedQuiz) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Active Quiz</span>
          <span className="badge-green badge">Live</span>
        </div>
        <div className="card p-4">
          <p className="text-sm font-medium text-slate-800 mb-3">
            {pushedQuiz.question}
          </p>
          <div className="flex flex-col gap-2">
            {(pushedQuiz.options || []).map((opt, idx) => {
              const count = liveResponses[idx] || 0;
              const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
              return (
                <div key={idx} className="relative overflow-hidden rounded border border-slate-200">
                  <div
                    className="absolute inset-y-0 left-0 bg-brand-50 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-100 text-xs font-bold flex items-center justify-center text-slate-600">
                        {OPTION_LABELS[idx]}
                      </span>
                      <span className="text-sm text-slate-700">{opt}</span>
                    </div>
                    <span className="text-xs font-semibold text-brand-700">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>{totalResponses} response{totalResponses !== 1 ? "s" : ""}</span>
            <button
              onClick={() => { setPushedQuiz(null); setQuestion(""); setOptions(["", ""]); setCorrectIndex(null); }}
              className="text-brand-600 hover:text-brand-800 font-medium"
            >
              New Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <QuizOutlinedIcon sx={{ fontSize: 16, color: "#64748b" }} />
        <span className="text-sm font-semibold text-slate-700">Push Quiz</span>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label className="label">Question</label>
        <textarea
          className="input resize-none"
          rows={2}
          placeholder="Type your quiz question…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Options</label>
        <div className="flex flex-col gap-1.5">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <button
                onClick={() => setCorrectIndex(idx)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  correctIndex === idx
                    ? "border-green-500 bg-green-500"
                    : "border-slate-300 hover:border-green-400"
                }`}
                title="Mark as correct"
              >
                {correctIndex === idx && (
                  <CheckCircleOutlineIcon sx={{ fontSize: 12, color: "white" }} />
                )}
              </button>
              <span className="w-5 text-xs font-bold text-slate-400 shrink-0">
                {OPTION_LABELS[idx]}
              </span>
              <input
                className="input flex-1"
                placeholder={`Option ${OPTION_LABELS[idx]}`}
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(idx)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < 4 && (
          <button
            onClick={addOption}
            className="mt-2 btn-ghost btn-sm btn text-xs"
          >
            <AddOutlinedIcon sx={{ fontSize: 13 }} />
            Add Option
          </button>
        )}
      </div>

      <button
        onClick={handlePush}
        disabled={loading}
        className="btn-primary btn w-full justify-center"
      >
        <SendOutlinedIcon sx={{ fontSize: 15 }} />
        {loading ? "Pushing…" : "Push to Students"}
      </button>
    </div>
  );
}