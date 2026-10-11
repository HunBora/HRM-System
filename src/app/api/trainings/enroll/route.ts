import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ទទួលបានបញ្ជី Enrollments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trainingId = searchParams.get('trainingId');
    const employeeId = searchParams.get('employeeId');

    const where: any = {};
    if (trainingId) where.trainingId = trainingId;
    if (employeeId) where.employeeId = employeeId;

    const enrollments = await prisma.trainingEnrollment.findMany({
      where,
      include: {
        training: true,
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstNameEn: true,
            lastNameEn: true,
            position: true,
            department: true,
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    });

    return NextResponse.json(enrollments);
  } catch (error: any) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}

// POST: ចុះឈ្មោះបុគ្គលិកចូលរៀន (Enroll Employee)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trainingId, employeeId, status, score, feedback, certificateUrl } = body;

    if (!trainingId || !employeeId) {
      return NextResponse.json({ error: 'Training ID and Employee ID are required' }, { status: 400 });
    }

    const enrollment = await prisma.trainingEnrollment.create({
      data: {
        trainingId,
        employeeId,
        status: status || 'ENROLLED',
        score: score ? parseFloat(score) : null,
        feedback: feedback || null,
        certificateUrl: certificateUrl || null,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstNameEn: true,
            lastNameEn: true,
            position: true,
            department: true,
          }
        }
      }
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json({ error: 'Failed to enroll employee (may already be enrolled)' }, { status: 500 });
  }
}

// PUT: កែប្រែលទ្ធផលសិក្សា ឬវិញ្ញាបនបត្រ
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, score, feedback, certificateUrl } = body;

    if (!id) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 });
    }

    const enrollment = await prisma.trainingEnrollment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(score !== undefined && { score: score !== null ? parseFloat(score) : null }),
        ...(feedback !== undefined && { feedback }),
        ...(certificateUrl !== undefined && { certificateUrl }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      }
    });

    return NextResponse.json(enrollment);
  } catch (error: any) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json({ error: 'Failed to update enrollment' }, { status: 500 });
  }
}

// DELETE: លុបការចុះឈ្មោះ
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 });
    }

    await prisma.trainingEnrollment.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Enrollment removed successfully' });
  } catch (error: any) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json({ error: 'Failed to remove enrollment' }, { status: 500 });
  }
}
