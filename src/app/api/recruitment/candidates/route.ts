import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ទទួលបានបញ្ជី Candidates ទាំងអស់ (អាច filter តាម jobPostingId ឬ status)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobPostingId = searchParams.get('jobPostingId');
    const status = searchParams.get('status');

    const where: any = {};
    if (jobPostingId) where.jobPostingId = jobPostingId;
    if (status && status !== 'ALL') where.status = status;

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            department: true,
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    return NextResponse.json(candidates);
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}

// POST: បង្កើត/ដាក់ពាក្យ Candidate ថ្មី
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobPostingId, firstName, lastName, email, phone, resumeUrl, coverLetter, notes, rating, status } = body;

    if (!jobPostingId || !firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Job Posting, First Name, Last Name, and Email are required' }, { status: 400 });
    }

    const candidate = await prisma.candidate.create({
      data: {
        jobPostingId,
        firstName,
        lastName,
        email,
        phone: phone || null,
        resumeUrl: resumeUrl || null,
        coverLetter: coverLetter || null,
        notes: notes || null,
        rating: rating ? parseInt(rating) : null,
        status: status || 'NEW',
      }
    });

    return NextResponse.json(candidate, { status: 201 });
  } catch (error: any) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
  }
}

// PUT: កែប្រែព័ត៌មាន ឬស្ថានភាព Candidate (Status update, Notes, Rating)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, notes, rating, resumeUrl } = body;

    if (!id) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(rating !== undefined && { rating: rating ? parseInt(rating) : null }),
        ...(resumeUrl !== undefined && { resumeUrl }),
      }
    });

    return NextResponse.json(candidate);
  } catch (error: any) {
    console.error('Error updating candidate:', error);
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
  }
}

// DELETE: លុប Candidate
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    await prisma.candidate.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json({ error: 'Failed to delete candidate' }, { status: 500 });
  }
}
