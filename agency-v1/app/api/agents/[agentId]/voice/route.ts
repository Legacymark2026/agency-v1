import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
    const { agentId } = await params;
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as Blob;
        const conversationId = formData.get("conversationId") as string | null;

        if (!audioFile) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        const agent = await prisma.aIAgent.findUnique({
            where: { id: agentId }
        });

        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }

        const arrayBuffer = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `
Eres un asistente de voz llamado ${agent.name}. 
A continuación se te enviará un comando o pregunta de voz del usuario.
Tu comportamiento debe adherirse estrictamente a este prompt base:
"${agent.systemPrompt}"

DIRECTRICES PARA VOZ (CRÍTICO):
1. Responde de forma muy concisa. En voz, respuestas largas aburren.
2. Usa "fillers" humanos como "Hmm...", "A ver...", "Claro," al inicio para sonar natural.
3. El idioma de respuesta debe coincidir con la región: ${agent.accentRegion || 'Neutro'}.
4. NUNCA uses markdown (como **negritas** o listas) porque tu texto será leído por un sintetizador de voz (TTS).
`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: audioFile.type || "audio/webm",
                    data: base64Audio
                }
            }
        ]);

        const textResponse = result.response.text();

        const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
        
        if (elevenLabsKey && agent.voiceId) {
            try {
                const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${agent.voiceId}/stream`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'xi-api-key': elevenLabsKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: textResponse,
                        model_id: "eleven_multilingual_v2",
                        voice_settings: {
                            stability: agent.stability || 0.5,
                            similarity_boost: agent.similarityBoost || 0.75
                        }
                    })
                });

                if (ttsResponse.ok) {
                    const audioBuffer = await ttsResponse.arrayBuffer();
                    return new NextResponse(audioBuffer, {
                        headers: {
                            "Content-Type": "audio/mpeg",
                            "X-Agent-Text": encodeURIComponent(textResponse)
                        }
                    });
                }
            } catch (error) {
                console.error("ElevenLabs TTS error:", error);
            }
        }

        return NextResponse.json({ 
            text: textResponse,
            fallbackTts: true
        });

    } catch (error: any) {
        console.error("Voice Agent Route Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}