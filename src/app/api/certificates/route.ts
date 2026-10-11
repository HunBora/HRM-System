import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Generate unique reference number
function generateRefNo(type: string): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  let prefix = 'CERT';
  if (type === 'SALARY_CERTIFICATE') prefix = 'SAL';
  else if (type === 'EMPLOYMENT_CERTIFICATE') prefix = 'EMP';
  else if (type === 'INTERNSHIP_CERTIFICATE') prefix = 'INT';
  else if (type === 'EXPERIENCE_LETTER') prefix = 'EXP';
  return `HR-${prefix}-${year}-${rand}`;
}

// GET: ទាញយកសំណើលិខិតបញ្ជាក់ (Certificate Requests)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const certificateType = searchParams.get('certificateType');

    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (certificateType && certificateType !== 'ALL') {
      where.certificateType = certificateType;
    }

    if (department && department !== 'ALL') {
      where.employee = {
        department: department
      };
    }

    const records = await prisma.certificateRequest.findMany({
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
            hireDate: true,
            basicSalary: true,
            gender: true,
          }
        }
      },
      orderBy: { requestDate: 'desc' }
    });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ error: 'Failed to fetch certificate requests' }, { status: 500 });
  }
}

// POST: បង្កើតសំណើលិខិតថ្មី (Create Request)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      employeeId,
      certificateType,
      purpose,
      addressee,
      notes,
      status,
      issuedBy
    } = body;

    if (!employeeId || !purpose) {
      return NextResponse.json({ error: 'Employee and purpose are required' }, { status: 400 });
    }

    const type = certificateType || 'EMPLOYMENT_CERTIFICATE';
    const refNo = generateRefNo(type);

    const isIssued = status === 'ISSUED';

    const newCert = await prisma.certificateRequest.create({
      data: {
        employeeId,
        certificateType: type,
        requestDate: new Date(),
        purpose,
        addressee: addressee || 'To Whom It May Concern (ជូនចំពោះអ្នកពាក់ព័ន្ធ)',
        status: status || 'PENDING',
        issuedDate: isIssued ? new Date() : null,
        issuedBy: isIssued ? (issuedBy || 'HR Department') : null,
        referenceNo: refNo,
        notes: notes || null,
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
            hireDate: true,
            basicSalary: true,
            gender: true,
          }
        }
      }
    });

    return NextResponse.json(newCert, { status: 201 });
  } catch (error: any) {
    console.error('Error creating certificate request:', error);
    return NextResponse.json({ error: 'Failed to create certificate request' }, { status: 500 });
  }
}

// PUT: អនុម័ត ឬ ចេញលិខិត (Approve / Issue Letter)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      status,
      issuedBy,
      notes,
      addressee,
      purpose
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const isIssued = status === 'ISSUED';

    const updated = await prisma.certificateRequest.update({
      where: { id },
      data: {
        status: status || undefined,
        issuedDate: isIssued ? new Date() : undefined,
        issuedBy: isIssued ? (issuedBy || 'HR Department') : undefined,
        notes: notes !== undefined ? notes : undefined,
        addressee: addressee !== undefined ? addressee : undefined,
        purpose: purpose !== undefined ? purpose : undefined,
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
            hireDate: true,
            basicSalary: true,
            gender: true,
          }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating certificate:', error);
    return NextResponse.json({ error: 'Failed to update certificate request' }, { status: 500 });
  }
}

// DELETE: លុបសំណើលិខិត
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.certificateRequest.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Certificate request deleted' });
  } catch (error: any) {
    console.error('Error deleting certificate:', error);
    return NextResponse.json({ error: 'Failed to delete certificate' }, { status: 500 });
  }
}
