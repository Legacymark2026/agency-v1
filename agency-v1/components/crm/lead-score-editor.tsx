"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateLeadScore } from "@/actions/leads";
import { Check, Edit2, X } from "lucide-react";

export function ScoreRadial({ score }: { score: number }) {
    const size = 64;
    const strokeWidth = 6;
    const center = size / 2;
    const radius = center - strokeWidth;
    const dashArray = 2 * Math.PI * radius;
    const dashOffset = dashArray * ((100 - score) / 100);
    const color = score >= 70 ? "#34d399" : score >= 40 ? "#fbbf24" : "#f87171";
    const glow = score >= 70 ? "rgba(52,211,153,0.25)" : score >= 40 ? "rgba(251,191,36,0.25)" : "rgba(248,113,113,0.25)";

    return (
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", borderRadius: "14px", background: `rgba(15,23,42,0.6)`, border: `1px solid ${glow}`, flexShrink: 0, boxShadow: `0 0 16px ${glow}` }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={strokeWidth} stroke="rgba(30,41,59,0.9)" />
                <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={strokeWidth}
                    stroke={color} strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: "stroke-dashoffset 1s ease-in-out" }}
                />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "18px", fontWeight: 900, color, fontFamily: "monospace" }}>{score}</span>
            </div>
        </div>
    );
}

export function LeadScoreEditor({ leadId, initialScore, canManageLeads = false }: { leadId: string; initialScore: number; canManageLeads?: boolean }) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [score, setScore] = useState(initialScore);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!canManageLeads) return;
        if (score === initialScore) { setIsEditing(false); return; }
        setIsLoading(true);
        try {
            const res = await updateLeadScore(leadId, score);
            if (res.success) { setIsEditing(false); router.refresh(); }
            else { setScore(initialScore); }
        } catch { setScore(initialScore); } finally { setIsLoading(false); }
    };

    if (isEditing) {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="number" min={0} max={100} value={score}
                    onChange={(e) => setScore(Number(e.target.value))} autoFocus
                    style={{ width: "56px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(13,148,136,0.5)", borderRadius: "8px", padding: "6px", textAlign: "center", fontSize: "14px", fontWeight: 900, color: "#2dd4bf", outline: "none", fontFamily: "monospace" }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <button onClick={handleSave} disabled={isLoading}
                        style={{ width: "22px", height: "22px", borderRadius: "6px", background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.4)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Check style={{ width: "12px", height: "12px" }} />
                    </button>
                    <button onClick={() => { setScore(initialScore); setIsEditing(false); }} disabled={isLoading}
                        style={{ width: "22px", height: "22px", borderRadius: "6px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <X style={{ width: "12px", height: "12px" }} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ position: "relative", cursor: canManageLeads ? "pointer" : "default" }}
            onClick={() => canManageLeads && setIsEditing(true)}
            className="group/score">
            <ScoreRadial score={score} />
            {canManageLeads && (
                <div style={{
                    position: "absolute", top: "-6px", right: "-6px",
                    background: "rgba(11,15,25,0.9)", borderRadius: "50%", padding: "4px",
                    border: "1px solid rgba(30,41,59,0.9)", display: "flex",
                    opacity: 0, transition: "opacity 0.15s", color: "#475569",
                }} className="group-hover/score:!opacity-100">
                    <Edit2 style={{ width: "10px", height: "10px" }} />
                </div>
            )}
        </div>
    );
}
