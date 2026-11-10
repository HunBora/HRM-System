import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PrintAttendanceButton from './PrintAttendanceButton';
import ExportExcelButton from './ExportExcelButton';
import AttendanceReportTable from './AttendanceReportTable';
import { calculateDayAttendanceMetrics } from '@/lib/attendanceCalculator';
import { getCambodiaTime } from '@/lib/timezone';

export default async function EmployeeAttendancePage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ month?: string; year?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) || {};
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

  // Determine year and month from searchParams or default to current date
  const now = new Date();
  const year = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year, 10) : now.getFullYear();
  const month = resolvedSearchParams.month !== undefined ? parseInt(resolvedSearchParams.month, 10) : now.getMonth();
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
      (d1.getUTCFullYear() === d2.getFullYear() && d1.getUTCMonth() === d2.getMonth() && d1.getUTCDate() === d2.getDate()) ||
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
      (a) => isSameCalendarDay(new Date(a.date), date)
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
      dayPunches.sort((a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime());

      const checkIn = dayPunches.find(p => p.punchType === 'CHECK_IN');
      const checkOut = dayPunches.find(p => p.punchType === 'CHECK_OUT');
      const breakIn = dayPunches.find(p => p.punchType === 'BREAK_IN');
      const breakOut = dayPunches.find(p => p.punchType === 'BREAK_OUT');
      const otInPunch = dayPunches.find(p => p.punchType === 'OT_IN');
      const otOutPunch = dayPunches.find(p => p.punchType === 'OT_OUT');

      if (!fIn && checkIn) fIn = getCambodiaTime(new Date(checkIn.punchTime));
      if (!fOut && breakOut) fOut = getCambodiaTime(new Date(breakOut.punchTime));
      if (!sIn && breakIn) sIn = getCambodiaTime(new Date(breakIn.punchTime));
      if (!sOut && checkOut) sOut = getCambodiaTime(new Date(checkOut.punchTime));

      // Chronological fallback for sequential punches or generic scan logs
      if (!fIn && dayPunches.length > 0) {
        fIn = getCambodiaTime(new Date(dayPunches[0].punchTime));
      }
      if (!sOut && dayPunches.length > 1) {
        sOut = getCambodiaTime(new Date(dayPunches[dayPunches.length - 1].punchTime));
      }
      if (!fOut && dayPunches.length === 4) {
        fOut = getCambodiaTime(new Date(dayPunches[1].punchTime));
      }
      if (!sIn && dayPunches.length === 4) {
        sIn = getCambodiaTime(new Date(dayPunches[2].punchTime));
      }
      if (!otIn && otInPunch) otIn = getCambodiaTime(new Date(otInPunch.punchTime));
      if (!otOut && otOutPunch) otOut = getCambodiaTime(new Date(otOutPunch.punchTime));
    }

    let remarks = hasImportedData && attendanceRecord.remarks ? attendanceRecord.remarks : (isHoliday ? HOLIDAYS[`${month + 1}-${i + 1}`] : (isWeekend ? 'សម្រាក' : ''));
    if (matchedLeave) {
      const leaveLabel = LEAVE_TYPE_MAP[matchedLeave.leaveType] || matchedLeave.leaveType;
      remarks = remarks ? `${remarks} | ${leaveLabel}` : leaveLabel;
    }

    // Calculate live metrics based on punch times (including OT, Night OT, Holiday OT, Late, Early)
    const metrics = calculateDayAttendanceMetrics(fIn, fOut, sIn, sOut, otIn, otOut, isOffDay);

    // If attendance record had 0 OT but punches had OT, auto-populate from calculated metrics!
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

    const dStr = (i + 1).toString().padStart(2, '0');
    const mStr = (month + 1).toString().padStart(2, '0');

    return {
      no: i + 1,
      dateStr: `${dStr}-${mStr}-${year.toString().slice(2)}`,
      rawDate: `${year}-${mStr}-${dStr}`,
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

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Link href="/dashboard/attendance" style={{ color: '#3b82f6', textDecoration: 'none', marginBottom: '10px', display: 'inline-block' }} className="no-print">&larr; Back</Link>
          <h1 className="title kh-text" style={{ marginBottom: 0 }}>Attendance Report</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <PrintAttendanceButton targetId="attendance-log-print-area" title={`Attendance_Log_${employee.employeeId}`} />
          <ExportExcelButton employeeId={employee.id} month={month} year={year} />
        </div>
      </div>

      <div
        id="attendance-log-print-area"
        className="card"
        style={{
          overflowX: 'auto',
          padding: '16px 20px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1.2fr',
            marginBottom: '12px',
            fontSize: '0.82rem',
            lineHeight: 1.4,
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '10px',
          }}
        >
          <div>
            <p style={{ margin: '2px 0' }}><b>អត្តលេខ និង ឈ្មោះ:</b> {employee.employeeId} / {employee.firstNameKh || employee.firstNameEn} {employee.lastNameKh || employee.lastNameEn}</p>
            <p style={{ margin: '2px 0' }}><b>តួនាទី (Position):</b> {employee.position}</p>
            <p style={{ margin: '2px 0' }}><b>ផ្នែក (Depart):</b> {employee.department} {employee.line ? `(Line: ${employee.line})` : ''}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Attendance Log</h2>
            <p style={{ margin: '2px 0', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Period: {month + 1}/{year}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '2px 0' }}><b>កាលបរិច្ឆេទបោះពុម្ព:</b> {new Date().toLocaleDateString('en-GB')}</p>
            <p style={{ margin: '2px 0' }}><b>ថ្ងៃចូលធ្វើការ (Date of Join):</b> {new Date(employee.hireDate).toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        <AttendanceReportTable
          employee={employee}
          initialDays={dummyDays}
          month={month}
          year={year}
        />
      </div>
    </div>
  );
}

const thStyle = { padding: '5px', whiteSpace: 'nowrap' as const };
const tdStyle = { padding: '5px' };
