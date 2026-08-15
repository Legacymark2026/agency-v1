import { VoiceboxClient, type AudioEffectPreset, type TTSEngine, type ParalinguisticTag } from '../../../voicebox/dist/index.js';
import type { AudioTrack } from '../index.js';

export interface ScriptNarrativeBlock {
  id: string;
  text: string;
  voiceProfileId?: string;
  engine?: TTSEngine;
  emotion?: ParalinguisticTag;
  effectsPreset?: AudioEffectPreset;
  startTimeSeconds?: number;
}

export interface NarrationResult {
  totalDurationSeconds: number;
  tracks: AudioTrack[];
  scriptBlocks: ScriptNarrativeBlock[];
}

export class VoiceNarrator {
  private client: VoiceboxClient;

  constructor(clientUrl?: string) {
    this.client = new VoiceboxClient({ baseUrl: clientUrl });
  }

  /**
   * Automatically splits a video script into blocks, synthesizes audio using Voicebox TTS,
   * and builds AudioTrack objects compatible with VideoEditorModule timeline.
   */
  async generateNarrationForScript(
    blocks: ScriptNarrativeBlock[],
    defaultVoiceProfileId?: string
  ): Promise<NarrationResult> {
    const tracks: AudioTrack[] = [];
    let currentTimelinePos = 0;

    for (const block of blocks) {
      let formattedText = block.text;
      if (block.emotion) {
        formattedText = `${block.emotion} ${formattedText}`;
      }

      const audioResponse = await this.client.speak({
        text: formattedText,
        profileId: block.voiceProfileId || defaultVoiceProfileId,
        engine: block.engine || 'kokoro',
        effects: block.effectsPreset ? { preset: block.effectsPreset } : undefined,
      });

      const durationSec = audioResponse.durationMs / 1000;

      const track: AudioTrack = {
        type: 'voiceover',
        source: audioResponse.audioUrl,
        lufs: -14, // Broadcast standard LUFS level
        duration: durationSec,
      };

      tracks.push(track);
      currentTimelinePos += durationSec + 0.3; // 300ms pause between narrator blocks
    }

    return {
      totalDurationSeconds: currentTimelinePos,
      tracks,
      scriptBlocks: blocks,
    };
  }
}
