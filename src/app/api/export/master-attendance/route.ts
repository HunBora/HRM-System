import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Month names for title
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[month - 1];

    const daysInMonth = new Date(year, month, 0).getDate();

    const employees = await prisma.employee.findMany({
      include: {
        attendances: {
          where: { month, year }
        }
      },
      orderBy: { employeeId: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Master Attendance', {
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

    // 1. Title Row
    sheet.mergeCells('A1:J2');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Attendance List for ${monthName} ${year}`;
    titleCell.font = { name: 'Khmer OS Siemreap', size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // 2. Fixed Headers (Columns 1 to 5)
    const fixedHeaders = [
      { kh: 'ល.រ', en: 'No.', width: 4 },
      { kh: 'អត្តលេខ', en: 'ID No.', width: 8 },
      { kh: 'ឈ្មោះខ្មែរ', en: 'Khmer Name', width: 15 },
      { kh: 'តួនាទី', en: 'Dept.', width: 12 },
      { kh: 'ថ្ងៃចូលធ្វើការ', en: 'Start Date', width: 12 },
    ];

    fixedHeaders.forEach((h, i) => {
      const col = i + 1;
      sheet.getColumn(col).width = h.width;
      sheet.mergeCells(5, col, 6, col);
      const cell = sheet.getCell(5, col);
      cell.value = `${h.kh}\n${h.en}`;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      cell.font = { name: 'Khmer OS Siemreap', bold: true, size: 8 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
      
      // Apply border to the merged bottom cell to prevent visual issues
      sheet.getCell(6, col).border = cell.border;
    });

    // 3. Dynamic Days Headers (Columns 6 to 6 + daysInMonth - 1)
    let currentCol = 6;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ...
      const isSunday = dayOfWeek === 0;
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayStr = dayNames[dayOfWeek];
      const dateStr = day.toString().padStart(2, '0');

      sheet.getColumn(currentCol).width = 4;

      // Row 5: Day of week
      const cellDay = sheet.getCell(5, currentCol);
      cellDay.value = dayStr;
      cellDay.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isSunday ? 'FFFF0000' : 'FFFFE699' } };
      cellDay.font = { name: 'Khmer OS Siemreap', bold: true, size: 8, color: { argb: isSunday ? 'FFFFFFFF' : 'FF000000' } };
      cellDay.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };
      cellDay.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

      // Row 6: Date
      const cellDate = sheet.getCell(6, currentCol);
      cellDate.value = dateStr;
      cellDate.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isSunday ? 'FFFF0000' : 'FFFFFFFF' } };
      cellDate.font = { name: 'Khmer OS Siemreap', bold: true, size: 8, color: { argb: isSunday ? 'FFFFFFFF' : 'FF000000' } };
      cellDate.alignment = { horizontal: 'center', vertical: 'middle' };
      cellDate.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

      currentCol++;
    }

    // 4. Summary Headers (Right side)
    const summaryHeaders = [
      { kh: 'ចំនួនថ្ងៃ\nធ្វើការ', en: 'Working Day', width: 9, bg: 'FFD9D9D9', color: 'FF000000' },
      { kh: 'ចំនួនម៉ោង\nថែមម៉ោង', en: 'OT Hours', width: 9, bg: 'FFD9D9D9', color: 'FF000000' },
      { kh: 'ម៉ោងថ្ងៃ\nបុណ្យ', en: 'Holiday', width: 8, bg: 'FFD9D9D9', color: 'FF000000' },
      { kh: 'ឈប់អត់\nច្បាប់(A)', en: 'Absence', width: 8, bg: 'FFFCE4D6', color: 'FFFF0000' },
      { kh: 'ឈប់សុំ\nច្បាប់(P)', en: 'Permission', width: 8, bg: 'FFE2EFDA', color: 'FF38761D' },
      { kh: 'ចំនួនថ្ងៃ\nថែមម៉ោង', en: 'OT Num.', width: 9, bg: 'FFD9D9D9', color: 'FF000000' },
      { kh: 'ហត្ថលេខា', en: 'Signature', width: 12, bg: 'FFD9D9D9', color: 'FF000000' }
    ];

    summaryHeaders.forEach((h, i) => {
      const col = currentCol + i;
      sheet.getColumn(col).width = h.width;
      sheet.mergeCells(5, col, 6, col);
      const cell = sheet.getCell(5, col);
      cell.value = `${h.kh}\n${h.en}`;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: h.bg } };
      cell.font = { name: 'Khmer OS Siemreap', bold: true, size: 8, color: { argb: h.color } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
      
      sheet.getCell(6, col).border = cell.border;
    });

    sheet.getRow(5).height = 45;
    sheet.getRow(6).height = 20;

    // 5. Data Rows
    let currentRow = 7;
    employees.forEach((emp, index) => {
      const row = sheet.getRow(currentRow);
      
      // Fixed Columns
      row.getCell(1).value = index + 1;
      row.getCell(2).value = emp.employeeId;
      row.getCell(3).value = emp.firstNameKh ? `${emp.firstNameKh} ${emp.lastNameKh}` : `${emp.firstNameEn} ${emp.lastNameEn}`;
      row.getCell(4).value = emp.department || '';
      row.getCell(5).value = emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('en-GB') : '';

      // Grid cells (Days)
      let dayCol = 6;
      for (let day = 1; day <= daysInMonth; day++) {
        row.getCell(dayCol).value = '';
        dayCol++;
      }

      // Summary Data
      const att = emp.attendances.length > 0 ? emp.attendances[0] : null;
      const sumColStart = 6 + daysInMonth;
      
      row.getCell(sumColStart).value = att ? att.daysWorked : 0; // Working Day
      row.getCell(sumColStart + 1).value = att ? att.otHours : 0; // OT Hours
      row.getCell(sumColStart + 2).value = 0; // Holiday (placeholder)
      row.getCell(sumColStart + 3).value = att ? att.absentDays : 0; // Absence
      row.getCell(sumColStart + 4).value = att ? att.leaveDays : 0; // Permission
      row.getCell(sumColStart + 5).value = 0; // OT Num (placeholder)
      row.getCell(sumColStart + 6).value = ''; // Signature

      // Styling and borders for data row
      const totalCols = 5 + daysInMonth + summaryHeaders.length;
      for (let c = 1; c <= totalCols; c++) {
        const cell = row.getCell(c);
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Khmer OS Siemreap', size: 9 };
        
        // Format numbers for summary columns (except signature)
        if (c >= sumColStart && c < sumColStart + 6) {
          cell.numFmt = '#,##0.00';
          // Make text red for absence if > 0
          if (c === sumColStart + 3 && cell.value && (cell.value as number) > 0) {
            cell.font = { name: 'Khmer OS Siemreap', size: 9, color: { argb: 'FFFF0000' } };
          }
        }
      }

      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Master_Attendance_${month}_${year}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Failed to generate Excel:', error);
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 });
  }
}
