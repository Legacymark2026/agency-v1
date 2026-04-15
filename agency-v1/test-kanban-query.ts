import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const firstCompany = await prisma.company.findFirst();
    if (!firstCompany) {
      console.log("No company found");
      return;
    }

    console.log("Found company:", firstCompany.id);

    const projects = await prisma.kanbanProject.findMany({
      where: { companyId: firstCompany.id },
      include: {
        kanbanTasks: {
          include: {
            assignee: { select: { id: true, name: true, image: true } },
          },
          orderBy: { order: "asc" },
        },
        deal: { select: { id: true, title: true, value: true, stage: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    console.log("Projects found:", projects.length);
    console.log("Success!");
  } catch (error) {
    console.error("PRISMA QUERY ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
