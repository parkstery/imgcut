with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find handleRadialConfirm
confirm_start = content.find('const handleRadialConfirm = useCallback')
confirm_end = content.find('}, [elements, layers, config, pushHistory, showToast]);', confirm_start)
if confirm_end >= 0:
    confirm_end += len('}, [elements, layers, config, pushHistory, showToast]);')
    handleRadialConfirm = content[confirm_start:confirm_end]
    content = content[:confirm_start] + content[confirm_end:]
    print("Extracted handleRadialConfirm")

# Find handleRadialCancel
cancel_start = content.find('const handleRadialCancel = useCallback')
cancel_end = content.find('}, [showToast]);', cancel_start)
if cancel_end >= 0:
    cancel_end += len('}, [showToast]);')
    handleRadialCancel = content[cancel_start:cancel_end]
    content = content[:cancel_start] + content[cancel_end:]
    print("Extracted handleRadialCancel")

# Find pushHistory end
push_idx = content.find('const pushHistory = useCallback')
if push_idx >= 0:
    paren = 0
    brace = 0
    i = content.find('const pushHistory = useCallback')
    while i < len(content):
        c = content[i]
        if c == '(':
            paren += 1
        elif c == ')':
            paren -= 1
        elif c == '{':
            brace += 1
        elif c == '}':
            brace -= 1
        if paren == 0 and brace == 0 and i > push_idx:
            insert_pos = i + 1
            break
        i += 1
    else:
        insert_pos = 0

if insert_pos:
    content = content[:insert_pos] + '\n\n' + handleRadialConfirm + '\n\n' + handleRadialCancel + content[insert_pos:]
    print("Inserted callbacks after pushHistory")
else:
    print("Could not find pushHistory end")

with open(r'C:\20.HDev\imgman\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done fixing pushHistory order")