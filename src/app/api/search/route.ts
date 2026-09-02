import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q || q.length < 1) {
    return NextResponse.json({ employees: [] });
  }

  try {
    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { firstNameEn: { contains: q, mode: 'insensitive' } },
          { lastNameEn: { contains: q, mode: 'insensitive' } },
          { firstNameKh: { contains: q, mode: 'insensitive' } },
          { lastNameKh: { contains: q, mode: 'insensitive' } },
          { employeeId: { contains: q, mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        employeeId: true,
        firstNameEn: true,
        lastNameEn: true,
        firstNameKh: true,
        lastNameKh: true,
        department: true,
        photoUrl: true,
      },
      take: 10,
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
