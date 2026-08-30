import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    // We only update the 'default' settings record
    const updated = await prisma.companySettings.update({
      where: { id: 'default' },
      data: {
        fontSize: data.fontSize,
        fontFamily: data.fontFamily,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update company settings' }, { status: 500 });
  }
}
