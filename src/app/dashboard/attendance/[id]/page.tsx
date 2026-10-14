import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PrintAttendanceButton from './PrintAttendanceButton';
import ExportExcelButton from './ExportExcelButton';

export default async function EmployeeAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const employee = await prisma.employee.findUnique({
    where: { id: resolvedParams.id },
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

  if (!employee) notFound();

  // Generate 31 days for the current month for demo purposes
  // In a real app, you would pass month/year in query params
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
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
    const isWeekend = dayName === 'Sun'; // Typically Sunday is off
    const isHoliday = !!HOLIDAYS[`${month + 1}-${i + 1}`];
    const isOffDay = isWeekend || isHoliday;
    
    // 1. Find if we have imported daily attendance record
    const attendanceRecord = employee.dailyAttendances.find(
      (a) => a.date.getDate() === i + 1 && a.date.getMonth() === month && a.date.getFullYear() === year
    );

    const hasImportedData = !!attendanceRecord;

    // 2. Find approved Overtime requests on this date
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

    // 3. Find approved Leave requests covering this date
    const dayStart = new Date(year, month, i + 1, 0, 0, 0).getTime();
    const dayEnd = new Date(year, month, i + 1, 23, 59, 59, 999).getTime();
    const matchedLeave = employee.leaveRequests.find((lv) => {
      const lvStart = new Date(lv.startDate).getTime();
      const lvEnd = new Date(lv.endDate).getTime();
      return dayStart <= lvEnd && dayEnd >= lvStart;
    });

    // 4. Find biometric punch logs on this date
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
      regDay: hasImportedData ? (attendanceRecord.regDay || 0) : (isOffDay ? 0 : (matchedLeave ? 0 : 1)),
      workHrs: hasImportedData ? (attendanceRecord.workHrs || 0) : (isOffDay ? 0 : 0),
      normalOtHrs,
      nightOtHrs,
      holidayOtHrs,
      lateMins: hasImportedData ? (attendanceRecord.lateMins || 0) : 0,
      earlyMins: hasImportedData ? (attendanceRecord.earlyMins || 0) : 0,
      remarks
    };
  });

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link href="/dashboard/attendance" style={{ color: '#3b82f6', textDecoration: 'none', marginBottom: '10px', display: 'inline-block' }} className="no-print">&larr; Back</Link>
          <h1 className="title kh-text" style={{ marginBottom: 0 }}>Attendance Report</h1>
        </div>
        <div>
          <PrintAttendanceButton targetId="attendance-log-print-area" title={`Attendance_Log_${employee.employeeId}`} />
          <ExportExcelButton employeeId={employee.id} />
        </div>
      </div>

      <div id="attendance-log-print-area" className="card" style={{ overflowX: 'auto', padding: '20px', backgroundColor: '#fbff00' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '20px', fontWeight: 'bold', fontSize: '0.9rem' }}>
          <div>
            <p>អត្តលេខ និង ឈ្មោះ(EmpID-Name): {employee.employeeId} / {employee.firstNameEn} {employee.lastNameEn}</p>
            <p>តួនាទី (Position): {employee.position}</p>
            <p>ផ្នែក (Depart): {employee.department}</p>
            <p>ក្រុម (Line): {employee.line || '-'}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2>Attendance Log</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p>Period: {month + 1}/{year}</p>
            <p>ថ្ងៃចូលធ្វើការ (Date of Join): {new Date(employee.hireDate).toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={thStyle}>លេខ<br/>No</th>
              <th style={thStyle}>កាលបរិច្ឆេទ<br/>Date</th>
              <th style={thStyle}>ថ្ងៃ<br/>Day</th>
              <th style={thStyle}>ម៉ោងចូលព្រឹក<br/>F-In</th>
              <th style={thStyle}>ម៉ោងចេញព្រឹក<br/>F-Out</th>
              <th style={thStyle}>ម៉ោងចូលថ្ងៃ<br/>S-In</th>
              <th style={thStyle}>ម៉ោងចេញថ្ងៃ<br/>S-Out</th>
              <th style={thStyle}>ម៉ោងចូលOT<br/>OT-In</th>
              <th style={thStyle}>ម៉ោងចេញOT<br/>OT-Out</th>
              <th style={thStyle}>ថ្ងៃធម្មតា<br/>Reg Day</th>
              <th style={thStyle}>ម៉ោងធ្វើការ<br/>Work Hrs</th>
              <th style={thStyle}>ម៉ោងថែមធម្មតា<br/>Normal OT</th>
              <th style={thStyle}>ម៉ោងថែមយប់<br/>Night OT</th>
              <th style={thStyle}>ម៉ោងថែមថ្ងៃបុណ្យ<br/>Holiday OT</th>
              <th style={thStyle}>ចូលយឺត(នាទី)<br/>Late</th>
              <th style={thStyle}>ចេញមុន<br/>Early</th>
              <th style={thStyle}>ផ្សេងៗ<br/>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {dummyDays.map((d) => (
              <tr key={d.no} style={d.isOffDay ? { backgroundColor: '#fee2e2', color: '#b91c1c' } : {}}>
                <td style={tdStyle}>{d.no}</td>
                <td style={tdStyle}>{d.dateStr}</td>
                <td style={tdStyle}>{d.day}</td>
                <td style={tdStyle}>{d.fIn}</td>
                <td style={tdStyle}>{d.fOut}</td>
                <td style={tdStyle}>{d.sIn}</td>
                <td style={tdStyle}>{d.sOut}</td>
                <td style={tdStyle}>{d.otIn}</td>
                <td style={tdStyle}>{d.otOut}</td>
                <td style={tdStyle}>{d.regDay}</td>
                <td style={tdStyle}>{d.workHrs}</td>
                <td style={tdStyle}>{d.normalOtHrs}</td>
                <td style={tdStyle}>{d.nightOtHrs}</td>
                <td style={tdStyle}>{d.holidayOtHrs}</td>
                <td style={tdStyle}>{d.lateMins}</td>
                <td style={tdStyle}>{d.earlyMins}</td>
                <td style={tdStyle}>{d.remarks}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 'bold', borderTop: '1px solid #000' }}>
              <td colSpan={9} style={{ textAlign: 'right', padding: '10px' }}>សរុប-Total</td>
              <td style={tdStyle}>{dummyDays.reduce((sum, d) => sum + d.regDay, 0)}</td>
              <td style={tdStyle}>{dummyDays.reduce((sum, d) => sum + d.workHrs, 0)}</td>
              <td style={tdStyle}>{dummyDays.reduce((sum, d) => sum + d.normalOtHrs, 0)}</td>
              <td style={tdStyle}>{dummyDays.reduce((sum, d) => sum + d.nightOtHrs, 0)}</td>
              <td style={tdStyle}>{dummyDays.reduce((sum, d) => sum + d.holidayOtHrs, 0)}</td>
              <td style={tdStyle}>{dummyDays.reduce((sum, d) => sum + d.lateMins, 0)}</td>
              <td style={tdStyle}>{dummyDays.reduce((sum, d) => sum + d.earlyMins, 0)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = { padding: '5px', whiteSpace: 'nowrap' as const };
const tdStyle = { padding: '5px' };
