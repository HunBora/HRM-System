import os

path = r'd:\HR System\HRM-System-main\src\app\dashboard\expenses\ExpenseClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
export_imports = """import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
"""
if 'XLSX' not in content:
    content = content.replace("import Swal from 'sweetalert2';", "import Swal from 'sweetalert2';\n" + export_imports)

# 2. Add Export Functions
export_funcs = """
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(claims.map((c: any) => ({
      Date: new Date(c.date).toLocaleDateString('en-GB'),
      Employee: c.employee ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : '',
      Type: c.category,
      Amount: c.amount,
      Currency: c.currency,
      Status: c.status,
      Description: c.description
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, 'expenses.xlsx');
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(claims.map((c: any) => ({
      Date: new Date(c.date).toLocaleDateString('en-GB'),
      Employee: c.employee ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : '',
      Type: c.category,
      Amount: c.amount,
      Currency: c.currency,
      Status: c.status,
      Description: c.description
    })));
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'expenses.csv';
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Expense Claims', 14, 15);
    (doc as any).autoTable({
      head: [['Date', 'Employee', 'Type', 'Amount', 'Currency', 'Status']],
      body: claims.map((c: any) => [
        new Date(c.date).toLocaleDateString('en-GB'),
        c.employee ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : '',
        c.category,
        c.amount,
        c.currency,
        c.status
      ]),
      startY: 20
    });
    doc.save('expenses.pdf');
  };

  const handlePrint = () => {
    window.print();
  };
"""
if 'exportToExcel' not in content:
    content = content.replace('const t = l.expenses;', export_funcs + '\n  const t = l.expenses;')

# 3. Add Export Buttons above the table
export_buttons = """
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }} className="print-hidden">
        <button onClick={exportToPDF} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>📄 PDF</button>
        <button onClick={exportToExcel} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>📊 Excel</button>
        <button onClick={exportToCSV} style={{ padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>📑 CSV</button>
        <button onClick={handlePrint} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>🖨️ Print</button>
      </div>
      <div className="card"
"""
content = content.replace('<div className="card" style={{ padding: \'0\', overflow: \'hidden\'', export_buttons)

# 4. Modify form values (Emp ID, Name, Phone) & handleSubmit
if "formData.set(" not in content:
    content = content.replace("const formData = new FormData(e.currentTarget);", """const formData = new FormData(e.currentTarget);
    const empId = formData.get('empId') as string;
    const empName = formData.get('empName') as string;
    const empPhone = formData.get('empPhone') as string;
    let desc = formData.get('description') as string;
    
    let extraInfo = [];
    if (empId) extraInfo.push('ID: ' + empId);
    if (empName) extraInfo.push('Name: ' + empName);
    if (empPhone) extraInfo.push('Phone: ' + empPhone);
    
    if (extraInfo.length > 0) {
      desc = desc + '\\n(' + extraInfo.join(', ') + ')';
      formData.set('description', desc);
    }
""")

# 5. Add Inputs to the form
form_fields = """
            <div className="form-group">
              <label className="kh-text">លេខសម្គាល់បុគ្គលិក / Emp ID (Optional)</label>
              <input type="text" name="empId" className="input-field" placeholder="e.g. EMP-001" />
            </div>
            <div className="form-group">
              <label className="kh-text">ឈ្មោះ / Name (Optional)</label>
              <input type="text" name="empName" className="input-field" placeholder="e.g. Sokha" />
            </div>
            <div className="form-group">
              <label className="kh-text">លេខទូរស័ព្ទ / Phone (Optional)</label>
              <input type="text" name="empPhone" className="input-field" placeholder="e.g. 012345678" />
            </div>
"""
content = content.replace('<div className="form-group">\n              <label className="kh-text">{t.form.receipt}</label>', form_fields + '<div className="form-group">\n              <label className="kh-text">ឯកសារយោង / Receipt Link / 收据链接</label>')

# Form Labels
content = content.replace('{t.form.date}', 'កាលបរិច្ឆេទ / Date / 日期')
content = content.replace('{t.form.category}', 'ប្រភេទ / Category / 类别')
content = content.replace('{t.form.amount}', 'ទឹកប្រាក់ / Amount / 金额')
content = content.replace('{t.form.desc}', 'មូលហេតុ / Description / 原因')
content = content.replace('{isSubmitting ? t.form.submitting : t.form.submit}', '{isSubmitting ? "កំពុងបញ្ជូន... / Submitting..." : "បញ្ជូនការស្នើសុំ / Submit Request"}')

# Table Headers
content = content.replace('{t.table.date}', 'កាលបរិច្ឆេទ / Date / 日期')
content = content.replace('{t.table.employee}', 'បុគ្គលិក / Employee / 员工')
content = content.replace('{t.table.type}', 'ប្រភេទ / Type / 类别')
content = content.replace('{t.table.amount}', 'ទឹកប្រាក់ / Amount / 金额')
content = content.replace('{t.table.status}', 'ស្ថានភាព / Status / 状态')
content = content.replace('{t.table.action}', 'សកម្មភាព / Action / 操作')

# Title
content = content.replace('{t.title}', 'ស្នើសុំចំណាយ / Expense Claims / 报销申请')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Modified successfully')
