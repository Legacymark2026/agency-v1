const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// Cargador simple de archivos .env para evitar dependencias externas como dotenv
function loadEnv() {
  const envPath = path.resolve(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    console.log(`📝 Loading environment variables from: ${envPath}`);
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const index = trimmed.indexOf('=');
        if (index > 0) {
          const key = trimmed.substring(0, index).trim();
          let val = trimmed.substring(index + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
  }
}

loadEnv();

const schemas = [
  {
    name: 'auth',
    file: 'packages/database/prisma/schema.auth.prisma',
    envVar: 'AUTH_DATABASE_URL',
    defaultUrl: 'postgresql://legacymark:legacymark_dev@localhost:5432/legacymark_auth'
  },
  {
    name: 'core',
    file: 'packages/database/prisma/schema.core.prisma',
    envVar: 'CORE_DATABASE_URL',
    defaultUrl: 'postgresql://legacymark:legacymark_dev@localhost:5432/legacymark_core'
  },
  {
    name: 'media',
    file: 'packages/database/prisma/schema.media.prisma',
    envVar: 'MEDIA_DATABASE_URL',
    defaultUrl: 'postgresql://legacymark:legacymark_dev@localhost:5432/legacymark_media'
  },
  {
    name: 'analytics',
    file: 'packages/database/prisma/schema.analytics.prisma',
    envVar: 'ANALYTICS_DATABASE_URL',
    defaultUrl: 'postgresql://legacymark:legacymark_dev@localhost:5432/legacymark_analytics'
  }
];

console.log('🚀 Starting migrations on segregated databases...');

async function run() {
  for (const schema of schemas) {
    const dbUrl = process.env[schema.envVar] || process.env.DATABASE_URL || schema.defaultUrl;
    console.log(`\n📦 Migrating [${schema.name}] database using schema: ${schema.file}...`);
    // Ocultar la contraseña en el log para mayor seguridad
    const safeLogUrl = dbUrl.replace(/:[^:@/]+@/, ':****@');
    console.log(`🔌 Connection URL: ${safeLogUrl}`);

    try {
      execSync(`npx prisma db push --schema=${schema.file}`, {
        cwd: rootDir,
        env: {
          ...process.env,
          [schema.envVar]: dbUrl,
          DATABASE_URL: dbUrl // Sobrescribir DATABASE_URL para el fallback de Prisma
        },
        stdio: 'inherit'
      });
      console.log(`✅ Database [${schema.name}] successfully synchronized.`);

      // Aplicar trigger personalizado para LISTEN/NOTIFY en la base de datos core
      if (schema.name === 'core') {
        console.log(`🔧 Applying custom triggers for [core] database (Outbox LISTEN/NOTIFY)...`);
        try {
          const { PrismaClient } = require(path.resolve(rootDir, 'node_modules/@prisma/client/core'));
          const prismaClient = new PrismaClient({
            datasources: {
              db: {
                url: dbUrl
              }
            }
          });

          await prismaClient.$executeRawUnsafe(`
            CREATE OR REPLACE FUNCTION notify_outbox_event()
            RETURNS TRIGGER AS $$
            BEGIN
              PERFORM pg_notify('outbox_event_inserted', NEW.id::text);
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
          `);

          await prismaClient.$executeRawUnsafe(`
            DROP TRIGGER IF EXISTS trg_notify_outbox_event ON tbl_outbox_events;
          `);

          await prismaClient.$executeRawUnsafe(`
            CREATE TRIGGER trg_notify_outbox_event
            AFTER INSERT ON tbl_outbox_events
            FOR EACH ROW EXECUTE FUNCTION notify_outbox_event();
          `);

          console.log(`✅ Custom triggers applied successfully to [core] database.`);
          await prismaClient.$disconnect();
        } catch (triggerErr) {
          console.error(`❌ Failed to apply custom triggers to [core] database:`, triggerErr.message);
          process.exit(1);
        }
      }
    } catch (error) {
      console.error(`❌ Migration failed for database [${schema.name}]:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n🎉 All databases have been successfully migrated.');
}

run().catch(err => {
  console.error('Migration wrapper execution failed:', err);
  process.exit(1);
});

