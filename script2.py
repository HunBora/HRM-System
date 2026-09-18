import os

path = r'd:\HR System\HRM-System-main\src\app\dashboard\expenses\ExpenseClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Export Buttons with Dropdown
old_export = """      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }} className="print-hidden">
        <button onClick={exportToPDF} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>📄 PDF</button>
        <button onClick={exportToExcel} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>📊 Excel</button>
        <button onClick={exportToCSV} style={{ padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>📑 CSV</button>
        <button onClick={handlePrint} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>🖨️ Print</button>
      </div>"""

new_export = """      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }} className="print-hidden">
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

if old_export in content:
    content = content.replace(old_export, new_export)
else:
    print("Could not find old_export block")

# Replace Headers with 3 stacked divs
headers = {
    "កាលបរិច្ឆេទ / Date / 日期": "<div>កាលបរិច្ឆេទ</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Date</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>日期</div>",
    "បុគ្គលិក / Employee / 员工": "<div>បុគ្គលិក</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Employee</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>员工</div>",
    "ប្រភេទ / Type / 类别": "<div>ប្រភេទ</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Type</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>类别</div>",
    "ទឹកប្រាក់ / Amount / 金额": "<div>ទឹកប្រាក់</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Amount</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>金额</div>",
    "ស្ថានភាព / Status / 状态": "<div>ស្ថានភាព</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Status</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>状态</div>",
    "សកម្មភាព / Action / 操作": "<div>សកម្មភាព</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Action</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>操作</div>"
}

for old, new_h in headers.items():
    content = content.replace(old, new_h)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
