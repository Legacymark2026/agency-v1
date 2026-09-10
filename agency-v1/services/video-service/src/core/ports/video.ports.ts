/**
 * Video Service — Hexagonal Ports (Inbound & Outbound Interfaces)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { VideoProjectDomain, ViralClipDomain } from "../domain/video.domain";

export interface CreateVideoJobDTO {
  companyId: string;
  title: string;
  sourceUrl: string;
}

export interface IVideoUseCases {
  createVideoJob(dto: CreateVideoJobDTO): Promise<VideoProjectDomain>;
  generateViralClips(projectId: string, sentences: Array<{ text: string; startSec: number; endSec: number; energyLevel: number }>): Promise<ViralClipDomain[]>;
}

export interface IVideoStoragePort {
  saveProject(project: VideoProjectDomain): Promise<VideoProjectDomain>;
  findProjectById(id: string): Promise<VideoProjectDomain | null>;
  uploadRender(buffer: Buffer, filename: string): Promise<string>;
}

export interface IFFmpegRendererPort {
  executeFilter(command: string): Promise<boolean>;
}

export interface IVideoEventPublisherPort {
  publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}
