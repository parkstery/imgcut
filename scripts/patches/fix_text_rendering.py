with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the text rendering that has transform with + operators
old_text = """                {el.type === 'text' && (\n                  <text\n                    x={el.x + el.width / 2}\n                    y={el.y + el.height / 2}\n                    fill={el.color}\n                    font-family={el.fontFamily}\n                    font-size={el.fontSize}\n                    transform=\"rotate(\" + (el.rotation || 0) + \")\"\n                    text-anchor=\"middle\"\n                  >{el.text || ''}</text>\n                )}"""

new_text = """                {el.type === 'text' && (\n                  <text\n                    x={el.x + el.width / 2 + (el.rotation || 0) * 10}\n                    y={el.y + el.height / 2}\n                    fill={el.color}\n                    font-family={el.fontFamily}\n                    font-size={el.fontSize}\n                    text-anchor=\"middle\"\n                  >{el.text || ''}</text>\n                )}"""

if old_text in content:
    content = content.replace(old_text, new_text)
    print("Fixed text rendering")
else:
    print("Text rendering pattern not found")

with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")