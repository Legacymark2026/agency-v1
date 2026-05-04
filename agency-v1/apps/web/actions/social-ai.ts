"use server";

import { generateText } from "ai";
import { geminiModel } from "@/lib/ai-provider";

export async function generateSocialCopy(prompt: string) {
    try {
        const { text } = await generateText({
            model: geminiModel as any,
            system: `You are an expert social media manager. The user will provide a topic or base prompt. Your task is to generate three distinct versions of the copy tailored for Facebook, LinkedIn, and TikTok. 
            
Requirements:
1. Facebook: Engaging, conversational tone, emojis, moderate length.
2. LinkedIn: Professional, authoritative tone, structured with line breaks, industry hashtags, longer form.
3. TikTok: Catchy hook, short and punchy, trending style hashtags, focus on visual cues (like instructions for video text).

Format your response strictly as a JSON object with these exact keys: "FACEBOOK", "LINKEDIN", "TIKTOK". Do not include markdown blocks or any other text outside the JSON. Example: {"FACEBOOK": "...", "LINKEDIN": "...", "TIKTOK": "..."}`,
            prompt: prompt,
        });

        // Try to clean up the response in case it contains markdown formatting
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/```json\n/g, '').replace(/```/g, '');
        }

        const parsed = JSON.parse(cleanText);
        return { success: true, data: parsed };
    } catch (error) {
        console.error("Error generating social copy:", error);
        return { success: false, error: "Failed to generate AI copy." };
    }
}
