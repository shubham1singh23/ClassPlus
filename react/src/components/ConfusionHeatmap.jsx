import React from "react";
import ThermostatOutlinedIcon from "@mui/icons-material/ThermostatOutlined";

function getTokenStyle(lostPct) {
  if (lostPct >= 0.6)
    return {
      bg: "bg-red-100",
      border: "border-red-300",
      text: "text-red-800",
      dot: "bg-red-500",
    };
  if (lostPct >= 0.4)
    return {
      bg: "bg-amber-100",
      border: "border-amber-300",
      text: "text-amber-800",
      dot: "bg-amber-500",
    };
  return {
    bg: "bg-slate-50",
    border: "border-transparent",
    text: "text-slate-700",
    dot: "bg-slate-300",
  };
}

export default function ConfusionHeatmap({ heatmap = [] }) {
  if (!heatmap || heatmap.length === 0) {
    return (
      <div className="card-padded">
        <div className="flex items-center gap-2 mb-4">
          <ThermostatOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
          <h3 className="font-display font-bold text-base text-slate-900">
            Confusion Heatmap
          </h3>
        </div>
        <div className="text-sm text-slate-400 text-center py-6">
          No heatmap data available for this session.
        </div>
      </div>
    );
  }

  return (
    <div className="card-padded">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ThermostatOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
          <h3 className="font-display font-bold text-base text-slate-900">
            Confusion Heatmap
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            High confusion ≥60%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Moderate ≥40%
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 leading-relaxed">
        {heatmap.map((segment, i) => {
          const style = getTokenStyle(segment.lost_pct || 0);
          const lostPct = Math.round((segment.lost_pct || 0) * 100);
          return (
            <div
              key={i}
              className={`group relative inline-flex items-center gap-1 px-2 py-0.5 rounded border text-sm transition-all cursor-default ${style.bg} ${style.border} ${style.text}`}
            >
              {lostPct >= 40 && (
                <span className={`w-1.5 h-1.5 rounded-full ${style.dot} inline-block`} />
              )}
              <span>{segment.text}</span>

              {/* Tooltip */}
              {lostPct >= 40 && (
                <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-10 pointer-events-none">
                  <div className="bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                    {lostPct}% confused at this point
                    {segment.start !== undefined && (
                      <span className="text-slate-400">
                        {" "}
                        ({Math.round(segment.start)}s–{Math.round(segment.end)}s)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}