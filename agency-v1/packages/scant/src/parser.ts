import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

export interface ParsedRoute {
  method: string;
  path: string;
  schemaVarName?: string;
  description?: string;
}

export interface ParsedSchemaField {
  type: string;
  required: boolean;
  format?: string;
}

export interface ParsedSchema {
  name: string;
  fields: Record<string, ParsedSchemaField>;
}

export interface ServiceSpecMetadata {
  title: string;
  version: string;
  routes: ParsedRoute[];
  schemas: Record<string, ParsedSchema>;
}

export class CodeParser {
  private programFiles: string[] = [];
  private visitedFiles = new Set<string>();

  constructor(private serviceDir: string) {
    this.discoverFiles(path.join(serviceDir, "src"));
  }

  private discoverFiles(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.discoverFiles(fullPath);
      } else if (/\.(ts|js)$/.test(entry.name)) {
        this.programFiles.push(fullPath);
      }
    }
  }

  public parseService(): ServiceSpecMetadata {
    const routes: ParsedRoute[] = [];
    const schemas: Record<string, ParsedSchema> = {};
    this.visitedFiles.clear();

    const serviceName = path.basename(this.serviceDir);

    // Seed visitedFiles with main program files
    for (const file of this.programFiles) {
      this.visitedFiles.add(file);
    }

    for (const file of this.programFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

      this.analyzeNode(sourceFile, sourceFile, routes, schemas);
    }

    return {
      title: `${serviceName.charAt(0).toUpperCase()}${serviceName.slice(1)} API`,
      version: "1.0.0",
      routes,
      schemas,
    };
  }

  private analyzeNode(
    sourceFile: ts.SourceFile,
    node: ts.Node,
    routes: ParsedRoute[],
    schemas: Record<string, ParsedSchema>
  ) {
    // 0. Detect Import Declarations to follow Zod schemas imported from other files
    if (ts.isImportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const specifier = node.moduleSpecifier.text;
        if (specifier.startsWith(".")) {
          const baseDir = path.dirname(sourceFile.fileName);
          const resolvedPath = path.resolve(baseDir, specifier);
          const candidates = [
            resolvedPath + ".ts",
            resolvedPath + ".js",
            path.join(resolvedPath, "index.ts"),
            path.join(resolvedPath, "index.js"),
          ];

          for (const candidate of candidates) {
            if (fs.existsSync(candidate) && !this.visitedFiles.has(candidate)) {
              this.visitedFiles.add(candidate);
              try {
                const importContent = fs.readFileSync(candidate, "utf-8");
                const importSourceFile = ts.createSourceFile(candidate, importContent, ts.ScriptTarget.Latest, true);
                this.analyzeNode(importSourceFile, importSourceFile, routes, schemas);
              } catch (err) {
                // ignore read errors
              }
              break;
            }
          }
        }
      }
    }

    // 1. Detect Router/App HTTP Method Calls
    // e.g. router.get("/path", ...), app.post("/path", ...)
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isPropertyAccessExpression(expr)) {
        const methodName = expr.name.text.toLowerCase();
        const validMethods = ["get", "post", "put", "delete", "patch"];

        if (validMethods.includes(methodName) && node.arguments.length >= 2) {
          const pathArg = node.arguments[0];
          if (ts.isStringLiteral(pathArg)) {
            const routePath = pathArg.text;
            let schemaVarName: string | undefined;

            // Search arguments for request validation schemas (like validateRequest(schema))
            for (let i = 1; i < node.arguments.length; i++) {
              const arg = node.arguments[i];
              if (ts.isCallExpression(arg)) {
                const argExpr = arg.expression;
                if (ts.isIdentifier(argExpr) && argExpr.text === "validateRequest" && arg.arguments.length > 0) {
                  const schemaArg = arg.arguments[0];
                  if (ts.isIdentifier(schemaArg)) {
                    schemaVarName = schemaArg.text;
                  }
                }
              }
            }

            // Extract JSDoc description if available
            let description = "";
            const leadComments = ts.getLeadingCommentRanges(sourceFile.text, node.pos);
            if (leadComments && leadComments.length > 0) {
              const lastComment = leadComments[leadComments.length - 1];
              description = sourceFile.text
                .slice(lastComment.pos, lastComment.end)
                .replace(/\/\*\*|\*\/|\*/g, "")
                .trim();
            }

            routes.push({
              method: methodName,
              path: routePath,
              schemaVarName,
              description: description || undefined,
            });
          }
        }
      }
    }

    // 2. Detect Zod Schemas
    // e.g. const schema = z.object({ ... })
    if (ts.isVariableDeclaration(node)) {
      if (node.name && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer)) {
        const init = node.initializer;
        const schemaName = node.name.text;

        // Check if expression is z.object(...)
        if (this.isZodObjectCall(init)) {
          const schemaFields = this.parseZodObjectFields(init);
          schemas[schemaName] = {
            name: schemaName,
            fields: schemaFields,
          };
        }
      }
    }

    ts.forEachChild(node, (child) => this.analyzeNode(sourceFile, child, routes, schemas));
  }

  private isZodObjectCall(node: ts.CallExpression): boolean {
    const expr = node.expression;
    // Direct call: z.object(...)
    if (ts.isPropertyAccessExpression(expr)) {
      if (ts.isIdentifier(expr.expression) && expr.expression.text === "z" && expr.name.text === "object") {
        return true;
      }
    }
    // Chained call: z.object(...).optional() or similar
    if (ts.isCallExpression(expr)) {
      return this.isZodObjectCall(expr);
    }
    return false;
  }

  private parseZodObjectFields(node: ts.CallExpression): Record<string, ParsedSchemaField> {
    const fields: Record<string, ParsedSchemaField> = {};

    // Retrieve the ObjectLiteralExpression inside z.object({...})
    let objLiteral: ts.ObjectLiteralExpression | undefined;

    const findObjectLiteral = (callNode: ts.CallExpression) => {
      const expr = callNode.expression;
      if (ts.isPropertyAccessExpression(expr) && expr.name.text === "object" && callNode.arguments.length > 0) {
        const arg = callNode.arguments[0];
        if (ts.isObjectLiteralExpression(arg)) {
          objLiteral = arg;
        }
      } else if (ts.isPropertyAccessExpression(expr) && ts.isCallExpression(expr.expression)) {
        findObjectLiteral(expr.expression);
      }
    };

    findObjectLiteral(node);

    if (objLiteral) {
      for (const prop of objLiteral.properties) {
        if (ts.isPropertyAssignment(prop) && prop.name && (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name))) {
          const fieldName = prop.name.text;
          
          // Unwrap body: z.object({...}) nested schema declarations
          if (fieldName === "body" && ts.isCallExpression(prop.initializer) && this.isZodObjectCall(prop.initializer)) {
            return this.parseZodObjectFields(prop.initializer);
          }

          const initializerText = prop.initializer.getText();
          let type = "string";
          let required = true;
          let format: string | undefined;

          // Parse primitive types
          if (initializerText.includes("z.number")) {
            type = "number";
          } else if (initializerText.includes("z.boolean")) {
            type = "boolean";
          }

          // Parse optional modifier
          if (/\.optional\s*\(/.test(initializerText)) {
            required = false;
          }

          // Parse formats
          if (/\.email\s*\(/.test(initializerText)) {
            format = "email";
          } else if (/\.datetime\s*\(/.test(initializerText)) {
            format = "date-time";
          }

          fields[fieldName] = {
            type,
            required,
            format,
          };
        }
      }
    }

    return fields;
  }
}
