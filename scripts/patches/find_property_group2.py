with open(r'C:\20.HDev\imgman\src\components\PropertiesPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the second </PropertyGroup> (after Geometry/Transform)
first_idx = content.find('</PropertyGroup>')
second_idx = content.find('</PropertyGroup>', first_idx + 1)

if second_idx >= 0:
    # Find the next PropertyGroup or end of selectedElement section
    next_prop = content.find('<PropertyGroup', second_idx)
    if next_prop >= 0:
        # Save to file instead of printing
        with open(r'C:\20.HDev\imgman\found_section.txt', 'w', encoding='utf-8') as f:
            f.write(content[second_idx:next_prop])
        print("Saved to found_section.txt")
        print(f"Length: {next_prop - second_idx}")
    else:
        with open(r'C:\20.HDev\imgman\found_section.txt', 'w', encoding='utf-8') as f:
            f.write(content[second_idx:second_idx+500])
        print("Saved partial to found_section.txt")
else:
    print("Not found")