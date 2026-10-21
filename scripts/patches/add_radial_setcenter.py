with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with "const handleRadialCancel = useCallback(() => {"
for i, line in enumerate(lines):
    if 'const handleRadialCancel = useCallback(() => {' in line:
        # Find the end of this function
        j = i
        brace_count = 0
        while j < len(lines):
            for c in lines[j]:
                if c == '{':
                    brace_count += 1
                elif c == '}':
                    brace_count -= 1
            if brace_count == 0:
                insert_idx = j + 1
                break
            j += 1
        break

# Add handleRadialSetCenter
radial_set_center = [
    '\n',
    '  const handleRadialSetCenter = useCallback((x: number, y: number) => {\n',
    '    setRadialToolState((prev) => ({\n',
    '      ...prev,\n',
    '      step: \'adjusting_radius\',\n',
    '      center: { x, y },\n',
    '      previewElements: [],\n',
    '    }));\n',
    '  }, []);\n',
    '\n',
]

# Insert after handleRadialCancel
new_lines = lines[:insert_idx] + radial_set_center + lines[insert_idx:]

with open(r'C:\20.HDev\imgman\src\App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Added handleRadialSetCenter')