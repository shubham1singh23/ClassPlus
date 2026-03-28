import React, { useEffect, useState } from "react";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { pushQuiz } from "../services/api";

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

export default function QuizPanel({ sessionId, liveResponses = {} }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pushedQuiz, setPushedQuiz] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pushedQuiz) return;
    setPushedQuiz((current) => (current ? { ...current, responses: liveResponses } : current));
  }, [liveResponses, pushedQuiz]);

  const addOption = () => {
    if (options.length < OPTION_LABELS.length) {
      setOptions((prev) => [...prev, ""]);
    }
  };

  const removeOption = (idx) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, optionIndex) => optionIndex !== idx));
    if (correctIndex === idx) setCorrectIndex(null);
    if (correctIndex > idx) setCorrectIndex((current) => current - 1);
  };

  const updateOption = (idx, value) => {
    setOptions((prev) =>
      prev.map((optionValue, optionIndex) => (optionIndex === idx ? value : optionValue))
    );
  };

  const handlePush = async () => {
    const trimmedQuestion = question.trim();
    const trimmedOptions = options.map((option) => option.trim()).filter(Boolean);

    if (!trimmedQuestion) {
      setError("Enter a quiz question before pushing.");
      return;
    }

    if (trimmedOptions.length < 2 || trimmedOptions.length !== options.length) {
      setError("Enter at least two non-empty options.");
      return;
    }

    if (correctIndex === null || correctIndex < 0 || correctIndex >= trimmedOptions.length) {
      setError("Mark one of the entered options as the correct answer.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await pushQuiz({
        session_id: sessionId,
        question: trimmedQuestion,
        options: trimmedOptions,
        correct_index: correctIndex,
      });

      const quiz = res.quiz || res;
      setPushedQuiz({
        ...quiz,
        question: quiz.question || trimmedQuestion,
        options: quiz.options || trimmedOptions,
        correct_index:
          quiz.correct_index !== undefined ? quiz.correct_index : correctIndex,
      });
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to push quiz.");
    } finally {
      setLoading(false);
    }
  };

  const totalResponses = Object.values(liveResponses).reduce(
    (sum, value) => sum + value,
    0
  );

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
            {(pushedQuiz.options || []).map((option, idx) => {
              const count = liveResponses[idx] || 0;
              const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
              const isCorrect = pushedQuiz.correct_index === idx;

              return (
                <div
                  key={idx}
                  className={`relative overflow-hidden rounded border ${
                    isCorrect ? "border-green-300" : "border-slate-200"
                  }`}
                >
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                      isCorrect ? "bg-green-50" : "bg-brand-50"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-100 text-xs font-bold flex items-center justify-center text-slate-600">
                        {OPTION_LABELS[idx]}
                      </span>
                      <span className="text-sm text-slate-700">{option}</span>
                      {isCorrect && (
                        <span className="text-[11px] uppercase tracking-wide font-semibold text-green-700">
                          Correct
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      {count} ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>{totalResponses} responses received</span>
            <button
              onClick={() => {
                setPushedQuiz(null);
                setQuestion("");
                setOptions(["", ""]);
                setCorrectIndex(null);
              }}
              className="text-brand-600 hover:text-brand-800 font-medium"
            >
              Push Another Quiz
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
          placeholder="Type your quiz question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Options</label>
        <div className="flex flex-col gap-1.5">
          {options.map((option, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <button
                onClick={() => setCorrectIndex(idx)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  correctIndex === idx
                    ? "border-green-500 bg-green-500"
                    : "border-slate-300 hover:border-green-400"
                }`}
                title="Mark as correct"
                type="button"
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
                value={option}
                onChange={(e) => updateOption(idx, e.target.value)}
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(idx)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  type="button"
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </button>
              )}
            </div>
          ))}
        </div>

        {options.length < OPTION_LABELS.length && (
          <button
            onClick={addOption}
            className="mt-2 btn-ghost btn-sm btn text-xs"
            type="button"
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
        {loading ? "Pushing..." : "Push to Students"}
      </button>
    </div>
  );
}
