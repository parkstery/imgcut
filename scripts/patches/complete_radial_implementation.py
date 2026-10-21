"""
Complete radial tool implementation for imgman.
This script makes all necessary changes to implement the radial object tool.
"""

with open(r'C:\20.HDev\imgman\src\types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add 'radial' to ToolType - find the exact pattern
old_tool_type_start = "export type ToolType =\n  | 'select'"
idx = content.find(old_tool_type_start)
if idx >= 0:
    # Find the end of ToolType (before the next export or end of file)
    remaining = content[idx:]
    # Find where ToolType ends - it's followed by other types or ends
    radial_insert = "  | 'radial'"
    if radial_insert not in remaining:
        # Insert 'radial' before the closing }
        # Find the line that has the last tool type
        lines = remaining.split('\n')
        new_lines = []
        for line in lines:
            new_lines.append(line)
            if line.strip() == "| 'crop';":
                # Add radial after this line
                new_lines.append("  | 'radial';")
                break
        content = content[:idx] + '\n'.join(new_lines) + content[idx + len(lines[0]):]
        print("1. Added 'radial' to ToolType")
    else:
        print("1. 'radial' already in ToolType")
else:
    print("1. ToolType pattern not found")

with open(r'C:\20.HDev\imgman\src\types.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("types.ts done")