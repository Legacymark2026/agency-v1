"use client";

import React from "react";

export type SentimentType = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "ANGRY";

export interface SentimentBadgeProps {
  sentiment?: SentimentType;
  score?: number;
  className?: string;
}

export function SentimentBadge({ sentiment = "NEUTRAL", score, className = "" }: SentimentBadgeProps) {
  const getStyle = () => {
    switch (sentiment) {
      case "POSITIVE":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          icon: "😊",
          label: "Positivo"
        };
      case "ANGRY":
        return {
          bg: "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse",
          icon: "🔥",
          label: "Molesto / URGENTE"
        };
      case "NEGATIVE":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          icon: "😟",
          label: "Negativo"
        };
      case "NEUTRAL":
      default:
        return {
          bg: "bg-slate-500/10 border-slate-500/30 text-slate-400",
          icon: "😐",
          label: "Neutral"
        };
    }
  };

  const style = getStyle();

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md transition-all ${style.bg} ${className}`}>
      <span>{style.icon}</span>
      <span>{style.label}</span>
      {score !== undefined && (
        <span className="opacity-60 text-[10px]">({score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)})</span>
      )}
    </span>
  );
}
