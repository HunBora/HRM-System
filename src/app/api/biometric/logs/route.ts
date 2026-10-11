import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET punch logs with filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const punchType = searchParams.get('punchType');
    const date = searchParams.get('date');

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (punchType && punchType !== 'ALL') where.punchType = punchType;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.punchTime = { gte: start, lte: end };
    }

    const logs = await prisma.biometricPunchLog.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstNameEn: true,
            lastNameEn: true,
            firstNameKh: true,
            lastNameKh: true,
            department: true,
            position: true,
            photoUrl: true,
          },
        },
        device: {
          select: {
            id: true,
            deviceName: true,
            deviceIp: true,
            location: true,
          },
        },
      },
      orderBy: { punchTime: 'desc' },
      take: 200,
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Error fetching punch logs:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 });
  }
}

// POST create punch log (single or bulk from Excel import)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if bulk insert
    if (Array.isArray(body.logs)) {
      const createdLogs = [];
      for (const item of body.logs) {
        let empId = item.employeeId;
        // If passed device card or employee ID code, find employee by employeeId
        if (item.empCode) {
          const emp = await prisma.employee.findFirst({
            where: {
              OR: [
                { employeeId: item.empCode },
                { cardNo: item.empCode },
              ],
            },
          });
          if (emp) empId = emp.id;
        }

        if (empId) {
          const log = await prisma.biometricPunchLog.create({
            data: {
              employeeId: empId,
              punchTime: item.punchTime ? new Date(item.punchTime) : new Date(),
              punchType: item.punchType || 'CHECK_IN',
              verifyMode: item.verifyMode || 'FINGERPRINT',
              deviceId: item.deviceId || null,
              deviceName: item.deviceName || 'USB Import / Terminal',
              source: item.source || 'EXCEL_IMPORT',
              syncStatus: 'SYNCED',
              notes: item.notes || null,
            },
          });
          createdLogs.push(log);
        }
      }

      return NextResponse.json({ success: true, count: createdLogs.length, logs: createdLogs });
    }

    // Single creation
    const { employeeId, punchTime, punchType, verifyMode, deviceId, deviceName, notes } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee is required' }, { status: 400 });
    }

    const newLog = await prisma.biometricPunchLog.create({
      data: {
        employeeId,
        punchTime: punchTime ? new Date(punchTime) : new Date(),
        punchType: punchType || 'CHECK_IN',
        verifyMode: verifyMode || 'MANUAL',
        deviceId: deviceId || null,
        deviceName: deviceName || 'Manual Entry / Terminal',
        source: 'MANUAL',
        syncStatus: 'SYNCED',
        notes: notes || null,
      },
      include: {
        employee: true,
        device: true,
      },
    });

    return NextResponse.json(newLog, { status: 201 });
  } catch (error: any) {
    console.error('Error creating punch log:', error);
    return NextResponse.json({ error: error.message || 'Failed to create punch log' }, { status: 500 });
  }
}

// DELETE log
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Log ID required' }, { status: 400 });
    }

    await prisma.biometricPunchLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting punch log:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
