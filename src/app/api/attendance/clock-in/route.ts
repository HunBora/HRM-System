import { NextRequest, NextResponse } from 'next/server';
import { processMobileClockIn } from '@/lib/attendanceClockIn';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();

    let targetEmployeeId = body.employeeId;

    // If no employeeId passed, resolve from session or employee code
    if (!targetEmployeeId && session?.employeeId) {
      targetEmployeeId = session.employeeId;
    }

    // Support submitting by employee code/ID
    if (body.empCode && !targetEmployeeId) {
      const emp = await prisma.employee.findUnique({
        where: { employeeId: body.empCode.trim() },
      });
      if (emp) {
        targetEmployeeId = emp.id;
      }
    }

    if (!targetEmployeeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'មិនអាចស្វែងរកទិន្នន័យបុគ្គលិកបានទេ! (Employee account or ID missing)',
        },
        { status: 400 }
      );
    }

    const result = await processMobileClockIn({
      employeeId: targetEmployeeId,
      method: body.method || 'QR_DYNAMIC',
      qrToken: body.qrToken,
      latitude: body.latitude !== undefined ? Number(body.latitude) : undefined,
      longitude: body.longitude !== undefined ? Number(body.longitude) : undefined,
      accuracy: body.accuracy !== undefined ? Number(body.accuracy) : undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'កំហុសបច្ចេកទេសក្នុងការកត់ត្រាវត្តមាន',
      },
      { status: 400 }
    );
  }
}
