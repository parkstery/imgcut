with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the corrupted Korean text in handleRadialConfirm
content = content.replace(
    "name: el.name.replace('(�̸�����', ''),",
    "name: el.name.replace('(미리보기', ''),"
)

with open(r'C:\20.HDev\imgman\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed corrupted Korean text')