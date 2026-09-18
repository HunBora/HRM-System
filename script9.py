import os

path = r'd:\HR System\HRM-System-main\src\app\dashboard\expenses\ExpenseClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make grid responsive instead of strictly 4 columns
old_grid = "style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>"
new_grid = "style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>"
content = content.replace(old_grid, new_grid)

# Change receipt link to span 1 in auto-fit so it doesn't break layout
content = content.replace("style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>", 
                          "style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>")

# Fix Amount input layout
# Revert to standard 100% width but wrap if needed
old_amount_input = '<input type="number" name="amount" step="0.01" min="0.01" required className="input-field" placeholder="15.50" style={{ flex: 1, minWidth: 0 }} />'
new_amount_input = '<input type="number" name="amount" step="0.01" min="0.01" required className="input-field" placeholder="15.50" style={{ width: \'100%\', minWidth: \'80px\' }} />'
content = content.replace(old_amount_input, new_amount_input)

# Make currency select flexible too
old_currency = 'style={{ minWidth: \'100px\', flexShrink: 0 }}'
new_currency = 'style={{ width: \'90px\', flexShrink: 0 }}'
content = content.replace(old_currency, new_currency)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
