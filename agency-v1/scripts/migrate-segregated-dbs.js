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
          const { PrismaClient } = require(path.resolve(rootDir, 'packages/database/node_modules/@prisma/client/core'));
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

      // Aplicar particionamiento de logs en la base de datos analytics
      if (schema.name === 'analytics') {
        console.log(`🔧 Applying table partitioning for [analytics] database (Logs range partitioning)...`);
        try {
          const { PrismaClient } = require(path.resolve(rootDir, 'packages/database/node_modules/@prisma/client/analytics'));
          const prismaClient = new PrismaClient({
            datasources: {
              db: {
                url: dbUrl
              }
            }
          });

          // 1. Verificar si tbl_user_activity_logs ya está particionada
          const isUserActivityPartitioned = await prismaClient.$queryRawUnsafe(`
            SELECT 1 FROM pg_partitioned_table 
            WHERE partrelid = 'tbl_user_activity_logs'::regclass;
          `).catch(() => []);

          if (isUserActivityPartitioned.length === 0) {
            console.log(`📦 Converting tbl_user_activity_logs to partitioned table...`);
            
            // Renombrar vieja tabla si existe
            await prismaClient.$executeRawUnsafe(`DROP TABLE IF EXISTS tbl_user_activity_logs_old;`);
            await prismaClient.$executeRawUnsafe(`ALTER TABLE tbl_user_activity_logs RENAME TO tbl_user_activity_logs_old;`);
            
            // Crear tabla particionada
            await prismaClient.$executeRawUnsafe(`
              CREATE TABLE tbl_user_activity_logs (
                id VARCHAR(36) NOT NULL,
                user_id VARCHAR(36),
                action VARCHAR(255) NOT NULL,
                details JSONB,
                ip_address VARCHAR(45),
                user_agent VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                PRIMARY KEY (id, created_at)
              ) PARTITION BY RANGE (created_at);
            `);

            // Crear particiones mensuales dinámicas
            const now = new Date();
            for (let i = -1; i <= 2; i++) {
              const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const nextD = new Date(year, d.getMonth() + 1, 1);
              const nextYear = nextD.getFullYear();
              const nextMonth = String(nextD.getMonth() + 1).padStart(2, '0');
              
              const partName = `tbl_user_activity_logs_y${year}m${month}`;
              const fromStr = `${year}-${month}-01 00:00:00+00`;
              const toStr = `${nextYear}-${nextMonth}-01 00:00:00+00`;
              
              await prismaClient.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS ${partName} PARTITION OF tbl_user_activity_logs
                FOR VALUES FROM ('${fromStr}') TO ('${toStr}');
              `);
            }

            // Crear partición por defecto
            await prismaClient.$executeRawUnsafe(`
              CREATE TABLE IF NOT EXISTS tbl_user_activity_logs_default 
              PARTITION OF tbl_user_activity_logs DEFAULT;
            `);

            // Copiar datos
            await prismaClient.$executeRawUnsafe(`
              INSERT INTO tbl_user_activity_logs 
              SELECT id, user_id, action, details, ip_address, user_agent, created_at FROM tbl_user_activity_logs_old;
            `);

            // Crear índices
            await prismaClient.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS tbl_user_activity_logs_user_id_idx ON tbl_user_activity_logs (user_id);`);
            await prismaClient.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS tbl_user_activity_logs_created_at_idx ON tbl_user_activity_logs (created_at);`);
            
            // Eliminar tabla vieja
            await prismaClient.$executeRawUnsafe(`DROP TABLE tbl_user_activity_logs_old;`);
            console.log(`✅ tbl_user_activity_logs partitioned successfully.`);
          } else {
            console.log(`ℹ️ tbl_user_activity_logs is already partitioned.`);
          }

          // 2. Verificar si tbl_usage_logs ya está particionada
          const isUsagePartitioned = await prismaClient.$queryRawUnsafe(`
            SELECT 1 FROM pg_partitioned_table 
            WHERE partrelid = 'tbl_usage_logs'::regclass;
          `).catch(() => []);

          if (isUsagePartitioned.length === 0) {
            console.log(`📦 Converting tbl_usage_logs to partitioned table...`);
            
            // Renombrar vieja tabla si existe
            await prismaClient.$executeRawUnsafe(`DROP TABLE IF EXISTS tbl_usage_logs_old;`);
            await prismaClient.$executeRawUnsafe(`ALTER TABLE tbl_usage_logs RENAME TO tbl_usage_logs_old;`);
            
            // Crear tabla particionada
            await prismaClient.$executeRawUnsafe(`
              CREATE TABLE tbl_usage_logs (
                id VARCHAR(36) NOT NULL,
                company_id VARCHAR(36) NOT NULL,
                feature VARCHAR(255) NOT NULL,
                metric INTEGER DEFAULT 1 NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                PRIMARY KEY (id, created_at)
              ) PARTITION BY RANGE (created_at);
            `);

            // Crear particiones mensuales dinámicas
            const now = new Date();
            for (let i = -1; i <= 2; i++) {
              const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const nextD = new Date(year, d.getMonth() + 1, 1);
              const nextYear = nextD.getFullYear();
              const nextMonth = String(nextD.getMonth() + 1).padStart(2, '0');
              
              const partName = `tbl_usage_logs_y${year}m${month}`;
              const fromStr = `${year}-${month}-01 00:00:00+00`;
              const toStr = `${nextYear}-${nextMonth}-01 00:00:00+00`;
              
              await prismaClient.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS ${partName} PARTITION OF tbl_usage_logs
                FOR VALUES FROM ('${fromStr}') TO ('${toStr}');
              `);
            }

            // Crear partición por defecto
            await prismaClient.$executeRawUnsafe(`
              CREATE TABLE IF NOT EXISTS tbl_usage_logs_default 
              PARTITION OF tbl_usage_logs DEFAULT;
            `);

            // Copiar datos
            await prismaClient.$executeRawUnsafe(`
              INSERT INTO tbl_usage_logs 
              SELECT id, company_id, feature, metric, created_at FROM tbl_usage_logs_old;
            `);

            // Crear índices
            await prismaClient.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS tbl_usage_logs_company_id_idx ON tbl_usage_logs (company_id);`);
            await prismaClient.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS tbl_usage_logs_created_at_idx ON tbl_usage_logs (created_at);`);
            
            // Eliminar tabla vieja
            await prismaClient.$executeRawUnsafe(`DROP TABLE tbl_usage_logs_old;`);
            console.log(`✅ tbl_usage_logs partitioned successfully.`);
          } else {
            console.log(`ℹ️ tbl_usage_logs is already partitioned.`);
          }

          await prismaClient.$disconnect();
        } catch (partitionErr) {
          console.error(`❌ Failed to apply partitioning to [analytics] database:`, partitionErr.message);
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

