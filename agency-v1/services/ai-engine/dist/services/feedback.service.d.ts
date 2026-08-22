export type FeedbackRating = "THUMBS_UP" | "THUMBS_DOWN";
export interface AgentFeedback {
    id: string;
    agentId: string;
    companyId: string;
    conversationId: string;
    traceId?: string;
    rating: FeedbackRating;
    stars?: number;
    comment?: string;
    givenBy?: string;
    createdAt: string;
}
export interface FeedbackStats {
    agentId: string;
    companyId: string;
    totalFeedback: number;
    thumbsUp: number;
    thumbsDown: number;
    satisfactionRate: number;
    avgStars: number;
    recentFeedback: AgentFeedback[];
}
export declare class FeedbackService {
    /**
     * Record feedback (👍 / 👎 + optional stars + comment) for a conversation
     */
    static recordFeedback(input: Omit<AgentFeedback, "id" | "createdAt">): Promise<AgentFeedback>;
    /**
     * Get aggregate stats for an agent
     */
    static getStats(companyId: string, agentId: string): Promise<FeedbackStats>;
    /**
     * Get recent feedback items for a company (admin view)
     */
    static listRecentFeedback(companyId: string, limit?: number): Promise<AgentFeedback[]>;
}
