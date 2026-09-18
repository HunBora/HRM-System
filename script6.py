import os

path = r'd:\HR System\HRM-System-main\src\app\dashboard\expenses\ExpenseClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add flex layout to all form-group divs to align inputs at the bottom
content = content.replace('<div className="form-group">', '<div className="form-group" style={{ display: \'flex\', flexDirection: \'column\', justifyContent: \'flex-end\' }}>')
content = content.replace('<div className="form-group" style={{ gridColumn: \'span 2\' }}>', '<div className="form-group" style={{ gridColumn: \'span 2\', display: \'flex\', flexDirection: \'column\', justifyContent: \'flex-end\' }}>')
content = content.replace('<div className="form-group" style={{ gridColumn: \'1 / -1\' }}>', '<div className="form-group" style={{ gridColumn: \'1 / -1\', display: \'flex\', flexDirection: \'column\', justifyContent: \'flex-end\' }}>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
