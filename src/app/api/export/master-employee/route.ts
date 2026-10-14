import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'system'; // 'system' (default) or 'factory'

    const employees = await prisma.employee.findMany({
      orderBy: { employeeId: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(
      format === 'factory' ? 'Employee Master (Factory)' : 'Employee Master (System)',
      {
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          margins: {
            left: 0.2, right: 0.2,
            top: 0.3, bottom: 0.3,
            header: 0.2, footer: 0.2
          }
        }
      }
    );

    const formatDate = (date: Date | null | undefined) => (date ? new Date(date).toLocaleDateString('en-GB') : '');
    const formatMarital = (status: string | null | undefined) => {
      if (!status) return 'នៅលីវ';
      const s = status.toUpperCase();
      if (s.includes('MARRIED') || s.includes('រៀបការ') || s.includes('已婚')) return 'រៀបការរួច';
      return 'នៅលីវ';
    };

    if (format === 'factory') {
      // ==========================================
      // FACTORY 36-COLUMN TEMPLATE (Evergreen Format)
      // ==========================================
      const endColLetter = 'AJ'; // 36 columns

      // 1. Company Titles
      sheet.mergeCells(`A1:${endColLetter}1`);
      const t1 = sheet.getCell('A1');
      t1.value = 'ក្រុមហ៊ុន អេវើហ្គ្រីន ស្ពតធីង ហ្គូដ (ខេមបូឌា) ឯ.ក';
      t1.font = { name: 'Khmer OS Muol Light', size: 13, bold: true };
      t1.alignment = { horizontal: 'center', vertical: 'middle' };

      sheet.mergeCells(`A2:${endColLetter}2`);
      const t2 = sheet.getCell('A2');
      t2.value = '长青户外用品（柬埔寨）有限公司';
      t2.font = { name: 'SimSun', size: 11, bold: true };
      t2.alignment = { horizontal: 'center', vertical: 'middle' };

      sheet.mergeCells(`A3:${endColLetter}3`);
      const t3 = sheet.getCell('A3');
      t3.value = 'EVERGREEN SPORTING GOODS (CAMBODIA) CO., LTD';
      t3.font = { name: 'Times New Roman', size: 11, bold: true };
      t3.alignment = { horizontal: 'center', vertical: 'middle' };

      sheet.mergeCells(`A4:${endColLetter}4`);
      const rTitle = sheet.getCell('A4');
      rTitle.value = 'បញ្ជីឈ្មោះបុគ្គលិក / EMPLOYEE NAME LIST';
      rTitle.font = { name: 'Khmer OS Muol Light', size: 11, bold: true, underline: true };
      rTitle.alignment = { horizontal: 'left', vertical: 'middle' };

      const factoryHeaders = [
        { top: '', bottom: { kh: 'ល.រ', cn: '序号', en: 'No' }, width: 6 },
        { top: '', bottom: { kh: 'អត្តលេខ', cn: '编号', en: 'ID No' }, width: 10 },
        { top: '', bottom: { kh: 'ឈ្មោះខ្មែរ', cn: '柬文名字', en: 'Name Khmer' }, width: 18 },
        { top: '', bottom: { kh: 'ឈ្មោះឡាតាំង', cn: '英文名字', en: 'Name English' }, width: 18 },
        { top: '', bottom: { kh: 'ភេទ', cn: '性别', en: 'Sex' }, width: 6 },
        { top: '', bottom: { kh: 'ថ្ងៃចូលធ្វើការ', cn: '入职日期', en: 'Join Date' }, width: 12 },
        { top: '', bottom: { kh: 'អត្តសញ្ញាណប័ណ្ណ', cn: '身份证', en: 'ID No' }, width: 14 },
        { top: '', bottom: { kh: 'កាតធនាគារ', cn: '银行卡号', en: 'Card' }, width: 15 },
        { top: '', bottom: { kh: 'ផ្នែក', cn: '部门', en: 'Department' }, width: 15 },
        { top: '', bottom: { kh: 'មុខងារ', cn: '职务', en: 'Position' }, width: 15 },
        // Probation
        { top: 'កិច្ចសន្យាសាកល្បង\n试用合同\nProbation Contract', bottom: { kh: 'ចាប់ផ្តើម', cn: '开始', en: 'Start' }, width: 12, mergeTopCols: 2 },
        { top: '', bottom: { kh: 'បញ្ចប់', cn: '结束', en: 'End' }, width: 12 },
        // Regular
        { top: 'កិច្ចសន្យាការងារ លើកទី\n正式合同\nRegular Contract', bottom: { kh: 'ទី១', cn: '第一次', en: '1st' }, width: 12, mergeTopCols: 3 },
        { top: '', bottom: { kh: 'ទី២', cn: '第二次', en: '2nd' }, width: 12 },
        { top: '', bottom: { kh: 'ទី៣', cn: '第三次', en: '3rd' }, width: 12 },
        // Salary
        { top: 'ប្រាក់បៀវត្សរ៍\n基本底薪\nBasic Salary', bottom: { kh: 'ទី១', cn: '第一次', en: '1st' }, width: 12, mergeTopCols: 3 },
        { top: '', bottom: { kh: 'ទី២', cn: '第二次', en: '2nd' }, width: 12 },
        { top: '', bottom: { kh: 'ទី៣', cn: '第三次', en: '3rd' }, width: 12 },
        // Skill
        { top: 'ប្រាក់ជំនាញ\n技能补贴\nSkill Allowance', bottom: { kh: 'ទី១', cn: '第一次', en: '1st' }, width: 12, mergeTopCols: 3 },
        { top: '', bottom: { kh: 'ទី២', cn: '第二次', en: '2nd' }, width: 12 },
        { top: '', bottom: { kh: 'ទី៣', cn: '第三次', en: '3rd' }, width: 12 },
        // Position
        { top: 'ប្រាក់មុខងារ\n岗位补贴\nPosition Allowance', bottom: { kh: 'ទី១', cn: '第一次', en: '1st' }, width: 12, mergeTopCols: 3 },
        { top: '', bottom: { kh: 'ទី២', cn: '第二次', en: '2nd' }, width: 12 },
        { top: '', bottom: { kh: 'ទី៣', cn: '第三次', en: '3rd' }, width: 12 },
        // Others
        { top: '', bottom: { kh: 'ថ្ងៃខែឆ្នាំកំណើត', cn: '出生日期', en: 'Date of Birth' }, width: 12 },
        { top: '', bottom: { kh: 'លេខអត្តសញ្ញាណប័ណ្ណ', cn: '身份证号', en: 'National ID' }, width: 15 },
        { top: '', bottom: { kh: 'ទីកន្លែងកំណើត', cn: '出生地', en: 'Place of Birth' }, width: 18 },
        { top: '', bottom: { kh: 'អាស័យដ្ឋាន', cn: '地址', en: 'Address' }, width: 22 },
        { top: '', bottom: { kh: 'កម្រិតវប្បធម៌', cn: '学历', en: 'Education' }, width: 12 },
        { top: '', bottom: { kh: 'កូន', cn: '子女', en: 'Child' }, width: 7 },
        { top: '', bottom: { kh: 'ស្ថានភាពគ្រួសារ', cn: '婚姻状况', en: 'Marital Status' }, width: 12 },
        { top: '', bottom: { kh: 'សៀវភៅសុខភាព', cn: '健康证', en: 'Health Book' }, width: 12 },
        { top: '', bottom: { kh: 'សំបុត្រពេទ្យ', cn: '体检单', en: 'Health Certificate' }, width: 12 },
        { top: '', bottom: { kh: 'ផ្សេងៗ', cn: '备注', en: 'Remark' }, width: 14 },
        { top: '', bottom: { kh: 'ប.ស.ស', cn: '社保', en: 'NSSF' }, width: 14 },
        { top: '', bottom: { kh: 'ឈ្មោះប្តី/ប្រពន្ធ', cn: '配偶', en: 'Girl/Spouse Zone' }, width: 15 },
      ];

      let colIdx = 1;
      factoryHeaders.forEach((h) => {
        sheet.getColumn(colIdx).width = h.width;
        const bCell = sheet.getCell(6, colIdx);
        bCell.value = `${h.bottom.kh}\n${h.bottom.cn}\n${h.bottom.en}`;
        bCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        bCell.font = { name: 'Khmer OS Siemreap', size: 9, bold: true };
        bCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        bCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

        if (h.mergeTopCols) {
          sheet.mergeCells(5, colIdx, 5, colIdx + h.mergeTopCols - 1);
          const tCell = sheet.getCell(5, colIdx);
          tCell.value = h.top;
          tCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          tCell.font = { name: 'Khmer OS Siemreap', size: 9, bold: true };
          tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
          tCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
        } else if (!h.top && !sheet.getCell(5, colIdx).value) {
          sheet.mergeCells(5, colIdx, 6, colIdx);
          const cell = sheet.getCell(5, colIdx);
          cell.value = `${h.bottom.kh}\n${h.bottom.cn}\n${h.bottom.en}`;
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.font = { name: 'Khmer OS Siemreap', size: 9, bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
        }
        colIdx++;
      });

      sheet.getRow(5).height = 45;
      sheet.getRow(6).height = 45;

      let cRow = 7;
      employees.forEach((emp, index) => {
        const row = sheet.getRow(cRow);
        const rowData = [
          index + 1,
          emp.employeeId,
          emp.firstNameKh ? `${emp.firstNameKh} ${emp.lastNameKh || ''}`.trim() : '',
          `${emp.firstNameEn} ${emp.lastNameEn || ''}`.trim(),
          (emp.gender === 'MALE' || emp.gender === 'ប្រុស' || emp.gender === 'M') ? 'M' : 'F',
          formatDate(emp.hireDate),
          emp.cardNo || emp.nationalId || '',
          emp.bankCardNo || '',
          emp.department || '',
          emp.position || '',
          formatDate(emp.probationStart),
          formatDate(emp.probationEnd),
          formatDate(emp.regularContract1),
          formatDate(emp.regularContract2),
          formatDate(emp.regularContract3),
          emp.basicSalary1 ?? (emp.basicSalary || ''),
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
          emp.numberOfChildren ?? 0,
          formatMarital(emp.maritalStatus),
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
          if (typeof val === 'number' && i >= 15 && i <= 23) {
            cell.numFmt = '#,##0.00';
          }
        });
        row.height = 24;
        cRow++;
      });
    } else {
      // ==========================================
      // SYSTEM FORM FORMAT (Exact Match with System Form & Table)
      // ==========================================
      const endColLetter = 'AL'; // 38 columns

      // 1. Company Titles
      sheet.mergeCells(`A1:${endColLetter}1`);
      const t1 = sheet.getCell('A1');
      t1.value = 'ក្រុមហ៊ុន អេវើហ្គ្រីន ស្ពតធីង ហ្គូដ (ខេមបូឌា) ឯ.ក';
      t1.font = { name: 'Khmer OS Muol Light', size: 14, bold: true };
      t1.alignment = { horizontal: 'center', vertical: 'middle' };

      sheet.mergeCells(`A2:${endColLetter}2`);
      const t2 = sheet.getCell('A2');
      t2.value = 'EVERGREEN SPORTING GOODS (CAMBODIA) CO., LTD - 长青户外用品（柬埔寨）有限公司';
      t2.font = { name: 'Times New Roman', size: 11, bold: true };
      t2.alignment = { horizontal: 'center', vertical: 'middle' };

      sheet.mergeCells(`A3:${endColLetter}3`);
      const rTitle = sheet.getCell('A3');
      rTitle.value = 'បញ្ជីឈ្មោះបុគ្គលិកតាមទម្រង់ប្រព័ន្ធ / EMPLOYEE NAME LIST (SYSTEM FORM LAYOUT)';
      rTitle.font = { name: 'Khmer OS Muol Light', size: 12, bold: true, underline: true };
      rTitle.alignment = { horizontal: 'left', vertical: 'middle' };

      // Top Section Headers (Row 4)
      const sections = [
        { name: '១. ព័ត៌មានទូទៅ (Personal Information)', start: 1, end: 10, color: 'FFDBEAFE' },
        { name: '២. ព័ត៌មានគ្រួសារ (Family Details)', start: 11, end: 13, color: 'FFFEF3C7' },
        { name: '៣. ព័ត៌មានការងារ (Employment Details)', start: 14, end: 16, color: 'FFD1FAE5' },
        { name: '៤. កិច្ចសន្យាការងារ (Contracts)', start: 17, end: 21, color: 'FFE0E7FF' },
        { name: '៥. ប្រាក់បៀវត្សរ៍ និងប្រាក់រង្វាន់ (Salaries & Allowances)', start: 22, end: 30, color: 'FFFCE7F3' },
        { name: '៦. ឯកសារ និងព័ត៌មានផ្សេងៗ (Documents & Remark)', start: 31, end: 38, color: 'FFF1F5F9' },
      ];

      sections.forEach(sec => {
        sheet.mergeCells(4, sec.start, 4, sec.end);
        const cell = sheet.getCell(4, sec.start);
        cell.value = sec.name;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Khmer OS Siemreap', size: 10, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sec.color } };
        for (let c = sec.start; c <= sec.end; c++) {
          sheet.getCell(4, c).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
        }
      });
      sheet.getRow(4).height = 28;

      // Columns (Row 5)
      const systemColumns = [
        // 1. Personal Info (1-10)
        { kh: 'ល.រ', cn: '序号', en: 'No', width: 6 },
        { kh: 'អត្តលេខ', cn: '编号', en: 'ID No', width: 11 },
        { kh: 'ឈ្មោះខ្មែរ', cn: '柬文名字', en: 'Name Khmer', width: 18 },
        { kh: 'ឈ្មោះឡាតាំង', cn: '英文名字', en: 'Name English', width: 18 },
        { kh: 'ភេទ', cn: '性别', en: 'Sex', width: 7 },
        { kh: 'ថ្ងៃខែឆ្នាំកំណើត', cn: '出生日期', en: 'Date of Birth', width: 13 },
        { kh: 'ទីកន្លែងកំណើត', cn: '出生地', en: 'Place of Birth', width: 18 },
        { kh: 'អាស័យដ្ឋាន', cn: '地址', en: 'Address', width: 22 },
        { kh: 'លេខទូរស័ព្ទ', cn: '电话号码', en: 'Phone No', width: 14 },
        { kh: 'តេឡេក្រាម', cn: '飞机', en: 'Telegram ID', width: 14 },
        // 2. Family Info (11-13)
        { kh: 'ស្ថានភាពគ្រួសារ', cn: '婚姻状况', en: 'Marital Status', width: 14 },
        { kh: 'ឈ្មោះប្តី/ប្រពន្ធ', cn: '配偶', en: 'Spouse Name', width: 16 },
        { kh: 'ចំនួនកូន', cn: '子女', en: 'Child Q\'ty', width: 8 },
        // 3. Employment Info (14-16)
        { kh: 'ថ្ងៃចូលធ្វើការ', cn: '入职日期', en: 'Join Date', width: 13 },
        { kh: 'ផ្នែក', cn: '部门', en: 'Department', width: 15 },
        { kh: 'មុខងារ', cn: '职务', en: 'Position', width: 15 },
        // 4. Contracts (17-21)
        { kh: 'សាកល្បង ចាប់ផ្តើម', cn: '试用开始', en: 'Probation Start', width: 14 },
        { kh: 'សាកល្បង បញ្ចប់', cn: '试用结束', en: 'Probation End', width: 14 },
        { kh: 'កិច្ចសន្យា លើកទី១', cn: '正式合同 1', en: 'Regular 1st', width: 13 },
        { kh: 'កិច្ចសន្យា លើកទី២', cn: '正式合同 2', en: 'Regular 2nd', width: 13 },
        { kh: 'កិច្ចសន្យា លើកទី៣', cn: '正式合同 3', en: 'Regular 3rd', width: 13 },
        // 5. Salaries & Allowances (22-30)
        { kh: 'ប្រាក់បៀវត្សរ៍ គោល/ទី១', cn: '基本底薪 1', en: 'Basic Salary 1', width: 15 },
        { kh: 'ប្រាក់បៀវត្សរ៍ ទី២', cn: '基本底薪 2', en: 'Basic Salary 2', width: 13 },
        { kh: 'ប្រាក់បៀវត្សរ៍ ទី៣', cn: '基本底薪 3', en: 'Basic Salary 3', width: 13 },
        { kh: 'ប្រាក់ជំនាញ ទី១', cn: '技能补贴 1', en: 'Skill Allow 1', width: 13 },
        { kh: 'ប្រាក់ជំនាញ ទី២', cn: '技能补贴 2', en: 'Skill Allow 2', width: 13 },
        { kh: 'ប្រាក់ជំនាញ ទី៣', cn: '技能补贴 3', en: 'Skill Allow 3', width: 13 },
        { kh: 'ប្រាក់មុខងារ ទី១', cn: '岗位补贴 1', en: 'Pos Allow 1', width: 13 },
        { kh: 'ប្រាក់មុខងារ ទី២', cn: '岗位补贴 2', en: 'Pos Allow 2', width: 13 },
        { kh: 'ប្រាក់មុខងារ ទី៣', cn: '岗位补贴 3', en: 'Pos Allow 3', width: 13 },
        // 6. Documents & Remark (31-38)
        { kh: 'លេខកាតសម្គាល់', cn: '卡号', en: 'Card No', width: 13 },
        { kh: 'លេខអត្តសញ្ញាណប័ណ្ណ', cn: '身份证号', en: 'National ID', width: 16 },
        { kh: 'កម្រិតវប្បធម៌', cn: '学历', en: 'Education', width: 13 },
        { kh: 'កាតធនាគារ', cn: '银行卡号', en: 'Bank Card No', width: 16 },
        { kh: 'ប.ស.ស', cn: '社保', en: 'NSSF No', width: 14 },
        { kh: 'សៀវភៅសុខភាព', cn: '健康证', en: 'Health Book', width: 13 },
        { kh: 'សំបុត្រពេទ្យ', cn: '体检单', en: 'Health Cert.', width: 13 },
        { kh: 'ផ្សេងៗ', cn: '备注', en: 'Remark', width: 16 },
      ];

      systemColumns.forEach((col, idx) => {
        sheet.getColumn(idx + 1).width = col.width;
        const cell = sheet.getCell(5, idx + 1);
        cell.value = `${col.kh}\n${col.cn}\n${col.en}`;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.font = { name: 'Khmer OS Siemreap', size: 9, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
      });
      sheet.getRow(5).height = 48;

      let cRow = 6;
      employees.forEach((emp, index) => {
        const row = sheet.getRow(cRow);
        const rowData = [
          index + 1,
          emp.employeeId,
          emp.firstNameKh ? `${emp.firstNameKh} ${emp.lastNameKh || ''}`.trim() : '',
          `${emp.firstNameEn} ${emp.lastNameEn || ''}`.trim(),
          (emp.gender === 'MALE' || emp.gender === 'ប្រុស' || emp.gender === 'M') ? 'ប្រុស' : 'ស្រី',
          formatDate(emp.dob),
          emp.placeOfBirth || '',
          emp.address || '',
          emp.phone || '',
          emp.telegramChatId || '',
          formatMarital(emp.maritalStatus),
          emp.spouseName || '',
          emp.numberOfChildren ?? 0,
          formatDate(emp.hireDate),
          emp.department || '',
          emp.position || '',
          formatDate(emp.probationStart),
          formatDate(emp.probationEnd),
          formatDate(emp.regularContract1),
          formatDate(emp.regularContract2),
          formatDate(emp.regularContract3),
          emp.basicSalary1 ?? (emp.basicSalary || ''),
          emp.basicSalary2 || '',
          emp.basicSalary3 || '',
          emp.skillAllowance1 || '',
          emp.skillAllowance2 || '',
          emp.skillAllowance3 || '',
          emp.positionAllowance1 || '',
          emp.positionAllowance2 || '',
          emp.positionAllowance3 || '',
          emp.cardNo || '',
          emp.nationalId || '',
          emp.education || '',
          emp.bankCardNo || '',
          emp.nssfNo || '',
          emp.healthBook || '',
          emp.healthCertificate || '',
          emp.remark || ''
        ];

        rowData.forEach((val, i) => {
          const cell = row.getCell(i + 1);
          cell.value = val;
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          cell.font = { name: 'Khmer OS Siemreap', size: 9 };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
          if (typeof val === 'number' && i >= 21 && i <= 29) {
            cell.numFmt = '#,##0.00';
          }
        });
        row.height = 24;
        cRow++;
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = format === 'factory'
      ? `Employee_Factory_Master_${Date.now()}.xlsx`
      : `Employee_System_Master_${Date.now()}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Failed to generate Excel:', error);
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 });
  }
}
