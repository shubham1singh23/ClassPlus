import React from "react";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

export default function LiveSignalBar({
  gotIt = 0,
  sortOf = 0,
  lost = 0,
  reliableCount = 0,
  totalCount = 0,
}) {
  const gotItPct = Math.round((gotIt || 0) * 100);
  const sortOfPct = Math.round((sortOf || 0) * 100);
  const lostPct = Math.round((lost || 0) * 100);

  const segments = [
    {
      key: "got_it",
      pct: gotItPct,
      label: "Got It",
      bg: "bg-green-600",
      light: "bg-green-50",
      text: "text-green-700",
      icon: CheckCircleOutlineIcon,
    },
    {
      key: "sort_of",
      pct: sortOfPct,
      label: "Sort Of",
      bg: "bg-amber-500",
      light: "bg-amber-50",
      text: "text-amber-700",
      icon: HelpOutlineIcon,
    },
    {
      key: "lost",
      pct: lostPct,
      label: "Lost",
      bg: "bg-red-600",
      light: "bg-red-50",
      text: "text-red-700",
      icon: ErrorOutlineIcon,
    },
  ];

  return (
    <div className="card-padded space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-base text-slate-900">Live Signal</h3>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <PeopleOutlineIcon sx={{ fontSize: 14 }} />
          <span>
            {reliableCount} reliable / {totalCount} total
          </span>
        </div>
      </div>

      <div className="signal-bar-track" style={{ height: 12 }}>
        {segments.map(({ key, pct, bg }) => (
          <div
            key={key}
            className={`${bg} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {segments.map(({ key, pct, label, light, text, icon: Icon }) => (
          <div key={key} className={`${light} rounded-lg px-3 py-2.5 text-center`}>
            <div className={`flex items-center justify-center gap-1 ${text} mb-0.5`}>
              <Icon sx={{ fontSize: 14 }} />
              <span className="text-xs font-medium">{label}</span>
            </div>
            <div className={`font-display font-bold text-xl ${text}`}>{pct}%</div>
          </div>
        ))}
      </div>

      {reliableCount > 0 && (
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              reliableCount >= 5 ? "bg-green-500" : "bg-amber-500"
            }`}
          />
          <span className="text-xs text-slate-500">
            {reliableCount >= 5
              ? `Signal reliable - ${reliableCount} responses`
              : `Low sample - ${reliableCount} responses (need >=5)`}
          </span>
        </div>
      )}
    </div>
  );
}
