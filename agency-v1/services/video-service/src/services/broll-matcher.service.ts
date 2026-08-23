/**
 * AI B-Roll Inserter & Stock Video Cutaway Matcher (InVideo / Runway style)
 * ─────────────────────────────────────────────────────────────────────────────
 * Analyzes video transcript sentences, extracts visual semantic concepts,
 * and schedules B-Roll cutaway video overlays to maintain high visual engagement.
 */

export interface BrollAsset {
  id: string;
  title: string;
  category: "BUSINESS" | "FINANCE" | "TECHNOLOGY" | "TEAMWORK" | "SUCCESS" | "LIFESTYLE";
  keywords: string[];
  durationSec: number;
  assetUrl: string;
}

export interface CutawayInsertPlan {
  brollAssetId: string;
  brollTitle: string;
  category: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  matchedKeyword: string;
  transitionType: "SMOOTH_DISSOLVE" | "QUICK_CUT" | "SLIDE_LEFT";
}

export class BrollMatcherService {
  private defaultCatalog: BrollAsset[] = [
    { id: "broll_fin_1", title: "Crecimiento de Gráficos de Ventas", category: "FINANCE", keywords: ["ventas", "dinero", "ingresos", "crecimiento", "millón"], durationSec: 8, assetUrl: "/assets/broll/finance-growth.mp4" },
    { id: "broll_tech_1", title: "Servidores Cloud & Dashboard SaaS", category: "TECHNOLOGY", keywords: ["software", "código", "plataforma", "automatización", "ia"], durationSec: 10, assetUrl: "/assets/broll/tech-dashboard.mp4" },
    { id: "broll_team_1", title: "Reunión de Equipo Estratégico", category: "TEAMWORK", keywords: ["equipo", "agencia", "reunión", "clientes", "estrategia"], durationSec: 6, assetUrl: "/assets/broll/team-meeting.mp4" },
    { id: "broll_succ_1", title: "Celebración de Cierre de Negocio", category: "SUCCESS", keywords: ["éxito", "victoria", "cerrar", "contrato", "logro"], durationSec: 7, assetUrl: "/assets/broll/deal-celebration.mp4" },
  ];

  /**
   * Generates a timeline schedule of B-Roll cutaways matched to speech concepts.
   */
  public matchBrollToTranscript(
    transcriptSegments: Array<{ text: string; startSec: number; endSec: number }>,
    minGapBetweenBrollsSec = 4
  ): CutawayInsertPlan[] {
    const plans: CutawayInsertPlan[] = [];
    let lastBrollEndSec = -999;

    for (const seg of transcriptSegments) {
      if (seg.startSec < lastBrollEndSec + minGapBetweenBrollsSec) {
        continue; // Maintain minimum pacing
      }

      const lowerText = seg.text.toLowerCase();
      let matchedAsset: BrollAsset | undefined;
      let matchedKeyword = "";

      for (const asset of this.defaultCatalog) {
        for (const kw of asset.keywords) {
          if (lowerText.includes(kw)) {
            matchedAsset = asset;
            matchedKeyword = kw;
            break;
          }
        }
        if (matchedAsset) break;
      }

      if (matchedAsset) {
        const duration = Math.min(4.5, seg.endSec - seg.startSec);
        const endSec = Math.round((seg.startSec + duration) * 100) / 100;

        plans.push({
          brollAssetId: matchedAsset.id,
          brollTitle: matchedAsset.title,
          category: matchedAsset.category,
          startSec: seg.startSec,
          endSec,
          durationSec: Math.round(duration * 100) / 100,
          matchedKeyword,
          transitionType: "SMOOTH_DISSOLVE",
        });

        lastBrollEndSec = endSec;
      }
    }

    return plans;
  }
}

export const brollMatcherService = new BrollMatcherService();
