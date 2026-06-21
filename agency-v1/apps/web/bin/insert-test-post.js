const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: process.env.MEDIA_DATABASE_URL
});

async function main() {
  console.log("Inserting test post...");
  const post = await prisma.post.upsert({
    where: { slug: "mi-primer-blog" },
    update: {},
    create: {
      id: "test-post-1",
      title: "Mi primer blog",
      slug: "mi-primer-blog",
      content: "Este es el contenido de mi primer blog posts. Creado para verificar la base de datos segregada.",
      authorId: "f73a894c-7442-48fc-baee-2dfd2a7f0e4c",
      published: true,
      status: "published",
      updatedAt: new Date()
    }
  });
  console.log("Success! Created post:", post.id, post.title);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
