import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Process and sync biometric punch logs into DailyAttendance table
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetDateStr = body.date || new Date().toISOString().slice(0, 10);
    const deviceId = body.deviceId;

    const startDate = new Date(targetDateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDateStr);
    endDate.setHours(23, 59, 59, 999);

    // 1. Fetch all punch logs for target date
    const logs = await prisma.biometricPunchLog.findMany({
      where: {
        punchTime: { gte: startDate, lte: endDate },
        ...(deviceId && { deviceId }),
      },
      orderBy: { punchTime: 'asc' },
    });

    if (logs.length === 0) {
      return NextResponse.json({
        message: 'គ្មានកំណត់ត្រាស្កេនមេដៃសម្រាប់កាលបរិច្ឆេទនេះទេ (No logs found for this date)',
        processedCount: 0,
      });
    }

    // 2. Group punches by employeeId
    const employeeLogs: Record<string, any[]> = {};
    for (const log of logs) {
      if (!employeeLogs[log.employeeId]) {
        employeeLogs[log.employeeId] = [];
      }
      employeeLogs[log.employeeId].push(log);
    }

    let updatedAttendanceCount = 0;

    // 3. For each employee, compute daily timesheet
    for (const [employeeId, empPunches] of Object.entries(employeeLogs)) {
      if (empPunches.length === 0) continue;

      const formatTime = (d: Date) => {
        return d.toTimeString().slice(0, 5); // "HH:MM"
      };

      const sortedTimes = empPunches.map((p) => new Date(p.punchTime)).sort((a, b) => a.getTime() - b.getTime());

      const firstPunch = sortedTimes[0];
      const lastPunch = sortedTimes[sortedTimes.length - 1];

      const fInStr = formatTime(firstPunch);
      const sOutStr = sortedTimes.length > 1 ? formatTime(lastPunch) : null;

      // Calculate approximate working hours
      let workHours = 0;
      if (sortedTimes.length > 1) {
        const diffMs = lastPunch.getTime() - firstPunch.getTime();
        workHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        // If greater than 5 hours, subtract 1 hour for lunch
        if (workHours > 5) workHours = Math.max(0, workHours - 1);
      } else {
        workHours = 4.0; // Half day if only checked in
      }

      // Check if late (after 08:05)
      const inMinutes = firstPunch.getHours() * 60 + firstPunch.getMinutes();
      const standardStartMinutes = 8 * 60; // 08:00
      const lateMins = Math.max(0, inMinutes - standardStartMinutes);

      // Upsert DailyAttendance
      await prisma.dailyAttendance.upsert({
        where: {
          employeeId_date: {
            employeeId,
            date: startDate,
          },
        },
        update: {
          fIn: fInStr,
          ...(sOutStr && { sOut: sOutStr }),
          workHrs: workHours,
          regDay: workHours >= 7 ? 1.0 : 0.5,
          lateMins,
          remarks: `Biometric Sync (${empPunches.length} punches)`,
        },
        create: {
          employeeId,
          date: startDate,
          fIn: fInStr,
          sOut: sOutStr,
          workHrs: workHours,
          regDay: workHours >= 7 ? 1.0 : 0.5,
          lateMins,
          remarks: `Biometric Sync (${empPunches.length} punches)`,
        },
      });

      updatedAttendanceCount++;
    }

    // 4. Update device lastSyncTime
    if (deviceId) {
      await prisma.biometricDevice.update({
        where: { id: deviceId },
        data: {
          lastSyncTime: new Date(),
          totalLogsCount: { increment: logs.length },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `បានធ្វើសមកាលកម្មទិន្នន័យជោគជ័យ! បុគ្គលិកចំនួន ${updatedAttendanceCount} នាក់ (${logs.length} កំណត់ត្រាស្កេន)`,
      syncedEmployees: updatedAttendanceCount,
      totalPunches: logs.length,
    });
  } catch (error: any) {
    console.error('Error syncing biometric logs:', error);
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
