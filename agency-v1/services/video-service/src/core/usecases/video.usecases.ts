/**
 * Video Service — Pure Hexagonal Use Cases Orchestration
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  IVideoUseCases,
  IVideoStoragePort,
  IFFmpegRendererPort,
  IVideoEventPublisherPort,
  CreateVideoJobDTO,
} from "../ports/video.ports";
import { VideoProjectDomain, ViralClipDomain } from "../domain/video.domain";
import { ViralClipperService } from "../../services/viral-clipper.service";

export class VideoUseCases implements IVideoUseCases {
  private clipper = new ViralClipperService();

  constructor(
    private readonly storagePort: IVideoStoragePort,
    private readonly rendererPort: IFFmpegRendererPort,
    private readonly eventPublisher: IVideoEventPublisherPort
  ) {}

  public async createVideoJob(dto: CreateVideoJobDTO): Promise<VideoProjectDomain> {
    const project = new VideoProjectDomain(
      "vid_" + Math.random().toString(36).substring(2, 9),
      dto.companyId,
      dto.title,
      dto.sourceUrl,
      "QUEUED"
    );

    const saved = await this.storagePort.saveProject(project);

    await this.eventPublisher.publishEvent("video.job.created", {
      projectId: saved.id,
      companyId: saved.companyId,
      title: saved.title,
    });

    return saved;
  }

  public async generateViralClips(
    projectId: string,
    sentences: Array<{ text: string; startSec: number; endSec: number; energyLevel: number }>
  ): Promise<ViralClipDomain[]> {
    const project = await this.storagePort.findProjectById(projectId);
    if (!project) throw new Error(`Proyecto ${projectId} no encontrado`);

    const rawClips = this.clipper.extractViralClips(sentences, 30);
    const domainClips: ViralClipDomain[] = rawClips.map((c, i) => ({
      clipId: `clip_${projectId}_${i + 1}`,
      startSec: c.startSec,
      endSec: c.endSec,
      viralityScore: c.viralityScore,
      hookHeadline: c.hookHeadline,
      recommendedPlatform: c.recommendedPlatform as any,
    }));

    const completed = project.markCompleted(project.sourceUrl, domainClips);
    await this.storagePort.saveProject(completed);

    await this.eventPublisher.publishEvent("video.clips.extracted", {
      projectId,
      clipCount: domainClips.length,
    });

    return domainClips;
  }
}
