with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the corrupted Korean text and add missing closing parenthesis for map call
content = content.replace(
    "const newElements = prev.previewElements.map((el, i) => ({\n        ...el,\n        id: `radial-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,\n        name: el.name.replace('(�̸�����', ''),\n      });",
    "const newElements = prev.previewElements.map((el, i) => ({\n        ...el,\n        id: `radial-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,\n        name: el.name.replace('(미리보기', ''),\n      }));"
)

with open(r'C:\20.HDev\imgman\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed map callback closing parenthesis and Korean text')