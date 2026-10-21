with open(r'C:\20.HDev\imgman\src\types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add 'radial' before the last 'crop;
old = "  | 'crop';"
new = "  | 'crop';\n  | 'radial';"

if old in content and '| \'radial\'' not in content:
    content = content.replace(old, new)
    print('Added radial to ToolType')
else:
    print('Pattern not found or already present')

with open(r'C:\20.HDev\imgman\src\types.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")