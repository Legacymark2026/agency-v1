
interface AIResponse {
    result: string;
    sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    confidence: number;
}

export async function generateAIResponse(prompt: string, context: Record<string, any>, type: 'SENTIMENT' | 'GENERATION'): Promise<AIResponse> {
    console.log(`🤖 AI Agent Analyzing [${type}]...`);

    // Simulate API Latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (type === 'SENTIMENT') {
        const text = JSON.stringify(context).toLowerCase();
        let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';

        if (text.includes('urgent') || text.includes('bad') || text.includes('problem') || text.includes('terrible') || text.includes('refund')) sentiment = 'NEGATIVE';
        else if (text.includes('love') || text.includes('great') || text.includes('thanks')) sentiment = 'POSITIVE';

        return {
            result: sentiment,
            sentiment,
            confidence: 0.95
        };
    }

    if (type === 'GENERATION') {
        // Simple Mock Generation based on context
        const name = context.name || 'Customer';
        return {
            result: `Hello ${name},\n\nThank you for reaching out! based on your message about "${context.message || 'your inquiry'}", we have analyzed your request with our AI agent.\n\nBest,\nAutomated Agent`,
            confidence: 0.88
        };
    }

    return { result: "Unknown Task", confidence: 0 };
}
