import { describe, it, expect } from 'vitest';
import { VoiceNarrator } from '../src/audio/voice-narrator.js';

describe('VoiceNarrator Module (@agency/video-editor)', () => {
  it('should process narrative blocks and return compliant AudioTrack objects for VideoEditorModule', async () => {
    const narrator = new VoiceNarrator('http://localhost:7860');
    const result = await narrator.generateNarrationForScript([
      {
        id: 'block_1',
        text: 'Descubre el nuevo producto revolucionario.',
        engine: 'kokoro',
        effectsPreset: 'studio_clean',
      },
      {
        id: 'block_2',
        text: 'Diseñado exclusivamente para elevar tu agencia.',
        emotion: '[chuckle]',
        engine: 'chatterbox_turbo',
      },
    ]);

    expect(result.tracks).toHaveLength(2);
    expect(result.totalDurationSeconds).toBeGreaterThan(0);
    expect(result.tracks[0].type).toBe('voiceover');
    expect(result.tracks[0].lufs).toBe(-14);
  });
});
