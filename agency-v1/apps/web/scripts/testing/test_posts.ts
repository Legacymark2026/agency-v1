import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const posts = await prisma.post.findMany({
        select: { id: true, title: true, slug: true, status: true, published: true }
    })
    console.log("POSTS IN DB:", JSON.stringify(posts, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
