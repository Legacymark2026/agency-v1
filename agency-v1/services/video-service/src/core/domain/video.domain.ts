/**
 * Video Service — Pure Domain Entities & Calculations
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero external framework dependencies.
 */

export interface ViralClipDomain {
  clipId: string;
  startSec: number;
  endSec: number;
  viralityScore: number;
  hookHeadline: string;
  recommendedPlatform: "TIKTOK" | "INSTAGRAM_REELS" | "YOUTUBE_SHORTS";
}

export class VideoProjectDomain {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly title: string,
    public readonly sourceUrl: string,
    public readonly status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" = "QUEUED",
    public readonly clips: ViralClipDomain[] = [],
    public readonly renderedUrl?: string,
    public readonly createdAt: Date = new Date()
  ) {}

  public markProcessing(): VideoProjectDomain {
    return new VideoProjectDomain(
      this.id,
      this.companyId,
      this.title,
      this.sourceUrl,
      "PROCESSING",
      this.clips,
      this.renderedUrl,
      this.createdAt
    );
  }

  public markCompleted(renderedUrl: string, clips: ViralClipDomain[] = []): VideoProjectDomain {
    return new VideoProjectDomain(
      this.id,
      this.companyId,
      this.title,
      this.sourceUrl,
      "COMPLETED",
      clips,
      renderedUrl,
      this.createdAt
    );
  }
}
