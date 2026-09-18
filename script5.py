import os

path = r'd:\HR System\HRM-System-main\src\app\dashboard\expenses\ExpenseClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Change grid template to 4 columns
old_grid = "style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>"
new_grid = "style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>"
content = content.replace(old_grid, new_grid)

# Change Receipt Link grid column to span 2, so it fits nicely on the second row
# Wait, the Receipt link div currently doesn't have a style for gridColumn.
old_receipt_div = '<div className="form-group">\n              <label className="kh-text">ឯកសារយោង / Receipt Link / 收据链接</label>'
new_receipt_div = '<div className="form-group" style={{ gridColumn: \'span 2\' }}>\n              <label className="kh-text">ឯកសារយោង / Receipt Link / 收据链接</label>'

if old_receipt_div in content:
    content = content.replace(old_receipt_div, new_receipt_div)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
