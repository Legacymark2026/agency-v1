const fs = require('fs');
const path = 'apps/web/app/(dashboard)/layout.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add import
const importStatement = "import { GlobalCommandPalette } from '@/components/GlobalCommandPalette';\n";
content = content.replace("import { CognitiveAgentChat }", importStatement + "import { CognitiveAgentChat }");

// Inject component before CognitiveAgentChat
content = content.replace("{/* Agente de IA Flotante Nivel C-Level */}", "<GlobalCommandPalette />\n\n                {/* Agente de IA Flotante Nivel C-Level */}");

fs.writeFileSync(path, content, 'utf8');
console.log("Injected Global Command Palette");
