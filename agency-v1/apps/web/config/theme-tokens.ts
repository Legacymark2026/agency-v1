/**
 * Unified Design System Tokens & Aesthetic Helpers
 * ─────────────────────────────────────────────────────────────────────────────
 * Curated color tokens, glassmorphism classes, and gradient utilities.
 */

export const THEME_TOKENS = {
  colors: {
    background: "bg-slate-950",
    cardBackground: "bg-slate-900/80 backdrop-blur-xl",
    cardBorder: "border border-slate-800",
    textPrimary: "text-slate-100",
    textSecondary: "text-slate-400",
    textMuted: "text-slate-500",
  },
  gradients: {
    brand: "bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent",
    rose: "bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent",
    purple: "bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent",
    gold: "bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent",
  },
  badges: {
    success: "px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/40",
    warning: "px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-500/40",
    danger: "px-3 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-full border border-rose-500/40",
    info: "px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-full border border-cyan-500/40",
  },
};
