with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Check the handleRadialUpdateRadius function for balance
start = content.find('const handleRadialUpdateRadius = useCallback(')
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
            print(f'Function ends at position {i}')
            print(content[start:i+200])
            break
        i += 1
    if i >= len(content):
        print('Function not properly closed!')
        print(f'Final paren_count: {paren_count}, brace_count: {brace_count}')