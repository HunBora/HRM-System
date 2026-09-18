import os
import re

path = r'd:\HR System\HRM-System-main\src\app\dashboard\expenses\ExpenseClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix thead duplicates
# Remove all the DEPT and EMP ID headers
# The correct sequence should be just Dept, Employee, Emp ID
# Let's just find the whole block of 5 headers (Dept, Dept, Employee, Emp ID, Emp ID) and replace it with 3 headers.

# A simple way is to match all `role !== 'EMPLOYEE' && <th...` in thead and replace the entire block.
thead_pattern = r"(              \{role !== 'EMPLOYEE' && <th.*?Dept.*?</th>\}\n)+.*?Employee.*?</th>\}\n(              \{role !== 'EMPLOYEE' && <th.*?Emp ID.*?</th>\}\n)+"

correct_headers = """              {role !== 'EMPLOYEE' && <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}><div>ផ្នែក</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Dept</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>部门</div></th>}
              {role !== 'EMPLOYEE' && <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}><div>បុគ្គលិក</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Employee</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>员工</div></th>}
              {role !== 'EMPLOYEE' && <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}><div>អត្តលេខ</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Emp ID</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>工号</div></th>}\n"""

content = re.sub(thead_pattern, correct_headers, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
