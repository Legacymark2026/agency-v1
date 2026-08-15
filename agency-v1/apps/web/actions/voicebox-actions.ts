'use server';

import { VoiceboxClient } from '@agency/voicebox';
import { prisma } from '@agency/database';

const voiceboxClient = new VoiceboxClient();

export interface SynthesizeVoiceInput {
  text: string;
  companyId: string;
  voiceProfileId?: string;
  engine?: 'qwen3' | 'kokoro' | 'chatterbox_turbo';
  effectsPreset?: 'robotic' | 'radio' | 'echo_chamber' | 'deep_voice' | 'studio_clean';
}

export interface TranscribeAudioInput {
  companyId: string;
  userId?: string;
  audioBase64: string; // Base64 encoded audio buffer
  language?: string;
  cleanFillers?: boolean;
}

/**
 * Server Action: Synthesizes text into speech using Voicebox TTS
 */
export async function synthesizeVoiceAction(input: SynthesizeVoiceInput) {
  try {
    const { text, companyId, voiceProfileId, engine, effectsPreset } = input;

    let voiceProfile = null;
    if (voiceProfileId) {
      voiceProfile = await prisma.voiceProfile.findUnique({
        where: { id: voiceProfileId },
      });
    }

    const response = await voiceboxClient.speak({
      text,
      profileId: voiceProfile?.id,
      engine: (voiceProfile?.engine as any) || engine || 'kokoro',
      language: voiceProfile?.language || 'es',
      effects: effectsPreset ? { preset: effectsPreset } : (voiceProfile?.effectsConfig as any),
    });

    return {
      success: true,
      audioUrl: response.audioUrl,
      durationMs: response.durationMs,
      engineUsed: response.engineUsed,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Server Action: Transcribes recorded audio via Whisper & LLM Refinement, saving a VoiceCapture entry.
 */
export async function transcribeAudioAction(input: TranscribeAudioInput) {
  try {
    const { companyId, userId, audioBase64, language, cleanFillers } = input;

    const audioBuffer = Buffer.from(audioBase64, 'base64');

    const result = await voiceboxClient.transcribe(audioBuffer, {
      language: language || 'es',
      fillerWordCleanup: cleanFillers ?? true,
      selfCorrectionRemoval: true,
    });

    // Save capture record in DB
    const capture = await prisma.voiceCapture.create({
      data: {
        companyId,
        userId: userId || null,
        audioUrl: `data:audio/wav;base64,${audioBase64.substring(0, 100)}...`, // Mock audio reference or S3 key
        rawTranscript: result.rawTranscript,
        refinedTranscript: result.text,
        durationSeconds: result.durationSeconds,
        language: result.languageDetected,
      },
    });

    return {
      success: true,
      captureId: capture.id,
      transcript: result.text,
      rawTranscript: result.rawTranscript,
      durationSeconds: result.durationSeconds,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Server Action: Fetches all Voice Profiles for a company
 */
export async function getCompanyVoiceProfilesAction(companyId: string) {
  try {
    const profiles = await prisma.voiceProfile.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, profiles };
  } catch (err) {
    return { success: false, profiles: [] };
  }
}

/**
 * Server Action: Creates a new Voice Profile from a reference sample audio
 */
export async function createVoiceProfileAction(formData: FormData) {
  try {
    const companyId = formData.get('companyId') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const language = (formData.get('language') as string) || 'es';
    const sampleFile = formData.get('sample') as File;

    if (!companyId || !name || !sampleFile) {
      throw new Error('companyId, name and sample file are required');
    }

    const arrayBuffer = await sampleFile.arrayBuffer();
    const voiceboxProfile = await voiceboxClient.createVoiceProfile(arrayBuffer, {
      organizationId: companyId,
      name,
      description,
      language,
    });

    const newProfile = await prisma.voiceProfile.create({
      data: {
        companyId,
        name,
        description,
        language,
        engine: voiceboxProfile.defaultEngine || 'kokoro',
        sampleUrl: voiceboxProfile.sampleUrl,
      },
    });

    return { success: true, profile: newProfile };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
