import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

function computeCambodianTaxOnSalary(taxBaseKhr: number, isResident: boolean = true): { taxKhr: number; ratePercent: number } {
  if (!isResident) {
    return { taxKhr: Math.round(taxBaseKhr * 0.20), ratePercent: 20 };
  }
  if (taxBaseKhr <= 1500000) {
    return { taxKhr: 0, ratePercent: 0 };
  } else if (taxBaseKhr <= 2000000) {
    return { taxKhr: Math.max(0, Math.round(taxBaseKhr * 0.05 - 75000)), ratePercent: 5 };
  } else if (taxBaseKhr <= 8500000) {
    return { taxKhr: Math.max(0, Math.round(taxBaseKhr * 0.10 - 175000)), ratePercent: 10 };
  } else if (taxBaseKhr <= 12500000) {
    return { taxKhr: Math.max(0, Math.round(taxBaseKhr * 0.15 - 600000)), ratePercent: 15 };
  } else {
    return { taxKhr: Math.max(0, Math.round(taxBaseKhr * 0.20 - 1225000)), ratePercent: 20 };
  }
}

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
    const sheet = workbook.addWorksheet('GDT Tax on Salary', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.2, right: 0.2, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
      },
    });

    // 1. Company & Tax Header
    sheet.mergeCells('A1:R1');
    sheet.getCell('A1').value = `${companyName.toUpperCase()} • GENERAL DEPARTMENT OF TAXATION (GDT)`;
    sheet.getCell('A1').font = { name: 'Khmer OS Siemreap', size: 14, bold: true, color: { argb: 'FF991B1B' } };
    sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 28;

    sheet.mergeCells('A2:R2');
    sheet.getCell('A2').value = `តារាងប្រកាសពន្ធលើប្រាក់បៀវត្ស (TOST) ប្រចាំខែ ${month} ឆ្នាំ ${year} | អត្រាប្តូរប្រាក់ផ្លូវការ: 1$ = ${exchangeRate.toLocaleString()} ៛`;
    sheet.getCell('A2').font = { name: 'Khmer OS Siemreap', size: 10, italic: true, color: { argb: 'FF475569' } };
    sheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(2).height = 20;

    sheet.addRow([]); // Blank spacer

    // 2. Table Headers
    const headers = [
      { id: 'no', kh: 'ល.រ', en: 'No', width: 6 },
      { id: 'empId', kh: 'អត្តលេខ', en: 'Emp ID', width: 10 },
      { id: 'tinOrId', kh: 'លេខសារពើពន្ធ / អត្តសញ្ញាណប័ណ្ណ', en: 'TIN / National ID', width: 18 },
      { id: 'nameKh', kh: 'គោត្តនាម-នាម', en: 'Name Khmer', width: 18 },
      { id: 'nameEn', kh: 'ឈ្មោះឡាតាំង', en: 'Name English', width: 18 },
      { id: 'resident', kh: 'និវាសនជន', en: 'Resident', width: 10 },
      { id: 'marital', kh: 'ស្ថានភាពគ្រួសារ', en: 'Marital', width: 12 },
      { id: 'spouse', kh: 'បន្ទុកសហព័ទ្ធ', en: 'Spouse Relief', width: 12 },
      { id: 'children', kh: 'កូនក្នុងបន្ទុក', en: 'Child Relief', width: 12 },
      { id: 'totalReliefKhr', kh: 'កាត់បន្ថយសរុប (៛)', en: 'Family Relief (៛)', width: 15 },
      { id: 'grossWageUsd', kh: 'ប្រាក់បៀវត្ស ($)', en: 'Gross Wage ($)', width: 13 },
      { id: 'grossWageKhr', kh: 'ប្រាក់បៀវត្ស (៛)', en: 'Gross Wage (៛)', width: 15 },
      { id: 'pensionDeductKhr', kh: 'កាត់សោធន ប.ស.ស', en: 'Pension Ded.', width: 14 },
      { id: 'taxBaseKhr', kh: 'មូលដ្ឋានគិតពន្ធ (៛)', en: 'Tax Base (៛)', width: 15 },
      { id: 'taxRate', kh: 'អត្រាពន្ធ', en: 'Rate', width: 8 },
      { id: 'taxPayableKhr', kh: 'ពន្ធត្រូវបង់ (៛)', en: 'Tax Payable (៛)', width: 14 },
      { id: 'taxPayableUsd', kh: 'ពន្ធត្រូវបង់ ($)', en: 'Tax Payable ($)', width: 13 },
      { id: 'netSalaryUsd', kh: 'ប្រាក់ខែបើកជាក់ស្តែង', en: 'Net Pay ($)', width: 14 },
    ];

    sheet.columns = headers.map((h) => ({ key: h.id, width: h.width }));

    // Row 4: Khmer Headers
    const khHeaderRow = sheet.addRow(headers.map((h) => h.kh));
    khHeaderRow.height = 24;
    khHeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
      cell.font = { name: 'Khmer OS Siemreap', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Row 5: English Headers
    const enHeaderRow = sheet.addRow(headers.map((h) => h.en));
    enHeaderRow.height = 18;
    enHeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF991B1B' } };
      cell.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FFFEE2E2' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    let sumGrossUsd = 0;
    let sumGrossKhr = 0;
    let sumReliefKhr = 0;
    let sumTaxBaseKhr = 0;
    let sumTaxPayableKhr = 0;
    let sumTaxPayableUsd = 0;
    let sumNetUsd = 0;

    // 3. Populate Rows
    payrolls.forEach((p, idx) => {
      const emp = p.employee;
      const grossWageUsd = p.totalSalary || p.basicSalary || 0;
      const grossWageKhr = Math.round(grossWageUsd * exchangeRate);

      // Family Relief: 150,000 KHR each for spouse & minor children
      const hasSpouse = emp.spouse || emp.maritalStatus === 'MARRIED';
      const spouseReliefKhr = hasSpouse ? 150000 : 0;
      const childrenReliefKhr = (emp.numberOfChildren || 0) * 150000;
      const totalReliefKhr = spouseReliefKhr + childrenReliefKhr;

      // NSSF Pension Employee Deduction (2% of contributory wage - capped at 1,200,000)
      const contributoryKhr = Math.min(1200000, Math.max(400000, grossWageKhr));
      const pensionDeductKhr = Math.round(contributoryKhr * 0.02);

      // Tax Base in KHR
      const taxBaseKhr = Math.max(0, grossWageKhr - totalReliefKhr - pensionDeductKhr);

      // Progressive Tax Bracket
      const { taxKhr, ratePercent } = computeCambodianTaxOnSalary(taxBaseKhr, true);
      const taxUsd = Math.round((taxKhr / exchangeRate) * 100) / 100;
      const netPayUsd = p.netSalaryUsd || (grossWageUsd - taxUsd);

      sumGrossUsd += grossWageUsd;
      sumGrossKhr += grossWageKhr;
      sumReliefKhr += totalReliefKhr;
      sumTaxBaseKhr += taxBaseKhr;
      sumTaxPayableKhr += taxKhr;
      sumTaxPayableUsd += taxUsd;
      sumNetUsd += netPayUsd;

      const row = sheet.addRow({
        no: idx + 1,
        empId: emp.employeeId,
        tinOrId: emp.nationalId || emp.bankCardNo || '-',
        nameKh: `${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.trim() || emp.firstNameEn,
        nameEn: `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim(),
        resident: 'និវាសនជន',
        marital: hasSpouse ? 'រៀបការរួច' : 'នៅលីវ',
        spouse: spouseReliefKhr > 0 ? spouseReliefKhr : '-',
        children: childrenReliefKhr > 0 ? childrenReliefKhr : '-',
        totalReliefKhr,
        grossWageUsd,
        grossWageKhr,
        pensionDeductKhr,
        taxBaseKhr,
        taxRate: `${ratePercent}%`,
        taxPayableKhr: taxKhr,
        taxPayableUsd: taxUsd,
        netSalaryUsd: netPayUsd,
      });

      row.height = 20;
      row.eachCell((cell, colNum) => {
        cell.font = { name: 'Khmer OS Siemreap', size: 8.5 };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        if ([1, 2, 6, 7, 15].includes(colNum)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNum >= 8) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = [11, 17, 18].includes(colNum) ? '#,##0.00' : '#,##0';
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
    });

    // 4. Totals Row
    const totalRow = sheet.addRow({
      no: '',
      empId: '',
      tinOrId: '',
      nameKh: 'សរុបរួម (TOTAL)',
      nameEn: `TOTAL (${payrolls.length} Staff)`,
      resident: '',
      marital: '',
      spouse: '',
      children: '',
      totalReliefKhr: sumReliefKhr,
      grossWageUsd: sumGrossUsd,
      grossWageKhr: sumGrossKhr,
      pensionDeductKhr: '',
      taxBaseKhr: sumTaxBaseKhr,
      taxRate: '',
      taxPayableKhr: sumTaxPayableKhr,
      taxPayableUsd: sumTaxPayableUsd,
      netSalaryUsd: sumNetUsd,
    });

    totalRow.height = 24;
    totalRow.eachCell((cell, colNum) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      cell.font = { name: 'Khmer OS Siemreap', size: 9, bold: true, color: { argb: 'FF991B1B' } };
      cell.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'double' }, right: { style: 'thin' } };
      if (colNum >= 10) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = [11, 17, 18].includes(colNum) ? '#,##0.00' : '#,##0';
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="GDT_TOST_Tax_Salary_${month}_${year}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating GDT Tax Excel:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
