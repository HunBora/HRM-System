import os

path = r'd:\HR System\HRM-System-main\src\app\dashboard\expenses\ExpenseClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Modify the Export Dropdown to put the Print button back outside
old_export_dropdown = """      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }} className="print-hidden">
        <select 
          className="input-field kh-text"
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', width: '250px' }}
          defaultValue=""
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'pdf') exportToPDF();
            else if (val === 'excel') exportToExcel();
            else if (val === 'csv') exportToCSV();
            else if (val === 'print') handlePrint();
            e.target.value = "";
          }}
        >
          <option value="" disabled>ទាញយករបាយការណ៍ / Export...</option>
          <option value="pdf">📄 ទាញយកជា PDF</option>
          <option value="excel">📊 ទាញយកជា Excel</option>
          <option value="csv">📑 ទាញយកជា CSV</option>
          <option value="print">🖨️ ព្រីនចេញ (Print)</option>
        </select>
      </div>"""

new_export_dropdown = """      <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', marginBottom: '15px' }} className="print-hidden">
        <select 
          className="input-field kh-text"
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', width: '250px' }}
          defaultValue=""
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'pdf') exportToPDF();
            else if (val === 'excel') exportToExcel();
            else if (val === 'csv') exportToCSV();
            e.target.value = "";
          }}
        >
          <option value="" disabled>ទាញយករបាយការណ៍ / Export...</option>
          <option value="pdf">📄 ទាញយកជា PDF</option>
          <option value="excel">📊 ទាញយកជា Excel</option>
          <option value="csv">📑 ទាញយកជា CSV</option>
        </select>
        
        <button onClick={handlePrint} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          🖨️ Print
        </button>
      </div>"""

content = content.replace(old_export_dropdown, new_export_dropdown)

# 2. Add print function for a single claim
single_print_func = """
  const printSingleClaim = (claim: any) => {
    const doc = new jsPDF();
    doc.text('Expense Claim Detail', 14, 15);
    doc.text(`Date: ${new Date(claim.date).toLocaleDateString('en-GB')}`, 14, 25);
    doc.text(`Employee: ${claim.employee ? claim.employee.firstNameKh + ' ' + claim.employee.lastNameKh : 'N/A'}`, 14, 35);
    doc.text(`Category: ${claim.category}`, 14, 45);
    doc.text(`Amount: ${claim.amount} ${claim.currency}`, 14, 55);
    doc.text(`Status: ${claim.status}`, 14, 65);
    doc.text(`Description: ${claim.description || 'N/A'}`, 14, 75);
    
    doc.save(`Expense_${claim.id}.pdf`);
  };
"""

if 'printSingleClaim' not in content:
    content = content.replace('const exportToExcel', single_print_func + '\n  const exportToExcel')

# 3. Add the print icon to the action column for each row
old_action_start = "{claim.receiptUrl && ("
new_action_start = """<button onClick={() => printSingleClaim(claim)} style={{ display: 'inline-block', marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }} title="Print / ព្រីន">
                      🖨️
                    </button>
                    {claim.receiptUrl && ("""

content = content.replace(old_action_start, new_action_start)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
