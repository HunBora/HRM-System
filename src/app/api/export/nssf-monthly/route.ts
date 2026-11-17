import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';
import { calculateNssfFullContribution, getNssfWageLimits } from '@/lib/nssf';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const format = searchParams.get('format') || 'xlsx';

    const company = await prisma.companySettings.findFirst();
    const companyName = company?.companyName || 'G.STextileGarment (Cambodia) co.,Ltd';
    const exchangeRate = company?.exchangeRate || 4000;

    const payrolls = await prisma.payroll.findMany({
      where: { month, year },
      include: { employee: true },
      orderBy: { employee: { employeeId: 'asc' } },
    });

    const periodStr = `${year}-${String(month).padStart(2, '0')}-01`;

    // Calculate row data matching exact NSSF Standard Columns
    const processedRows = payrolls.map((p, idx) => {
      const emp = p.employee;
      const actualGrossUsd = p.totalSalary || p.basicSalary || 0;
      const actualGrossKhr = Math.round(actualGrossUsd * exchangeRate);

      const contrib = calculateNssfFullContribution(
        actualGrossKhr,
        emp.dob,
        month,
        year,
        exchangeRate
      );

      // Name splitting: Cambodian standard format
      const lastNameKh = emp.lastNameKh || '';
      const firstNameKh = emp.firstNameKh || '';
      const lastNameEn = emp.lastNameEn || '';
      const firstNameEn = emp.firstNameEn || '';

      const dobStr = emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '';
      const hireDateStr = emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : '';
      const nationality = emp.nationality || 'ខ្មែរ';
      const gender = emp.gender === 'MALE' || emp.gender === 'ប្រុស' ? 'ប្រុស' : 'ស្រី';

      return {
        no: idx + 1,
        empId: emp.employeeId,
        nssfNo: emp.nssfNo || '',
        nationalId: emp.nationalId || '',
        lastNameKh,
        firstNameKh,
        lastNameEn,
        firstNameEn,
        gender,
        dob: dobStr,
        nationality,
        hireDate: hireDateStr,
        group: emp.line || emp.department || '',
        position: emp.position || '',
        workerType: 'ក្នុងប្រព័ន្ធ',
        status: 'កំពុងធ្វើការ',
        wageUsd: actualGrossUsd,
        wageKhr: actualGrossKhr,
        occRisk: contrib.occRiskKhr,
        healthCare: contrib.healthCareKhr,
        pensionOrg: contrib.pensionOrgKhr,
        pensionWorker: contrib.pensionStaffKhr,
        total: contrib.totalKhr,
        isPensionExempt: contrib.isPensionExempt,
      };
    });

    // If user requested CSV (direct upload to e-NSSF portal)
    if (format === 'csv') {
      const csvLines: string[] = [];
      // Row 1: Header metadata
      csvLines.push(`,,,,,,,,,,,,,,,,,,បង់ភាគទានសម្រាប់ខែ,${periodStr},,,`);
      // Row 2: Standard 23 Columns
      csvLines.push(
        'ល.រ,"អត្ត.នៅ\nសហគ្រាស","លេខអត្ត.\nប.ស.ស",អត្ត.ប្រជាពលរដ្ឋ,គោតនាម,នាម,"គោតនាម\nឡាតាំង","នាម\nឡាតាំង",ភេទ,ថ្ងៃខែឆ្នាំកំណើត,សញ្ជាតិ,កាលបរិ.ចូលធ្វើការ,ក្រុម,តួនាទី,"ប្រភេទកម្មករ\nនិយោជិត",ស្ថានភាព,ប្រាក់បៀវត្ស（ដុល្លា）,ប្រាក់បៀវត្ស(រៀល）,0.008,0.026,0.02,0.02,Total'
      );

      let sumWageKhr = 0;
      let sumOccRisk = 0;
      let sumHealthCare = 0;
      let sumPensionOrg = 0;
      let sumPensionWorker = 0;
      let sumTotal = 0;

      processedRows.forEach((r) => {
        sumWageKhr += r.wageKhr;
        sumOccRisk += r.occRisk;
        sumHealthCare += r.healthCare;
        sumPensionOrg += r.pensionOrg;
        sumPensionWorker += r.pensionWorker;
        sumTotal += r.total;

        csvLines.push(
          [
            r.no,
            `"${r.empId}"`,
            `"${r.nssfNo}"`,
            `"${r.nationalId}"`,
            `"${r.lastNameKh}"`,
            `"${r.firstNameKh}"`,
            `"${r.lastNameEn}"`,
            `"${r.firstNameEn}"`,
            r.gender,
            r.dob,
            `"${r.nationality}"`,
            r.hireDate,
            `"${r.group}"`,
            `"${r.position}"`,
            r.workerType,
            r.status,
            r.wageUsd,
            r.wageKhr,
            r.occRisk,
            r.healthCare,
            r.pensionOrg,
            r.pensionWorker,
            r.total,
          ].join(',')
        );
      });

      // Total Row
      csvLines.push(
        `,,,,,,,,,,,,,,,,,${sumWageKhr},${sumOccRisk},${sumHealthCare},${sumPensionOrg},${sumPensionWorker},"${sumTotal.toLocaleString()}"`
      );

      const csvContent = '\uFEFF' + csvLines.join('\r\n'); // Add UTF-8 BOM
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="NSSF_Declaration_${month}_${year}.csv"`,
        },
      });
    }

    // Default: Excel (.xlsx) workbook with Sheet 1 = NSSF Official Format, Sheet 2 = Internal Summary
    const workbook = new ExcelJS.Workbook();

    // ==========================================
    // SHEET 1: EXACT NSSF OFFICIAL STANDARD FORM
    // ==========================================
    const officialSheet = workbook.addWorksheet('ទម្រង់ផ្លូវការ ប.ស.ស', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    // Row 1: Period Header matching NSSF e-form
    officialSheet.getCell('S1').value = 'បង់ភាគទានសម្រាប់ខែ';
    officialSheet.getCell('S1').font = { name: 'Khmer OS Siemreap', size: 9, bold: true };
    officialSheet.getCell('S1').alignment = { horizontal: 'right', vertical: 'middle' };

    officialSheet.getCell('T1').value = periodStr;
    officialSheet.getCell('T1').font = { name: 'Khmer OS Siemreap', size: 9, bold: true, color: { argb: 'FF0284C7' } };
    officialSheet.getCell('T1').alignment = { horizontal: 'center', vertical: 'middle' };
    officialSheet.getRow(1).height = 22;

    // Row 2: Standard 23 Headers
    const standardHeaders = [
      { id: 'no', label: 'ល.រ', width: 5 },
      { id: 'empId', label: 'អត្ត.នៅ\nសហគ្រាស', width: 11 },
      { id: 'nssfNo', label: 'លេខអត្ត.\nប.ស.ស', width: 13 },
      { id: 'nationalId', label: 'អត្ត.ប្រជាពលរដ្ឋ', width: 14 },
      { id: 'lastNameKh', label: 'គោតនាម', width: 12 },
      { id: 'firstNameKh', label: 'នាម', width: 12 },
      { id: 'lastNameEn', label: 'គោតនាម\nឡាតាំង', width: 13 },
      { id: 'firstNameEn', label: 'នាម\nឡាតាំង', width: 13 },
      { id: 'gender', label: 'ភេទ', width: 6 },
      { id: 'dob', label: 'ថ្ងៃខែឆ្នាំកំណើត', width: 13 },
      { id: 'nationality', label: 'សញ្ជាតិ', width: 9 },
      { id: 'hireDate', label: 'កាលបរិ.ចូលធ្វើការ', width: 14 },
      { id: 'group', label: 'ក្រុម', width: 12 },
      { id: 'position', label: 'តួនាទី', width: 16 },
      { id: 'workerType', label: 'ប្រភេទកម្មករ\nនិយោជិត', width: 14 },
      { id: 'status', label: 'ស្ថានភាព', width: 12 },
      { id: 'wageUsd', label: 'ប្រាក់បៀវត្ស（ដុល្លា）', width: 14 },
      { id: 'wageKhr', label: 'ប្រាក់បៀវត្ស(រៀល）', width: 16 },
      { id: 'occRisk', label: '0.008', width: 10 },
      { id: 'healthCare', label: '0.026', width: 11 },
      { id: 'pensionOrg', label: '0.02', width: 10 },
      { id: 'pensionWorker', label: '0.02', width: 10 },
      { id: 'total', label: 'Total', width: 13 },
    ];

    officialSheet.columns = standardHeaders.map((h) => ({ key: h.id, width: h.width }));

    const headerRow = officialSheet.addRow(standardHeaders.map((h) => h.label));
    headerRow.height = 32;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.font = { name: 'Khmer OS Siemreap', size: 8.5, bold: true, color: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
    });

    let sumWageUsd = 0;
    let sumWageKhr = 0;
    let sumOccRisk = 0;
    let sumHealthCare = 0;
    let sumPensionOrg = 0;
    let sumPensionWorker = 0;
    let sumTotal = 0;

    processedRows.forEach((r) => {
      sumWageUsd += r.wageUsd;
      sumWageKhr += r.wageKhr;
      sumOccRisk += r.occRisk;
      sumHealthCare += r.healthCare;
      sumPensionOrg += r.pensionOrg;
      sumPensionWorker += r.pensionWorker;
      sumTotal += r.total;

      const row = officialSheet.addRow(r);
      row.height = 20;
      row.eachCell((cell, colNum) => {
        cell.font = { name: 'Khmer OS Siemreap', size: 8.5 };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        if ([1, 2, 3, 4, 9, 10, 11, 12, 15, 16].includes(colNum)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNum >= 17) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = colNum === 17 ? '#,##0.00' : '#,##0';
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
    });

    // Total Row for Official Sheet
    const totalRow = officialSheet.addRow({
      no: '',
      empId: '',
      nssfNo: '',
      nationalId: '',
      lastNameKh: '',
      firstNameKh: '',
      lastNameEn: '',
      firstNameEn: '',
      gender: '',
      dob: '',
      nationality: '',
      hireDate: '',
      group: '',
      position: '',
      workerType: '',
      status: 'សរុបរួម',
      wageUsd: sumWageUsd,
      wageKhr: sumWageKhr,
      occRisk: sumOccRisk,
      healthCare: sumHealthCare,
      pensionOrg: sumPensionOrg,
      pensionWorker: sumPensionWorker,
      total: sumTotal,
    });

    totalRow.height = 24;
    totalRow.eachCell((cell, colNum) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.font = { name: 'Khmer OS Siemreap', size: 9, bold: true, color: { argb: 'FF0F172A' } };
      cell.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'double' }, right: { style: 'thin' } };
      if (colNum >= 17) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = colNum === 17 ? '#,##0.00' : '#,##0';
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    // ==========================================
    // SHEET 2: MANAGEMENT SUMMARY IN 3 LANGUAGES
    // ==========================================
    const summarySheet = workbook.addWorksheet('របាយការណ៍សង្ខេប (Summary)', {
      pageSetup: { paperSize: 9, orientation: 'portrait' },
    });

    summarySheet.mergeCells('A1:E1');
    summarySheet.getCell('A1').value = `${companyName.toUpperCase()} • NSSF DECLARATION SUMMARY`;
    summarySheet.getCell('A1').font = { name: 'Khmer OS Siemreap', size: 13, bold: true, color: { argb: 'FF1E3A8A' } };
    summarySheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    summarySheet.mergeCells('A2:E2');
    const limits = getNssfWageLimits(month, year, exchangeRate);
    summarySheet.getCell('A2').value = `ខែ ${month} ឆ្នាំ ${year} | អប្បបរមា: ${limits.minWageKhr.toLocaleString()} ៛ | ពិដាន: ${limits.maxWageKhr.toLocaleString()} ៛ | អត្រាប្តូរប្រាក់: 1$ = ${exchangeRate.toLocaleString()} ៛`;
    summarySheet.getCell('A2').font = { name: 'Khmer OS Siemreap', size: 9.5, italic: true, color: { argb: 'FF475569' } };
    summarySheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

    summarySheet.addRow([]); // Blank spacer

    summarySheet.columns = [
      { key: 'itemKh', width: 34 },
      { key: 'itemEn', width: 28 },
      { key: 'rate', width: 14 },
      { key: 'amountKhr', width: 20 },
      { key: 'amountUsd', width: 16 },
    ];

    const sumHead = summarySheet.addRow(['មុខទំនិញ / ភាគទាន', 'Description', 'អត្រា (Rate)', 'សរុប (រៀល)', 'សរុប (USD)']);
    sumHead.font = { name: 'Khmer OS Siemreap', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    sumHead.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
    });

    const summaryRows = [
      {
        itemKh: '១. ហានិភ័យការងារ (និយោជក ១០០%)',
        itemEn: 'Occupational Risk (Employer 100%)',
        rate: '0.8%',
        khr: sumOccRisk,
        usd: sumOccRisk / exchangeRate,
      },
      {
        itemKh: '២. ថែទាំសុខភាព (និយោជក ១០០%)',
        itemEn: 'Health Care (Employer 100%)',
        rate: '2.6%',
        khr: sumHealthCare,
        usd: sumHealthCare / exchangeRate,
      },
      {
        itemKh: '៣. របបសោធន - និយោជក',
        itemEn: 'Pension - Employer Portion',
        rate: '2.0%',
        khr: sumPensionOrg,
        usd: sumPensionOrg / exchangeRate,
      },
      {
        itemKh: '៤. របបសោធន - កម្មករ (កាត់ពីប្រាក់ខែ)',
        itemEn: 'Pension - Worker Deduction',
        rate: '2.0%',
        khr: sumPensionWorker,
        usd: sumPensionWorker / exchangeRate,
      },
      {
        itemKh: 'សរុបភាគីរោងចក្របង់ (និយោជក)',
        itemEn: 'Subtotal Employer Liability',
        rate: '5.4%',
        khr: sumOccRisk + sumHealthCare + sumPensionOrg,
        usd: (sumOccRisk + sumHealthCare + sumPensionOrg) / exchangeRate,
      },
      {
        itemKh: 'សរុបភាគីកម្មករបង់ (កាត់ប្រាក់ខែ)',
        itemEn: 'Subtotal Employee Deduction',
        rate: '2.0%',
        khr: sumPensionWorker,
        usd: sumPensionWorker / exchangeRate,
      },
      {
        itemKh: 'សរុបភាគទាន ប.ស.ស. ត្រូវបង់រួម',
        itemEn: 'GRAND TOTAL NSSF REMITTANCE',
        rate: '7.4%',
        khr: sumTotal,
        usd: sumTotal / exchangeRate,
      },
    ];

    summaryRows.forEach((r, idx) => {
      const isTotal = idx === summaryRows.length - 1;
      const isSub = idx === 4 || idx === 5;
      const sRow = summarySheet.addRow([r.itemKh, r.itemEn, r.rate, r.khr, r.usd]);
      sRow.height = 22;
      sRow.eachCell((cell, colNum) => {
        cell.font = {
          name: 'Khmer OS Siemreap',
          size: isTotal ? 10 : 9,
          bold: isTotal || isSub,
          color: { argb: isTotal ? 'FF1E3A8A' : 'FF0F172A' },
        };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: isTotal ? 'double' : 'thin' }, right: { style: 'thin' } };
        if (colNum === 3) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNum === 4) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0 "៛"';
        } else if (colNum === 5) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '"$"#,##0.00';
        }
        if (isTotal) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
        }
      });
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
