import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleName = searchParams.get('module');
    const action = searchParams.get('action');
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    const where: any = {};
    if (moduleName && moduleName !== 'ALL') where.module = moduleName;
    if (action && action !== 'ALL') where.action = action;
    if (status && status !== 'ALL') where.status = status;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 250,
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { action, module, targetId, targetName, details, status = 'SUCCESS' } = body;

    const log = await prisma.auditLog.create({
      data: {
        action,
        module,
        userId: session?.userId || null,
        userName: session?.email || 'Admin',
        userRole: session?.role || 'ADMIN',
        targetId,
        targetName,
        details,
        status,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Browser',
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error: any) {
    console.error('Error creating audit log:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (session?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const purgeOlderThanDays = searchParams.get('purgeDays');

    if (id) {
      await prisma.auditLog.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Log deleted' });
    }

    if (purgeOlderThanDays) {
      const days = parseInt(purgeOlderThanDays, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const res = await prisma.auditLog.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });

      return NextResponse.json({ success: true, deletedCount: res.count });
    }

    return NextResponse.json({ error: 'ID or purgeDays parameter required' }, { status: 400 });
  } catch (error: any) {
    console.error('Error deleting audit log:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
