
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function check(url: string, name: string) {
    try {
        const res = await fetch(url);
        if (res.status === 200) {
            console.log(`✅ ${name}: OK (${url})`);
            return true;
        } else {
            console.error(`❌ ${name}: Failed ${res.status} (${url})`);
            return false;
        }
    } catch (e: any) {
        console.error(`❌ ${name}: Error ${e.message}`);
        return false;
    }
}

async function main() {
    console.log("Verifying Public Endpoints...");

    await check(BASE_URL + '/', "Home Page");
    await check(BASE_URL + '/blog', "Blog List");
    await check(BASE_URL + '/portfolio', "Portfolio List");
    await check(BASE_URL + '/auth/login', "Login Page");

    // Dynamic
    const post = await prisma.post.findFirst({ where: { published: true } });
    if (post) {
        await check(BASE_URL + `/blog/${post.slug}`, "Single Post");
    } else {
        console.warn("⚠️ No published posts found to test single view. Creating one...");
        const newPost = await prisma.post.create({
            data: {
                title: "Auto Test Post",
                slug: "auto-test-post",
                content: "Content",
                published: true,
                author: { connect: { email: 'e2e@test.com' } } // Assuming e2e user exists
            }
        });
        await check(BASE_URL + `/blog/${newPost.slug}`, "Single Post (New)");
    }

    const project = await prisma.project.findFirst({ where: { published: true } });
    if (project) {
        await check(BASE_URL + `/portfolio/${project.slug}`, "Single Project");
    } else {
        console.warn("⚠️ No published projects found to test single view.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
