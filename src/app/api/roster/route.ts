import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ទទួលបានទិន្នន័យកាលវិភាគវេនការងារ (Roster)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth() + 1;
    const department = searchParams.get('department');
    const employeeId = searchParams.get('employeeId');

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      }
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (department && department !== 'ALL') {
      where.employee = {
        department: department
      };
    }

    const rosters = await prisma.shiftRoster.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstNameEn: true,
            lastNameEn: true,
            position: true,
            department: true,
            line: true,
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json(rosters);
  } catch (error: any) {
    console.error('Error fetching rosters:', error);
    return NextResponse.json({ error: 'Failed to fetch roster data' }, { status: 500 });
  }
}

// POST: ចាត់តាំងវេនការងារ (Assign / Upsert Shift)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, date, shiftType, startTime, endTime, notes, bulkDates } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    // Support bulk date assignment (e.g. array of dates)
    if (bulkDates && Array.isArray(bulkDates) && bulkDates.length > 0) {
      const ops = bulkDates.map((dStr: string) => {
        const d = new Date(dStr);
        return prisma.shiftRoster.upsert({
          where: {
            employeeId_date: {
              employeeId,
              date: d,
            }
          },
          update: {
            shiftType: shiftType || 'MORNING',
            startTime: startTime || null,
            endTime: endTime || null,
            notes: notes || null,
          },
          create: {
            employeeId,
            date: d,
            shiftType: shiftType || 'MORNING',
            startTime: startTime || null,
            endTime: endTime || null,
            notes: notes || null,
          }
        });
      });

      const results = await prisma.$transaction(ops);
      return NextResponse.json({ success: true, count: results.length });
    }

    // Single date assignment
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const targetDate = new Date(date);
    const roster = await prisma.shiftRoster.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: targetDate,
        }
      },
      update: {
        shiftType: shiftType || 'MORNING',
        startTime: startTime || null,
        endTime: endTime || null,
        notes: notes || null,
      },
      create: {
        employeeId,
        date: targetDate,
        shiftType: shiftType || 'MORNING',
        startTime: startTime || null,
        endTime: endTime || null,
        notes: notes || null,
      }
    });

    return NextResponse.json(roster);
  } catch (error: any) {
    console.error('Error assigning roster:', error);
    return NextResponse.json({ error: 'Failed to assign shift roster' }, { status: 500 });
  }
}

// DELETE: លុបវេនការងារ
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const dateStr = searchParams.get('date');

    if (!employeeId || !dateStr) {
      return NextResponse.json({ error: 'Employee ID and date are required' }, { status: 400 });
    }

    await prisma.shiftRoster.delete({
      where: {
        employeeId_date: {
          employeeId,
          date: new Date(dateStr)
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Shift assignment removed' });
  } catch (error: any) {
    console.error('Error deleting roster:', error);
    return NextResponse.json({ error: 'Failed to delete roster entry' }, { status: 500 });
  }
}
