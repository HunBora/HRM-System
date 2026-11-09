import { NextResponse } from 'next/server';
import { generateDynamicQrToken } from '@/lib/attendanceClockIn';
import { prisma } from '@/lib/prisma';
import { getCambodiaTime } from '@/lib/timezone';

export async function GET() {
  try {
    const qrData = generateDynamicQrToken();

    // Fetch the 5 latest punches to show on Kiosk screen live ticker
    const recentPunches = await prisma.biometricPunchLog.findMany({
      take: 5,
      orderBy: { punchTime: 'desc' },
      include: {
        employee: {
          select: {
            employeeId: true,
            firstNameKh: true,
            lastNameKh: true,
            firstNameEn: true,
            lastNameEn: true,
            photoUrl: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      ...qrData,
      recentPunches: recentPunches.map((p) => ({
        id: p.id,
        empId: p.employee.employeeId,
        nameKh: `${p.employee.firstNameKh || ''} ${p.employee.lastNameKh || ''}`.trim(),
        nameEn: `${p.employee.firstNameEn || ''} ${p.employee.lastNameEn || ''}`.trim(),
        department: p.employee.department,
        photoUrl: p.employee.photoUrl,
        time: getCambodiaTime(new Date(p.punchTime)),
        type: p.punchType,
        mode: p.verifyMode,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
