/**
 * Video Service — Storage Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IVideoStoragePort } from "../core/ports/video.ports";
import { VideoProjectDomain } from "../core/domain/video.domain";

export class StorageAdapter implements IVideoStoragePort {
  private projects = new Map<string, VideoProjectDomain>();

  public async saveProject(project: VideoProjectDomain): Promise<VideoProjectDomain> {
    this.projects.set(project.id, project);
    return project;
  }

  public async findProjectById(id: string): Promise<VideoProjectDomain | null> {
    return this.projects.get(id) || null;
  }

  public async uploadRender(buffer: Buffer, filename: string): Promise<string> {
    return `https://cdn.agency.com/renders/${filename}`;
  }
}
