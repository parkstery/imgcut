with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and extract handleRadialConfirm
confirm_start = content.find('const handleRadialConfirm = useCallback')
confirm_end = content.find('}, [elements, layers, config, pushHistory, showToast]);', confirm_start)
if confirm_end == -1:
    # Try alternative
    confirm_end = content.find('}, [elements, layers, config, pushHistory, showToast]);', confirm_start + 1)
if confirm_end == -1:
    print("Could not find end of handleRadialConfirm")
else:
    confirm_end += len('}, [elements, layers, config, pushHistory, showToast]);')
    handleRadialConfirm = content[confirm_start:confirm_end]
    print(f"Found handleRadialConfirm: {confirm_end - confirm_start} chars")
    print(handleRadialConfirm[:200])

# Find and extract handleRadialCancel
cancel_start = content.find('const handleRadialCancel = useCallback')
cancel_end = content.find('}, [showToast]);', cancel_start)
if cancel_end == -1:
    print("Could not find end of handleRadialCancel")
else:
    cancel_end += len('}, [showToast]);')
    handleRadialCancel = content[cancel_start:cancel_end]
    print(f"Found handleRadialCancel: {cancel_end - cancel_start} chars")
    print(handleRadialCancel[:200])

# Find pushHistory definition
push_start = content.find('const pushHistory = useCallback')
if push_start >= 0:
    print(f"pushHistory at position {push_start}")