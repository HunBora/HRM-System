import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedEmpId = searchParams.get('employeeId');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

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

    // Default to last 14 days if not specified
    const end = endDateStr ? new Date(endDateStr) : new Date();
    end.setHours(23, 59, 59, 999);

    const start = startDateStr ? new Date(startDateStr) : new Date(end);
    if (!startDateStr) {
      start.setDate(start.getDate() - 7);
    }
    start.setHours(0, 0, 0, 0);

    const [dailyAttendances, biometricLogs, overtimeRequests, leaveRequests, employee] = await Promise.all([
      prisma.dailyAttendance.findMany({
        where: {
          employeeId: targetEmployeeId,
          date: { gte: start, lte: end },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.biometricPunchLog.findMany({
        where: {
          employeeId: targetEmployeeId,
          punchTime: { gte: start, lte: end },
        },
        orderBy: { punchTime: 'asc' },
      }),
      prisma.overtimeRequest.findMany({
        where: {
          employeeId: targetEmployeeId,
          otDate: { gte: start, lte: end },
        },
      }),
      prisma.leaveRequest.findMany({
        where: {
          employeeId: targetEmployeeId,
          status: 'APPROVED',
        },
      }),
      prisma.employee.findUnique({
        where: { id: targetEmployeeId },
        select: {
          id: true,
          employeeId: true,
          firstNameKh: true,
          lastNameKh: true,
          firstNameEn: true,
          lastNameEn: true,
          shift: true,
          department: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      employee,
      dailyAttendances,
      biometricLogs,
      overtimeRequests,
      leaveRequests,
    });
  } catch (error: any) {
    console.error('Failed to get attendance history:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
