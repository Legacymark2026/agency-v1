import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Starting Phase 2 (CMS) Verification...");

    // 1. Create Test Author
    const authorEmail = `test-admin-${Date.now()}@example.com`;
    console.log(`👤 Creating test author: ${authorEmail}`);
    const author = await prisma.user.create({
        data: {
            name: "CMS Tester",
            email: authorEmail,
            passwordHash: "dummy",
        }
    });

    try {
        // 2. Test Post Model
        console.log("📝 Testing Blog Post Creation...");
        const post = await prisma.post.create({
            data: {
                title: "Test Post Phase 2",
                slug: `test-post-${Date.now()}`,
                content: "Content for testing phase 2.",
                published: true,
                authorId: author.id
            }
        });
        console.log(`✅ Post created: ${post.id}`);

        // Verify retrieval
        const fetchedPost = await prisma.post.findUnique({ where: { id: post.id } });
        if (!fetchedPost) throw new Error("Post not found after creation");
        console.log("✅ Post retrieval verified");

        // 3. Test Project Model
        console.log("💼 Testing Portfolio Project Creation...");
        const project = await prisma.project.create({
            data: {
                title: "Test Project Phase 2",
                slug: `test-project-${Date.now()}`,
                description: "Project description",
                published: true
            }
        });
        console.log(`✅ Project created: ${project.id}`);

        // Verify retrieval
        const fetchedProject = await prisma.project.findUnique({ where: { id: project.id } });
        if (!fetchedProject) throw new Error("Project not found after creation");
        console.log("✅ Project retrieval verified");

        // 4. Test Services Model
        console.log("🛠️ Testing Service Creation...");
        const service = await prisma.service.create({
            data: {
                name: "Test Service",
                slug: `service-${Date.now()}`
            }
        });
        console.log(`✅ Service created: ${service.id}`);

        // Clean up
        console.log("🧹 Cleaning up test data...");
        await prisma.post.delete({ where: { id: post.id } });
        await prisma.project.delete({ where: { id: project.id } });
        await prisma.service.delete({ where: { id: service.id } });
        await prisma.user.delete({ where: { id: author.id } });

        console.log("✨ PHASE 2 VERIFICATION: SUCCESS");

    } catch (e) {
        console.error("❌ Verification Failed:", e);
        // Try to cleanup user if post creation failed
        try { await prisma.user.delete({ where: { id: author.id } }); } catch { }
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
