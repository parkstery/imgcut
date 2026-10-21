with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and extract handleRadialConfirm
confirm_start = content.find('const handleRadialConfirm = useCallback')
confirm_end = content.find('}, [elements, layers, config, pushHistory, showToast]);', confirm_start)
if confirm_end >= 0:
    confirm_end += len('}, [elements, layers, config, pushHistory, showToast]);')
    handleRadialConfirm = content[confirm_start:confirm_end]
    # Remove it from content
    content = content[:confirm_start] + content[confirm_end:]
    print("Extracted handleRadialConfirm")

# Find and extract handleRadialCancel
cancel_start = content.find('const handleRadialCancel = useCallback')
cancel_end = content.find('}, [showToast]);', cancel_start)
if cancel_end >= 0:
    cancel_end += len('}, [showToast]);')
    handleRadialCancel = content[cancel_start:cancel_end]
    # Remove it from content
    content = content[:cancel_start] + content[cancel_end:]
    print("Extracted handleRadialCancel")

# Find pushHistory and insert after it
push_start = content.find('const pushHistory = useCallback')
if push_start >= 0:
    # Find the end of pushHistory useCallback
    push_end = content.find('}, [historyIndex, activeLayerId]', push_start)
    if push_end >= 0:
        push_end += len('}, [historyIndex, activeLayerId]);')
        # Insert after pushHistory
        content = content[:push_end] + '\n\n' + handleRadialConfirm + '\n\n' + handleRadialCancel + content[push_end:]
        print("Inserted after pushHistory")
    else:
        print("Could not find end of pushHistory")
else:
    print("Could not find pushHistory")

# Write back
with open(r'C:\20.HDev\imgman\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done moving callbacks")