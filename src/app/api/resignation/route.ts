import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ទាញយកកំណត់ត្រាលាលែង និងសម្ភាសន៍ចាកចេញ (Exit Interviews)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const department = searchParams.get('department');
    const primaryReason = searchParams.get('primaryReason');
    const status = searchParams.get('status');

    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (primaryReason && primaryReason !== 'ALL') {
      where.primaryReason = primaryReason;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (department && department !== 'ALL') {
      where.employee = {
        department: department
      };
    }

    const records = await prisma.exitInterview.findMany({
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
          }
        }
      },
      orderBy: { resignationDate: 'desc' }
    });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Error fetching exit interviews:', error);
    return NextResponse.json({ error: 'Failed to fetch resignation records' }, { status: 500 });
  }
}

// POST: បង្កើតកំណត់ត្រាលាលែងថ្មី (Create Exit Record)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      employeeId,
      resignationDate,
      lastWorkingDate,
      primaryReason,
      reasonDetails,
      cultureRating,
      managementRating,
      salaryBenefitRating,
      workEnvRating,
      growthOppRating,
      wouldRecommend,
      handoverPerson,
      handoverNotes,
      itClearance,
      financeClearance,
      adminClearance,
      hrClearance,
      interviewerName,
      feedbackNotes,
      status,
    } = body;

    if (!employeeId || !lastWorkingDate) {
      return NextResponse.json({ error: 'Employee and Last Working Date are required' }, { status: 400 });
    }

    const newRecord = await prisma.exitInterview.create({
      data: {
        employeeId,
        resignationDate: resignationDate ? new Date(resignationDate) : new Date(),
        lastWorkingDate: new Date(lastWorkingDate),
        primaryReason: primaryReason || 'CAREER_GROWTH',
        reasonDetails: reasonDetails || null,
        cultureRating: Number(cultureRating) || 4,
        managementRating: Number(managementRating) || 4,
        salaryBenefitRating: Number(salaryBenefitRating) || 3,
        workEnvRating: Number(workEnvRating) || 4,
        growthOppRating: Number(growthOppRating) || 3,
        wouldRecommend: Boolean(wouldRecommend),
        handoverPerson: handoverPerson || null,
        handoverNotes: handoverNotes || null,
        itClearance: Boolean(itClearance),
        financeClearance: Boolean(financeClearance),
        adminClearance: Boolean(adminClearance),
        hrClearance: Boolean(hrClearance),
        interviewerName: interviewerName || 'HR Department',
        feedbackNotes: feedbackNotes || null,
        status: status || 'PENDING',
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

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: any) {
    console.error('Error creating resignation record:', error);
    return NextResponse.json({ error: 'Failed to create resignation record' }, { status: 500 });
  }
}

// PUT: កែប្រែកំណត់ត្រា ឬ Clearance status
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      resignationDate,
      lastWorkingDate,
      primaryReason,
      reasonDetails,
      cultureRating,
      managementRating,
      salaryBenefitRating,
      workEnvRating,
      growthOppRating,
      wouldRecommend,
      handoverPerson,
      handoverNotes,
      itClearance,
      financeClearance,
      adminClearance,
      hrClearance,
      interviewerName,
      feedbackNotes,
      status,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updated = await prisma.exitInterview.update({
      where: { id },
      data: {
        resignationDate: resignationDate ? new Date(resignationDate) : undefined,
        lastWorkingDate: lastWorkingDate ? new Date(lastWorkingDate) : undefined,
        primaryReason: primaryReason || undefined,
        reasonDetails: reasonDetails !== undefined ? reasonDetails : undefined,
        cultureRating: cultureRating !== undefined ? Number(cultureRating) : undefined,
        managementRating: managementRating !== undefined ? Number(managementRating) : undefined,
        salaryBenefitRating: salaryBenefitRating !== undefined ? Number(salaryBenefitRating) : undefined,
        workEnvRating: workEnvRating !== undefined ? Number(workEnvRating) : undefined,
        growthOppRating: growthOppRating !== undefined ? Number(growthOppRating) : undefined,
        wouldRecommend: wouldRecommend !== undefined ? Boolean(wouldRecommend) : undefined,
        handoverPerson: handoverPerson !== undefined ? handoverPerson : undefined,
        handoverNotes: handoverNotes !== undefined ? handoverNotes : undefined,
        itClearance: itClearance !== undefined ? Boolean(itClearance) : undefined,
        financeClearance: financeClearance !== undefined ? Boolean(financeClearance) : undefined,
        adminClearance: adminClearance !== undefined ? Boolean(adminClearance) : undefined,
        hrClearance: hrClearance !== undefined ? Boolean(hrClearance) : undefined,
        interviewerName: interviewerName !== undefined ? interviewerName : undefined,
        feedbackNotes: feedbackNotes !== undefined ? feedbackNotes : undefined,
        status: status || undefined,
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
    console.error('Error updating resignation record:', error);
    return NextResponse.json({ error: 'Failed to update resignation record' }, { status: 500 });
  }
}

// DELETE: លុបកំណត់ត្រា
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.exitInterview.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Record deleted' });
  } catch (error: any) {
    console.error('Error deleting resignation record:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
