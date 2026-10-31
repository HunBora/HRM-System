import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const hideEmpty = searchParams.get('hideEmpty') !== 'false'; // Auto-hide empty columns by default

    const company = await prisma.companySettings.findFirst();
    const companyName = company?.companyName || "G.STextileGarment(Cambodia)co.,Ltd";

    const payrolls = await prisma.payroll.findMany({
      where: { month, year },
      include: { employee: true },
      orderBy: { employee: { employeeId: 'asc' } }
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Payslip Strips', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.25, right: 0.25,
          top: 0.4, bottom: 0.4,
          header: 0.2, footer: 0.2
        }
      }
    });

    const allHeaders = [
      { id: 'no', kh: 'ល.រ', en: 'No', zh: '序号', width: 5 },
      { id: 'empId', kh: 'អត្តលេខ', en: 'ID', zh: '工号', width: 9 },
      { id: 'nameKh', kh: 'ឈ្មោះ', en: 'Name', zh: '姓名', width: 15 },
      { id: 'nameEn', kh: 'ឈ្មោះឡាតាំង', en: 'Name', zh: '姓名', width: 15 },
      { id: 'department', kh: 'ផ្នែក', en: 'Dept', zh: '部门', width: 11 },
      { id: 'line', kh: 'ឡាញ', en: 'Line', zh: '组', width: 6 },
      { id: 'position', kh: 'មុខងារ', en: 'Position', zh: '职务', width: 12 },
      { id: 'shift', kh: 'វេន', en: 'N.T', zh: '班次', width: 6 },
      { id: 'gender', kh: 'ភេទ', en: 'Sex', zh: '性别', width: 6 },
      { id: 'spouse', kh: 'ប្រពន្ធ', en: 'Wife', zh: '配偶', width: 6 },
      { id: 'children', kh: 'កូន', en: 'Child', zh: '孩子', width: 6 },
      { id: 'hireDate', kh: 'ថ្ងៃចូលធ្វើការ', en: 'Start Date', zh: '入职日期', width: 12 },
      { id: 'basicSalary', kh: 'ប្រាក់គោល', en: 'B. Salary', zh: '底薪', width: 10 },
      { id: 'basicPayScale', kh: 'ប្រាក់បន្ថែម', en: 'Basic Pay Scale', zh: '岗位薪资', width: 10 },
      { id: 'workingDays', kh: 'ថ្ងៃធ្វើការ', en: 'W. Day', zh: '工作天数', width: 7 },
      { id: 'absent', kh: 'អវត្តមាន', en: 'Absent', zh: '旷工', width: 7 },
      { id: 'permission', kh: 'មានច្បាប់', en: 'Permission', zh: '请假', width: 7 },
      { id: 'workingSalary', kh: 'ប្រាក់ខែធ្វើការ', en: 'M. Salary', zh: '工作工资', width: 10 },
      { id: 'payScaleIncentive', kh: 'រង្វាន់ថែម', en: 'Pay Scale Incentive', zh: '岗位津贴', width: 10 },
      { id: 'otHours', kh: 'ថែមម៉ោងធម្មតា', en: 'OT Hour', zh: '平时加班时', width: 7 },
      { id: 'otWage', kh: 'ប្រាក់ថែមម៉ោង', en: 'Wage', zh: '平时加班费', width: 9 },
      { id: 'sunOtHours', kh: 'ថ្ងៃអាទិត្យ', en: 'Sun OT Hour', zh: '星期日加班时', width: 7 },
      { id: 'sunOtWage', kh: 'ប្រាក់', en: 'Wage', zh: '星期日加班费', width: 9 },
      { id: 'nightOtHours', kh: 'ថែមម៉ោងយប់', en: 'N. OT Hour', zh: '夜班加班时', width: 7 },
      { id: 'nightOtWage', kh: 'ប្រាក់', en: 'Wage', zh: '夜班加班费', width: 9 },
      { id: 'annualLeave', kh: 'ច្បាប់ឈប់សម្រាក', en: 'Annual Leave', zh: '年假', width: 9 },
      { id: 'attBonus', kh: 'រង្វាន់ទៀងទាត់', en: 'Att. Bonus', zh: '全勤奖', width: 9 },
      { id: 'transport', kh: 'ប្រាក់ធ្វើដំណើរ', en: 'Transportation', zh: '车费补贴', width: 9 },
      { id: 'lunch', kh: 'ប្រាក់អាហារ', en: 'Lunch Allowance', zh: '午餐费', width: 9 },
      { id: 'otMeal', kh: 'អាហារថែមម៉ោង', en: 'OT Meal Allowance', zh: '加班餐补', width: 9 },
      { id: 'dayCare', kh: 'ប្រាក់កូនតូច', en: 'Day Care Allowance', zh: '育儿费', width: 9 },
      { id: 'seniority', kh: 'ប្រាក់អតីតភាព', en: 'Seniority', zh: '工龄津贴', width: 9 },
      { id: 'seniorityIndemnity', kh: 'សំណងអតីតភាព', en: 'Seniority Indemnity', zh: '工龄奖', width: 9 },
      { id: 'productionIncentive', kh: 'រង្វាន់ផលិតកម្ម', en: 'Production Incentive', zh: '超产奖金', width: 9 },
      { id: 'adjust', kh: 'ប្រាក់កែតម្រូវ', en: 'Adjust', zh: '调整金额', width: 9 },
      { id: 'totalSalary', kh: 'ប្រាក់ខែសរុប', en: 'Total Salary', zh: '合计工资', width: 11 },
      { id: 'severancePay', kh: '5%', en: '5% Severance Pay', zh: '5%', width: 9 },
      { id: 'tax', kh: 'ពន្ធ', en: 'Tax payment', zh: '扣税', width: 8 },
      { id: 'loanPension', kh: 'ប្រាក់ខ្ចី', en: 'Loan/Pension', zh: '借款及养老金', width: 9 },
      { id: 'firstPayment', kh: 'បើកលើកទី១', en: '1st Salary paid', zh: '第一次发放', width: 10 },
      { id: 'union', kh: 'សហជីព', en: 'Union Deduction', zh: '工会费', width: 8 },
      { id: 'secondPayment', kh: 'បើកលើកទី២', en: '2nd Salary paid', zh: '第二次发放', width: 10 },
      { id: 'paidSalaryUsd', kh: 'ប្រាក់ត្រូវបើកUSD', en: 'Paid Salary USD', zh: '实发薪水USD', width: 11 },
      { id: 'riel', kh: 'ប្រាក់រៀល', en: 'RIEL', zh: '瑞尔', width: 12 },
      { id: 'signature', kh: 'ហត្ថលេខា', en: 'Signature', zh: '签名', width: 12 }
    ];

    // Check if column has non-empty, non-zero data across all employees
    const isColumnActive = (hId: string): boolean => {
      const MANDATORY = ['no', 'empId', 'nameKh', 'nameEn', 'department', 'position', 'basicSalary', 'workingDays', 'totalSalary', 'paidSalaryUsd', 'riel', 'signature'];
      if (MANDATORY.includes(hId)) return true;

      return payrolls.some(p => {
        const emp = p.employee;
        switch (hId) {
          case 'line': return !!(emp.line && emp.line !== '-');
          case 'shift': return !!(emp.shift && emp.shift !== '-');
          case 'gender': return !!emp.gender;
          case 'spouse': return !!emp.spouse;
          case 'children': return (emp.numberOfChildren || 0) > 0;
          case 'hireDate': return !!emp.hireDate;
          case 'basicPayScale': return (p.basicPayScale || 0) > 0;
          case 'absent': return (p.absentDays || 0) > 0;
          case 'permission': return (p.permissionDays || 0) > 0;
          case 'workingSalary': return (p.workingSalary || 0) > 0;
          case 'payScaleIncentive': return (p.payScaleIncentive || 0) > 0;
          case 'otHours': return (p.otHours || 0) > 0;
          case 'otWage': return (p.otWage || 0) > 0;
          case 'sunOtHours': return (p.sunOtHours || 0) > 0;
          case 'sunOtWage': return (p.sunOtWage || 0) > 0;
          case 'nightOtHours': return (p.nightOtHours || 0) > 0;
          case 'nightOtWage': return (p.nightOtWage || 0) > 0;
          case 'annualLeave': return (p.annualLeaveAmount || 0) > 0;
          case 'attBonus': return (p.attendanceBonus || 0) > 0;
          case 'transport': return (p.transportation || 0) > 0;
          case 'lunch': return (p.lunchAllowance || 0) > 0;
          case 'otMeal': return (p.otMealAllowance || 0) > 0;
          case 'dayCare': return (p.dayCareAllowance || 0) > 0;
          case 'seniority': return (p.seniority || 0) > 0;
          case 'seniorityIndemnity': return (p.seniorityIndemnity || 0) > 0;
          case 'productionIncentive': return (p.productionIncentive || 0) > 0;
          case 'adjust': return (p.adjustmentSkill || 0) > 0;
          case 'severancePay': return (p.severancePay || 0) > 0;
          case 'tax': return (p.taxPayment || 0) > 0;
          case 'loanPension': return (p.loanPension || 0) > 0;
          case 'firstPayment': return (p.loanPension || 0) > 0;
          case 'union': return (p.unionDeduction || 0) > 0;
          case 'secondPayment': return (p.netSalaryUsd || 0) > 0;
          default: return false;
        }
      });
    };

    const headers = hideEmpty ? allHeaders.filter(h => isColumnActive(h.id)) : allHeaders;
    const lastColLetter = sheet.getColumn(headers.length).letter;

    // Set column widths
    headers.forEach((h, index) => {
      sheet.getColumn(index + 1).width = h.width || 10;
    });

    // Data Rows (Repeating Headers for each employee)
    let currentRow = 1;
    payrolls.forEach((p, index) => {
      const emp = p.employee;

      // 1. Employee Title Row
      sheet.mergeCells(`A${currentRow}:${lastColLetter}${currentRow}`);
      const titleCell = sheet.getCell(`A${currentRow}`);
      titleCell.value = `📋 ប័ណ្ណប្រាក់បៀវត្សរ៍ / Payslip Strip #${index + 1} • ${emp.firstNameKh || ''} ${emp.lastNameKh || ''} (${emp.firstNameEn || ''} ${emp.lastNameEn || ''}) - អត្តលេខ: ${emp.employeeId} • ${companyName} (${month}/${year})`;
      titleCell.font = { name: 'Khmer OS Siemreap', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      sheet.getRow(currentRow).height = 24;
      currentRow++;

      // 2. Khmer Header Row
      const khRow = sheet.getRow(currentRow);
      khRow.height = 32;
      headers.forEach((h, i) => {
        const colLetter = sheet.getColumn(i + 1).letter;
        const cell = khRow.getCell(colLetter);
        cell.value = h.kh;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEef2ff' } };
        cell.font = { name: 'Khmer OS Siemreap', bold: true, size: 8.5 };
        const isVertical = ['absent', 'permission', 'shift'].includes(h.id);
        cell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: isVertical ? 90 : 0, wrapText: true };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
      });
      currentRow++;

      // 3. English/Chinese Header Row
      const enRow = sheet.getRow(currentRow);
      enRow.height = 22;
      headers.forEach((h, i) => {
        const colLetter = sheet.getColumn(i + 1).letter;
        const cell = enRow.getCell(colLetter);
        cell.value = h.en + (h.zh ? `\n${h.zh}` : '');
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEef2ff' } };
        cell.font = { name: 'Khmer OS Siemreap', size: 7.5 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
      });
      currentRow++;

      // 4. Data Row
      const row = sheet.getRow(currentRow);
      row.height = 22;
      
      const firstPayment = p.loanPension || 0;
      const secondPayment = p.netSalaryUsd;

      const cellValues: Record<string, any> = {
        no: index + 1,
        empId: emp.employeeId,
        nameKh: (emp.firstNameKh || '') + ' ' + (emp.lastNameKh || ''),
        nameEn: (emp.firstNameEn || '') + ' ' + (emp.lastNameEn || ''),
        department: emp.department || '',
        line: emp.line || '-',
        position: emp.position || '',
        shift: emp.shift || '-',
        gender: emp.gender || '',
        spouse: emp.spouse ? 1 : 0,
        children: emp.numberOfChildren || 0,
        hireDate: emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('en-GB') : '-',
        basicSalary: p.basicSalary,
        basicPayScale: p.basicPayScale,
        workingDays: p.workingDays,
        absent: p.absentDays,
        permission: p.permissionDays,
        workingSalary: p.workingSalary,
        payScaleIncentive: p.payScaleIncentive,
        otHours: p.otHours,
        otWage: p.otWage,
        sunOtHours: p.sunOtHours,
        sunOtWage: p.sunOtWage,
        nightOtHours: p.nightOtHours,
        nightOtWage: p.nightOtWage,
        annualLeave: p.annualLeaveAmount,
        attBonus: p.attendanceBonus,
        transport: p.transportation,
        lunch: p.lunchAllowance,
        otMeal: p.otMealAllowance,
        dayCare: p.dayCareAllowance,
        seniority: p.seniority,
        seniorityIndemnity: p.seniorityIndemnity,
        productionIncentive: p.productionIncentive,
        adjust: p.adjustmentSkill,
        totalSalary: p.totalSalary,
        severancePay: p.severancePay,
        tax: p.taxPayment,
        loanPension: p.loanPension,
        firstPayment: firstPayment,
        union: p.unionDeduction,
        secondPayment: secondPayment,
        paidSalaryUsd: p.paidSalaryUsd,
        riel: p.netSalaryRiel,
        signature: ''
      };

      headers.forEach((h, i) => {
        const colLetter = sheet.getColumn(i + 1).letter;
        const cell = row.getCell(colLetter);
        const val = cellValues[h.id];
        cell.value = val !== undefined ? val : '';
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Khmer OS Siemreap', size: 9 };

        const isNotFormatted = [
          'no', 'empId', 'nameEn', 'nameKh', 'gender', 'joinDate', 'position', 'department',
          'line', 'shift', 'spouse', 'children', 'hireDate',
          'workingDays', 'absent', 'permission', 'otHours', 'sunOtHours', 'nightOtHours', 'signature'
        ].includes(h.id);

        if (!isNotFormatted && typeof val === 'number') {
          if (h.id === 'riel') {
            cell.numFmt = '#,##0';
          } else {
            cell.numFmt = '#,##0.00';
          }
        }
      });

      currentRow++;
      
      // 5. Spacer Row with Cut Line Text
      sheet.mergeCells(`A${currentRow}:${lastColLetter}${currentRow}`);
      const cutCell = sheet.getCell(`A${currentRow}`);
      cutCell.value = '✂️ - - - - - - - - - - - - - - - - - - - - កាត់ជាបន្ទះៗត្រង់នេះ (Cut Strip Here) - - - - - - - - - - - - - - - - - - - - ✂️';
      cutCell.font = { name: 'Khmer OS Siemreap', size: 8, color: { argb: 'FF94A3B8' } };
      cutCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(currentRow).height = 18;
      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Payslip_Strips_${month}_${year}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Failed to generate Excel:', error);
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 });
  }
}
