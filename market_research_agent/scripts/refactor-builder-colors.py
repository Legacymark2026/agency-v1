import re
import os

files_to_process = [
    r"c:\Users\hboho\.gemini\antigravity\scratch\legacymark\components\automation\CustomNodes.tsx",
    r"c:\Users\hboho\.gemini\antigravity\scratch\legacymark\components\automation\Sidebar.tsx"
]

color_map = {
    "bg-white": "bg-slate-900",
    "text-gray-800": "text-white text-shadow-sm",
    "text-gray-700": "text-slate-200",
    "text-gray-600": "text-slate-400",
    "bg-gray-50": "bg-slate-800/80",
    "bg-gray-100": "bg-slate-800",
    "border-gray-200": "border-slate-700",
    "border-gray-300": "border-slate-600",
    "border-gray-100": "border-slate-700/50",
    "hover:border-gray-300": "hover:border-slate-500",
}

def convert_colors(content):
    # General gray/white text and backgrounds
    for k, v in color_map.items():
        content = content.replace(k, v)

    # Convert generic color-50 to color-900/40
    # e.g bg-amber-50 -> bg-amber-950/40
    content = re.sub(r'bg-([a-z]+)-50\b|bg-([a-z]+)-50/50\b', r'bg-\1-950/40', content)
    # the second group matches the /50 case, so we need a function to handle both groups
    def repl_bg(m):
        color = m.group(1) or m.group(2)
        if color == 'slate' or color == 'gray':
            return f'bg-slate-800'
        return f'bg-{color}-900/40'
    content = re.sub(r'bg-([a-z]+)-50\b|bg-([a-z]+)-50/50\b', repl_bg, content)

    # Convert borders: border-color-100 -> border-color-800
    def repl_border(m):
        color = m.group(1)
        if color == 'slate' or color == 'gray': return 'border-slate-700'
        return f'border-{color}-700/50'
    content = re.sub(r'border-([a-z]+)-100\b', repl_border, content)
    
    # border-color-200 -> border-color-800
    def repl_border2(m):
        color = m.group(1)
        if color == 'slate' or color == 'gray': return 'border-slate-600'
        return f'border-{color}-700/80'
    content = re.sub(r'border-([a-z]+)-200\b', repl_border2, content)

    # border-color-300 -> border-color-700
    def repl_border3(m):
        color = m.group(1)
        if color == 'slate' or color == 'gray': return 'border-slate-500'
        return f'border-{color}-600/80'
    content = re.sub(r'border-([a-z]+)-300\b', repl_border3, content)

    # text-color-600 -> text-color-400
    def repl_text(m):
        color = m.group(1)
        if color == 'slate' or color == 'gray': return 'text-slate-300'
        return f'text-{color}-400'
    content = re.sub(r'text-([a-z]+)-600\b', repl_text, content)
    
    # text-color-700 -> text-color-300
    def repl_text2(m):
        color = m.group(1)
        if color == 'slate' or color == 'gray': return 'text-slate-200'
        return f'text-{color}-300'
    content = re.sub(r'text-([a-z]+)-700\b', repl_text2, content)

    # text-color-900 -> text-color-100
    def repl_text3(m):
        color = m.group(1)
        if color == 'slate' or color == 'gray': return 'text-white'
        return f'text-{color}-50'
    content = re.sub(r'text-([a-z]+)-900\b', repl_text3, content)

    # Special dark-mode replacements for CustomNodes.tsx structure
    content = content.replace('bg-white rounded-b-lg', 'bg-slate-900/95 backdrop-blur-sm rounded-b-lg border-t border-slate-700/50 text-slate-300 shadow-inner')
    content = content.replace('shadow-md', 'shadow-lg shadow-black/40 border-slate-700')
    content = content.replace('border-2 border-white', 'border-2 border-slate-900')
    
    return content

for file_path in files_to_process:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = convert_colors(content)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Processed: {file_path}")
    else:
        print(f"File not found: {file_path}")
