import { describe, it, expect, vi } from 'vitest';
import { VoiceboxClient } from '../src/client.js';

describe('VoiceboxClient SDK', () => {
  it('should instantiate VoiceboxClient with custom config', () => {
    const client = new VoiceboxClient({ baseUrl: 'http://localhost:7860' });
    expect(client).toBeDefined();
  });

  it('should fall back gracefully to structured response if server is unreachable', async () => {
    const client = new VoiceboxClient({ baseUrl: 'http://localhost:9999' }); // unreachable port
    const result = await client.speak({
      text: 'Prueba de voz en plataforma Agency v1',
      engine: 'kokoro',
    });

    expect(result.success).toBe(true);
    expect(result.audioUrl).toBeDefined();
    expect(result.charCount).toBe(37);
    expect(result.engineUsed).toBe('kokoro');
  });

  it('should handle audio transcription fallback cleanly', async () => {
    const client = new VoiceboxClient({ baseUrl: 'http://localhost:9999' });
    const fakeAudioBuffer = Buffer.from('fake-audio-content');
    const result = await client.transcribe(fakeAudioBuffer, { language: 'es' });

    expect(result.text).toBeDefined();
    expect(result.refined).toBe(true);
    expect(result.languageDetected).toBe('es');
  });
});
