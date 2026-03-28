import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";

export default function SessionCode({ joinCode, sessionId }) {
  const [copied, setCopied] = useState(false);
  const qrUrl = `https://app.classpulse.in/join?code=${joinCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-padded space-y-4">
      <div className="flex items-center gap-2">
        <QrCode2OutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
        <h3 className="font-display font-bold text-base text-slate-900">
          Join Code
        </h3>
      </div>

      {/* Large code display */}
      <div className="bg-slate-950 rounded-lg px-5 py-4 flex items-center justify-between">
        <span className="font-mono text-3xl font-bold tracking-widest text-white">
          {joinCode || "----"}
        </span>
        <button
          onClick={handleCopy}
          className={`transition-all p-1.5 rounded ${
            copied
              ? "text-green-400"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="Copy code"
        >
          {copied ? (
            <CheckOutlinedIcon sx={{ fontSize: 18 }} />
          ) : (
            <ContentCopyOutlinedIcon sx={{ fontSize: 18 }} />
          )}
        </button>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-2">
        <div className="bg-white border border-slate-200 rounded-lg p-3 inline-block">
          <QRCodeSVG value={qrUrl} size={120} level="M" />
        </div>
        <p className="text-xs text-slate-400 text-center">
          Students scan to join
        </p>
      </div>

      {sessionId && (
        <div className="text-xs text-slate-400 font-mono truncate text-center">
          {sessionId}
        </div>
      )}
    </div>
  );
}