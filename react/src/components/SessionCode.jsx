import React, { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

function formatCountdown(targetIso) {
  if (!targetIso) return null;

  const diffMs = new Date(targetIso).getTime() - Date.now();
  if (diffMs <= 0) return "Expired";

  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} remaining`;
}

export default function SessionCode({ joinCode, qrData, codeExpiresAt, sessionId }) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(() => formatCountdown(codeExpiresAt));
  const qrValue = useMemo(
    () => qrData || `classpulse://join?code=${joinCode || ""}`,
    [joinCode, qrData]
  );

  useEffect(() => {
    setCountdown(formatCountdown(codeExpiresAt));
    if (!codeExpiresAt) return undefined;

    const timer = window.setInterval(() => {
      setCountdown(formatCountdown(codeExpiresAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [codeExpiresAt]);

  const handleCopy = async () => {
    if (!joinCode) return;
    await navigator.clipboard.writeText(joinCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-padded space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <QrCode2OutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
          <h3 className="font-display font-bold text-base text-slate-900">
            Join Code
          </h3>
        </div>
        {countdown && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <AccessTimeOutlinedIcon sx={{ fontSize: 14 }} />
            <span>{countdown}</span>
          </div>
        )}
      </div>

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

      <div className="flex flex-col items-center gap-2">
        <div className="bg-white border border-slate-200 rounded-lg p-3 inline-block">
          <QRCodeSVG value={qrValue} size={140} level="M" />
        </div>
        <p className="text-xs text-slate-400 text-center">
          Students can scan the QR code or enter the join code manually.
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
