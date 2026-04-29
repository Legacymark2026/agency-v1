import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const DEFAULT_MODEL = 'gemini-2.5-flash';

export interface InboxAnalysisResult {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'URGENT';
  topic: string;
}

/**
 * Analyzes an incoming message to determine sentiment and intent mapping.
 */
export async function analyzeIncomingMessage(messageContent: string): Promise<InboxAnalysisResult> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("No GEMINI_API_KEY found. Falling back to basic heuristic triage.");
    return fallbackAnalysis(messageContent);
  }

  try {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
    const prompt = `
      Analyze the following message from a customer and return a JSON object with two fields:
      - "sentiment": Must be exactly one of "POSITIVE", "NEUTRAL", "NEGATIVE", or "URGENT".
      - "topic": A concise 1-3 word classification of what the message is about (e.g., "Pricing Inquiry", "Support Request", "Complaint").
      
      Message: "${messageContent}"
      
      Respond only with the raw JSON object, no markdown formatting.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Clean potential markdown blocks
    const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    return {
      sentiment: ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'URGENT'].includes(parsed.sentiment) ? parsed.sentiment : 'NEUTRAL',
      topic: parsed.topic || 'General Inquiry'
    };
  } catch (error) {
    console.error("[analyzeIncomingMessage] Error calling Gemini API:", error);
    return fallbackAnalysis(messageContent);
  }
}

export async function draftCopilotReply(conversationId: string): Promise<string> {
    try {
        const activeConversation = await db.conversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                lead: true
            }
        });

        if (!activeConversation) throw new Error("Conversation not found");

        const companyId = activeConversation.companyId;
        const config = await db.integrationConfig.findFirst({
            where: { companyId, provider: "gemini" },
            select: { config: true },
        });

        const apiKey = (config?.config as any)?.apiKey ?? process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return "Please configure the Gemini API key in Integrations to use the AI Copilot.";
        }

        const historyContext = activeConversation.messages.reverse().map((m: any) => 
            `${m.direction === 'INBOUND' ? 'Customer' : 'Agent'}: ${m.content}`
        ).join("\n");

        const lead = activeConversation.lead;
        let deal: any = null;
        let proposal: any = null;

        if (lead?.convertedToDealId) {
            deal = await db.deal.findUnique({
                where: { id: lead.convertedToDealId },
                include: { proposals: { orderBy: { createdAt: 'desc' }, take: 1 } }
            });
            proposal = deal?.proposals?.[0];
        }

        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: "gemini-2.0-flash" });
        
        const prompt = `
            Eres un copiloto de ventas de muy alto nivel para una empresa ultra-profesional.
            Tu objetivo es leer el contexto del cliente y redactar UNA ÚNICA respuesta clara, empática y persuasiva que el agente humano enviará.

            CONTEXTO DEL LEAD:
            - Nombre: ${lead?.name ?? 'Desconocido'}
            ${deal ? `- Deal Asociado: ${deal.title} (${deal.stage}) - Valor: $${deal.value}` : '- Sin deal activo en el CRM.'}
            ${proposal ? `- Última Propuesta: ${proposal.title} ($${proposal.items?.reduce((acc: any, i: any) => acc + i.price * i.quantity, 0)}) - Estado: ${proposal.status}` : ''}

            HISTORIAL DE CHAT RECIENTE:
            ${historyContext}

            INSTRUCCIONES:
            1. Responde de forma cálida, muy profesional y orientada a la resolución o avanzar la venta.
            2. Si se trata de una propuesta, intégralo sutilmente en la conversación si aporta valor.
            3. No incluyas placeholders como "[Tu Nombre]".
            4. DEBES DEVOLVER ÚNICAMENTE EL TEXTO DE LA RESPUESTA LISTO PARA PEGARSE. NADA MÁS.
        `;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
        });
        
        const generatedDraft = result.response.text().trim();

        // P2-1: Save draft into conversation metadata for instantaneous UI retrieval
        const metadata = (activeConversation.metadata as any) || {};
        metadata.copilotDraft = generatedDraft;
        metadata.copilotDraftTimestamp = new Date().toISOString();
        
        await db.conversation.update({
            where: { id: conversationId },
            data: { metadata }
        });

        return generatedDraft;
    } catch (error) {
        console.error("[draftCopilotReply] Error:", error);
        return "Lo siento, ha ocurrido un error al generar la sugerencia. Verifica tus configuraciones de API.";
    }
}

// Fallback logic if API key is missing
function fallbackAnalysis(message: string): InboxAnalysisResult {
  const text = message.toLowerCase();
  let sentiment: InboxAnalysisResult['sentiment'] = 'NEUTRAL';
  let topic = 'General Inquiry';

  if (text.includes('urgent') || text.includes('asap') || text.includes('help')) sentiment = 'URGENT';
  else if (text.includes('terrible') || text.includes('refund') || text.includes('bad')) sentiment = 'NEGATIVE';
  else if (text.includes('great') || text.includes('thanks') || text.includes('love')) sentiment = 'POSITIVE';

  if (text.includes('price') || text.includes('cost')) topic = 'Pricing';
  else if (text.includes('issue') || text.includes('broken')) topic = 'Support';

  return { sentiment, topic };
}

import { AIAgentTools, executeAgentTool } from './ai-tools';

/**
 * Hook to automatically reply to a message using the assigned Inbox Copilot Agent.
 */
export async function triggerOmnichannelAgent(conversationId: string, companyId: string) {
    try {
        // @ts-ignore Prisma might have cached types, but db push succeeded
        const agent = await db.aIAgent.findFirst({
            where: { companyId, isInboxAgent: true, isActive: true },
            include: { knowledgeBases: true }
        });

        if (!agent) {
             console.log("[OmnichannelAgent] No active inbox agent found for company", companyId);
             return { success: false, reason: "NO_AGENT" };
        }

        const activeConversation = await db.conversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: { orderBy: { createdAt: 'desc' }, take: 100 },
                lead: true
            }
        });

        if (!activeConversation) return { success: false, reason: "NO_CONVERSATION" };

        const config = await db.integrationConfig.findFirst({
            where: { companyId, provider: "gemini" },
            select: { config: true },
        });

        const apiKey = (config?.config as any)?.apiKey ?? process.env.GEMINI_API_KEY;
        if (!apiKey) return { success: false, reason: "NO_API_KEY" };

        let kbContext = "";
        try {
            const latestMsg = activeConversation.messages[0]?.content || "";
            if (latestMsg && agent.knowledgeBases && agent.knowledgeBases.length > 0) {
                const { generateEmbedding } = await import("@/lib/embeddings");
                const queryVector = await generateEmbedding(latestMsg, apiKey);
                const vectorString = `[${queryVector.join(',')}]`;
                
                const relevantKBs = await db.$queryRaw<Array<{ name: string, content: string }>>`
                    SELECT name, content 
                    FROM knowledge_bases 
                    WHERE company_id = ${companyId} 
                      AND is_active = true 
                      AND embedding IS NOT NULL
                    ORDER BY embedding <=> ${vectorString}::vector
                    LIMIT 3;
                `;
                
                if (relevantKBs && relevantKBs.length > 0) {
                    kbContext = relevantKBs.map(kb => `Documento: ${kb.name}\n${kb.content}`).join("\n\n");
                } else {
                     // Fallback
                     kbContext = agent.knowledgeBases.map((kb: any) => `Documento: ${kb.name}\n${kb.content}`).join("\n\n");
                }
            }
        } catch (e) {
            console.error("[OmnichannelAgent] Semantic RAG failed, using legacy:", e);
            if (agent.knowledgeBases && agent.knowledgeBases.length > 0) {
                 kbContext = agent.knowledgeBases.map((kb: any) => `Documento: ${kb.name}\n${kb.content}`).join("\n\n");
            }
        }

        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ 
            model: agent.llmModel || "gemini-2.0-flash",
            // We use systemInstruction if available, otherwise prepend to history
            systemInstruction: `Eres el Agente de nombre "${agent.name}". Responde al cliente de forma natural siguiendo estrictamente tus instrucciones y tono. Devuelve ÚNICAMENTE tu texto listo para enviar al cliente. Sin formato markdown de bloques.\n\nTUS REGLAS:\n${agent.systemPrompt}\n\nBASE DE CONOCIMIENTOS:\n${kbContext}\n\nCONTEXTO DEL CLIENTE:\nNombre: ${activeConversation.lead?.name || 'Cliente'}\nCanal: ${activeConversation.channel}`
        });

        // 1. Build Tools array, ignoring Prisma JsonValue type error
        // @ts-ignore
        const enabledSettings = (agent.enabledTools || []) as string[];
        const availableDeclarations = enabledSettings
            .map((t: string) => AIAgentTools[t])
            .filter(Boolean);

        const toolsConfig = availableDeclarations.length > 0 
            ? [{ functionDeclarations: availableDeclarations }] 
            : undefined;

        // 2. Build Chat History correctly
        // activeConversation.messages is DESC limit 100. We need to reverse it to ASC (oldest first).
        const historyData = activeConversation.messages.reverse();
        
        // Exclude the very last message from history, because we'll send it as the NEW message trigger.
        const previousMessages = historyData.slice(0, -1);
        const latestMessage = historyData[historyData.length - 1];

        if (!latestMessage) return { success: false, reason: "NO_MESSAGES" };

        const formattedHistory = previousMessages.map((m: any) => ({
            role: m.direction === 'INBOUND' ? 'user' : 'model',
            parts: [{ text: m.content || '[Media]' }]
        }));

        // 3. Start Chat Session
        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: { temperature: agent.temperature || 0.4, maxOutputTokens: agent.maxTokens || 400 },
            tools: toolsConfig
        });

        // 4. Send the new message and enter the Tool Execution Loop
        const latestParts: any[] = [{ text: latestMessage.content || '[Media]' }];

        // Multimodal handling for WhatsApp audio (P1-2 fix)
        if (latestMessage.mediaUrl && latestMessage.mediaUrl.includes('/api/media/whatsapp/')) {
            const mediaId = latestMessage.mediaUrl.split('/').pop();
            if (mediaId) {
                try {
                    const { getSystemIntegrationConfig } = await import("@/lib/integration-config-service");
                    let apiToken = process.env.WHATSAPP_API_TOKEN || '';
                    const waConfig = await getSystemIntegrationConfig('whatsapp');
                    if (waConfig?.accessToken) apiToken = waConfig.accessToken;

                    if (apiToken) {
                        const metaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, { headers: { 'Authorization': `Bearer ${apiToken}` } });
                        const metaData = await metaRes.json();
                        if (metaData.url) {
                            const mediaRes = await fetch(metaData.url, { headers: { 'Authorization': `Bearer ${apiToken}` } });
                            if (mediaRes.ok) {
                                const buffer = await mediaRes.arrayBuffer();
                                const base64Data = Buffer.from(buffer).toString('base64');
                                const mimeType = mediaRes.headers.get("Content-Type") || latestMessage.mediaType || 'audio/ogg';
                                
                                latestParts.push({
                                    inlineData: {
                                        data: base64Data,
                                        mimeType: mimeType
                                    }
                                });
                                // Provide explicit instruction to the model
                                latestParts[0].text += "\n[Nota del Sistema: Tienes acceso nativo a este audio de WhatsApp. Escúchalo y responde al cliente según lo que dice.]";
                            }
                        }
                    }
                } catch (audioErr) {
                    console.error("[OmnichannelAgent] Failed to fetch and parse multimodal audio:", audioErr);
                }
            }
        }

        let chatResult = await chat.sendMessage(latestParts);
        let response = chatResult.response;
        
        // Extract function call safely from parts if helpers are missing in types
        const getFunctionCall = (resp: any) => {
            if (typeof resp.functionCall === 'function') return resp.functionCall();
            if (typeof resp.functionCalls === 'function') return resp.functionCalls()?.[0];
            return resp.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
        };

        let functionCall = getFunctionCall(response);

        // Safeguard counter to prevent infinite loops
        let callCount = 0;
        while (functionCall && callCount < 5) {
            callCount++;
            console.log(`[OmnichannelAgent] Executing tool: ${functionCall.name} (args: ${JSON.stringify(functionCall.args)})`);
            
            // Execute the system tool locally
            const resultObj = await executeAgentTool(companyId, functionCall.name, functionCall.args);
            
            // Send the result back to Gemini so it can continue thinking
            chatResult = await chat.sendMessage([{
                functionResponse: {
                    name: functionCall.name,
                    response: resultObj
                }
            }]);
            response = chatResult.response;
            functionCall = getFunctionCall(response);
        }

        // 5. Tool execution finished. Extract final text reply.
        const aiReply = typeof response.text === 'function' ? response.text().trim() : response.candidates?.[0]?.content?.parts?.map((p:any) => p.text).join("").trim();

        if (aiReply) {
             const { sendMessage } = await import('@/actions/inbox');
             await sendMessage(conversationId, aiReply, "ai-copilot-" + agent.id);
             console.log(`[OmnichannelAgent] Auto-reply sent for conversation ${conversationId}`);
             return { success: true, replied: true };
        }

        return { success: false, reason: "EMPTY_REPLY" };

    } catch (e: any) {
        console.error("[OmnichannelAgent] Error triggering AI reply:", e);
        return { success: false, error: e.message };
    }
}

