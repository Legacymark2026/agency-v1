import type { AudioResponse, SpeakOptions, TranscribeOptions, TranscriptionResult, VoiceProfile, VoiceProfileMeta, VoiceboxConfig } from './types.js';
export declare class VoiceboxClient {
    private baseUrl;
    private apiKey?;
    private timeoutMs;
    constructor(config?: Partial<VoiceboxConfig>);
    private getHeaders;
    /**
     * Synthesizes speech from text using Voicebox TTS engines.
     */
    speak(options: SpeakOptions): Promise<AudioResponse>;
    /**
     * Transcribes audio using Whisper STT and refines text with local LLM.
     */
    transcribe(audioBuffer: Buffer | ArrayBuffer, options?: TranscribeOptions): Promise<TranscriptionResult>;
    /**
     * Creates a zero-shot voice profile from an audio reference sample.
     */
    createVoiceProfile(audioSampleBuffer: Buffer | ArrayBuffer, meta: VoiceProfileMeta): Promise<VoiceProfile>;
    /**
     * Lists available voice profiles.
     */
    listProfiles(organizationId?: string): Promise<VoiceProfile[]>;
}
//# sourceMappingURL=client.d.ts.map