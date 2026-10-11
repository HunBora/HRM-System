import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ទទួលបានបញ្ជី Job Postings ទាំងអស់
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const jobs = await prisma.jobPosting.findMany({
      where,
      include: {
        _count: {
          select: { candidates: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch job postings' }, { status: 500 });
  }
}

// POST: បង្កើត Job Posting ថ្មី
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, department, location, type, description, requirements, status, closingDate } = body;

    if (!title || !department || !location) {
      return NextResponse.json({ error: 'Title, department, and location are required' }, { status: 400 });
    }

    const job = await prisma.jobPosting.create({
      data: {
        title,
        department,
        location,
        type: type || 'FULL_TIME',
        description: description || '',
        requirements: requirements || '',
        status: status || 'OPEN',
        closingDate: closingDate ? new Date(closingDate) : null,
      }
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Failed to create job posting' }, { status: 500 });
  }
}

// PUT: កែប្រែ Job Posting
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, department, location, type, description, requirements, status, closingDate } = body;

    if (!id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const job = await prisma.jobPosting.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(department && { department }),
        ...(location && { location }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        ...(requirements !== undefined && { requirements }),
        ...(status && { status }),
        ...(closingDate !== undefined && { closingDate: closingDate ? new Date(closingDate) : null }),
      }
    });

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: 'Failed to update job posting' }, { status: 500 });
  }
}

// DELETE: លុប Job Posting
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    await prisma.jobPosting.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Job deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting job:', error);
    return NextResponse.json({ error: 'Failed to delete job posting' }, { status: 500 });
  }
}
