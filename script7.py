import os

path = r'd:\HR System\HRM-System-main\src\app\dashboard\expenses\ExpenseClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Change currency select width
old_style = "style={{ width: '80px' }}"
new_style = "style={{ minWidth: '100px', flexShrink: 0 }}"
content = content.replace(old_style, new_style)

# Make the amount input stretch nicely
if 'placeholder="15.50" />' in content:
    content = content.replace('placeholder="15.50" />', 'placeholder="15.50" style={{ width: \'100%\' }} />')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
