with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and extract handleRadialConfirm
confirm_start = content.find('const handleRadialConfirm = useCallback')
confirm_end = content.find('}, [elements, layers, config, pushHistory, showToast]);', confirm_start)
if confirm_end >= 0:
    confirm_end += len('}, [elements, layers, config, pushHistory, showToast]);')
    handleRadialConfirm = content[confirm_start:confirm_end]
    content = content[:confirm_start] + content[confirm_end:]
    print("Extracted handleRadialConfirm")

# Find and extract handleRadialCancel
cancel_start = content.find('const handleRadialCancel = useCallback')
cancel_end = content.find('}, [showToast]);', cancel_start)
if cancel_end >= 0:
    cancel_end += len('}, [showToast]);')
    handleRadialCancel = content[cancel_start:cancel_end]
    content = content[:cancel_start] + content[cancel_end:]
    print("Extracted handleRadialCancel")

# Find pushHistory end
push_start = content.find('const pushHistory = useCallback')
push_end = 0
if True:
    paren_count = 0
    brace_count = 0
    i = content.find('const pushHistory = useCallback')
    while i < len(content):
        c = content[i]
        if c == '(':
            paren_count += 1
        elif c == ')':
            paren_count -= 1
        elif c == '{':
            brace_count += 1
        elif c == '}':
            brace_count -= 1
        if paren_count == 0 and brace_count == 0 and i > 0:
            push_end = i + 1
            break
        i += 1
    else:
        push_end = 0

if push_end:
    # Insert after pushHistory
    new_callbacks = '\n\n' + handleRadialConfirm + '\n\n' + handleRadialCancel + '\n'
    content = content[:push_end] + '\n\n' + handleRadialConfirm + '\n\n' + handleRadialCancel + content[push_end:]
    print("Inserted after pushHistory")
else:
    print("Could not find pushHistory end")

with open(r'C:\20.HDev\imgman\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done fixing callbacks")