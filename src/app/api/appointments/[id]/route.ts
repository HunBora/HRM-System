import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET /api/appointments/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const appointment = await prisma.appointmentLetter.findUnique({
      where: { id },
      include: {
        employee: true
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment letter not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    console.error('Error fetching appointment by id:', error);
    return NextResponse.json({ error: 'Failed to fetch appointment letter' }, { status: 500 });
  }
}

// PUT /api/appointments/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
      employeeId,
      oldPosition,
      oldDepartment,
      newPosition,
      newDepartment,
      reportsTo,
      effectiveDate,
      probationMonths,
      newSalary,
      positionAllowance,
      benefits,
      duties,
      preambleLaw,
      preambleInternalRule,
      preamblePerformance,
      preambleNeeds,
      signLocation,
      signDate,
      signatoryTitle,
      signatoryName,
      ccList,
      templateStyle,
      status,
      notes
    } = body;

    let effective: Date | undefined;
    if (effectiveDate) {
      effective = new Date(effectiveDate);
    }

    let signing: Date | undefined;
    if (signDate) {
      signing = new Date(signDate);
    }

    let dutiesJson: string | undefined;
    if (duties !== undefined) {
      if (Array.isArray(duties)) {
        dutiesJson = JSON.stringify(duties);
      } else if (typeof duties === 'string') {
        try {
          const parsed = JSON.parse(duties);
          dutiesJson = JSON.stringify(Array.isArray(parsed) ? parsed : [duties]);
        } catch {
          dutiesJson = JSON.stringify(duties.split('\n').filter((d: string) => d.trim().length > 0));
        }
      }
    }

    const updated = await prisma.appointmentLetter.update({
      where: { id },
      data: {
        ...(employeeId && { employeeId }),
        ...(oldPosition !== undefined && { oldPosition }),
        ...(oldDepartment !== undefined && { oldDepartment }),
        ...(newPosition && { newPosition }),
        ...(newDepartment && { newDepartment }),
        ...(reportsTo !== undefined && { reportsTo }),
        ...(effective && { effectiveDate: effective }),
        ...(probationMonths !== undefined && { probationMonths: Number(probationMonths) }),
        ...(newSalary !== undefined && { newSalary: newSalary ? Number(newSalary) : null }),
        ...(positionAllowance !== undefined && { positionAllowance: positionAllowance ? Number(positionAllowance) : null }),
        ...(benefits !== undefined && { benefits }),
        ...(dutiesJson !== undefined && { dutiesJson }),
        ...(preambleLaw !== undefined && { preambleLaw }),
        ...(preambleInternalRule !== undefined && { preambleInternalRule }),
        ...(preamblePerformance !== undefined && { preamblePerformance }),
        ...(preambleNeeds !== undefined && { preambleNeeds }),
        ...(signLocation !== undefined && { signLocation }),
        ...(signing && { signDate: signing }),
        ...(signatoryTitle !== undefined && { signatoryTitle }),
        ...(signatoryName !== undefined && { signatoryName }),
        ...(ccList !== undefined && { ccList }),
        ...(templateStyle !== undefined && { templateStyle }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes })
      },
      include: {
        employee: true
      }
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    console.error('Error updating appointment letter:', error);
    return NextResponse.json({ error: error.message || 'Failed to update appointment letter' }, { status: 500 });
  }
}

// DELETE /api/appointments/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'HR_MANAGER' && session.role !== 'HR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.appointmentLetter.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting appointment letter:', error);
    return NextResponse.json({ error: 'Failed to delete appointment letter' }, { status: 500 });
  }
}
