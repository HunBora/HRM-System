const ExcelJS = require('exceljs');
async function test() {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Sheet1');
  ws.addRow(['ល.រ', 'អត្តលេខ', 'ឈ្មោះខ្មែរ', 'ឈ្មោះឡាតាំង', 'ផ្នែក', 'ក្រុម', 'តួនាទី']);
  ws.addRow(['序號', '工號', '姓名', '姓名', '部門', '組', '職位', '國籍', '性别']);
  ws.addRow(['No', 'ID', 'Name Khmer', 'Name', 'Dept', 'Line', 'Position', 'N.T', 'Sex']);
  ws.addRow([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  ws.addRow([1, 'CPA0234', 'សាល់ មីមី', 'SAL MIMI', '电脑车', 'A', '组长', 'F', 'F']);
  
  let headersMap = {};
  for (let r = 1; r <= 3; r++) {
    const rowValues = ws.getRow(r).values;
    if (!rowValues || rowValues.length === 0) continue;
    const rowText = rowValues.join(' ').toLowerCase();
    let matchCount = 0;
    if (rowText.includes('id') || rowText.includes('អត្តលេខ') || rowText.includes('工號') || rowText.includes('编号')) matchCount++;
    if (rowText.includes('name') || rowText.includes('ឈ្មោះ') || rowText.includes('姓名')) matchCount++;
    if (rowText.includes('dept') || rowText.includes('department') || rowText.includes('ផ្នែក') || rowText.includes('部门')) matchCount++;
    if (matchCount >= 3) {
      const headerRow = ws.getRow(r);
      const prevHeaderRow = r > 1 ? ws.getRow(r - 1) : null;
      const nextHeaderRow = ws.getRow(r + 1);
      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const text1 = cell.text ? String(cell.text).trim().toLowerCase() : '';
        const text2 = prevHeaderRow && prevHeaderRow.getCell(colNumber).text ? String(prevHeaderRow.getCell(colNumber).text).trim().toLowerCase() : '';
        const text3 = nextHeaderRow && nextHeaderRow.getCell(colNumber).text ? String(nextHeaderRow.getCell(colNumber).text).trim().toLowerCase() : '';
        const text = text1 + ' ' + text2 + ' ' + text3;
        
        if (text.includes('id no') || text.includes('អត្តលេខ') || text === 'id' || text.includes('employee id') || text.match(/\bid\b/) || text.includes('工號')) headersMap['employeeId'] = colNumber;
        else if (text.includes('khmer') || text.includes('ខ្មែរ') || text.includes('柬文名字')) headersMap['nameKh'] = colNumber;
        else if (text.includes('english') || text.includes('ឡាតាំង') || text.includes('英文名字')) headersMap['nameEn'] = colNumber;
        else if (text.includes('name') || text.includes('ឈ្មោះ') || text.includes('姓名')) {
           if (!headersMap['nameKh']) headersMap['nameKh'] = colNumber;
           else if (!headersMap['nameEn']) headersMap['nameEn'] = colNumber;
        }
      });
      break;
    }
  }
  console.log('Headers Map:', headersMap);
}
test();
