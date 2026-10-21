with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and remove the radial preview block
start_marker = '        {/* Radial Tool Preview Elements */}'
end_marker = '        {/* Active Brush Stroke Live Drawing Preview */}'

start_idx = content.find(start_marker)
if start_idx >= 0:
    end_idx = content.find(end_marker, start_idx)
    if end_idx >= 0:
        # Remove everything between start_marker and end_marker
        content = content[:start_idx] + end_marker + content[end_idx + len(end_marker):]
        with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print('Removed radial preview code successfully')
    else:
        print('End marker not found')
else:
    print('Start marker not found')
    # Search for partial
    idx = content.find('Radial Tool Preview')
    if idx >= 0:
        print(f'Found at {idx}: {content[idx:idx+100]}')