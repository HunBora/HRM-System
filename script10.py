import os

path = r'd:\HR System\HRM-System-main\src\app\dashboard\expenses\ExpenseClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add headers
old_employee_th = "{role !== 'EMPLOYEE' && <th className=\"kh-text\" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}><div>បុគ្គលិក</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Employee</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>员工</div></th>}"
new_employee_th = """              {role !== 'EMPLOYEE' && <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}><div>ផ្នែក</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Dept</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>部门</div></th>}
              {role !== 'EMPLOYEE' && <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}><div>បុគ្គលិក</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Employee</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>员工</div></th>}
              {role !== 'EMPLOYEE' && <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}><div>អត្តលេខ</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Emp ID</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>工号</div></th>}"""
content = content.replace(old_employee_th.replace('បុគ្គលិក', 'បុគ្គលិក'), new_employee_th)
# Because encoding might be weird from read, let's use a more robust replacement strategy for headers
import re
content = re.sub(
    r"\{role !== 'EMPLOYEE' && <th[^>]*><div>.*?</div><div[^>]*>Employee</div><div[^>]*>.*?</div></th>\}",
    new_employee_th,
    content
)

# 2. Add tbody columns
old_employee_td = """                {role !== 'EMPLOYEE' && (
                  <td style={{ padding: '12px 15px' }} className="kh-text">
                    {claim.employee?.firstNameKh} {claim.employee?.lastNameKh}
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{claim.employee?.department}</div>
                  </td>
                )}"""
new_employee_td = """                {role !== 'EMPLOYEE' && (
                  <td style={{ padding: '12px 15px' }} className="kh-text">
                    <div style={{ fontSize: '0.85rem' }}>{claim.employee?.department || '-'}</div>
                  </td>
                )}
                {role !== 'EMPLOYEE' && (
                  <td style={{ padding: '12px 15px' }} className="kh-text">
                    {claim.employee?.firstNameKh} {claim.employee?.lastNameKh}
                  </td>
                )}
                {role !== 'EMPLOYEE' && (
                  <td style={{ padding: '12px 15px' }} className="kh-text">
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{claim.employee?.employeeId || '-'}</div>
                  </td>
                )}"""
content = content.replace(old_employee_td, new_employee_td)

# 3. Increase colSpan for 'No Data' message
# It was colSpan=6, now we added 2 more columns for roles !== EMPLOYEE
# The cleanest way is just to use colSpan=10 to be safe.
content = content.replace('colSpan={6}', 'colSpan={10}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
