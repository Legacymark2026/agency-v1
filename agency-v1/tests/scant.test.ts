/**
 * Scant Parser & OpenAPI Spec Generator Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Run with: npx ts-node tests/scant.test.ts
 * 
 * Verifies:
 * 1. AST parsing of microservice routes
 * 2. AST parsing of Zod schemas inside route files
 * 3. OpenAPI 3.1.0 document compilation
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
  console.log("  LegacyMark — Scant API Analyzer Integration Tests");
  console.log("══════════════════════════════════════════════════════════════\n");

  const crmServicePath = path.resolve(__dirname, "../services/crm-service");

  // Run CodeParser on CRM Service
  const parser = new CodeParser(crmServicePath);
  const meta = parser.parseService();

  // Test 1: Route Discovery
  test("Scant should discover CRM Service routes", () => {
    assert(meta.routes.length > 0, "Should discover at least 1 route");
    const getLeadsRoute = meta.routes.find((r) => r.path === "/leads" && r.method === "get");
    const postLeadsRoute = meta.routes.find((r) => r.path === "/leads" && r.method === "post");
    
    assert(!!getLeadsRoute, "Should discover GET /leads route");
    assert(!!postLeadsRoute, "Should discover POST /leads route");
    assert(postLeadsRoute?.schemaVarName === "createLeadSchema", `Should identify createLeadSchema as request schema, got ${postLeadsRoute?.schemaVarName}`);
  });

  // Test 2: Schema Parsing
  test("Scant should parse Zod schema variables statically from AST", () => {
    const leadSchema = meta.schemas["createLeadSchema"];
    assert(!!leadSchema, "Should discover createLeadSchema variable");
    assert(leadSchema.fields["name"].type === "string", "name field should be parsed as string");
    assert(leadSchema.fields["name"].required === true, "name field should be required");
    assert(leadSchema.fields["email"].format === "email", "email field should have email format");
    assert(leadSchema.fields["companyId"].required === false, "companyId field should be optional");
  });

  // Test 3: OpenAPI Spec Generation
  test("Scant should compile valid OpenAPI 3.1.0 spec object", () => {
    const spec = buildOpenApiDocument(meta);
    assert(spec.openapi === "3.1.0", "Spec should be OpenAPI 3.1.0");
    assert(!!spec.paths["/leads"], "Spec should contain /leads path");
    assert(!!spec.paths["/leads/{id}"], "Spec should contain parameter-mapped path /leads/{id}");
    assert(!!spec.components.schemas["createLeadSchema"], "Spec components should contain createLeadSchema");
    
    console.log("     Generated OpenAPI Specs Title:", spec.info.title);
    console.log("     Endpoints Found:", Object.keys(spec.paths).join(", "));
  });

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("══════════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

run();
