import os

path = r'd:\HR System\HRM-System-main\src\app\dashboard\expenses\ExpenseClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix amount input
old_input = '<input type="number" name="amount" step="0.01" min="0.01" required className="input-field" placeholder="15.50" style={{ width: \'100%\' }} />'
new_input = '<input type="number" name="amount" step="0.01" min="0.01" required className="input-field" placeholder="15.50" style={{ flex: 1, minWidth: 0 }} />'

content = content.replace(old_input, new_input)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
