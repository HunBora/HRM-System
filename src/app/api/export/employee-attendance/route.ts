import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';
import { calculateDayAttendanceMetrics } from '@/lib/attendanceCalculator';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const month = parseInt(searchParams.get('month') || (new Date().getMonth()).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        dailyAttendances: { orderBy: { date: 'asc' } },
        overtimeRequests: {
          where: { status: 'APPROVED' }
        },
        leaveRequests: {
          where: { status: 'APPROVED' }
        },
        biometricLogs: {
          orderBy: { punchTime: 'asc' }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const HOLIDAYS: Record<string, string> = {
      '1-1': 'ទិវាចូលឆ្នាំសកល',
      '1-7': 'ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍',
      '3-8': 'ទិវានារីអន្តរជាតិ',
      '4-14': 'បុណ្យចូលឆ្នាំខ្មែរ',
      '4-15': 'បុណ្យចូលឆ្នាំខ្មែរ',
      '4-16': 'បុណ្យចូលឆ្នាំខ្មែរ',
      '5-1': 'ទិវាពលកម្មអន្តរជាតិ',
      '5-14': 'ព្រះរាជពិធីចម្រើនព្រះជន្ម ព្រះមហាក្សត្រ',
      '5-31': 'ពិធីបុណ្យវិសាខបូជា', 
      '6-4': 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល',
      '9-24': 'ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ',
      '10-9': 'ពិធីបុណ្យភ្ជុំបិណ្ឌ',
      '10-10': 'ពិធីបុណ្យភ្ជុំបិណ្ឌ',
      '10-11': 'ពិធីបុណ្យភ្ជុំបិណ្ឌ',
      '10-15': 'ទិវាប្រារព្ធព្រះបរមរតនកោដ្ឋ',
      '10-29': 'ព្រះរាជពិធីគ្រងព្រះបរមរាជសម្បត្តិ',
      '11-9': 'ទិវាបុណ្យឯករាជ្យជាតិ',
      '11-23': 'ព្រះរាជពិធីបុណ្យអុំទូក',
      '11-24': 'ព្រះរាជពិធីបុណ្យអុំទូក',
      '11-25': 'ព្រះរាជពិធីបុណ្យអុំទូក',
    };

    const LEAVE_TYPE_MAP: Record<string, string> = {
      ANNUAL: 'ច្បាប់ប្រចាំឆ្នាំ (AL)',
      SICK: 'ច្បាប់ឈឺ (SL)',
      SPECIAL: 'ច្បាប់ពិសេស (Special)',
      MATERNITY: 'ច្បាប់សម្រាល (ML)',
      UNPAID: 'ច្បាប់ឥតប្រាក់ឈ្នួល (UP)',
    };

    const isSameCalendarDay = (d1: Date, d2: Date) => {
      return (
        (d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()) ||
        d1.toISOString().slice(0, 10) === d2.toISOString().slice(0, 10)
      );
    };

    const dummyDays = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const isWeekend = dayName === 'Sun';
      const isHoliday = !!HOLIDAYS[`${month + 1}-${i + 1}`];
      const isOffDay = isWeekend || isHoliday;
      
      const attendanceRecord = employee.dailyAttendances.find(
        (a) => a.date.getDate() === i + 1 && a.date.getMonth() === month && a.date.getFullYear() === year
      );
      const hasImportedData = !!attendanceRecord;

      // Find approved Overtime requests on this date
      const matchedOts = employee.overtimeRequests.filter((ot) => isSameCalendarDay(new Date(ot.otDate), date));
      let normalOtHrs = hasImportedData ? (attendanceRecord.normalOtHrs || 0) : 0;
      let nightOtHrs = hasImportedData ? (attendanceRecord.nightOtHrs || 0) : 0;
      let holidayOtHrs = hasImportedData ? (attendanceRecord.holidayOtHrs || 0) : 0;
      let otIn = hasImportedData ? (attendanceRecord.otIn || '') : '';
      let otOut = hasImportedData ? (attendanceRecord.otOut || '') : '';

      matchedOts.forEach((ot) => {
        if (ot.otType === 'NIGHT_OT') {
          nightOtHrs += ot.totalHours;
        } else if (ot.otType === 'SUNDAY_OT' || ot.otType === 'HOLIDAY_OT') {
          holidayOtHrs += ot.totalHours;
        } else {
          normalOtHrs += ot.totalHours;
        }
        if (!otIn && ot.startTime) otIn = ot.startTime;
        if (!otOut && ot.endTime) otOut = ot.endTime;
      });

      // Find approved Leave requests covering this date
      const dayStart = new Date(year, month, i + 1, 0, 0, 0).getTime();
      const dayEnd = new Date(year, month, i + 1, 23, 59, 59, 999).getTime();
      const matchedLeave = employee.leaveRequests.find((lv) => {
        const lvStart = new Date(lv.startDate).getTime();
        const lvEnd = new Date(lv.endDate).getTime();
        return dayStart <= lvEnd && dayEnd >= lvStart;
      });

      // Find biometric punch logs on this date
      const dayPunches = employee.biometricLogs.filter((p) => isSameCalendarDay(new Date(p.punchTime), date));
      let fIn = hasImportedData ? (attendanceRecord.fIn || '') : '';
      let fOut = hasImportedData ? (attendanceRecord.fOut || '') : '';
      let sIn = hasImportedData ? (attendanceRecord.sIn || '') : '';
      let sOut = hasImportedData ? (attendanceRecord.sOut || '') : '';

      if (dayPunches.length > 0) {
        const checkIn = dayPunches.find(p => p.punchType === 'CHECK_IN');
        const checkOut = dayPunches.find(p => p.punchType === 'CHECK_OUT');
        const breakIn = dayPunches.find(p => p.punchType === 'BREAK_IN');
        const breakOut = dayPunches.find(p => p.punchType === 'BREAK_OUT');
        const otInPunch = dayPunches.find(p => p.punchType === 'OT_IN');
        const otOutPunch = dayPunches.find(p => p.punchType === 'OT_OUT');

        if (!fIn && checkIn) fIn = new Date(checkIn.punchTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        if (!fOut && checkOut) fOut = new Date(checkOut.punchTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        if (!sIn && breakIn) sIn = new Date(breakIn.punchTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        if (!sOut && breakOut) sOut = new Date(breakOut.punchTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        if (!otIn && otInPunch) otIn = new Date(otInPunch.punchTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        if (!otOut && otOutPunch) otOut = new Date(otOutPunch.punchTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      }

      let remarks = hasImportedData && attendanceRecord.remarks ? attendanceRecord.remarks : (isHoliday ? HOLIDAYS[`${month + 1}-${i + 1}`] : (isWeekend ? 'សម្រាក' : ''));
      if (matchedLeave) {
        const leaveLabel = LEAVE_TYPE_MAP[matchedLeave.leaveType] || matchedLeave.leaveType;
        remarks = remarks ? `${remarks} | ${leaveLabel}` : leaveLabel;
      }

      // Calculate live metrics based on punch times
      const metrics = calculateDayAttendanceMetrics(fIn, fOut, sIn, sOut, otIn, otOut, isOffDay);

      const finalNormalOt = normalOtHrs > 0 ? normalOtHrs : metrics.normalOtHrs;
      const finalNightOt = nightOtHrs > 0 ? nightOtHrs : metrics.nightOtHrs;
      const finalHolidayOt = holidayOtHrs > 0 ? holidayOtHrs : metrics.holidayOtHrs;

      const finalLateMins = (hasImportedData && (attendanceRecord.lateMins || 0) > 0)
        ? attendanceRecord.lateMins
        : metrics.lateMins;

      const finalEarlyMins = (hasImportedData && (attendanceRecord.earlyMins || 0) > 0)
        ? attendanceRecord.earlyMins
        : metrics.earlyMins;

      const finalWorkHrs = (hasImportedData && (attendanceRecord.workHrs || 0) > 0)
        ? attendanceRecord.workHrs
        : metrics.workHrs;

      const finalRegDay = (hasImportedData && attendanceRecord.regDay !== undefined && attendanceRecord.regDay !== null)
        ? attendanceRecord.regDay
        : (isOffDay ? 0 : (matchedLeave ? 0 : metrics.regDay));

      return {
        no: i + 1,
        dateStr: `${(i+1).toString().padStart(2, '0')}-${(month+1).toString().padStart(2, '0')}-${year.toString().slice(2)}`,
        day: dayName,
        isOffDay: isOffDay,
        fIn,
        fOut,
        sIn,
        sOut,
        otIn,
        otOut,
        regDay: finalRegDay,
        workHrs: finalWorkHrs,
        normalOtHrs: finalNormalOt,
        nightOtHrs: finalNightOt,
        holidayOtHrs: finalHolidayOt,
        lateMins: finalLateMins,
        earlyMins: finalEarlyMins,
        remarks
      };
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance Log', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        margins: {
          left: 0.25, right: 0.25,
          top: 0.25, bottom: 0.25,
          header: 0.2, footer: 0.2
        }
      }
    });

    // Top Header info
    sheet.getCell('A1').value = `ឈ្មោះ (Name): ${employee.firstNameKh} ${employee.lastNameKh} / ${employee.firstNameEn} ${employee.lastNameEn}`;
    sheet.getCell('A2').value = `អត្តលេខ (ID-NO): ${employee.employeeId}`;
    sheet.getCell('A3').value = `តួនាទី (Position): ${employee.position}`;
    sheet.getCell('A4').value = `ផ្នែក (Depart): ${employee.department}`;
    sheet.getCell('A5').value = `ក្រុម (Line): ${employee.line || '-'}`;
    
    sheet.mergeCells('G1:J3');
    const titleCell = sheet.getCell('G1');
    titleCell.value = 'Attendance Log';
    titleCell.font = { name: 'Arial', size: 20, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.getCell('N1').value = `Period: ${month + 1}/${year}`;
    sheet.getCell('N2').value = `ថ្ងៃចូលធ្វើការ (Date of Join): ${new Date(employee.hireDate).toLocaleDateString('en-GB')}`;

    for (let r = 1; r <= 4; r++) {
      for (let c = 1; c <= 17; c++) {
        sheet.getCell(r, c).font = { name: 'Khmer OS Siemreap', bold: true, size: 9 };
      }
    }

    const headers = [
      { header: 'លេខ\nNo', width: 5 },
      { header: 'កាលបរិច្ឆេទ\nDate', width: 12 },
      { header: 'ថ្ងៃ\nDay', width: 6 },
      { header: 'ម៉ោងចូលព្រឹក\nF-In', width: 12 },
      { header: 'ម៉ោងចេញព្រឹក\nF-Out', width: 12 },
      { header: 'ម៉ោងចូលថ្ងៃ\nS-In', width: 12 },
      { header: 'ម៉ោងចេញថ្ងៃ\nS-Out', width: 12 },
      { header: 'ម៉ោងចូលOT\nOT-In', width: 12 },
      { header: 'ម៉ោងចេញOT\nOT-Out', width: 12 },
      { header: 'ថ្ងៃធម្មតា\nReg Day', width: 10 },
      { header: 'ម៉ោងធ្វើការ\nWork Hrs', width: 10 },
      { header: 'ម៉ោងថែមធម្មតា\nNormal OT', width: 12 },
      { header: 'ម៉ោងថែមយប់\nNight OT', width: 10 },
      { header: 'ម៉ោងថែមថ្ងៃបុណ្យ\nHoliday OT', width: 14 },
      { header: 'ចូលយឺត(នាទី)\nLate', width: 12 },
      { header: 'ចេញមុន\nEarly', width: 10 },
      { header: 'ផ្សេងៗ\nRemarks', width: 25 },
    ];

    const headerRow = sheet.getRow(7);
    headerRow.height = 30;
    
    headers.forEach((col, index) => {
      const c = index + 1;
      sheet.getColumn(c).width = col.width;
      const cell = headerRow.getCell(c);
      cell.value = col.header;
      cell.font = { name: 'Khmer OS Siemreap', bold: true, size: 9 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
    });

    const startDataRow = 8;
    let currentRow = startDataRow;

    dummyDays.forEach(d => {
      const row = sheet.getRow(currentRow);
      row.values = [
        d.no, d.dateStr, d.day, d.fIn, d.fOut, d.sIn, d.sOut, d.otIn, d.otOut,
        d.regDay, d.workHrs, d.normalOtHrs, d.nightOtHrs, d.holidayOtHrs, d.lateMins, d.earlyMins, d.remarks
      ];

      for (let c = 1; c <= 17; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Khmer OS Siemreap', size: 9 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        
        if (c >= 10 && c <= 16 && cell.value === 0) {
           cell.value = ''; // Hide zero values for cleaner look
        }

        if (d.isOffDay) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { name: 'Khmer OS Siemreap', size: 9, color: { argb: 'FFB91C1C' } };
        }
      }
      currentRow++;
    });

    // Summary Row with FORMULAS
    const totalRowIndex = currentRow;
    const totalRow = sheet.getRow(totalRowIndex);
    totalRow.height = 25;
    
    sheet.mergeCells(`A${totalRowIndex}:I${totalRowIndex}`);
    const sumTitleCell = totalRow.getCell(1);
    sumTitleCell.value = 'សរុប-Total';
    sumTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };
    sumTitleCell.font = { name: 'Khmer OS Siemreap', bold: true, size: 10 };
    
    const sumTitleCellI = totalRow.getCell(9);
    sumTitleCellI.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }, left: { style: 'thin' } };
    sumTitleCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' } };

    // Set Formulas
    const columnsToSum = ['J', 'K', 'L', 'M', 'N', 'O', 'P'];
    columnsToSum.forEach(col => {
      const cell = sheet.getCell(`${col}${totalRowIndex}`);
      cell.value = { formula: `SUM(${col}${startDataRow}:${col}${currentRow - 1})` };
      cell.font = { name: 'Khmer OS Siemreap', bold: true, size: 9 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Remarks col in total
    const emptyRem = totalRow.getCell(17);
    emptyRem.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Attendance_Log_${employee.employeeId}_${month+1}_${year}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Failed to generate Excel:', error);
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 });
  }
}
