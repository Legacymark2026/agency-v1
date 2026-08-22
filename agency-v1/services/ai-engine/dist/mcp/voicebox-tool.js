"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceboxSpeakTool = void 0;
const voicebox_1 = require("@agency/voicebox");
const voiceboxClient = new voicebox_1.VoiceboxClient();
/**
 * MCP Tool definition for voicebox.speak capability.
 * Enables AI Agents in ai-engine to speak out loud or generate speech files.
 */
exports.voiceboxSpeakTool = {
    name: "voicebox.speak",
    description: "Synthesizes expressive spoken audio from text using Voicebox AI Voice Studio.",
    parameters: {
        type: "object",
        properties: {
            text: {
                type: "string",
                description: "The text spoken by the AI agent, can include emotional tags like [laugh], [sigh], [gasp].",
            },
            profileId: {
                type: "string",
                description: "Optional VoiceProfile ID for voice cloning.",
            },
            profileName: {
                type: "string",
                description: "Optional preset voice name (e.g. Morgan, Scarlett).",
            },
            engine: {
                type: "string",
                enum: ["qwen3", "qwen_custom", "luxtts", "chatterbox_multilingual", "chatterbox_turbo", "hume_tada", "kokoro"],
                description: "TTS Engine to execute synthesis.",
            },
            language: {
                type: "string",
                description: "Language code (es, en, fr, de, etc.).",
            },
            effectsPreset: {
                type: "string",
                enum: ["robotic", "radio", "echo_chamber", "deep_voice", "studio_clean"],
                description: "Optional DSP pedalboard effect preset.",
            },
        },
        required: ["text"],
    },
    execute: async (input) => {
        try {
            const response = await voiceboxClient.speak({
                text: input.text,
                profileId: input.profileId,
                profileName: input.profileName,
                engine: input.engine || "kokoro",
                language: input.language || "es",
                effects: input.effectsPreset ? { preset: input.effectsPreset } : undefined,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `Speech generated successfully using engine ${response.engineUsed}. Audio URL: ${response.audioUrl}`,
                    },
                ],
                metadata: response,
            };
        }
        catch (err) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Failed to synthesize speech: ${err instanceof Error ? err.message : String(err)}`,
                    },
                ],
            };
        }
    },
};
//# sourceMappingURL=voicebox-tool.js.map