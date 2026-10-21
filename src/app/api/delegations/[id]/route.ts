import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET /api/delegations/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const delegation = await prisma.delegationOfAuthority.findUnique({
      where: { id },
      include: {
        delegator: true
      }
    });

    if (!delegation) {
      return NextResponse.json({ error: 'Delegation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, delegation });
  } catch (error: any) {
    console.error('Error fetching delegation by id:', error);
    return NextResponse.json({ error: 'Failed to fetch delegation' }, { status: 500 });
  }
}

// PUT /api/delegations/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
      delegatorId,
      reasonType,
      reasonDetail,
      missionLocation,
      startDate,
      endDate,
      delegatees,
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
      status,
      approvedByDeptHead,
      approvedByManagement
    } = body;

    let totalDays: number | undefined;
    let start: Date | undefined;
    let end: Date | undefined;
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    }

    const updated = await prisma.delegationOfAuthority.update({
      where: { id },
      data: {
        ...(reasonType && { reasonType }),
        ...(reasonDetail !== undefined && { reasonDetail }),
        ...(missionLocation !== undefined && { missionLocation }),
        ...(start && { startDate: start }),
        ...(end && { endDate: end }),
        ...(totalDays !== undefined && { totalDays }),
        ...(delegatees !== undefined && { delegateesJson: JSON.stringify(delegatees) }),
        ...(canApproveLeave !== undefined && { canApproveLeave }),
        ...(canApproveOt !== undefined && { canApproveOt }),
        ...(canSignDailyReports !== undefined && { canSignDailyReports }),
        ...(canApproveExpense !== undefined && { canApproveExpense }),
        ...(maxExpenseAmount !== undefined && { maxExpenseAmount: maxExpenseAmount ? Number(maxExpenseAmount) : null }),
        ...(canManageOperations !== undefined && { canManageOperations }),
        ...(canCoordinateClients !== undefined && { canCoordinateClients }),
        ...(canAccessKeysStamps !== undefined && { canAccessKeysStamps }),
        ...(restrictions !== undefined && { restrictions }),
        ...(handoverItems !== undefined && { handoverItems }),
        ...(notes !== undefined && { notes }),
        ...(templateStyle !== undefined && { templateStyle }),
        ...(status !== undefined && { status }),
        ...(approvedByDeptHead !== undefined && { approvedByDeptHead }),
        ...(approvedByManagement !== undefined && { approvedByManagement })
      },
      include: {
        delegator: true
      }
    });

    return NextResponse.json({ success: true, delegation: updated });
  } catch (error: any) {
    console.error('Error updating delegation:', error);
    return NextResponse.json({ error: error.message || 'Failed to update delegation' }, { status: 500 });
  }
}

// DELETE /api/delegations/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'HR_MANAGER' && session.role !== 'HR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.delegationOfAuthority.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting delegation:', error);
    return NextResponse.json({ error: 'Failed to delete delegation' }, { status: 500 });
  }
}
