import { VoiceboxClient } from '@agency/voicebox';
export class VoiceNarrator {
    constructor(clientUrl) {
        this.client = new VoiceboxClient({ baseUrl: clientUrl });
    }
    /**
     * Automatically splits a video script into blocks, synthesizes audio using Voicebox TTS,
     * and builds AudioTrack objects compatible with VideoEditorModule timeline.
     */
    async generateNarrationForScript(blocks, defaultVoiceProfileId) {
        const tracks = [];
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
            const track = {
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
