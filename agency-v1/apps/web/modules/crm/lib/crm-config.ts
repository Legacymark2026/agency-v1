/**
 * CRM Stage Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for Kanban pipeline stages.
 * Used by KanbanBoard, reports, and any stage-aware component.
 */

export interface CRMStage {
  id: string;
  label: string;
  /** Tailwind bg class for the column header badge */
  color: string;
  /** Tailwind text/border accent for cards in this stage */
  accent: string;
  /** Emoji icon for quick visual identification */
  icon: string;
  /** Default probability % for deals entering this stage */
  defaultProbability: number;
}

export const STAGES: CRMStage[] = [
  {
    id: "NEW",
    label: "Nuevo Lead",
    color: "bg-slate-700/60",
    accent: "border-slate-500",
    icon: "🎯",
    defaultProbability: 10,
  },
  {
    id: "CONTACTED",
    label: "Contactado",
    color: "bg-blue-900/60",
    accent: "border-blue-500",
    icon: "📞",
    defaultProbability: 25,
  },
  {
    id: "PROPOSAL",
    label: "Propuesta Enviada",
    color: "bg-violet-900/60",
    accent: "border-violet-500",
    icon: "📄",
    defaultProbability: 50,
  },
  {
    id: "NEGOTIATION",
    label: "En Negociación",
    color: "bg-amber-900/60",
    accent: "border-amber-500",
    icon: "🤝",
    defaultProbability: 75,
  },
  {
    id: "WON",
    label: "Ganado",
    color: "bg-emerald-900/60",
    accent: "border-emerald-500",
    icon: "🏆",
    defaultProbability: 100,
  },
  {
    id: "LOST",
    label: "Perdido",
    color: "bg-red-900/60",
    accent: "border-red-500",
    icon: "❌",
    defaultProbability: 0,
  },
];

/** Lookup map for O(1) stage resolution by ID */
export const STAGE_MAP = new Map<string, CRMStage>(
  STAGES.map((s) => [s.id, s])
);

/** Get stage label by ID, fallback to the raw id */
export function getStageLabelById(stageId: string): string {
  return STAGE_MAP.get(stageId)?.label ?? stageId;
}

/** All valid stage IDs as a union type */
export type StageId = (typeof STAGES)[number]["id"];

/** Active pipeline stages (excludes LOST) */
export const ACTIVE_STAGES = STAGES.filter((s) => s.id !== "LOST");
