with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Check all useCallback functions for balance
import re

# Find all useCallback functions
pattern = r'const (\w+) = useCallback\('
matches = list(re.finditer(pattern, content))

for match in matches:
    func_name = match.group(1)
    start = match.start()
    
    brace_count = 0
    paren_count = 0
    in_string = False
    string_char = ''
    i = start
    
    while i < len(content):
        c = content[i]
        if not in_string:
            if c == '(':
                paren_count += 1
            elif c == ')':
                paren_count -= 1
            elif c == '{':
                brace_count += 1
            elif c == '}':
                brace_count -= 1
            elif c in "\"'`":
                in_string = True
                string_char = c
        else:
            if c == string_char and i > 0 and content[i-1] != '\\':
                in_string = False
        
        if paren_count == 0 and brace_count == 0 and i > start:
            print(f'{func_name}: OK - ends at position {i}')
            break
        i += 1
        if i >= len(content):
            print(f'{func_name}: NOT CLOSED! paren={paren_count}, brace={brace_count}')
            break

# Also check the main App function
print('\nChecking main App function...')
start = content.find('export default function App()')
if start >= 0:
    brace_count = 0
    paren_count = 0
    in_string = False
    string_char = ''
    i = start
    while i < len(content):
        c = content[i]
        if not in_string:
            if c == '(':
                paren_count += 1
            elif c == ')':
                paren_count -= 1
            elif c == '{':
                brace_count += 1
            elif c == '}':
                brace_count -= 1
            elif c in "\"'`":
                in_string = True
                string_char = c
        else:
            if c == string_char and i > 0 and content[i-1] != '\\':
                in_string = False
        
        if paren_count == 0 and brace_count == 0 and i > start:
            print(f'App function: OK - ends at position {i}')
            break
        i += 1
        if i >= len(content):
            print(f'App function: NOT CLOSED! paren={paren_count}, brace={brace_count}')
            break