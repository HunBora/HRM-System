import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ទាញយកបញ្ជីសេចក្តីជូនដំណឹង (Company Announcements)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const targetDept = searchParams.get('targetDept');
    const status = searchParams.get('status');

    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (targetDept && targetDept !== 'ALL') {
      where.OR = [
        { targetDept: 'ALL' },
        { targetDept: targetDept }
      ];
    }

    const announcements = await prisma.companyAnnouncement.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { effectiveDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(announcements);
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

// POST: បង្កើតសេចក្តីជូនដំណឹងថ្មី (Create Announcement)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      category,
      targetDept,
      priority,
      isPinned,
      effectiveDate,
      expiryDate,
      authorName,
      attachmentUrl,
      status
    } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and Content are required' }, { status: 400 });
    }

    const announcement = await prisma.companyAnnouncement.create({
      data: {
        title,
        content,
        category: category || 'GENERAL',
        targetDept: targetDept || 'ALL',
        priority: priority || 'NORMAL',
        isPinned: Boolean(isPinned),
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        authorName: authorName || 'Management / HR',
        attachmentUrl: attachmentUrl || null,
        status: status || 'PUBLISHED',
      }
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}

// PUT: កែប្រែសេចក្តីជូនដំណឹង ឬ Toggle Pin / View count
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      content,
      category,
      targetDept,
      priority,
      isPinned,
      effectiveDate,
      expiryDate,
      authorName,
      attachmentUrl,
      status,
      incrementView
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Quick increment view
    if (incrementView) {
      const updated = await prisma.companyAnnouncement.update({
        where: { id },
        data: { viewsCount: { increment: 1 } }
      });
      return NextResponse.json(updated);
    }

    const updated = await prisma.companyAnnouncement.update({
      where: { id },
      data: {
        title: title || undefined,
        content: content || undefined,
        category: category || undefined,
        targetDept: targetDept || undefined,
        priority: priority || undefined,
        isPinned: isPinned !== undefined ? Boolean(isPinned) : undefined,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : undefined,
        authorName: authorName !== undefined ? authorName : undefined,
        attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : undefined,
        status: status || undefined,
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

// DELETE: លុបសេចក្តីជូនដំណឹង
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.companyAnnouncement.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Announcement deleted' });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
