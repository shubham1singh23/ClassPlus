import React from "react";
import QuestionAnswerOutlinedIcon from "@mui/icons-material/QuestionAnswerOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";

export default function QuestionQueue({ questions = [], onAcknowledge, onRefresh }) {
  const active = questions.filter((q) => !q.acknowledged);
  const done = questions.filter((q) => q.acknowledged);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">
            Questions
          </span>
          {active.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center">
              {active.length}
            </span>
          )}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="btn-ghost btn-sm btn"
            title="Refresh clusters"
          >
            <RefreshOutlinedIcon sx={{ fontSize: 15 }} />
            Summarise
          </button>
        )}
      </div>

      {questions.length === 0 && (
        <div className="empty-state flex-1">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <QuestionAnswerOutlinedIcon sx={{ fontSize: 20, color: "#94a3b8" }} />
          </div>
          <p className="text-sm text-slate-400 font-medium">No questions yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Students will submit doubts during the session
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 overflow-y-auto scrollbar-thin flex-1">
        {active.map((q) => (
          <div
            key={q.question_id || q.id}
            className="card p-3 border-l-4 border-l-amber-400"
          >
            {q.cluster_summaries && q.cluster_summaries.length > 0 ? (
              <div className="space-y-1.5">
                {q.cluster_summaries.map((cs) => (
                  <div key={cs.cluster_id} className="flex items-start gap-2">
                    <div className="flex items-center gap-1 mt-0.5">
                      <GroupsOutlinedIcon sx={{ fontSize: 13, color: "#64748b" }} />
                      <span className="text-xs text-slate-500">{cs.count}</span>
                    </div>
                    <p className="text-sm text-slate-700 flex-1">{cs.summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-700">{q.text || q.content || "Question received"}</p>
            )}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                ID #{q.question_id || q.id}
              </span>
              {onAcknowledge && (
                <button
                  onClick={() => onAcknowledge(q.question_id || q.id)}
                  className="btn-sm btn border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                >
                  <CheckOutlinedIcon sx={{ fontSize: 13 }} />
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        ))}

        {done.length > 0 && (
          <>
            <div className="divider" />
            <p className="section-title">Acknowledged</p>
            {done.map((q) => (
              <div key={q.question_id || q.id} className="card p-3 opacity-50">
                <p className="text-sm text-slate-500 line-through">
                  {q.cluster_summaries?.[0]?.summary || q.text || "Question"}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}