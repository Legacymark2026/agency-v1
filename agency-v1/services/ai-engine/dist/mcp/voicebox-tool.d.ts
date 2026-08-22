export interface SpeakToolInput {
    text: string;
    profileId?: string;
    profileName?: string;
    engine?: 'qwen3' | 'qwen_custom' | 'luxtts' | 'chatterbox_multilingual' | 'chatterbox_turbo' | 'hume_tada' | 'kokoro';
    language?: string;
    effectsPreset?: 'robotic' | 'radio' | 'echo_chamber' | 'deep_voice' | 'studio_clean';
}
/**
 * MCP Tool definition for voicebox.speak capability.
 * Enables AI Agents in ai-engine to speak out loud or generate speech files.
 */
export declare const voiceboxSpeakTool: {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            text: {
                type: string;
                description: string;
            };
            profileId: {
                type: string;
                description: string;
            };
            profileName: {
                type: string;
                description: string;
            };
            engine: {
                type: string;
                enum: string[];
                description: string;
            };
            language: {
                type: string;
                description: string;
            };
            effectsPreset: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
    execute: (input: SpeakToolInput) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
        metadata: import("@agency/voicebox").AudioResponse;
        isError?: undefined;
    } | {
        isError: boolean;
        content: {
            type: string;
            text: string;
        }[];
        metadata?: undefined;
    }>;
};
