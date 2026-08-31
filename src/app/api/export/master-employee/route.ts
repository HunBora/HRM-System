import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { employeeId: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Employee Master', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.2, right: 0.2,
          top: 0.4, bottom: 0.4,
          header: 0.2, footer: 0.2
        }
      }
    });

    // 1. Company Titles (Rows 1 to 3)
    sheet.mergeCells('A1:AK1');
    const title1 = sheet.getCell('A1');
    title1.value = 'ក្រុមហ៊ុន អេវើហ្គ្រីន ស្ពតធីង ហ្គូដ (ខេមបូឌា) ឯ.ក';
    title1.font = { name: 'Khmer OS Muol Light', size: 14, bold: true };
    title1.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A2:AK2');
    const title2 = sheet.getCell('A2');
    title2.value = '长青户外用品（柬埔寨）有限公司';
    title2.font = { name: 'SimSun', size: 12, bold: true };
    title2.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A3:AK3');
    const title3 = sheet.getCell('A3');
    title3.value = 'EVERGREEN SPORTING GOODS (CAMBODIA) CO., LTD';
    title3.font = { name: 'Times New Roman', size: 12, bold: true };
    title3.alignment = { horizontal: 'center', vertical: 'middle' };

    // 2. Report Title (Row 4)
    sheet.mergeCells('A4:AK4');
    const reportTitle = sheet.getCell('A4');
    reportTitle.value = 'បញ្ជីឈ្មោះបុគ្គលិក / EMPLOYEE NAME LIST';
    reportTitle.font = { name: 'Khmer OS Muol Light', size: 12, bold: true, underline: true };
    reportTitle.alignment = { horizontal: 'left', vertical: 'middle' };

    // 3. Headers (Row 5 and 6)
    const headers = [
      { top: '', bottom: { kh: 'អត្តលេខ', cn: '编号', en: 'ID No' }, width: 10 },
      { top: '', bottom: { kh: 'ល.រ', cn: '序号', en: 'No' }, width: 5 },
      { top: '', bottom: { kh: 'ឈ្មោះខ្មែរ', cn: '柬文名字', en: 'Name Khmer' }, width: 18 },
      { top: '', bottom: { kh: 'ឈ្មោះឡាតាំង', cn: '英文名字', en: 'Name English' }, width: 18 },
      { top: '', bottom: { kh: 'ភេទ', cn: '性别', en: 'Sex' }, width: 6 },
      { top: '', bottom: { kh: 'ថ្ងៃចូលធ្វើការ', cn: '入职日期', en: 'Join Date' }, width: 12 },
      { top: '', bottom: { kh: 'អត្តសញ្ញាណប័ណ្ណ', cn: '身份证', en: 'ID No' }, width: 15 },
      { top: '', bottom: { kh: 'កាតធនាគារ', cn: '银行卡号', en: 'Card' }, width: 15 },
      { top: '', bottom: { kh: 'ផ្នែក', cn: '部门', en: 'Department' }, width: 15 },
      { top: '', bottom: { kh: 'មុខងារ', cn: '职务', en: 'Position' }, width: 15 },
      // Probation Contract
      { top: 'កិច្ចសន្យាសាកល្បង\n试用合同\nProbation Contract', bottom: { kh: 'ចាប់ផ្តើម', cn: '开始', en: 'Start' }, width: 12, mergeTopCols: 2 },
      { top: '', bottom: { kh: 'បញ្ចប់', cn: '结束', en: 'End' }, width: 12 },
      // Regular Contract
      { top: 'កិច្ចសន្យាការងារ លើកទី\n正式合同\nRegular Contract', bottom: { kh: 'ទី១', cn: '第一次', en: '1st' }, width: 12, mergeTopCols: 3 },
      { top: '', bottom: { kh: 'ទី២', cn: '第二次', en: '2nd' }, width: 12 },
      { top: '', bottom: { kh: 'ទី៣', cn: '第三次', en: '3rd' }, width: 12 },
      // Basic Salary
      { top: 'ប្រាក់បៀវត្សរ៍\n基本底薪\nBasic Salary', bottom: { kh: 'ទី១', cn: '第一次', en: '1st' }, width: 12, mergeTopCols: 3 },
      { top: '', bottom: { kh: 'ទី២', cn: '第二次', en: '2nd' }, width: 12 },
      { top: '', bottom: { kh: 'ទី៣', cn: '第三次', en: '3rd' }, width: 12 },
      // Skill Allowance
      { top: 'ប្រាក់ជំនាញ\n技能补贴\nSkill Allowance', bottom: { kh: 'ទី១', cn: '第一次', en: '1st' }, width: 12, mergeTopCols: 3 },
      { top: '', bottom: { kh: 'ទី២', cn: '第二次', en: '2nd' }, width: 12 },
      { top: '', bottom: { kh: 'ទី៣', cn: '第三次', en: '3rd' }, width: 12 },
      // Position Allowance
      { top: 'ប្រាក់មុខងារ\n岗位补贴\nPosition Allowance', bottom: { kh: 'ទី១', cn: '第一次', en: '1st' }, width: 12, mergeTopCols: 3 },
      { top: '', bottom: { kh: 'ទី២', cn: '第二次', en: '2nd' }, width: 12 },
      { top: '', bottom: { kh: 'ទី៣', cn: '第三次', en: '3rd' }, width: 12 },
      // Rest of columns
      { top: '', bottom: { kh: 'ថ្ងៃខែឆ្នាំកំណើត', cn: '出生日期', en: 'Date of Birth' }, width: 12 },
      { top: '', bottom: { kh: 'លេខអត្តសញ្ញាណប័ណ្ណ', cn: '身份证号', en: 'National ID' }, width: 15 },
      { top: '', bottom: { kh: 'ទីកន្លែងកំណើត', cn: '出生地', en: 'Place of Birth' }, width: 20 },
      { top: '', bottom: { kh: 'អាស័យដ្ឋាន', cn: '地址', en: 'Address' }, width: 25 },
      { top: '', bottom: { kh: 'កម្រិតវប្បធម៌', cn: '学历', en: 'Education' }, width: 15 },
      { top: '', bottom: { kh: 'កូន', cn: '子女', en: 'Child' }, width: 8 },
      { top: '', bottom: { kh: 'ស្ថានភាពគ្រួសារ', cn: '婚姻状况', en: 'Marital Status' }, width: 12 },
      { top: '', bottom: { kh: 'សៀវភៅសុខភាព', cn: '健康证', en: 'Health Book' }, width: 12 },
      { top: '', bottom: { kh: 'សំបុត្រពេទ្យ', cn: '体检单', en: 'Health Certificate' }, width: 12 },
      { top: '', bottom: { kh: 'ផ្សេងៗ', cn: '备注', en: 'Remark' }, width: 15 },
      { top: '', bottom: { kh: 'ប.ស.ស', cn: '社保', en: 'NSSF' }, width: 15 },
      { top: '', bottom: { kh: 'ឈ្មោះប្តី/ប្រពន្ធ', cn: '配偶', en: 'Girl/Spouse Zone' }, width: 15 },
    ];

    let colIndex = 1;
    headers.forEach((h) => {
      sheet.getColumn(colIndex).width = h.width;
      
      // Bottom header (Row 6)
      const bottomCell = sheet.getCell(6, colIndex);
      bottomCell.value = `${h.bottom.kh}\n${h.bottom.cn}\n${h.bottom.en}`;
      bottomCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      bottomCell.font = { name: 'Khmer OS Siemreap', size: 9, bold: true };
      bottomCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

      // Top header (Row 5)
      if (h.mergeTopCols) {
        sheet.mergeCells(5, colIndex, 5, colIndex + h.mergeTopCols - 1);
        const topCell = sheet.getCell(5, colIndex);
        topCell.value = h.top;
        topCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        topCell.font = { name: 'Khmer OS Siemreap', size: 9, bold: true };
        topCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
      } else if (!h.top && !sheet.getCell(5, colIndex).value) {
        // Merge vertically if there is no top header
        sheet.mergeCells(5, colIndex, 6, colIndex);
        const cell = sheet.getCell(5, colIndex);
        cell.value = `${h.bottom.kh}\n${h.bottom.cn}\n${h.bottom.en}`;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.font = { name: 'Khmer OS Siemreap', size: 9, bold: true };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
      }
      
      colIndex++;
    });

    sheet.getRow(5).height = 45;
    sheet.getRow(6).height = 45;

    // 4. Data Rows
    let currentRow = 7;
    const formatDate = (date: Date | null | undefined) => date ? new Date(date).toLocaleDateString('en-GB') : '';

    employees.forEach((emp, index) => {
      const row = sheet.getRow(currentRow);
      
      const rowData = [
        emp.employeeId,
        index + 1,
        emp.firstNameKh ? `${emp.firstNameKh} ${emp.lastNameKh || ''}`.trim() : '',
        `${emp.firstNameEn} ${emp.lastNameEn || ''}`.trim(),
        (emp.gender === 'MALE' || emp.gender === 'ប្រុស' || emp.gender === 'M' || emp.gender?.toLowerCase().includes('male')) ? 'M' : 'F',
        formatDate(emp.hireDate),
        emp.nationalId || '', // Using nationalId for col 8
        emp.bankCardNo || '',
        emp.department,
        emp.position,
        formatDate(emp.probationStart),
        formatDate(emp.probationEnd),
        formatDate(emp.regularContract1),
        formatDate(emp.regularContract2),
        formatDate(emp.regularContract3),
        emp.basicSalary1 || emp.basicSalary || '',
        emp.basicSalary2 || '',
        emp.basicSalary3 || '',
        emp.skillAllowance1 || '',
        emp.skillAllowance2 || '',
        emp.skillAllowance3 || '',
        emp.positionAllowance1 || '',
        emp.positionAllowance2 || '',
        emp.positionAllowance3 || '',
        formatDate(emp.dob),
        emp.nationalId || '',
        emp.placeOfBirth || '',
        emp.address || '',
        emp.education || '',
        emp.numberOfChildren || 0,
        emp.maritalStatus,
        emp.healthBook || '',
        emp.healthCertificate || '',
        emp.remark || '',
        emp.nssfNo || '',
        emp.spouseName || ''
      ];

      rowData.forEach((val, i) => {
        const cell = row.getCell(i + 1);
        cell.value = val;
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.font = { name: 'Khmer OS Siemreap', size: 9 };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
      });

      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Employee_Master_${new Date().getTime()}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Failed to generate Excel:', error);
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 });
  }
}
