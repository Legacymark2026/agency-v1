import os
import re

def replace_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace text-[8px], text-[9px], text-[10px], text-[11px] with text-xs
    # Using regex that matches exactly these occurrences
    new_content = re.sub(r'text-\[(8|9|10|11)px\]', 'text-xs', content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed: {file_path}")

def walk_and_fix(root_dir):
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.next' in dirs:
            dirs.remove('.next')
        for file in files:
            if file.endswith('.tsx') or file.endswith('.jsx') or file.endswith('.ts'):
                replace_in_file(os.path.join(root, file))

if __name__ == "__main__":
    walk_and_fix('.')
