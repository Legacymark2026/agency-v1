/**
 * AI Worker - Dedicated process for AI agent tasks
 * Runs separately from main Next.js app for better resource isolation
 */

const { Worker } = require('worker_threads');
const Queue = require('bull');

// Create AI task queue with Redis
const aiQueue = new Queue('ai-tasks', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
    },
    limiter: {
        max: 10, // Max 10 concurrent AI tasks
        duration: 1000, // Per second
    },
});

// Process AI tasks
aiQueue.process(async (job) => {
    console.log(`[AI Worker] Processing job ${job.id}:`, job.data.type);

    try {
        const result = await processAITask(job.data);
        return result;
    } catch (error) {
        console.error(`[AI Worker] Error processing job ${job.id}:`, error);
        throw error;
    }
});

/**
 * Process different types of AI tasks
 */
async function processAITask(data) {
    const { type, payload } = data;

    switch (type) {
        case 'chat':
            return await processChatTask(payload);

        case 'analysis':
            return await processAnalysisTask(payload);

        case 'generation':
            return await processGenerationTask(payload);

        default:
            throw new Error(`Unknown task type: ${type}`);
    }
}

/**
 * Process chat/conversation task
 */
async function processChatTask(payload) {
    const { messages, model = 'gpt-4', userId } = payload;

    // Import OpenAI dynamically
    const { Configuration, OpenAIApi } = require('openai');

    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        user: userId,
    });

    return {
        response: completion.data.choices[0].message.content,
        usage: completion.data.usage,
        model: completion.data.model,
    };
}

/**
 * Process data analysis task
 */
async function processAnalysisTask(payload) {
    const { data, analysisType } = payload;

    // Implement your analysis logic here
    // This could involve multiple AI calls, data processing, etc.

    return {
        analysis: 'Analysis result',
        metrics: {},
    };
}

/**
 * Process content generation task
 */
async function processGenerationTask(payload) {
    const { prompt, type } = payload;

    // Implement generation logic

    return {
        content: 'Generated content',
    };
}

// Event handlers
aiQueue.on('completed', (job, result) => {
    console.log(`[AI Worker] Job ${job.id} completed successfully`);
});

aiQueue.on('failed', (job, err) => {
    console.error(`[AI Worker] Job ${job.id} failed:`, err.message);
});

aiQueue.on('active', (job) => {
    console.log(`[AI Worker] Job ${job.id} started`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('[AI Worker] Received SIGTERM, closing queue...');
    await aiQueue.close();
    process.exit(0);
});

console.log('[AI Worker] Started and waiting for tasks...');
console.log(`[AI Worker] Using model: ${process.env.OPENAI_MODEL || 'gpt-4'}`);

// Export for testing
module.exports = { aiQueue, processAITask };
