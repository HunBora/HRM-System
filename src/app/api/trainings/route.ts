import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ទទួលបានបញ្ជី Training Programs ទាំងអស់
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const trainings = await prisma.trainingProgram.findMany({
      where,
      include: {
        _count: {
          select: { enrollments: true }
        },
        enrollments: {
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
        }
      },
      orderBy: { startDate: 'desc' }
    });

    return NextResponse.json(trainings);
  } catch (error: any) {
    console.error('Error fetching trainings:', error);
    return NextResponse.json({ error: 'Failed to fetch training programs' }, { status: 500 });
  }
}

// POST: បង្កើត Training Program ថ្មី
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, trainer, location, startDate, endDate, cost, status } = body;

    if (!title || !startDate || !endDate) {
      return NextResponse.json({ error: 'Title, start date, and end date are required' }, { status: 400 });
    }

    const training = await prisma.trainingProgram.create({
      data: {
        title,
        description: description || '',
        trainer: trainer || null,
        location: location || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        cost: cost ? parseFloat(cost) : 0,
        status: status || 'UPCOMING',
      }
    });

    return NextResponse.json(training, { status: 201 });
  } catch (error: any) {
    console.error('Error creating training:', error);
    return NextResponse.json({ error: 'Failed to create training program' }, { status: 500 });
  }
}

// PUT: កែប្រែ Training Program
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, description, trainer, location, startDate, endDate, cost, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Training ID is required' }, { status: 400 });
    }

    const training = await prisma.trainingProgram.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(trainer !== undefined && { trainer }),
        ...(location !== undefined && { location }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(cost !== undefined && { cost: parseFloat(cost) || 0 }),
        ...(status && { status }),
      }
    });

    return NextResponse.json(training);
  } catch (error: any) {
    console.error('Error updating training:', error);
    return NextResponse.json({ error: 'Failed to update training program' }, { status: 500 });
  }
}

// DELETE: លុប Training Program
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Training ID is required' }, { status: 400 });
    }

    await prisma.trainingProgram.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Training program deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting training:', error);
    return NextResponse.json({ error: 'Failed to delete training program' }, { status: 500 });
  }
}
