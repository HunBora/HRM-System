import os

path = r'd:\HR System\HRM-System-main\src\app\dashboard\expenses\ExpenseClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update Excel and CSV exports
old_export_map = """      Date: new Date(c.date).toLocaleDateString('en-GB'),
      Employee: c.employee ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : '',
      Type: c.category,"""
new_export_map = """      Date: new Date(c.date).toLocaleDateString('en-GB'),
      Department: c.employee?.department || '',
      Employee: c.employee ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : '',
      'Emp ID': c.employee?.employeeId || '',
      Type: c.category,"""
content = content.replace(old_export_map, new_export_map)

# Update PDF export
old_pdf_head = "head: [['Date', 'Employee', 'Type', 'Amount', 'Currency', 'Status']],"
new_pdf_head = "head: [['Date', 'Dept', 'Employee', 'Emp ID', 'Type', 'Amount', 'Currency', 'Status']],"
content = content.replace(old_pdf_head, new_pdf_head)

old_pdf_body = """        new Date(c.date).toLocaleDateString('en-GB'),
        c.employee ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : '',
        c.category,"""
new_pdf_body = """        new Date(c.date).toLocaleDateString('en-GB'),
        c.employee?.department || '',
        c.employee ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : '',
        c.employee?.employeeId || '',
        c.category,"""
content = content.replace(old_pdf_body, new_pdf_body)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
