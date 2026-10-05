const { PrismaClient } = require("@prisma/client");

const authUrl = process.env.AUTH_DATABASE_URL || "postgresql://legacymark:legacymark_dev@pgbouncer:6432/legacymark_auth?connection_limit=5&pgbouncer=true&sslmode=prefer";
const pAuth = new PrismaClient({ datasourceUrl: authUrl });

async function run() {
  const emails = [
    "HEYBER@HEYBER.COM",
    "enri@jsjdsd.com",
    "fdsfdsf@hhahja.com",
    "enriqeubohorquez02@gmail.com",
  ];
  const r = await pAuth.user.deleteMany({
    where: {
      email: {
        in: emails,
        mode: "insensitive",
      },
    },
  });
  console.log("Deleted orphaned users in Auth DB:", r.count);
  await pAuth.$disconnect();
}

run();
