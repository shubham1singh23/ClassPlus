import React from "react";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";

export default function VideoPlayer({ url, onClose }) {
  if (!url) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-black rounded-xl overflow-hidden shadow-2xl w-full max-w-3xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
          <div className="flex items-center gap-2 text-white">
            <PlayCircleOutlineIcon sx={{ fontSize: 18 }} />
            <span className="text-sm font-medium">Session Recording</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <CloseOutlinedIcon sx={{ fontSize: 20 }} />
          </button>
        </div>
        <video
          src={url}
          controls
          autoPlay
          className="w-full aspect-video bg-black"
        />
      </div>
    </div>
  );
}