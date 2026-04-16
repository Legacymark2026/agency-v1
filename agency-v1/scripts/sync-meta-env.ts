/**
 * scripts/sync-meta-env.ts
 *
 * Sincroniza las credenciales de Meta/WhatsApp configuradas en el Dashboard
 * de Integraciones (base de datos) hacia:
 *   1. Las Variables de Entorno de Vercel (via Vercel REST API)
 *   2. El archivo .env local (para desarrollo / VPS sin Vercel)
 *
 * USO:
 *   npm run sync-meta
 *
 * REQUISITOS (.env o variables del sistema):
 *   VERCEL_API_TOKEN   — Token de la API de Vercel (vercel.com/account/tokens)
 *   VERCEL_PROJECT_ID  — ID del proyecto en Vercel (Project Settings → General)
 *   VERCEL_TEAM_ID     — (Opcional) ID del equipo si usas un Team Plan
 *   DATABASE_URL       — URL de tu base de datos (ya debe estar configurada)
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// ─── Configuración  ───────────────────────────────────────────────────────────

const prisma = new PrismaClient();

const VERCEL_API_TOKEN  = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID    = process.env.VERCEL_TEAM_ID;   // Opcional

// Environments de Vercel a los que se aplicarán los cambios
const VERCEL_ENVS: Array<'production' | 'preview' | 'development'> = ['production', 'preview'];

// ─── Tipos  ───────────────────────────────────────────────────────────────────

interface EnvRecord {
  key: string;
  value: string;
  /** Describe de dónde viene el valor para el log */
  source: string;
}

interface VercelEnvVar {
  id: string;
  key: string;
  value: string;
  target: string[];
}

// ─── Vercel API helpers  ──────────────────────────────────────────────────────

function vercelEndpoint(path: string): string {
  const base = `https://api.vercel.com${path}`;
  return VERCEL_TEAM_ID
    ? `${base}${path.includes('?') ? '&' : '?'}teamId=${VERCEL_TEAM_ID}`
    : base;
}

async function vercelRequest(method: string, url: string, body?: object) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${VERCEL_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(`Vercel API ${method} ${url}: ${JSON.stringify(err)}`);
  }

  return res.status === 204 ? null : res.json();
}

async function listVercelEnvVars(): Promise<VercelEnvVar[]> {
  const data = await vercelRequest(
    'GET',
    vercelEndpoint(`/v9/projects/${VERCEL_PROJECT_ID}/env?decrypt=false`),
  );
  return (data.envs ?? data) as VercelEnvVar[];
}

async function upsertVercelEnvVar(key: string, value: string, existing: VercelEnvVar[]) {
  const found = existing.find(e => e.key === key);

  if (found) {
    await vercelRequest(
      'PATCH',
      vercelEndpoint(`/v9/projects/${VERCEL_PROJECT_ID}/env/${found.id}`),
      { value, target: VERCEL_ENVS },
    );
    console.log(`  🔄 Vercel PATCH: ${key}`);
  } else {
    await vercelRequest(
      'POST',
      vercelEndpoint(`/v9/projects/${VERCEL_PROJECT_ID}/env`),
      {
        key,
        value,
        type: 'encrypted',
        target: VERCEL_ENVS,
      },
    );
    console.log(`  ➕ Vercel POST: ${key}`);
  }
}

// ─── .env local helper  ───────────────────────────────────────────────────────

function syncLocalEnv(records: EnvRecord[]) {
  const envPath = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    console.log('\n⚠️  Archivo .env local no encontrado — saltando sincronización local.');
    return;
  }

  // Backup
  const backupPath = `${envPath}.backup`;
  fs.copyFileSync(envPath, backupPath);
  console.log(`  📦 Backup creado en: ${backupPath}`);

  let lines = fs.readFileSync(envPath, 'utf8').split('\n');

  for (const { key, value } of records) {
    const newLine = `${key}="${value.trim()}"`;
    const idx = lines.findIndex(l => l.startsWith(`${key}=`));
    if (idx !== -1) {
      lines[idx] = newLine;
      console.log(`  🔄 .env actualizado: ${key}`);
    } else {
      lines.push(newLine);
      console.log(`  ➕ .env agregado: ${key}`);
    }
  }

  fs.writeFileSync(envPath, lines.join('\n'));
}

// ─── Main  ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀  Sincronización: Integraciones DB → Variables de Entorno');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Leer configs de la DB
  const configs = await prisma.integrationConfig.findMany({
    where: { provider: { in: ['facebook', 'whatsapp', 'instagram'] }, isEnabled: true },
  }).finally(() => prisma.$disconnect());

  const fb = configs.find(c => c.provider === 'facebook')?.config   as any;
  const wa = configs.find(c => c.provider === 'whatsapp')?.config   as any;
  const ig = configs.find(c => c.provider === 'instagram')?.config  as any;

  // 2. Construir mapa de variables
  const records: EnvRecord[] = [
    // Meta / Facebook
    fb?.appId      && { key: 'META_APP_ID',              value: fb.appId,      source: 'DB:facebook.appId' },
    fb?.appSecret  && { key: 'META_APP_SECRET',          value: fb.appSecret,  source: 'DB:facebook.appSecret' },
    fb?.verifyToken && { key: 'META_WEBHOOK_VERIFY_TOKEN', value: fb.verifyToken, source: 'DB:facebook.verifyToken' },
    fb?.accessToken && { key: 'META_ACCESS_TOKEN',       value: fb.accessToken, source: 'DB:facebook.accessToken' },
    // Instagram (can share Meta configs)
    ig?.appId      && { key: 'META_APP_ID',              value: ig.appId,      source: 'DB:instagram.appId' },
    ig?.appSecret  && { key: 'META_APP_SECRET',          value: ig.appSecret,  source: 'DB:instagram.appSecret' },
    // WhatsApp
    wa?.phoneNumberId && { key: 'WHATSAPP_PHONE_NUMBER_ID', value: wa.phoneNumberId, source: 'DB:whatsapp.phoneNumberId' },
    wa?.accessToken   && { key: 'WHATSAPP_API_TOKEN',        value: wa.accessToken,   source: 'DB:whatsapp.accessToken' },
    wa?.businessAccountId && { key: 'WHATSAPP_BUSINESS_ACCOUNT_ID', value: wa.businessAccountId, source: 'DB:whatsapp.businessAccountId' },
  ].filter(Boolean) as EnvRecord[];

  // Eliminar duplicados (primera ocurrencia gana)
  const seen = new Set<string>();
  const uniqueRecords = records.filter(r => {
    if (seen.has(r.key)) return false;
    seen.add(r.key);
    return true;
  });

  if (uniqueRecords.length === 0) {
    console.log('⚠️  No se encontraron credenciales en la base de datos.');
    console.log('    Asegúrate de haber guardado las integraciones en el Dashboard primero.\n');
    return;
  }

  console.log(`✅  ${uniqueRecords.length} variable(s) encontrada(s) en la base de datos:`);
  uniqueRecords.forEach(r => console.log(`    • ${r.key}  [${r.source}]`));

  // 3. Sincronizar con Vercel
  console.log('\n─── Vercel Environment Variables ───────────────────────────\n');

  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    console.log('⚠️  VERCEL_API_TOKEN / VERCEL_PROJECT_ID no configurados.');
    console.log('    Saltando sincronización con Vercel.\n');
    console.log('    Para activarla, agrega estas variables a tu .env:');
    console.log('      VERCEL_API_TOKEN=<desde vercel.com/account/tokens>');
    console.log('      VERCEL_PROJECT_ID=<desde Project Settings en Vercel>');
    console.log('      VERCEL_TEAM_ID=<opcional, si usas un Team Plan>\n');
  } else {
    try {
      console.log(`  📡 Conectando al proyecto Vercel (ID: ${VERCEL_PROJECT_ID})...`);
      const existing = await listVercelEnvVars();
      console.log(`  📋 Variables actuales en Vercel: ${existing.length}`);

      for (const record of uniqueRecords) {
        await upsertVercelEnvVar(record.key, record.value, existing);
      }

      console.log('\n  ✨ Variables Vercel actualizadas correctamente.');
      console.log('  ⚡ Haz un nuevo deploy en Vercel para que los cambios surtan efecto:');
      console.log('     vercel --prod\n');
    } catch (err: any) {
      console.error('  ❌ Error al sincronizar con Vercel:', err.message);
    }
  }

  // 4. Sincronizar con .env local
  console.log('─── Archivo .env local (VPS / Desarrollo) ──────────────────\n');
  syncLocalEnv(uniqueRecords);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅  Sincronización completada.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
