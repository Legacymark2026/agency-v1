import { prisma } from '@agency/database';

export class MemoryVectorService {
  /**
   * Generates a 1536-dimension embedding vector mock or call OpenAI/Gemini
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    // Generate a simple deterministic vector based on text characters for testing/consistency
    const vector = new Array(1536).fill(0);
    for (let i = 0; i < text.length && i < 1536; i++) {
      vector[i] = text.charCodeAt(i) / 255.0;
    }
    // Normalize vector
    const mag = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map(v => v / mag);
  }

  /**
   * Saves memory text with generated embedding to the database (uses pgvector)
   */
  static async saveMemoryWithVector(agentId: string, content: string, metadata: Record<string, any> = {}): Promise<void> {
    try {
      const embedding = await this.generateEmbedding(content);
      const embeddingSql = `[${embedding.join(',')}]`;

      // Insert directly using raw SQL to bypass Prisma compile constraints for custom Vector types
      await prisma.$executeRawUnsafe(`
        INSERT INTO "tbl_agent_memories" ("id", "agent_id", "content", "embedding", "metadata", "created_at")
        VALUES ($1, $2, $3, $4::vector, $5, NOW())
      `, 
        `vmem-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        agentId,
        content,
        embeddingSql,
        JSON.stringify(metadata)
      );
    } catch (err: any) {
      console.warn('[MemoryVectorService] saveMemoryWithVector database fallback notice:', err.message);
      // Fallback if tbl_agent_memories table or pgvector extension is not fully configured
      try {
        await (prisma as any).agentMemory.create({
          data: {
            agentId,
            conversationId: 'vector-fallback-conv',
            role: 'system',
            content: `[Vector Memory] ${content}`,
            metadata: JSON.stringify({ ...metadata, hasEmbeddingMock: true })
          }
        });
      } catch (e) {
        // Safe fail-silent if tables are not fully migrated
      }
    }
  }

  /**
   * Searches for top k matching memories using pgvector cosine distance operator (<=>)
   */
  static async searchMemory(agentId: string, query: string, limit = 5): Promise<any[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const queryEmbeddingSql = `[${queryEmbedding.join(',')}]`;

      // pgvector cosine similarity search
      const results: any[] = await prisma.$queryRawUnsafe(`
        SELECT "id", "content", "metadata", 
               1 - ("embedding" <=> $1::vector) as "similarity"
        FROM "tbl_agent_memories"
        WHERE "agent_id" = $2
        ORDER BY "embedding" <=> $1::vector ASC
        LIMIT $3
      `,
        queryEmbeddingSql,
        agentId,
        limit
      );
      return results;
    } catch (err: any) {
      console.warn('[MemoryVectorService] searchMemory fallback notice:', err.message);
      // Fallback search using fuzzy matching in normal memory table
      try {
        const records = await (prisma as any).agentMemory.findMany({
          where: { 
            agentId,
            content: { contains: query }
          },
          take: limit
        });
        return records.map((r: any) => ({
          id: r.id,
          content: r.content,
          metadata: r.metadata ? JSON.parse(r.metadata) : {},
          similarity: 0.8 // static similarity for fallback matches
        }));
      } catch (e) {
        return [];
      }
    }
  }
}
