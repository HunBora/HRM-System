import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET /api/delegations - List all delegations
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const q = searchParams.get('q');
    const delegatorId = searchParams.get('delegatorId');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (delegatorId) {
      where.delegatorId = delegatorId;
    }
    if (q) {
      where.OR = [
        { refNo: { contains: q, mode: 'insensitive' } },
        { reasonDetail: { contains: q, mode: 'insensitive' } },
        { missionLocation: { contains: q, mode: 'insensitive' } },
        { delegateesJson: { contains: q, mode: 'insensitive' } },
        {
          delegator: {
            OR: [
              { firstNameKh: { contains: q } },
              { lastNameKh: { contains: q } },
              { firstNameEn: { contains: q, mode: 'insensitive' } },
              { lastNameEn: { contains: q, mode: 'insensitive' } },
              { employeeId: { contains: q, mode: 'insensitive' } },
              { nationalId: { contains: q, mode: 'insensitive' } },
              { department: { contains: q, mode: 'insensitive' } },
              { position: { contains: q, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    const delegations = await prisma.delegationOfAuthority.findMany({
      where,
      include: {
        delegator: {
          select: {
            id: true,
            employeeId: true,
            firstNameKh: true,
            lastNameKh: true,
            firstNameEn: true,
            lastNameEn: true,
            gender: true,
            dob: true,
            nationalId: true,
            department: true,
            position: true,
            phone: true,
            photoUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, delegations });
  } catch (error: any) {
    console.error('Error fetching delegations:', error);
    return NextResponse.json({ error: 'Failed to fetch delegations' }, { status: 500 });
  }
}

// POST /api/delegations - Create a new delegation
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      delegatorId,
      reasonType,
      reasonDetail,
      missionLocation,
      startDate,
      endDate,
      delegatees, // array of { employeeId, nameKh, nameEn, position, department, phone, scopeOfWork, financialLimit, specificTasks }
      canApproveLeave,
      canApproveOt,
      canSignDailyReports,
      canApproveExpense,
      maxExpenseAmount,
      canManageOperations,
      canCoordinateClients,
      canAccessKeysStamps,
      restrictions,
      handoverItems,
      notes,
      templateStyle,
      approvedByDeptHead,
      approvedByManagement
    } = body;

    if (!delegatorId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'សូមបំពេញព័ត៌មានចាំបាច់ (អ្នកផ្ទេរសិទ្ធិ, ថ្ងៃចាប់ផ្តើម, ថ្ងៃបញ្ចប់)' },
        { status: 400 }
      );
    }

    // Auto-generate reference number: DOA-YYYYMM-XXXX
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const countThisMonth = await prisma.delegationOfAuthority.count({
      where: {
        refNo: { startsWith: `DOA-${yearMonth}` }
      }
    });
    const seq = String(countThisMonth + 1).padStart(4, '0');
    const refNo = `DOA-${yearMonth}-${seq}`;

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const delegateesList = Array.isArray(delegatees) ? delegatees : [];
    const delegateesJson = JSON.stringify(delegateesList);

    const delegation = await prisma.delegationOfAuthority.create({
      data: {
        refNo,
        delegatorId,
        reasonType: reasonType || 'MISSION',
        reasonDetail: reasonDetail || '',
        missionLocation: missionLocation || '',
        startDate: start,
        endDate: end,
        totalDays,
        delegateesJson,
        canApproveLeave: canApproveLeave ?? true,
        canApproveOt: canApproveOt ?? true,
        canSignDailyReports: canSignDailyReports ?? true,
        canApproveExpense: canApproveExpense ?? false,
        maxExpenseAmount: maxExpenseAmount ? Number(maxExpenseAmount) : null,
        canManageOperations: canManageOperations ?? true,
        canCoordinateClients: canCoordinateClients ?? false,
        canAccessKeysStamps: canAccessKeysStamps ?? false,
        restrictions: restrictions || '',
        handoverItems: handoverItems || '',
        notes: notes || '',
        templateStyle: templateStyle || 'standard',
        status: 'ACTIVE',
        approvedByDeptHead: approvedByDeptHead || '',
        approvedByManagement: approvedByManagement || ''
      },
      include: {
        delegator: true
      }
    });

    return NextResponse.json({ success: true, delegation });
  } catch (error: any) {
    console.error('Error creating delegation:', error);
    return NextResponse.json({ error: error.message || 'Failed to create delegation' }, { status: 500 });
  }
}
