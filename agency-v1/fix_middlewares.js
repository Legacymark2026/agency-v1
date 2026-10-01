const fs = require("fs");
const path = require("path");
const servicesDir = path.join(__dirname, "services");
const services = fs.readdirSync(servicesDir).filter(f => fs.statSync(path.join(servicesDir, f)).isDirectory());

for (const svc of services) {
  const indexFile = path.join(servicesDir, svc, "src", "index.ts");
  if (!fs.existsSync(indexFile)) continue;
  
  let content = fs.readFileSync(indexFile, "utf8");
  
  if (content.includes("@agency/service-auth")) {
    if (!content.includes("tenantContextMiddleware")) {
      content = content.replace(/import\s+\{([^}]*)\}\s+from\s+["']@agency\/service-auth["'];/g, (match, imports) => {
        const cleanImports = imports.split(",").map(i => i.trim()).filter(Boolean);
        if (!cleanImports.includes("tenantContextMiddleware")) cleanImports.push("tenantContextMiddleware");
        if (!cleanImports.includes("globalErrorHandler")) cleanImports.push("globalErrorHandler");
        return "import { " + cleanImports.join(", ") + " } from \"@agency/service-auth\";";
      });
    }
  } else {
    content = "import { tenantContextMiddleware, globalErrorHandler } from \"@agency/service-auth\";\n" + content;
  }
  
  if (!content.includes("app.use(tenantContextMiddleware);")) {
    if (content.includes("app.use(express.json());")) {
      content = content.replace("app.use(express.json());", "app.use(express.json());\napp.use(tenantContextMiddleware);");
    } else if (content.includes("app.use(cors());")) {
      content = content.replace("app.use(cors());", "app.use(cors());\napp.use(tenantContextMiddleware);");
    }
  }
  
  if (!content.includes("app.use(globalErrorHandler);")) {
    if (content.includes("const server = app.listen(")) {
      content = content.replace("const server = app.listen(", "app.use(globalErrorHandler);\nconst server = app.listen(");
    } else if (content.includes("app.listen(")) {
      content = content.replace("app.listen(", "app.use(globalErrorHandler);\napp.listen(");
    } else if (content.includes("export default app;")) {
      content = content.replace("export default app;", "app.use(globalErrorHandler);\nexport default app;");
    }
  }
  
  fs.writeFileSync(indexFile, content);
  console.log("Updated " + svc);
}
