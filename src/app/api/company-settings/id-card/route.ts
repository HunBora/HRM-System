import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' },
      select: { idCardDefaultSettings: true }
    });

    return NextResponse.json({
      success: true,
      idCardDefaultSettings: settings?.idCardDefaultSettings || null
    });
  } catch (error: any) {
    console.error('Error fetching ID card default settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ID card default settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (session?.role !== 'ADMIN' && session?.role !== 'HR_MANAGER' && session?.role !== 'HR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const configString =
      typeof body.idCardDefaultSettings === 'string'
        ? body.idCardDefaultSettings
        : JSON.stringify(body.idCardDefaultSettings || body);

    const updated = await prisma.companySettings.upsert({
      where: { id: 'default' },
      update: {
        idCardDefaultSettings: configString
      },
      create: {
        id: 'default',
        idCardDefaultSettings: configString
      }
    });

    return NextResponse.json({
      success: true,
      idCardDefaultSettings: updated.idCardDefaultSettings
    });
  } catch (error: any) {
    console.error('Error saving ID card default settings:', error);
    return NextResponse.json(
      { error: 'Failed to save ID card default settings' },
      { status: 500 }
    );
  }
}
