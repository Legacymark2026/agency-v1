import os
import re

def scan_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex searches
    # 1. Hooks inside if
    # if (...) { ... useSomething( ... }
    # Let's search for hooks inside conditional blocks or loops
    
    # We can also check if a hook is called after an early return
    # Let's parse line by line
    lines = content.split('\n')
    in_function = False
    returned = False
    function_indent = 0
    
    # Find all occurrences of "return" followed by a hook call in the same block
    # A simple way is to search for lines matching:
    # return ...
    # and then lines matching:
    # const ... = use...
    # in the same function scope.
    
    # Let's search for "use" hook calls:
    hook_call_pat = re.compile(r'\b(use[A-Z]\w*)\s*\(')
    if_pat = re.compile(r'\bif\s*\(')
    for_pat = re.compile(r'\bfor\s*\(')
    while_pat = re.compile(r'\bwhile\s*\(')
    
    violations = []
    
    # Let's do a regex search for hooks inside if, for, while blocks
    # e.g., if (cond) { ... useSomething() ... }
    # Or hooks inside callbacks/nested functions:
    # function name(...) { ... function nested(...) { ... useSomething() ... } ... }
    
    # Let's write a simple scanner that checks if a hook is called after a top-level return within a function
    # We can track brackets to find function scopes
    stack = []
    current_func = None
    func_returned = False
    
    for line_idx, line in enumerate(lines, 1):
        # Strip comments
        line_clean = re.sub(r'//.*', '', line)
        line_clean = re.sub(r'/\*.*?\*/', '', line_clean)
        
        # Check if line contains a hook call
        hook_match = hook_call_pat.search(line_clean)
        
        # Simple heuristic: if we see "return " and then a hook call later in the file, and they are in the same file, let's inspect.
        # Let's just print hook calls that appear after a return statement in the file, but filter out obvious false positives
        # Or better: let's scan for hook calls that have "return" earlier in the component.
        pass

    # Let's search for some patterns:
    # Pattern A: `if (.*) return` followed by `use...(`
    # Let's search for a return statement followed by a hook call within the next 30 lines, without a closing brace that resets it.
    
    for i in range(len(lines)):
        line = lines[i].strip()
        if line.startswith('//') or line.startswith('*'):
            continue
        # Early return pattern:
        if ('return' in line) and ('if' in line or '&&' in line or '?' in line or '!' in line or line.startswith('return')):
            # Look ahead for hook calls
            for j in range(i+1, min(i+50, len(lines))):
                next_line = lines[j].strip()
                if next_line.startswith('//') or next_line.startswith('*'):
                    continue
                # If we hit a closing brace at the same indentation, it might mean the end of the function, but it's a heuristic
                if next_line == '}':
                    # If it's a single closing brace, the function might have ended
                    break
                hook_match = hook_call_pat.search(next_line)
                if hook_match:
                    violations.append({
                        'type': 'Hook after return',
                        'return_line': i + 1,
                        'return_content': line,
                        'hook_line': j + 1,
                        'hook_content': next_line,
                        'hook': hook_match.group(1)
                    })
                    break
                    
        # Hook inside if block:
        if 'if (' in line or 'if(' in line:
            # check if there is a hook call in the same line or next few lines inside the if block
            # (only if it's on the same line or next few lines before closing brace)
            for j in range(i, min(i+5, len(lines))):
                next_line = lines[j].strip()
                if 'use' in next_line:
                    hook_match = hook_call_pat.search(next_line)
                    if hook_match:
                        # check if it's inside the if condition or block
                        violations.append({
                            'type': 'Hook in if block',
                            'line': j + 1,
                            'content': next_line,
                            'hook': hook_match.group(1)
                        })
                        
    return violations

def main():
    root_dir = r"c:\Users\hboho\.gemini\antigravity\scratch\agency-v1\apps\web"
    all_violations = {}
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in root or '.next' in root or 'dist' in root:
            continue
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                viols = scan_file(path)
                if viols:
                    all_violations[path] = viols
                    
    for path, viols in all_violations.items():
        print(f"\nFile: {path}")
        for v in viols:
            if v['type'] == 'Hook after return':
                print(f"  [POTENTIAL VIOLATION] Hook {v['hook']} at line {v['hook_line']} is called after a return at line {v['return_line']}")
                print(f"    Line {v['return_line']}: {v['return_content']}")
                print(f"    Line {v['hook_line']}: {v['hook_content']}")
            else:
                print(f"  [POTENTIAL VIOLATION] Hook {v['hook']} at line {v['line']} is inside or near an if statement")
                print(f"    Line {v['line']}: {v['content']}")

if __name__ == '__main__':
    main()
