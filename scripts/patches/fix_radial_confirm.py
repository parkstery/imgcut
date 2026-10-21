with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the handleRadialConfirm function - fix corrupted Korean text and add missing closing parenthesis
# Find the problematic block and replace it entirely
old_block = '''      const newElements = prev.previewElements.map((el, i) => ({
        ...el,
        id: `radial-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        name: el.name.replace('(미리보기', ''),
      });'''

# The actual content has corrupted Korean text
# Let's find and replace the specific lines
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'const newElements = prev.previewElements.map((el, i) => ({' in line:
        start = i
    if 'const nextElements = [...elements, ...newElements];' in line:
        end = i
        break

if 'start' in locals() and 'end' in locals():
    # Replace lines from start to end-1
    new_lines = lines[:start] + [
        '      const newElements = prev.previewElements.map((el, i) => ({',
        '        ...el,',
        '        id: `radial-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,',
        "        name: el.name.replace('(미리보기', ''),",
        '      }));',
    ] + lines[end:]
    content = '\n'.join(new_lines)
    with open(r'C:\20.HDev\imgman\src\App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed handleRadialConfirm map callback')
else:
    print('Could not find the block to replace')