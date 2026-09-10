import { describe, it, expect } from "vitest";
import { VideoService } from "../src/services/video.service";
import { ViralClipperService } from "../src/services/viral-clipper.service";
import { KineticSubtitlesService } from "../src/services/kinetic-subtitles.service";
import { SilenceRemoverService } from "../src/services/silence-remover.service";
import { AudioDuckingService } from "../src/services/audio-ducking.service";
import { SmartReframeService } from "../src/services/smart-reframe.service";
import { BrollMatcherService } from "../src/services/broll-matcher.service";
import { ThumbnailGeneratorService } from "../src/services/thumbnail-generator.service";
import { VoiceIsolationService } from "../src/services/voice-isolation.service";
import { VoiceoverNarratorService } from "../src/services/voiceover-narrator.service";
import { ScriptGeneratorService } from "../src/services/script-generator.service";

describe("VideoService Unit & AI Engines Contract Tests", () => {
  it("1. Viral Highlight Clipper debe extraer clips con viralityScore y hookHeadline", () => {
    const clipper = new ViralClipperService();
    const sentences = [
      { text: "El secreto que nadie te cuenta sobre marketing digital", startSec: 0, endSec: 7, energyLevel: 0.95 },
      { text: "es que el contenido en video corto retiene 3 veces más audiencia.", startSec: 7, endSec: 22, energyLevel: 0.88 },
      { text: "Implementa esta estrategia hoy mismo para escalar tus ventas.", startSec: 22, endSec: 32, energyLevel: 0.82 }
    ];

    const clips = clipper.extractViralClips(sentences, 30);
    expect(clips.length).toBeGreaterThan(0);
    expect(clips[0].viralityScore).toBeGreaterThan(70);
    expect(clips[0].hookHeadline).toBeDefined();
    expect(clips[0].recommendedPlatform).toBe("TIKTOK");
  });

  it("2. Kinetic Subtitles debe segmentar palabras en bloques y generar formato ASS", () => {
    const service = new KineticSubtitlesService();
    const words = [
      { word: "Aprende", startSec: 0, endSec: 0.5 },
      { word: "a", startSec: 0.5, endSec: 0.7 },
      { word: "automatizar", startSec: 0.7, endSec: 1.4 },
      { word: "tu", startSec: 1.4, endSec: 1.6 },
      { word: "negocio", startSec: 1.6, endSec: 2.2 }
    ];

    const blocks = service.generateSubtitleBlocks(words, 3);
    expect(blocks.length).toBeGreaterThan(0);
    const assScript = service.generateASSFormat(blocks);
    expect(assScript).toContain("[Script Info]");
    expect(assScript).toContain("Dialogue:");
  });

  it("3. Silence Remover debe filtrar segmentos por debajo del umbral de silencio", () => {
    const service = new SilenceRemoverService();
    const samples = [
      { timestampSec: 0, dbLevel: -15 },
      { timestampSec: 2, dbLevel: -15 },
      { timestampSec: 4, dbLevel: -48 }, // Silencio
      { timestampSec: 5, dbLevel: -48 },
      { timestampSec: 6, dbLevel: -18 },
      { timestampSec: 10, dbLevel: -18 }
    ];

    const result = service.removeSilence(samples, -35, 0.5);
    expect(result.cutCount).toBeGreaterThanOrEqual(1);
    expect(result.savedDurationSec).toBeGreaterThan(0);
    expect(result.segmentsToKeep.length).toBeGreaterThanOrEqual(1);
  });

  it("4. Audio Ducking debe generar curvas de atenuación durante la voz", () => {
    const service = new AudioDuckingService();
    const speechSegments = [{ startSec: 5, endSec: 25 }];
    const curve = service.generateDuckingCurve(speechSegments, 40, 0.15, 0.8);

    expect(curve.volumePoints.length).toBeGreaterThan(2);
    expect(curve.duckedVolumeMultiplier).toBe(0.15);
    expect(curve.ffmpegAFilter).toContain("volume=");
  });

  it("5. Smart Reframe debe computar filtros de recorte para formato vertical 9:16", () => {
    const service = new SmartReframeService();
    const reframe = service.computeReframeFilter({
      targetRatio: "9:16",
      fitMode: "SMART_CENTER_CROP",
      sourceWidth: 1920,
      sourceHeight: 1080
    });

    expect(reframe.targetWidth).toBe(1080);
    expect(reframe.targetHeight).toBe(1920);
    expect(reframe.ffmpegFilterComplex).toContain("crop=");
  });

  it("6. B-Roll Matcher debe correlacionar palabras clave con catálogo de planos", () => {
    const service = new BrollMatcherService();
    const transcript = [
      { text: "Nuestra plataforma contable con inteligencia artificial y automatización", startSec: 2, endSec: 8 }
    ];

    const matched = service.matchBrollToTranscript(transcript, 3);
    expect(Array.isArray(matched)).toBe(true);
  });

  it("7. Thumbnail Generator debe componer plantilla de alta conversión con título", () => {
    const service = new ThumbnailGeneratorService();
    const design = service.generateThumbnailDesign("Secretos de Marketing con IA", [], "1280x720");

    expect(design.punchyHeadline).toContain("SECRETOS");
    expect(design.recommendedResolution).toBe("1280x720");
    expect(design.overallFrameQuality).toBeGreaterThan(50);
  });

  it("8. Voice Isolation debe aplicar cadena FFmpeg de reducción de ruido y normalización LUFS", () => {
    const service = new VoiceIsolationService();
    const result = service.enhanceVoice({ aggressiveness: "MODERATE", targetLufs: -14 });

    expect(result.ffmpegAudioFilterComplex).toContain("afftdn");
    expect(result.ffmpegAudioFilterComplex).toContain("loudnorm=I=-14");
    expect(result.noiseFloorReductionDb).toBeGreaterThan(10);
    expect(result.speechClarityBoostPercent).toBeGreaterThan(20);
  });

  it("9. Voiceover Narrator debe sintetizar pista de voz con WPM y emoción adecuados", () => {
    const service = new VoiceoverNarratorService();
    const track = service.synthesizeVoiceover({
      scriptText: "Automatiza tu empresa hoy mismo con agentes inteligentes.",
      voiceId: "voice_es_co_pro",
      language: "es-CO",
      emotion: "HIGH_ENERGY_ENTHUSIASTIC",
      speedRate: 1.0,
    });

    expect(track.wordCount).toBe(8);
    expect(track.totalDurationSec).toBeGreaterThan(0);
    expect(track.emotionApplied).toBe("HIGH_ENERGY_ENTHUSIASTIC");
    expect(track.sampleRateHz).toBe(48000);
  });

  it("10. Script Generator debe estructurar storyboard viral de 4 fases (Hook, Problem, Solution, CTA)", () => {
    const service = new ScriptGeneratorService();
    const project = service.generateScript({
      topic: "Contabilidad DIAN con IA",
      niche: "Fintech",
      targetDurationSec: 30,
      tone: "HIGH_CONVERSION",
    });

    expect(project.beats.length).toBe(4);
    expect(project.beats[0].phase).toBe("HOOK");
    expect(project.beats[1].phase).toBe("PROBLEM");
    expect(project.beats[2].phase).toBe("SOLUTION");
    expect(project.beats[3].phase).toBe("CTA");
    expect(project.targetDurationSec).toBe(30);
  });

  it("11. Long-Form Video Engine debe procesar transcripciones y contenido de 60 minutos (3600s)", () => {
    const clipper = new ViralClipperService();
    // Simular un podcast o webinar de 60 minutos (120 bloques de 30s = 3600s)
    const longSentences = Array.from({ length: 120 }, (_, i) => ({
      text: i % 10 === 0 
        ? `El secreto número ${i} para automatizar la facturación y retener clientes`
        : `En el minuto ${Math.floor((i * 30) / 60)} analizamos las métricas clave de crecimiento empresarial`,
      startSec: i * 30,
      endSec: (i + 1) * 30,
      energyLevel: i % 10 === 0 ? 0.95 : 0.65,
    }));

    const clips = clipper.extractViralClips(longSentences, 60, 20);
    expect(clips.length).toBeGreaterThan(0);
    expect(clips.length).toBeLessThanOrEqual(20);
    expect(clips[0].viralityScore).toBeGreaterThanOrEqual(80);
    expect(clips[0].hookHeadline).toContain("Gancho de Alta Retención");
  });

  it("12. VideoService Hexagonal Architecture 5.0 (Inbound & Outbound Ports)", async () => {
    const { VideoUseCases } = await import("../src/core/usecases/video.usecases");
    const { VideoProjectDomain } = await import("../src/core/domain/video.domain");

    const projectStore = new Map<string, any>();
    const publishedEvents: any[] = [];

    const mockStorage: any = {
      saveProject: async (p: any) => {
        projectStore.set(p.id, p);
        return p;
      },
      findProjectById: async (id: string) => projectStore.get(id) || null,
      uploadRender: async () => "https://cdn.agency.com/clip.mp4",
    };

    const mockFfmpeg: any = {
      executeFilter: async () => true,
    };

    const mockPublisher: any = {
      publishEvent: async (topic: string, event: any) => {
        publishedEvents.push({ topic, event });
      },
    };

    const useCases = new VideoUseCases(mockStorage, mockFfmpeg, mockPublisher);

    // 1. Create project
    const project = await useCases.createVideoJob({
      companyId: "comp-vid-1",
      title: "Podcast Ep 1",
      sourceUrl: "https://videos.storage/podcast1.mp4",
    });

    expect(project.id).toBeDefined();
    expect(project.status).toBe("QUEUED");
    expect(publishedEvents.some((e) => e.topic === "video.job.created")).toBe(true);

    // 2. Generate viral clips
    const sentences = [
      { text: "El secreto que nadie te cuenta sobre marketing digital", startSec: 0, endSec: 7, energyLevel: 0.95 },
      { text: "es que el contenido en video corto retiene 3 veces más audiencia.", startSec: 7, endSec: 22, energyLevel: 0.88 },
      { text: "Implementa esta estrategia hoy mismo para escalar tus ventas.", startSec: 22, endSec: 32, energyLevel: 0.82 }
    ];

    const clips = await useCases.generateViralClips(project.id, sentences);
    expect(clips.length).toBeGreaterThan(0);
    expect(publishedEvents.some((e) => e.topic === "video.clips.extracted")).toBe(true);

    const updated = await mockStorage.findProjectById(project.id);
    expect(updated.status).toBe("COMPLETED");
  });
});


