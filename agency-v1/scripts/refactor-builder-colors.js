const fs = require('fs');
const path = require('path');

const filesToProcess = [
    "c:\\Users\\hboho\\.gemini\\antigravity\\scratch\\legacymark\\components\\automation\\NodeConfigPanel.tsx"
];

const colorMap = {
    "bg-white": "bg-slate-900",
    "text-gray-800": "text-white drop-shadow-sm",
    "text-gray-700": "text-slate-200",
    "text-gray-600": "text-slate-400",
    "text-gray-500": "text-slate-500",
    "bg-gray-50": "bg-slate-800/80",
    "bg-gray-100": "bg-slate-800",
    "bg-gray-900": "bg-slate-900",
    "bg-gray-950": "bg-slate-950",
    "border-gray-200": "border-slate-700",
    "border-gray-300": "border-slate-600",
    "border-gray-100": "border-slate-700/50",
    "border-gray-800": "border-slate-700",
    "hover:border-gray-300": "hover:border-slate-500",
};

function convertColors(content) {
    let newContent = content;

    for (const [k, v] of Object.entries(colorMap)) {
        newContent = newContent.split(k).join(v);
    }
    return newContent;
}

for (const filePath of filesToProcess) {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const newContent = convertColors(content);
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`Processed: ${filePath}`);
    } else {
        console.log(`File not found: ${filePath}`);
    }
}
