import os

path = r'd:\HR System\HRM-System-main\src\app\dashboard\expenses\ExpenseClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add helper function at the top of the component
helper_func = """
  const parseDescription = (desc: string) => {
    if (!desc) return { realDesc: '', name: '', id: '', phone: '' };
    const match = desc.match(/\\n\\((.*?)\\)$/);
    if (!match) return { realDesc: desc, name: '', id: '', phone: '' };
    const extraStr = match[1];
    const realDesc = desc.replace(/\\n\\((.*?)\\)$/, '');
    let name = ''; let id = ''; let phone = '';
    extraStr.split(', ').forEach((p: string) => {
      if (p.startsWith('Name: ')) name = p.substring(6);
      if (p.startsWith('ID: ')) id = p.substring(4);
      if (p.startsWith('Phone: ')) phone = p.substring(7);
    });
    return { realDesc, name, id, phone };
  };
"""

if 'const parseDescription' not in content:
    content = content.replace('const [isSubmitting, setIsSubmitting] = useState(false);', 'const [isSubmitting, setIsSubmitting] = useState(false);\n' + helper_func)

# Replace the tbody cells
# 1. We need to add the parsed const inside the map
old_tr = "{claims.map((claim: any) => ("
new_tr = """{claims.map((claim: any) => {
              const parsed = parseDescription(claim.description);
              const empName = claim.employee?.firstNameKh ? `${claim.employee.firstNameKh} ${claim.employee.lastNameKh}` : parsed.name;
              const empId = claim.employee?.employeeId || parsed.id;
              
              return (
"""
content = content.replace(old_tr, new_tr)

# 2. Update Employee Name cell
old_name_cell = """                  {role !== 'EMPLOYEE' && (
                    <td style={{ padding: '12px 15px' }} className="kh-text">
                      {claim.employee?.firstNameKh} {claim.employee?.lastNameKh}
                    </td>
                  )}"""
new_name_cell = """                  {role !== 'EMPLOYEE' && (
                    <td style={{ padding: '12px 15px' }} className="kh-text">
                      {empName || '-'}
                    </td>
                  )}"""
content = content.replace(old_name_cell, new_name_cell)

# 3. Update Emp ID cell
old_id_cell = """                  {role !== 'EMPLOYEE' && (
                    <td style={{ padding: '12px 15px' }} className="kh-text">
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{claim.employee?.employeeId || '-'}</div>
                    </td>
                  )}"""
new_id_cell = """                  {role !== 'EMPLOYEE' && (
                    <td style={{ padding: '12px 15px' }} className="kh-text">
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{empId || '-'}</div>
                    </td>
                  )}"""
content = content.replace(old_id_cell, new_id_cell)

# 4. Update Description cell
old_desc_cell = ">{claim.description}</div>"
new_desc_cell = ">{parsed.realDesc || '-'}</div>"
content = content.replace(old_desc_cell, new_desc_cell)

# Close the map properly
old_close_tr = "              </tr>\n            ))}"
new_close_tr = "              </tr>\n            );\n          })}"
content = content.replace(old_close_tr, new_close_tr)

# Let's also fix the exports!
old_excel_map = """      Date: new Date(c.date).toLocaleDateString('en-GB'),
      Department: c.employee?.department || '',
      Employee: c.employee ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : '',
      'Emp ID': c.employee?.employeeId || '',
      Type: c.category,
      Amount: c.amount,
      Currency: c.currency,
      Status: c.status,
      Description: c.description
    })));"""
new_excel_map = """      ...(() => {
        const p = parseDescription(c.description);
        return {
          Date: new Date(c.date).toLocaleDateString('en-GB'),
          Department: c.employee?.department || '',
          Employee: c.employee?.firstNameKh ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : p.name,
          'Emp ID': c.employee?.employeeId || p.id,
          Type: c.category,
          Amount: c.amount,
          Currency: c.currency,
          Status: c.status,
          Description: p.realDesc
        };
      })()
    })));"""
# The above replacement for Excel is a bit risky due to syntax inside map returning an object. Let's do it cleanly:
new_excel_map = """      ...(() => {
        const p = parseDescription(c.description);
        return {
          Date: new Date(c.date).toLocaleDateString('en-GB'),
          Department: c.employee?.department || '',
          Employee: c.employee?.firstNameKh ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : p.name,
          'Emp ID': c.employee?.employeeId || p.id,
          Type: c.category,
          Amount: c.amount,
          Currency: c.currency,
          Status: c.status,
          Description: p.realDesc
        };
      })()
    })));"""
# Actually, `claims.map((c: any) => ({ ...(() => {...})() }))` works in JS!

content = content.replace("""      Date: new Date(c.date).toLocaleDateString('en-GB'),
      Department: c.employee?.department || '',
      Employee: c.employee ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : '',
      'Emp ID': c.employee?.employeeId || '',
      Type: c.category,
      Amount: c.amount,
      Currency: c.currency,
      Status: c.status,
      Description: c.description""", """      ...(() => {
        const p = parseDescription(c.description);
        return {
          Date: new Date(c.date).toLocaleDateString('en-GB'),
          Department: c.employee?.department || '',
          Employee: c.employee?.firstNameKh ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : p.name,
          'Emp ID': c.employee?.employeeId || p.id,
          Type: c.category,
          Amount: c.amount,
          Currency: c.currency,
          Status: c.status,
          Description: p.realDesc
        };
      })()""")

# Fix PDF export body
# It's inside claims.map((c: any) => [ ... ])
old_pdf_body = """        new Date(c.date).toLocaleDateString('en-GB'),
        c.employee?.department || '',
        c.employee ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : '',
        c.employee?.employeeId || '',
        c.category,
        c.amount,
        c.currency,
        c.status
      ]),"""
new_pdf_body = """        (() => {
          const p = parseDescription(c.description);
          return [
            new Date(c.date).toLocaleDateString('en-GB'),
            c.employee?.department || '',
            c.employee?.firstNameKh ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : p.name,
            c.employee?.employeeId || p.id,
            c.category,
            c.amount,
            c.currency,
            c.status
          ];
        })()
      ).map((x: any) => x()),"""
content = content.replace("        body: claims.map((c: any) => [\n" + old_pdf_body, "        body: claims.map((c: any) => {\n          const p = parseDescription(c.description);\n          return [\n            new Date(c.date).toLocaleDateString('en-GB'),\n            c.employee?.department || '',\n            c.employee?.firstNameKh ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : p.name,\n            c.employee?.employeeId || p.id,\n            c.category,\n            c.amount,\n            c.currency,\n            c.status\n          ];\n        }),")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
