import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Usamos el modelo de embeddings estándar de Google
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    
    // Si el texto es muy largo, deberíamos cortarlo, pero text-embedding-004
    // soporta un input bastante amplio. Para ser seguros, cortamos si es excesivo.
    const safeText = text.length > 20000 ? text.slice(0, 20000) : text;
    
    const result = await model.embedContent(safeText);
    return result.embedding.values;
}
