import { db } from "@/lib/db";

export const LeadScoringService = {
    async calculateScore(leadId: string) {
        const lead = await db.lead.findUnique({
            where: { id: leadId },
            include: {
                conversations: {
                    include: { messages: true }
                },
                marketingEvents: true
            }
        });

        if (!lead) return 0;

        let score = 0;

        // 1. Explicit Signals (Demographics)
        if (lead.email && !lead.email.includes("gmail.com") && !lead.email.includes("hotmail.com")) {
            score += 15; // Corporate email
        }
        if (lead.phone) score += 10;
        if (lead.jobTitle) {
            const title = lead.jobTitle.toLowerCase();
            if (title.includes("ceo") || title.includes("founder") || title.includes("director")) score += 20;
            else if (title.includes("manager")) score += 10;
        }

        // 2. Implicit Signals (Behavior) through Marketing Events
        const events = lead.marketingEvents || [];

        // Page Views
        const pageViews = events.filter(e => e.eventType === 'PAGE_VIEW');
        score += Math.min(pageViews.length * 2, 20); // Max 20 pts for views

        // High Value Pages
        const pricingVisits = pageViews.filter(e => e.url?.includes('pricing')).length;
        score += pricingVisits * 10;

        // Form Submissions
        const forms = events.filter(e => e.eventType === 'FORM_SUBMIT');
        score += forms.length * 20;

        // 3. Engagement (Inbox)
        const conversations = lead.conversations || [];
        if (conversations.length > 0) score += 10;

        // Inbound messages (interest)
        const inboundCount = conversations.reduce((acc, conv) => {
            return acc + conv.messages.filter(m => m.direction === 'INBOUND').length;
        }, 0);
        score += Math.min(inboundCount * 5, 25);

        // Cap at 100
        const finalScore = Math.min(score, 100);

        // Update Lead
        await db.lead.update({
            where: { id: leadId },
            data: { score: finalScore }
        });

        return finalScore;
    }
};
