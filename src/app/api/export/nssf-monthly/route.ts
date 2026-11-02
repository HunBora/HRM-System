import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const company = await prisma.companySettings.findFirst();
    const companyName = company?.companyName || 'G.STextileGarment (Cambodia) co.,Ltd';
    const exchangeRate = company?.exchangeRate || 4000;

    const payrolls = await prisma.payroll.findMany({
      where: { month, year },
      include: { employee: true },
      orderBy: { employee: { employeeId: 'asc' } },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('NSSF Monthly Declaration', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.2, right: 0.2, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
      },
    });

    // 1. Company & Document Header
    sheet.mergeCells('A1:Q1');
    sheet.getCell('A1').value = `${companyName.toUpperCase()} • NATIONAL SOCIAL SECURITY FUND (NSSF)`;
    sheet.getCell('A1').font = { name: 'Khmer OS Siemreap', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
    sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 28;

    sheet.mergeCells('A2:Q2');
    sheet.getCell('A2').value = `តារាងប្រកាសភាគទាន ប.ស.ស ប្រចាំខែ ${month} ឆ្នាំ ${year} (Monthly NSSF Contribution Declaration - ${month}/${year}) | អត្រាប្តូរប្រាក់: 1$ = ${exchangeRate.toLocaleString()} ៛`;
    sheet.getCell('A2').font = { name: 'Khmer OS Siemreap', size: 10, italic: true, color: { argb: 'FF475569' } };
    sheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(2).height = 20;

    sheet.addRow([]); // Blank spacer

    // 2. Table Headers
    const headers = [
      { id: 'no', kh: 'ល.រ', en: 'No', width: 6 },
      { id: 'empId', kh: 'អត្តលេខ', en: 'Emp ID', width: 10 },
      { id: 'nssfNo', kh: 'លេខកាត ប.ស.ស', en: 'NSSF ID', width: 14 },
      { id: 'nationalId', kh: 'អត្តសញ្ញាណប័ណ្ណ', en: 'National ID', width: 15 },
      { id: 'nameKh', kh: 'គោត្តនាម-នាម', en: 'Name Khmer', width: 18 },
      { id: 'nameEn', kh: 'ឈ្មោះឡាតាំង', en: 'Name English', width: 18 },
      { id: 'gender', kh: 'ភេទ', en: 'Sex', width: 6 },
      { id: 'dob', kh: 'ថ្ងៃខែឆ្នាំកំណើត', en: 'Date of Birth', width: 12 },
      { id: 'dept', kh: 'ផ្នែក / មុខងារ', en: 'Department', width: 16 },
      { id: 'actualWage', kh: 'ប្រាក់ឈ្នួល ($)', en: 'Gross Wage ($)', width: 12 },
      { id: 'contributoryWage', kh: 'ជាប់ភាគទាន (៛)', en: 'Contributory (៛)', width: 15 },
      { id: 'occRisk', kh: 'ហានិភ័យ (0.8%)', en: 'Occup. Risk', width: 13 },
      { id: 'healthCare', kh: 'ថែទាំសុខភាព (2.6%)', en: 'Health Care', width: 14 },
      { id: 'pensionEmp', kh: 'សោធន និយោជក (2%)', en: 'Pension (Org)', width: 14 },
      { id: 'pensionWorker', kh: 'សោធន កម្មករ (2%)', en: 'Pension (Staff)', width: 14 },
      { id: 'totalKhr', kh: 'ភាគទានសរុប (៛)', en: 'Total (KHR)', width: 15 },
      { id: 'totalUsd', kh: 'ភាគទានសរុប ($)', en: 'Total (USD)', width: 13 },
    ];

    sheet.columns = headers.map((h) => ({ key: h.id, width: h.width }));

    // Row 4: Khmer Headers
    const khHeaderRow = sheet.addRow(headers.map((h) => h.kh));
    khHeaderRow.height = 24;
    khHeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
      cell.font = { name: 'Khmer OS Siemreap', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Row 5: English Headers
    const enHeaderRow = sheet.addRow(headers.map((h) => h.en));
    enHeaderRow.height = 18;
    enHeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0369A1' } };
      cell.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FFE2E8F0' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    let sumGrossUsd = 0;
    let sumContribKhr = 0;
    let sumOccRisk = 0;
    let sumHealthCare = 0;
    let sumPensionOrg = 0;
    let sumPensionStaff = 0;
    let sumTotalKhr = 0;
    let sumTotalUsd = 0;

    // 3. Populate Rows
    payrolls.forEach((p, idx) => {
      const emp = p.employee;
      const actualGrossUsd = p.totalSalary || p.basicSalary || 0;
      const actualGrossKhr = actualGrossUsd * exchangeRate;

      // NSSF Law Cap: Floor 400,000 KHR, Ceiling 1,200,000 KHR
      const contributoryWageKhr = Math.min(1200000, Math.max(400000, actualGrossKhr));

      const occRisk = Math.round(contributoryWageKhr * 0.008);
      const healthCare = Math.round(contributoryWageKhr * 0.026);
      const pensionOrg = Math.round(contributoryWageKhr * 0.02);
      const pensionStaff = Math.round(contributoryWageKhr * 0.02);
      const rowTotalKhr = occRisk + healthCare + pensionOrg + pensionStaff;
      const rowTotalUsd = Math.round((rowTotalKhr / exchangeRate) * 100) / 100;

      sumGrossUsd += actualGrossUsd;
      sumContribKhr += contributoryWageKhr;
      sumOccRisk += occRisk;
      sumHealthCare += healthCare;
      sumPensionOrg += pensionOrg;
      sumPensionStaff += pensionStaff;
      sumTotalKhr += rowTotalKhr;
      sumTotalUsd += rowTotalUsd;

      const row = sheet.addRow({
        no: idx + 1,
        empId: emp.employeeId,
        nssfNo: emp.nssfNo || '-',
        nationalId: emp.nationalId || '-',
        nameKh: `${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.trim() || emp.firstNameEn,
        nameEn: `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim(),
        gender: emp.gender === 'MALE' || emp.gender === 'ប្រុស' ? 'ប្រុស' : 'ស្រី',
        dob: emp.dob ? new Date(emp.dob).toLocaleDateString('en-GB') : '-',
        dept: `${emp.department} • ${emp.position}`,
        actualWage: actualGrossUsd,
        contributoryWage: contributoryWageKhr,
        occRisk,
        healthCare,
        pensionEmp: pensionOrg,
        pensionWorker: pensionStaff,
        totalKhr: rowTotalKhr,
        totalUsd: rowTotalUsd,
      });

      row.height = 20;
      row.eachCell((cell, colNum) => {
        cell.font = { name: 'Khmer OS Siemreap', size: 8.5 };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        // Numbers format
        if ([1, 2, 7, 8].includes(colNum)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNum >= 10) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = colNum === 10 || colNum === 17 ? '#,##0.00' : '#,##0';
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
    });

    // 4. Totals Row
    const totalRow = sheet.addRow({
      no: '',
      empId: '',
      nssfNo: '',
      nationalId: '',
      nameKh: 'សរុបរួម (TOTAL)',
      nameEn: `TOTAL (${payrolls.length} Staff)`,
      gender: '',
      dob: '',
      dept: '',
      actualWage: sumGrossUsd,
      contributoryWage: sumContribKhr,
      occRisk: sumOccRisk,
      healthCare: sumHealthCare,
      pensionEmp: sumPensionOrg,
      pensionWorker: sumPensionStaff,
      totalKhr: sumTotalKhr,
      totalUsd: sumTotalUsd,
    });

    totalRow.height = 24;
    totalRow.eachCell((cell, colNum) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.font = { name: 'Khmer OS Siemreap', size: 9, bold: true, color: { argb: 'FF0F172A' } };
      cell.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'double' }, right: { style: 'thin' } };
      if (colNum >= 10) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = colNum === 10 || colNum === 17 ? '#,##0.00' : '#,##0';
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="NSSF_Declaration_${month}_${year}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating NSSF Excel:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
