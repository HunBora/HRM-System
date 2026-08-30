import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const bankName = searchParams.get('bankName') || 'ABA';

    const payrolls = await prisma.payroll.findMany({
      where: { month, year },
      include: { employee: true },
      orderBy: { employee: { employeeId: 'asc' } }
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Payroll_Bank(${bankName})`);

    // Headers
    sheet.getRow(1).values = ['Employee Name', 'Employee Id', 'Account Number', 'Amount', 'Remark'];
    sheet.getRow(1).font = { bold: true };

    // Data
    let currentRow = 2;
    payrolls.forEach(p => {
      const emp = p.employee;
      const row = sheet.getRow(currentRow);
      
      row.getCell(1).value = `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim();
      row.getCell(2).value = emp.employeeId;
      
      // Store Account Number as string to preserve leading zeros
      const accountCell = row.getCell(3);
      accountCell.value = emp.bankCardNo || '';
      accountCell.numFmt = '@'; 
      
      const amountCell = row.getCell(4);
      amountCell.value = p.netSalaryUsd;
      amountCell.numFmt = '#,##0.00';
      
      row.getCell(5).value = ''; // Remark
      
      currentRow++;
    });

    sheet.columns = [
      { width: 25 }, // Name
      { width: 15 }, // ID
      { width: 20 }, // Account
      { width: 15 }, // Amount
      { width: 20 }, // Remark
    ];

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Bank_Transfer_${bankName}_${month}_${year}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Failed to generate Excel:', error);
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 });
  }
}
