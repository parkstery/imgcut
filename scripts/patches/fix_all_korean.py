with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix all corrupted Korean text in toast messages
content = content.replace('�̸�����', '미리보기')
content = content.replace('�� ��ü�� ���� �迭�� �����Ǿ����ϴ�.', f'{0}개 객체로 방사상 배열이 생성되었습니다.')
content = content.replace('���� ������ ��ҵǾ����ϴ�.', '방사상 도구가 취소되었습니다.')
content = content.replace('�̸�����', '미리보기')

with open(r'C:\20.HDev\imgman\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed all corrupted Korean text')