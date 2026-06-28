// test-auth-runtime.js — Autonomous Runtime Auth-DB Connection Diagnostics
const { PrismaClient } = require("@prisma/client");

console.log("=== INICIANDO TEST DE CONEXION DE AUTENTICACION COMPLETO ===");
console.log("Directorio actual:", process.cwd());

console.log("\n--- VARIABLES DE ENTORNO EN RUNTIME ---");
console.log("process.env.DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
console.log("process.env.AUTH_DATABASE_URL:", process.env.AUTH_DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
console.log("process.env.AUTH_DATABASE_READ_URL:", process.env.AUTH_DATABASE_READ_URL?.replace(/:[^:@]+@/, ":****@"));
console.log("globalThis.__DB_ENV__:", globalThis.__DB_ENV__ ? "Poblado" : "Vacio");
if (globalThis.__DB_ENV__) {
  console.log("   __DB_ENV__.DATABASE_URL:", globalThis.__DB_ENV__.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
  console.log("   __DB_ENV__.AUTH_DATABASE_URL:", globalThis.__DB_ENV__.AUTH_DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
  console.log("   __DB_ENV__.AUTH_DATABASE_READ_URL:", globalThis.__DB_ENV__.AUTH_DATABASE_READ_URL?.replace(/:[^:@]+@/, ":****@"));
}

const getRuntimeEnv = (key) => {
  const dbEnv = globalThis.__DB_ENV__;
  if (dbEnv && key in dbEnv) {
    return dbEnv[key];
  }
  if (typeof process !== "undefined" && process.env) {
    const envObj = process.env;
    return envObj[key];
  }
  return undefined;
};

// Emulated createClient function from shared/lib/prisma
const createClient = (url) => {
  let connectionUrl = url;
  if (connectionUrl && !connectionUrl.includes("connection_limit")) {
    const separator = connectionUrl.includes("?") ? "&" : "?";
    connectionUrl = `${connectionUrl}${separator}connection_limit=5&pool_timeout=20`;
  }
  return new PrismaClient({
    datasourceUrl: connectionUrl
  });
};

async function runTests() {
  // Test 1: getPrismaAuth equivalent (Escritura / Primario)
  const authUrl = getRuntimeEnv("AUTH_DATABASE_URL") || getRuntimeEnv("DATABASE_URL");
  console.log(`\n1. Conectando a AUTH_DATABASE_URL [Primario/Escritura]: ${authUrl?.replace(/:[^:@]+@/, ":****@")}`);
  try {
    const client = createClient(authUrl);
    const user = await client.user.findFirst();
    console.log("   ✅ Exito! Encontrado usuario:", user?.email);
    await client.$disconnect();
  } catch (err) {
    console.error("   ❌ Fallo:", err.message);
  }

  // Test 2: getPrismaAuthRead equivalent (Lectura / Réplica)
  const authReadUrl = getRuntimeEnv("AUTH_DATABASE_READ_URL") || getRuntimeEnv("DATABASE_READ_URL") || authUrl;
  console.log(`\n2. Conectando a AUTH_DATABASE_READ_URL [Réplica/Lectura]: ${authReadUrl?.replace(/:[^:@]+@/, ":****@")}`);
  try {
    const clientRead = createClient(authReadUrl);
    const userRead = await clientRead.user.findFirst();
    console.log("   ✅ Exito! Encontrado usuario:", userRead?.email);
    await clientRead.$disconnect();
  } catch (err) {
    console.error("   ❌ Fallo:", err.message);
  }
  
  process.exit(0);
}

runTests();
