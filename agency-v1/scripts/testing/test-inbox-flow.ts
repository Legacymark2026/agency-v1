
import { PrismaClient } from '@prisma/client';
import { sendMessage, getConversations, getMessages, updateConversationStatus, getLeadDetails } from '../actions/inbox';

const prisma = new PrismaClient();

async function runTest() {
    console.log("🚀 Starting Inbox E2E Test Sequence...");

    // 1. Setup Data
    console.log("\n1. Setting up test data...");

    // Try to find an admin user with companies
    let user = await prisma.user.findFirst({
        include: { companies: true }
    });

    // If no user exists, create one
    if (!user) {
        console.log("⚠️ No user found, creating test user...");
        user = await prisma.user.create({
            data: {
                email: 'test.admin@example.com',
                name: 'Test Admin',
                role: 'admin',
                companies: {
                    create: {
                        company: {
                            create: {
                                name: 'Test Corp',
                                slug: 'test-corp-' + Date.now()
                            }
                        }
                    }
                }
            },
            include: { companies: true }
        });
    }

    // Ensure user has a company
    let companyId = user.companies[0]?.companyId;
    if (!companyId) {
        console.log("⚠️ User found but no company linked, creating company...");
        const company = await prisma.company.create({
            data: {
                name: 'Test Corp Fallback',
                slug: 'test-corp-fallback-' + Date.now(),
                members: {
                    create: {
                        userId: user.id,
                        role: 'admin'
                    }
                }
            }
        });
        companyId = company.id;
    }

    console.log("✅ User & Company ready. User ID:", user.id);
    console.log("👉 Using Company ID:", companyId);

    // Create or Get Lead
    let lead = await prisma.lead.findFirst({
        where: { email: 'test.lead@example.com' }
    });

    if (!lead) {
        lead = await prisma.lead.create({
            data: {
                email: 'test.lead@example.com',
                name: 'Test Lead',
                source: 'TEST_SCRIPT',
                companyId: companyId
            }
        });
    }
    console.log("✅ Lead ready:", lead.name);

    // 2. Simulate Incoming Message (Create Conversation)
    console.log("\n2. Simulating incoming message...");
    // We'll manually create a conversation to simulate "incoming" since we don't have a public webhook here
    const conversation = await prisma.conversation.create({
        data: {
            leadId: lead.id,
            companyId: lead.companyId,
            channel: 'WEB_CHAT',
            status: 'OPEN',
            lastMessageAt: new Date(),
            unreadCount: 1,
            lastMessagePreview: "Hello, I have a question about pricing."
        }
    });
    console.log("✅ Conversation created:", conversation.id);

    // 3. Fetch Conversations (Inbox List)
    console.log("\n3. Testing getConversations...");
    const { data: convos } = await getConversations({ limit: 10 });
    const found = convos?.find((c: any) => c.id === conversation.id); // Loose typing for script
    if (found) console.log("✅ Conversation found in Inbox list");
    else console.error("❌ Conversation NOT found in list");

    // 4. Send Message (Agent Reply)
    console.log("\n4. Testing sendMessage (Agent Reply)...");
    const sent = await sendMessage(conversation.id, "Hi! I can help with pricing.", user.id);
    if (sent.success) console.log("✅ Message sent successfully");
    else console.error("❌ Message send failed:", sent.error);

    // 5. Verify Messages (Chat Window)
    console.log("\n5. Testing getMessages...");
    const { data: msgs } = await getMessages(conversation.id);
    if (msgs && msgs.length > 0) console.log(`✅ Retrieved ${msgs.length} messages`);
    else console.error("❌ No messages retrieved");

    // 6. Update Status (Management)
    console.log("\n6. Testing updateConversationStatus...");
    const updated = await updateConversationStatus(conversation.id, 'CLOSED');
    if (updated.success) console.log("✅ Status updated to CLOSED");
    else console.error("❌ Status update failed");

    // 7. Check Lead Intelligence (Right Sidebar)
    console.log("\n7. Testing getLeadDetails (Marketing Brain)...");
    const leadDetails = await getLeadDetails(lead.id);
    if (leadDetails?.marketingEvents) {
        console.log("✅ Lead details fetched with marketing events");
    } else {
        console.error("❌ Failed to fetch lead details");
    }

    console.log("\n🎉 Test Sequence Complete!");
}

runTest()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
