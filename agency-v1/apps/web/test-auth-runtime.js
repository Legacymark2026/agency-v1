// test-auth-runtime.js — Runtime Auth-DB Connection Diagnostics
const path = require("path");

console.log("=== INICIANDO TEST DE CONEXION DE AUTENTICACION ===");
console.log("Directorio actual:", process.cwd());

// En Next.js standalone, los archivos de shared/lib/prisma se compilan a JS
// Buscamos la ruta correcta dentro de .next/standalone
let prismaModule;
try {
  prismaModule = require("./shared/lib/prisma");
  console.log("Módulo prisma cargado desde ./shared/lib/prisma");
} catch (e) {
  try {
    prismaModule = require("../../shared/lib/prisma");
    console.log("Módulo prisma cargado desde ../../shared/lib/prisma");
  } catch (err2) {
    try {
      prismaModule = require("/app/apps/web/shared/lib/prisma");
      console.log("Módulo prisma cargado desde ruta absoluta");
    } catch (err3) {
      console.error("No se pudo cargar el módulo prisma:", err3.message);
      process.exit(1);
    }
  }
}

const { prisma, getPrismaAuth, getPrismaAuthRead } = prismaModule;

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

async function runTests() {
  // Test 1: getPrismaAuth (Escritura / Primario)
  try {
    console.log("\n1. Test: Conexión a getPrismaAuth() [Primario/Escritura]...");
    const client = getPrismaAuth();
    const user = await client.user.findFirst();
    console.log("   ✅ Exito! Encontrado usuario:", user?.email);
  } catch (err) {
    console.error("   ❌ Fallo:", err.message);
  }

  // Test 2: getPrismaAuthRead (Lectura / Réplica)
  try {
    console.log("\n2. Test: Conexión a getPrismaAuthRead() [Réplica/Lectura]...");
    const clientRead = getPrismaAuthRead();
    const userRead = await clientRead.user.findFirst();
    console.log("   ✅ Exito! Encontrado usuario:", userRead?.email);
  } catch (err) {
    console.error("   ❌ Fallo:", err.message);
  }

  // Test 3: Proxy principal 'prisma' con consulta de lectura (findUnique)
  try {
    console.log("\n3. Test: Consulta de lectura (findUnique) a través de Proxy 'prisma'...");
    const userProxy = await prisma.user.findUnique({
      where: { email: "security-test@legacymark.com" }
    });
    console.log("   ✅ Exito! Encontrado usuario:", userProxy?.email);
  } catch (err) {
    console.error("   ❌ Fallo:", err.message);
  }
  
  process.exit(0);
}

runTests();
