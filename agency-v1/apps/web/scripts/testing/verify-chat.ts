
import { initializeChat, sendMessage, getMessages } from "../actions/chat";
import { prisma } from "../lib/prisma";

async function verifyChat() {
    console.log("🚀 Starting Chat Integration Verification...");

    const testUser = {
        name: "Test User " + Date.now(),
        email: `test-${Date.now()}@example.com`,
        message: "This is a test message from verification script",
        visitorId: crypto.randomUUID(),
    };

    try {
        // Debug Company
        const companyCount = await prisma.company.count();
        console.log(`DEBUG: Found ${companyCount} companies in DB.`);
        const firstCompany = await prisma.company.findFirst();
        console.log("DEBUG: First Company:", firstCompany);

        // 1. Initialize Chat
        console.log("Step 1: Initializing Chat...");
        const initResult = await initializeChat(testUser);

        if (!initResult.success || !initResult.conversationId) {
            throw new Error(`Failed to initialize chat: ${initResult.error}`);
        }
        console.log("✅ Chat Initialized. Conversation ID:", initResult.conversationId);

        // 2. Verify Client DB (Lead & Conversation)
        console.log("Step 2: Verifying Database Records...");
        const lead = await prisma.lead.findFirst({
            where: { email: testUser.email },
            include: { conversations: true },
        });

        if (!lead) throw new Error("Lead was not created in DB");
        if (lead.conversations.length === 0) throw new Error("Conversation was not linked to Lead");
        console.log("✅ Lead and Conversation verified in DB");

        // 3. Send a follow-up message
        console.log("Step 3: Sending Follow-up Message...");
        const sendResult = await sendMessage(initResult.conversationId, "Second message from user");
        if (!sendResult.success) throw new Error("Failed to send message");
        console.log("✅ Follow-up message sent");

        // 4. Get Messages
        console.log("Step 4: Fetching Messages...");
        const history = await getMessages(initResult.conversationId);
        if (!history.success || history.messages.length !== 2) {
            throw new Error(`Expected 2 messages, found ${history.messages?.length}`);
        }
        console.log("✅ Message history verified:", history.messages.map(m => m.content));

        // Cleanup
        console.log("🧹 Cleaning up test data...");
        await prisma.lead.delete({ where: { id: lead.id } });
        console.log("✅ Cleanup complete");

        console.log("🎉 VERIFICATION SUCCESSFUL! Backend logic is solid.");

    } catch (error) {
        console.error("❌ VERIFICATION FAILED:", error);
        process.exit(1);
    }
}

verifyChat();
