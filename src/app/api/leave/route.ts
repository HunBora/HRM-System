import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { sendTelegramNotificationWithButtons } from '@/lib/telegram';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedEmpId = searchParams.get('employeeId');
    const requestedYear = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

    const isHR = ['ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN', 'HR'].includes(session.role || '');
    let targetEmployeeId = requestedEmpId;

    if (!isHR || !targetEmployeeId) {
      const linked = await prisma.employee.findFirst({
        where: { userId: session.userId },
        select: { id: true },
      });
      if (linked) {
        targetEmployeeId = linked.id;
      } else if (isHR && requestedEmpId) {
        targetEmployeeId = requestedEmpId;
      } else {
        const first = await prisma.employee.findFirst({ select: { id: true } });
        targetEmployeeId = first ? first.id : null;
      }
    }

    if (!targetEmployeeId) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      include: {
        leaveRequests: {
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    // Calculate Cambodian Labor Law metrics
    let yearsOfService = 0;
    if (employee.hireDate) {
      const hire = new Date(employee.hireDate);
      const targetYearEnd = new Date(requestedYear, 11, 31);
      const diffMs = targetYearEnd.getTime() - hire.getTime();
      yearsOfService = Math.max(0, Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000)));
    }
    const seniorityBonus = Math.floor(yearsOfService / 3);
    const annualEntitled = (employee.annualLeaveDays || 18) + seniorityBonus;
    const specialEntitled = 7.0;

    // Filter requests for selected year
    const yearRequests = (employee.leaveRequests || []).filter((r) => {
      const rDate = new Date(r.startDate);
      return rDate.getFullYear() === requestedYear && r.status !== 'REJECTED';
    });

    const annualUsed = yearRequests.filter((r) => r.leaveType === 'ANNUAL').reduce((sum, r) => sum + (r.duration || 1), 0);
    const specialUsed = yearRequests.filter((r) => r.leaveType === 'SPECIAL' || r.leaveType === 'SICK').reduce((sum, r) => sum + (r.duration || 1), 0);
    const certifiedSickUsed = yearRequests.filter((r) => r.leaveType === 'CERTIFIED_SICK' || r.leaveType === 'MEDICAL').reduce((sum, r) => sum + (r.duration || 1), 0);
    const unpaidUsed = yearRequests.filter((r) => r.leaveType === 'UNPAID').reduce((sum, r) => sum + (r.duration || 1), 0);

    const annualRemaining = Math.max(0, annualEntitled - annualUsed);
    const specialRemaining = Math.max(0, specialEntitled - specialUsed);

    return NextResponse.json({
      success: true,
      year: requestedYear,
      yearsOfService,
      seniorityBonus,
      balances: {
        annual: {
          entitled: annualEntitled,
          used: annualUsed,
          remaining: annualRemaining,
          forward1: 0.0,
          forward2: 0.0,
          forward3: 0.0,
        },
        certifiedSick: {
          entitled: 0.0,
          used: certifiedSickUsed,
          remaining: 0.0,
          forward1: 0.0,
          forward2: 0.0,
          forward3: 0.0,
        },
        special: {
          entitled: specialEntitled,
          used: specialUsed,
          remaining: specialRemaining,
          forward1: 0.0,
          forward2: 0.0,
          forward3: 0.0,
        },
        unpaid: {
          entitled: 0.0,
          used: unpaidUsed,
          remaining: 0.0,
          forward1: 0.0,
          forward2: 0.0,
          forward3: 0.0,
        },
      },
      requests: employee.leaveRequests,
    });
  } catch (error: any) {
    console.error('Error fetching leave balance:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { employeeId, leaveType, startDate, endDate, reason } = body;

    if (!employeeId || !leaveType || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        leaveRequests: {
          where: { status: { not: 'REJECTED' } },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return NextResponse.json({ success: false, error: 'ថ្ងៃបញ្ចប់ត្រូវតែក្រោយថ្ងៃចាប់ផ្តើម' }, { status: 400 });
    }

    // Calculate duration in days (excluding Sundays as standard rest day)
    let duration = 0;
    const cur = new Date(start);
    while (cur <= end) {
      if (cur.getDay() !== 0) { // Skip Sunday
        duration += 1;
      }
      cur.setDate(cur.getDate() + 1);
    }
    if (duration === 0) duration = 1; // At least 1 day if single sunday picked

    // Validate balance according to Cambodian Labor Law
    const reqYear = start.getFullYear();
    let yearsOfService = 0;
    if (employee.hireDate) {
      const hire = new Date(employee.hireDate);
      const targetYearEnd = new Date(reqYear, 11, 31);
      const diffMs = targetYearEnd.getTime() - hire.getTime();
      yearsOfService = Math.max(0, Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000)));
    }
    const seniorityBonus = Math.floor(yearsOfService / 3);

    const yearRequests = employee.leaveRequests.filter((r) => {
      const rYear = new Date(r.startDate).getFullYear();
      return rYear === reqYear;
    });

    if (leaveType === 'ANNUAL') {
      const annualEntitled = (employee.annualLeaveDays || 18) + seniorityBonus;
      const annualUsed = yearRequests.filter((r) => r.leaveType === 'ANNUAL').reduce((sum, r) => sum + (r.duration || 1), 0);
      const remaining = Math.max(0, annualEntitled - annualUsed);

      if (duration > remaining) {
        return NextResponse.json(
          {
            success: false,
            error: `សមតុល្យច្បាប់ប្រចាំឆ្នាំនៅសល់តែ ${remaining} ថ្ងៃប៉ុណ្ណោះ។ ចំនួនស្នើសុំ (${duration} ថ្ងៃ) លើសពីសមតុល្យច្បាប់ការងារ!`,
          },
          { status: 400 }
        );
      }
    } else if (leaveType === 'SPECIAL') {
      const specialEntitled = 7.0;
      const specialUsed = yearRequests.filter((r) => r.leaveType === 'SPECIAL' || r.leaveType === 'SICK').reduce((sum, r) => sum + (r.duration || 1), 0);
      const remaining = Math.max(0, specialEntitled - specialUsed);

      if (duration > remaining) {
        return NextResponse.json(
          {
            success: false,
            error: `សមតុល្យច្បាប់ពិសេស (មាត្រា ១៧១) នៅសល់តែ ${remaining} ថ្ងៃប៉ុណ្ណោះ។ ចំនួនស្នើសុំ (${duration} ថ្ងៃ) លើសពីកម្រិតកំណត់!`,
          },
          { status: 400 }
        );
      }
    }

    // Create the leave request
    const newRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        leaveType,
        startDate: start,
        endDate: end,
        duration,
        reason: reason || '',
        status: 'PENDING',
      },
    });

    // Send Telegram Notification
    try {
      const empKh = `${employee.firstNameKh || ''} ${employee.lastNameKh || ''}`.trim();
      const empEn = `${employee.firstNameEn || ''} ${employee.lastNameEn || ''}`.trim();
      const typeLabel =
        leaveType === 'ANNUAL'
          ? 'ច្បាប់ប្រចាំឆ្នាំ (Annual Leave)'
          : leaveType === 'SPECIAL'
          ? 'ច្បាប់ពិសេស (Special Leave)'
          : leaveType === 'SICK'
          ? 'ច្បាប់ឈឺ (Sick Leave)'
          : leaveType === 'CERTIFIED_SICK'
          ? 'ច្បាប់មានវេជ្ជបញ្ជា (Certified Sick)'
          : 'ច្បាប់ឥតប្រាក់ឈ្នួល (Unpaid Leave)';

      const msg = `🌴 <b>សំណើសុំច្បាប់ថ្មី (New Leave Request)</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>បុគ្គលិក:</b> ${empKh || empEn} ${empEn && empKh ? `(${empEn})` : ''}
📌 <b>អត្តលេខ:</b> ${employee.employeeId} | <b>ផ្នែក:</b> ${employee.department}
🏷 <b>ប្រភេទច្បាប់:</b> ${typeLabel}
⏱ <b>ចំនួន:</b> <b>${duration} ថ្ងៃ</b>
📅 <b>កាលបរិច្ឆេទ:</b> ${start.toLocaleDateString('km-KH')} ➔ ${end.toLocaleDateString('km-KH')}
📝 <b>មូលហេតុ:</b> ${reason || '-'}
━━━━━━━━━━━━━━━━━━━━
<i>សូមចុចប៊ូតុងខាងក្រោមដើម្បីអនុម័ត ឬបដិសេធ៖</i>`;

      await sendTelegramNotificationWithButtons(msg, [
        [
          { text: '✅ អនុម័ត (Approve)', callback_data: `APP:LEAVE:${newRequest.id}` },
          { text: '❌ បដិសេធ (Reject)', callback_data: `REJ:LEAVE:${newRequest.id}` },
        ],
      ]);
    } catch (telegramErr) {
      console.warn('Telegram notification failed:', telegramErr);
    }

    return NextResponse.json({ success: true, leaveRequest: newRequest });
  } catch (error: any) {
    console.error('Failed to submit leave request:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
