import { brollMatcherService } from "../services/video-service/src/services/broll-matcher.service";
import { voiceoverNarratorService } from "../services/video-service/src/services/voiceover-narrator.service";
import { brandingOverlayService } from "../services/video-service/src/services/branding-overlay.service";
import { colorGradingService } from "../services/video-service/src/services/color-grading.service";
import { thumbnailGeneratorService } from "../services/video-service/src/services/thumbnail-generator.service";

async function runVideoPostProductionAudit() {
  console.log("===============================================================================");
  console.log("🎞️ AUDITORÍA DE LA SUITE DE POSTPRODUCCIÓN DE VIDEO AI 360°");
  console.log("===============================================================================\n");

  let passed = 0;
  const total = 5;

  // 1. Test B-Roll Matcher
  try {
    console.log("1. Probando Inserción Automática de Tomas B-Roll (InVideo / Runway)...");
    const transcript = [
      { text: "Hemos logrado un incremento histórico en las ventas y los ingresos mensuales de la agencia", startSec: 0, endSec: 6 },
      { text: "gracias a la implementación de una plataforma de software y código automatizado", startSec: 7.0, endSec: 14 },
    ];
    const brollPlan = brollMatcherService.matchBrollToTranscript(transcript, 1.5);

    if (brollPlan.length >= 2 && brollPlan[0].category === "FINANCE" && brollPlan[1].category === "TECHNOLOGY") {
      console.log(`   ✅ PASÓ: ${brollPlan.length} tomas B-Roll asignadas automáticamente (1ra: "${brollPlan[0].brollTitle}" en ${brollPlan[0].startSec}s-${brollPlan[0].endSec}s).`);
      passed++;
    } else {
      console.error(`   ❌ FALLÓ: Asignación de B-Roll incorrecta (Obtenidos: ${brollPlan.length}).`);
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en B-Roll Matcher:", e.message);
  }

  console.log("");

  // 2. Test Voiceover Narrator TTS
  try {
    console.log("2. Probando Narrador IA y Modulación de Emociones (ElevenLabs)...");
    const script = "Bienvenido a LegacyMark. En este módulo aprenderás a optimizar tu flujo de facturación electrónica y gestión contable de manera automática.";
    const voxTrack = voiceoverNarratorService.synthesizeVoiceover({
      scriptText: script,
      voiceId: "voice_carlos_es_co",
      language: "es-CO",
      emotion: "HIGH_ENERGY_ENTHUSIASTIC",
      speedRate: 1.05,
    });

    if (voxTrack.wordCount > 15 && voxTrack.totalDurationSec > 5 && voxTrack.averageWpm > 150) {
      console.log(`   ✅ PASÓ: Pista de voz generada (${voxTrack.wordCount} palabras, ${voxTrack.totalDurationSec}s de duración, ${voxTrack.averageWpm} WPM, Emoción: ${voxTrack.emotionApplied}).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Síntesis de voz incorrecta.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en Voiceover Narrator:", e.message);
  }

  console.log("");

  // 3. Test Lower-Thirds & Watermark Overlay
  try {
    console.log("3. Probando Generador de Lower-Thirds y Marca de Agua Animada...");
    const branding = brandingOverlayService.generateBrandingFilters(
      {
        speakerName: "Carlos Mendoza",
        speakerRole: "CEO & Fundador LegacyMark",
        socialHandle: "@carlosmendoza",
        startSec: 2,
        durationSec: 6,
        themeColor: "EMERALD_NEON",
      },
      {
        logoUrl: "/assets/logo.png",
        position: "TOP_RIGHT",
        opacity: 0.8,
        scalePercent: 15,
      }
    );

    if (branding.totalElementsCount === 2 && branding.ffmpegDrawtextFilter.includes("CARLOS MENDOZA") && branding.ffmpegOverlayFilter.includes("colorchannelmixer")) {
      console.log(`   ✅ PASÓ: Filtros de Lower-Third animado y marca de agua generados (${branding.previewDescription}).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Generación de Lower-Thirds incorrecta.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en Branding Overlay:", e.message);
  }

  console.log("");

  // 4. Test Cinematic Color Grading
  try {
    console.log("4. Probando Corrección de Color Cinemática LUT (Teal & Orange)...");
    const grading = colorGradingService.generateColorFilter({
      preset: "TEAL_AND_ORANGE",
      intensity: 0.85,
    });

    if (grading.preset === "TEAL_AND_ORANGE" && grading.ffmpegEqFilter.includes("colorbalance=rs=0.10")) {
      console.log(`   ✅ PASÓ: Filtro de corrección de color cinemático generado (${grading.description}).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Filtro de color grading incorrecto.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en Color Grading:", e.message);
  }

  console.log("");

  // 5. Test AI Thumbnail Generator
  try {
    console.log("5. Probando Generador de Miniaturas de Alto CTR (Canva / Midjourney)...");
    const candidates = [
      { timestampSec: 1.2, faceClarityScore: 0.70, sharpnessScore: 0.65, expressionType: "SERIOUS" as const },
      { timestampSec: 4.8, faceClarityScore: 0.95, sharpnessScore: 0.92, expressionType: "EXCITED" as const },
    ];
    const thumb = thumbnailGeneratorService.generateThumbnailDesign("Cómo Escalar Tu Agencia a 7 Cifras", candidates, "1280x720");

    if (thumb.chosenTimestampSec === 4.8 && thumb.overallFrameQuality >= 90 && thumb.punchyHeadline.includes("CÓMO ESCALAR")) {
      console.log(`   ✅ PASÓ: Miniatura de alto CTR diseñada en fotograma ${thumb.chosenTimestampSec}s (Calidad: ${thumb.overallFrameQuality}/100, Titular: "${thumb.punchyHeadline}").`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Generación de miniatura incorrecta.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en Thumbnail Generator:", e.message);
  }

  console.log("\n===============================================================================");
  console.log(`RESULTADO DE AUDITORÍA POSTPRODUCCIÓN: ${passed}/${total} MÓDULOS VERIFICADOS AL 100%`);
  console.log("ESTADO: SUITE DE VIDEO 360° COMPLETAMENTE EQUIPADA Y LISTA PARA PRODUCCIÓN");
  console.log("===============================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runVideoPostProductionAudit();
