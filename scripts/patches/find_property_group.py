with open(r'C:\20.HDev\imgman\src\components\PropertiesPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the second </PropertyGroup> (after Geometry/Transform)
first_idx = content.find('</PropertyGroup>')
second_idx = content.find('</PropertyGroup>', first_idx + 1)

if second_idx >= 0:
    # Find the next PropertyGroup or end of selectedElement section
    next_prop = content.find('<PropertyGroup', second_idx)
    if next_prop >= 0:
        print(f"Found at {second_idx} to {next_prop}")
        print(repr(content[second_idx:next_prop]))
    else:
        print(repr(content[second_idx:second_idx+500]))
else:
    print("Not found")