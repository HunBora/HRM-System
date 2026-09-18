import os

path = r'd:\HR System\HRM-System-main\src\app\dashboard\expenses\actions.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """  const session = await getSession();
  if (!session?.employeeId) {
    return { error: 'មិនអាចស្វែងរកទិន្នន័យបុគ្គលិករបស់អ្នកបានទេ!' };
  }"""

new_logic = """  const session = await getSession();
  let targetEmployeeId = session?.employeeId;

  const formEmpId = formData.get('empId') as string;
  if (formEmpId) {
    const employee = await prisma.employee.findUnique({ where: { employeeId: formEmpId } });
    if (employee) {
      targetEmployeeId = employee.id;
    } else {
      return { error: 'រកមិនឃើញលេខសម្គាល់បុគ្គលិកនេះទេ! (Employee ID not found)' };
    }
  }

  if (!targetEmployeeId) {
    return { error: 'មិនអាចស្វែងរកទិន្នន័យបុគ្គលិករបស់អ្នកបានទេ! (No Employee linked to your account)' };
  }"""

# Since the file might have weird encoding characters from the console output, we'll replace using regex or string block ignoring exact khmer string
import re

content = re.sub(r'const session = await getSession\(\);\s+if \(!session\?\.employeeId\) \{\s+return \{ error: \'[^\']+\' \};\s+\}', new_logic, content)

# Also update the create call
content = content.replace("employeeId: session.employeeId,", "employeeId: targetEmployeeId,")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
