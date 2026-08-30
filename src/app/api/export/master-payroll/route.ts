import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const company = await prisma.companySettings.findFirst();
    const companyName = company?.companyName || "GS ELETECH CAMBODIA .CO.,LTE";

    const payrolls = await prisma.payroll.findMany({
      where: { month, year },
      include: { employee: true },
      orderBy: { employee: { employeeId: 'asc' } }
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Master Payroll', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.2, right: 0.2,
          top: 0.5, bottom: 0.5,
          header: 0.3, footer: 0.3
        }
      }
    });

    const headers = [
      { id: 'no', kh: 'ល.រ', en: 'No', zh: '序号', width: 5 },
      { id: 'empId', kh: 'អត្តលេខ', en: 'ID', zh: '工号', width: 8 },
      { id: 'nameKh', kh: 'ឈ្មោះ', en: 'Name', zh: '姓名', width: 15 },
      { id: 'nameEn', kh: 'ឈ្មោះឡាតាំង', en: 'Name', zh: '姓名', width: 15 },
      { id: 'department', kh: 'ផ្នែក', en: 'Dept', zh: '部门', width: 10 },
      { id: 'line', kh: 'ឡាញ', en: 'Line', zh: '组', width: 6 },
      { id: 'position', kh: 'មុខងារ', en: 'Position', zh: '职务', width: 12 },
      { id: 'shift', kh: 'វេន', en: 'N.T', zh: '班次', width: 6 },
      { id: 'gender', kh: 'ភេទ', en: 'Sex', zh: '性别', width: 6 },
      { id: 'spouse', kh: 'ប្រពន្ធ', en: 'Wife', zh: '配偶', width: 6 },
      { id: 'children', kh: 'កូន', en: 'Child', zh: '孩子', width: 6 },
      { id: 'hireDate', kh: 'ថ្ងៃចូលធ្វើការ', en: 'Start Date', zh: '入职日期', width: 12 },
      { id: 'basicSalary', kh: 'ប្រាក់គោល', en: 'B. Salary', zh: '底薪', width: 9 },
      { id: 'basicPayScale', kh: 'ប្រាក់បន្ថែម', en: 'Basic Pay Scale', zh: '岗位薪资', width: 9 },
      { id: 'workingDays', kh: 'ថ្ងៃធ្វើការ', en: 'W. Day', zh: '工作天数', width: 6 },
      { id: 'absent', kh: 'អវត្តមាន', en: 'Absent', zh: '旷工', width: 6 },
      { id: 'permission', kh: 'មានច្បាប់', en: 'Permission', zh: '请假', width: 6 },
      { id: 'workingSalary', kh: 'ប្រាក់ខែធ្វើការ', en: 'M. Salary', zh: '工作工资', width: 9 },
      { id: 'payScaleIncentive', kh: 'រង្វាន់ថែម', en: 'Pay Scale Incentive', zh: '岗位津贴', width: 9 },
      { id: 'otHours', kh: 'ថែមម៉ោងធម្មតា', en: 'OT Hour', zh: '平时加班时', width: 6 },
      { id: 'otWage', kh: 'ប្រាក់ថែមម៉ោង', en: 'Wage', zh: '平时加班费', width: 8 },
      { id: 'sunOtHours', kh: 'ថ្ងៃអាទិត្យ', en: 'Sun OT Hour', zh: '星期日加班时', width: 6 },
      { id: 'sunOtWage', kh: 'ប្រាក់', en: 'Wage', zh: '星期日加班费', width: 8 },
      { id: 'nightOtHours', kh: 'ថែមម៉ោងយប់', en: 'N. OT Hour', zh: '夜班加班时', width: 6 },
      { id: 'nightOtWage', kh: 'ប្រាក់', en: 'Wage', zh: '夜班加班费', width: 8 },
      { id: 'annualLeave', kh: 'ច្បាប់ឈប់សម្រាក', en: 'Annual Leave', zh: '年假', width: 8 },
      { id: 'attBonus', kh: 'រង្វាន់ទៀងទាត់', en: 'Att. Bonus', zh: '全勤奖', width: 8 },
      { id: 'transport', kh: 'ប្រាក់ធ្វើដំណើរ', en: 'Transportation', zh: '车费补贴', width: 8 },
      { id: 'lunch', kh: 'ប្រាក់អាហារ', en: 'Lunch Allowance', zh: '午餐费', width: 8 },
      { id: 'otMeal', kh: 'អាហារថែមម៉ោង', en: 'OT Meal Allowance', zh: '加班餐补', width: 8 },
      { id: 'dayCare', kh: 'ប្រាក់កូនតូច', en: 'Day Care Allowance', zh: '育儿费', width: 8 },
      { id: 'seniority', kh: 'ប្រាក់អតីតភាព', en: 'Seniority', zh: '工龄津贴', width: 8 },
      { id: 'seniorityIndemnity', kh: 'សំណងអតីតភាព', en: 'Seniority Indemnity', zh: '工龄奖', width: 8 },
      { id: 'productionIncentive', kh: 'រង្វាន់ផលិតកម្ម', en: 'Production Incentive', zh: '超产奖金', width: 8 },
      { id: 'adjust', kh: 'ប្រាក់កែតម្រូវ', en: 'Adjust', zh: '调整金额', width: 8 },
      { id: 'totalSalary', kh: 'ប្រាក់ខែសរុប', en: 'Total Salary', zh: '合计工资', width: 10 },
      { id: 'severancePay', kh: '5%', en: '5% Severance Pay', zh: '5%', width: 8 },
      { id: 'tax', kh: 'ពន្ធ', en: 'Tax payment', zh: '扣税', width: 8 },
      { id: 'loanPension', kh: 'ប្រាក់ខ្ចី', en: 'Loan/Pension', zh: '借款及养老金', width: 8 },
      { id: 'firstPayment', kh: 'បើកលើកទី១', en: '1st Salary paid', zh: '第一次发放', width: 9 },
      { id: 'union', kh: 'សហជីព', en: 'Union Deduction', zh: '工会费', width: 8 },
      { id: 'secondPayment', kh: 'បើកលើកទី២', en: '2nd Salary paid', zh: '第二次发放', width: 9 },
      { id: 'paidSalaryUsd', kh: 'ប្រាក់ត្រូវបើកUSD', en: 'Paid Salary USD', zh: '实发薪水USD', width: 10 },
      { id: 'riel', kh: 'ប្រាក់រៀល', en: 'RIEL', zh: '瑞尔', width: 12 },
      { id: 'signature', kh: 'ហត្ថលេខា', en: 'Signature', zh: '签名', width: 10 }
    ];

    const lastColLetter = sheet.getColumn(headers.length).letter;
    
    // 1. Title Row
    sheet.mergeCells(`A1:${lastColLetter}1`);
    const titleCell = sheet.getCell('A1');
    titleCell.value = companyName;
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

    sheet.mergeCells(`A2:${lastColLetter}2`);
    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = 'ប្រាក់ខែបុគ្គលិក Employee Salary 员工工资表 - ' + month + '/' + year;
    subtitleCell.font = { size: 16, bold: true, color: { argb: 'FF1E3A8A' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.getRow(1).height = 25;
    sheet.getRow(2).height = 30;

    sheet.columns = headers.map(h => ({ width: h.width }));
    
    // Set Header Rows (Row 3, 4, 5, 6 - numbers)
    sheet.getRow(3).height = 40; // Khmer Row
    sheet.getRow(4).height = 20; // Chinese Row
    sheet.getRow(5).height = 20; // English Row
    sheet.getRow(6).height = 15; // Numbering Row

    const colMap: Record<string, string> = {};

    headers.forEach((h, index) => {
      const colLetter = sheet.getColumn(index + 1).letter;
      colMap[h.id] = colLetter;
      
      const isVertical = ['leave', 'absent', 'permission', 'shift'].includes(h.id);

      // Khmer Header (Row 3)
      const cellKh = sheet.getCell(`${colLetter}3`);
      cellKh.value = h.kh;
      cellKh.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEef2ff' } };
      cellKh.font = { name: 'Khmer OS Siemreap', bold: true, size: 9 };
      cellKh.alignment = { horizontal: 'center', vertical: 'middle', textRotation: isVertical ? 90 : 0, wrapText: true };
      cellKh.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

      // Chinese Header (Row 4)
      const cellZh = sheet.getCell(`${colLetter}4`);
      cellZh.value = h.zh;
      cellZh.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEef2ff' } };
      cellZh.font = { name: 'Khmer OS Siemreap', size: 9, bold: true };
      cellZh.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cellZh.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

      // English Header (Row 5)
      const cellEn = sheet.getCell(`${colLetter}5`);
      cellEn.value = h.en;
      cellEn.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEef2ff' } };
      cellEn.font = { name: 'Khmer OS Siemreap', size: 8 };
      cellEn.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cellEn.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

      // Numbering Row (Row 6)
      const cellNum = sheet.getCell(`${colLetter}6`);
      cellNum.value = index + 1;
      cellNum.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1f5f9' } };
      cellNum.font = { name: 'Khmer OS Siemreap', size: 8, color: { argb: 'FF64748b' } };
      cellNum.alignment = { horizontal: 'center', vertical: 'middle' };
      cellNum.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'medium' } };
    });

    // 3. Data Rows
    let currentRow = 7;
    payrolls.forEach((p, index) => {
      const emp = p.employee;
      const row = sheet.getRow(currentRow);
      
      const firstPayment = emp.basicSalary1 || 0;
      const secondPayment = p.netSalaryUsd;

      row.getCell(colMap['no']).value = index + 1;
      row.getCell(colMap['empId']).value = emp.employeeId;
      row.getCell(colMap['nameKh']).value = (emp.firstNameKh || '') + ' ' + (emp.lastNameKh || '');
      row.getCell(colMap['nameEn']).value = (emp.firstNameEn || '') + ' ' + (emp.lastNameEn || '');
      row.getCell(colMap['department']).value = emp.department || '';
      row.getCell(colMap['line']).value = emp.line || '-';
      row.getCell(colMap['position']).value = emp.position || '';
      row.getCell(colMap['shift']).value = emp.shift || '-';
      row.getCell(colMap['gender']).value = emp.gender || '';
      row.getCell(colMap['spouse']).value = emp.spouse ? 1 : 0;
      row.getCell(colMap['children']).value = emp.numberOfChildren || 0;
      row.getCell(colMap['hireDate']).value = emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('en-GB') : '-';
      
      row.getCell(colMap['basicSalary']).value = p.basicSalary;
      row.getCell(colMap['basicPayScale']).value = p.basicPayScale;
      row.getCell(colMap['workingDays']).value = p.workingDays;
      row.getCell(colMap['absent']).value = p.absentDays;
      row.getCell(colMap['permission']).value = p.permissionDays;
      row.getCell(colMap['workingSalary']).value = p.workingSalary;
      row.getCell(colMap['payScaleIncentive']).value = p.payScaleIncentive;
      row.getCell(colMap['otHours']).value = p.otHours;
      row.getCell(colMap['otWage']).value = p.otWage;
      row.getCell(colMap['sunOtHours']).value = p.sunOtHours;
      row.getCell(colMap['sunOtWage']).value = p.sunOtWage;
      row.getCell(colMap['nightOtHours']).value = p.nightOtHours;
      row.getCell(colMap['nightOtWage']).value = p.nightOtWage;
      row.getCell(colMap['annualLeave']).value = p.annualLeaveAmount;
      row.getCell(colMap['attBonus']).value = p.attendanceBonus;
      row.getCell(colMap['transport']).value = p.transportation;
      row.getCell(colMap['lunch']).value = p.lunchAllowance;
      row.getCell(colMap['otMeal']).value = p.otMealAllowance;
      row.getCell(colMap['dayCare']).value = p.dayCareAllowance;
      row.getCell(colMap['seniority']).value = p.seniority;
      row.getCell(colMap['seniorityIndemnity']).value = p.seniorityIndemnity;
      row.getCell(colMap['productionIncentive']).value = p.productionIncentive;
      row.getCell(colMap['adjust']).value = p.adjustmentSkill;
      row.getCell(colMap['totalSalary']).value = p.totalSalary;
      row.getCell(colMap['severancePay']).value = p.severancePay;
      row.getCell(colMap['tax']).value = p.taxPayment;
      row.getCell(colMap['loanPension']).value = p.loanPension;
      row.getCell(colMap['firstPayment']).value = firstPayment;
      row.getCell(colMap['union']).value = p.unionDeduction;
      row.getCell(colMap['secondPayment']).value = secondPayment;
      row.getCell(colMap['paidSalaryUsd']).value = p.paidSalaryUsd;
      row.getCell(colMap['riel']).value = p.netSalaryRiel;
      row.getCell(colMap['signature']).value = '';

      // Styling and borders for data row
      row.eachCell((cell, colNumber) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Khmer OS Siemreap', size: 9 };
        
        const colId = headers[colNumber - 1].id;
        const isNotFormatted = [
          'no', 'empId', 'nameEn', 'nameKh', 'gender', 'joinDate', 'position', 'department',
          'line', 'shift', 'spouse', 'children', 'hireDate',
          'workingDays', 'absent', 'permission', 'otHours', 'sunOtHours', 'nightOtHours', 'signature'
        ].includes(colId);
        
        if (!isNotFormatted) {
          if (colId === 'riel') {
            cell.numFmt = '#,##0';
          } else {
            cell.numFmt = '#,##0.00';
          }
        }
      });

      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Master_Payroll_${month}_${year}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Failed to generate Excel:', error);
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 });
  }
}
