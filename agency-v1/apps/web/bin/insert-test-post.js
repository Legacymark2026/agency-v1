const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: process.env.MEDIA_DATABASE_URL
});

async function main() {
  console.log("Upserting author user in media database...");
  const user = await prisma.user.upsert({
    where: { id: "f73a894c-7442-48fc-baee-2dfd2a7f0e4c" },
    update: {},
    create: {
      id: "f73a894c-7442-48fc-baee-2dfd2a7f0e4c",
      name: "Administrador",
      email: "administrador@legacymarksas.com",
      role: "admin",
      globalRole: "super_admin",
      updatedAt: new Date()
    }
  });
  console.log("Success! Author user is ready:", user.id, user.email);

  console.log("Inserting test post...");
  const post = await prisma.post.upsert({
    where: { slug: "mi-primer-blog" },
    update: {},
    create: {
      id: "test-post-1",
      title: "Mi primer blog",
      slug: "mi-primer-blog",
      content: "Este es el contenido de mi primer blog posts. Creado para verificar la base de datos segregada.",
      authorId: user.id,
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
