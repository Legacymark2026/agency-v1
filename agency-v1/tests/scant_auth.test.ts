/**
 * Scant Auth Service API Parser Tests (Verifies Import-Following AST Parsing)
 * ─────────────────────────────────────────────────────────────────────────────
 * Run with: npx ts-node tests/scant_auth.test.ts
 * 
 * Verifies:
 * 1. AST parsing of routes defined inside functions/factories
 * 2. Recursive following of relative imports to parse schemas defined in separate files
 * 3. Successful OpenAPI 3.1.0 compilation of the auth API contract
 */

import "dotenv/config";
import * as path from "path";
import { CodeParser, buildOpenApiDocument } from "../packages/scant/src/index";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          console.log(`  ✅ ${name}`);
          passed++;
        })
        .catch((err) => {
          console.error(`  ❌ ${name}: ${err instanceof Error ? err.message : err}`);
          failed++;
        });
    } else {
      console.log(`  ✅ ${name}`);
      passed++;
    }
  } catch (err) {
    console.error(`  ❌ ${name}: ${err instanceof Error ? err.message : err}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

async function run() {
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  LegacyMark — Scant Auth Service Import Scanning Tests");
  console.log("══════════════════════════════════════════════════════════════\n");

  const authServicePath = path.resolve(__dirname, "../services/auth-service");

  // Run CodeParser on Auth Service
  const parser = new CodeParser(authServicePath);
  const meta = parser.parseService();

  // Test 1: Route Discovery in Factory Function
  test("Scant should discover Auth Service routes inside factory function", () => {
    assert(meta.routes.length > 0, "Should discover at least 1 route");
    const loginRoute = meta.routes.find((r) => r.path === "/login" && r.method === "post");
    const sessionsRoute = meta.routes.find((r) => r.path === "/sessions" && r.method === "get");
    
    assert(!!loginRoute, "Should discover POST /login route");
    assert(!!sessionsRoute, "Should discover GET /sessions route");
    assert(loginRoute?.schemaVarName === "loginSchema", `Should identify loginSchema as request schema, got ${loginRoute?.schemaVarName}`);
  });

  // Test 2: Schema Discovery via Import Following
  test("Scant should recursively follow imports and parse Zod schemas from separate validator files", () => {
    const loginSchema = meta.schemas["loginSchema"];
    const enable2FASchema = meta.schemas["enable2FASchema"];
    
    assert(!!loginSchema, "Should discover loginSchema by scanning imported auth.validators.ts file");
    assert(!!enable2FASchema, "Should discover enable2FASchema");
    
    assert(loginSchema.fields["email"].format === "email", "email field should have email format");
    assert(loginSchema.fields["password"].type === "string", "password field should be parsed as string");
    assert(enable2FASchema.fields["secret"].type === "string", "secret field should be parsed as string");
  });

  // Test 3: OpenAPI Spec Compilation
  test("Scant should compile valid OpenAPI document for Auth Service", () => {
    const spec = buildOpenApiDocument(meta);
    assert(spec.openapi === "3.1.0", "Spec should be OpenAPI 3.1.0");
    assert(!!spec.paths["/login"], "Spec paths should contain /login");
    assert(!!spec.components.schemas["loginSchema"], "Spec components should contain loginSchema");
    
    console.log("     Generated Auth Specs Title:", spec.info.title);
    console.log("     Endpoints Found:", Object.keys(spec.paths).join(", "));
  });

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("══════════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

run();
