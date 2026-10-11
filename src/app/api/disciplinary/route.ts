import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ទាញយកបញ្ជីវិធានការវិន័យ (Disciplinary Actions)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const department = searchParams.get('department');
    const actionType = searchParams.get('actionType');
    const status = searchParams.get('status');

    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (actionType && actionType !== 'ALL') {
      where.actionType = actionType;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (department && department !== 'ALL') {
      where.employee = {
        department: department
      };
    }

    const actions = await prisma.disciplinaryAction.findMany({
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
            position: true,
            department: true,
            line: true,
            photoUrl: true,
          }
        }
      },
      orderBy: { incidentDate: 'desc' }
    });

    return NextResponse.json(actions);
  } catch (error: any) {
    console.error('Error fetching disciplinary actions:', error);
    return NextResponse.json({ error: 'Failed to fetch disciplinary records' }, { status: 500 });
  }
}

// POST: បង្កើតវិធានការវិន័យថ្មី (Create Disciplinary Record)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      employeeId,
      actionType,
      incidentDate,
      subject,
      reason,
      description,
      actionTaken,
      issuedBy,
      status,
      documentUrl,
      warningCount
    } = body;

    if (!employeeId || !subject || !incidentDate) {
      return NextResponse.json({ error: 'Employee, subject, and incident date are required' }, { status: 400 });
    }

    const newAction = await prisma.disciplinaryAction.create({
      data: {
        employeeId,
        actionType: actionType || 'WRITTEN_WARNING',
        incidentDate: new Date(incidentDate),
        subject,
        reason: reason || 'POLICY_VIOLATION',
        description: description || null,
        actionTaken: actionTaken || null,
        issuedBy: issuedBy || 'HR Department',
        status: status || 'ACTIVE',
        documentUrl: documentUrl || null,
        warningCount: Number(warningCount) || 1,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstNameEn: true,
            lastNameEn: true,
            firstNameKh: true,
            lastNameKh: true,
            position: true,
            department: true,
          }
        }
      }
    });

    return NextResponse.json(newAction, { status: 201 });
  } catch (error: any) {
    console.error('Error creating disciplinary record:', error);
    return NextResponse.json({ error: 'Failed to create disciplinary record' }, { status: 500 });
  }
}

// PUT: កែប្រែព័ត៌មានវិធានការវិន័យ (Update Record)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      actionType,
      incidentDate,
      subject,
      reason,
      description,
      actionTaken,
      issuedBy,
      status,
      documentUrl,
      warningCount
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updated = await prisma.disciplinaryAction.update({
      where: { id },
      data: {
        actionType: actionType || undefined,
        incidentDate: incidentDate ? new Date(incidentDate) : undefined,
        subject: subject || undefined,
        reason: reason || undefined,
        description: description !== undefined ? description : undefined,
        actionTaken: actionTaken !== undefined ? actionTaken : undefined,
        issuedBy: issuedBy !== undefined ? issuedBy : undefined,
        status: status || undefined,
        documentUrl: documentUrl !== undefined ? documentUrl : undefined,
        warningCount: warningCount !== undefined ? Number(warningCount) : undefined,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstNameEn: true,
            lastNameEn: true,
            firstNameKh: true,
            lastNameKh: true,
            position: true,
            department: true,
          }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating disciplinary record:', error);
    return NextResponse.json({ error: 'Failed to update disciplinary record' }, { status: 500 });
  }
}

// DELETE: លុបកំណត់ត្រាវិន័យ
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.disciplinaryAction.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Disciplinary record deleted' });
  } catch (error: any) {
    console.error('Error deleting disciplinary record:', error);
    return NextResponse.json({ error: 'Failed to delete disciplinary record' }, { status: 500 });
  }
}
