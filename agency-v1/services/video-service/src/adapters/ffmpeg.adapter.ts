/**
 * Video Service — FFmpeg Renderer Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IFFmpegRendererPort } from "../core/ports/video.ports";

export class FFmpegAdapter implements IFFmpegRendererPort {
  public async executeFilter(command: string): Promise<boolean> {
    return true;
  }
}
