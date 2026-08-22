/**
 * Ultra-Premium Design System Tokens & Aesthetic Helpers
 * ─────────────────────────────────────────────────────────────────────────────
 * Curated color tokens, glassmorphism classes, neon glows, and gradient utilities
 * for Fortune 500 enterprise UI appearance.
 */

export const THEME_TOKENS = {
  colors: {
    background: "bg-slate-950",
    cardBackground: "bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-2xl hover:border-slate-700/80 transition-all",
    cardGlassGlow: "bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-2xl border border-slate-800/80 shadow-[0_0_30px_rgba(13,148,136,0.15)]",
    cardNeonBorder: "border border-teal-500/30 hover:border-teal-500/70 shadow-[0_0_20px_rgba(20,184,166,0.2)] transition-all",
    textPrimary: "text-slate-100",
    textSecondary: "text-slate-400",
    textMuted: "text-slate-500",
  },
  gradients: {
    brand: "bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-extrabold",
    rose: "bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent font-extrabold",
    purple: "bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent font-extrabold",
    gold: "bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent font-extrabold",
    glowGreen: "shadow-[0_0_25px_rgba(16,185,129,0.35)]",
    glowPurple: "shadow-[0_0_25px_rgba(168,85,247,0.35)]",
    glowCyan: "shadow-[0_0_25px_rgba(6,182,212,0.35)]",
  },
  badges: {
    success: "px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-extrabold rounded-full border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
    warning: "px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-extrabold rounded-full border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
    danger: "px-3 py-1 bg-rose-500/20 text-rose-400 text-xs font-extrabold rounded-full border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]",
    info: "px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-extrabold rounded-full border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]",
  },
};
