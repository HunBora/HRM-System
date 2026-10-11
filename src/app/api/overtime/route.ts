import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';
import { recordAudit } from '@/lib/audit';

// Calculate rate multiplier based on OT Type
function getMultiplier(type: string): number {
  switch (type) {
    case 'NIGHT_OT':
    case 'SUNDAY_OT':
    case 'HOLIDAY_OT':
      return 2.0;
    case 'REGULAR_OT':
    default:
      return 1.5;
  }
}

// GET: ទាញយកបញ្ជីសំណើថែមម៉ោង (Overtime Requests)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const otType = searchParams.get('otType');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (otType && otType !== 'ALL') {
      where.otType = otType;
    }

    if (department && department !== 'ALL') {
      where.employee = {
        department: department
      };
    }

    if (year && month) {
      const y = parseInt(year);
      const m = parseInt(month);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59));
      where.otDate = {
        gte: start,
        lte: end
      };
    }

    const requests = await prisma.overtimeRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstNameEn: true,
            lastNameEn: true,
            firstNameKh: true,
            lastNameKh: true,
            position: true,
            department: true,
            line: true,
            photoUrl: true,
            basicSalary: true,
          }
        }
      },
      orderBy: { otDate: 'desc' }
    });

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error('Error fetching overtime requests:', error);
    return NextResponse.json({ error: 'Failed to fetch overtime requests' }, { status: 500 });
  }
}

// POST: បង្កើតសំណើថែមម៉ោង (Single ឬ Bulk សម្រាប់បុគ្គលិកច្រើននាក់)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      employeeId,
      employeeIds, // Array of IDs for bulk request
      otDate,
      startTime,
      endTime,
      totalHours,
      otType,
      reason,
      notes,
      status,
      approvedBy
    } = body;

    const parsedDate = new Date(otDate);
    const hours = Number(totalHours) || 1.0;
    const type = otType || 'REGULAR_OT';
    const multiplier = getMultiplier(type);

    // Support Bulk Request (e.g. whole department / line)
    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
      const createOps = employeeIds.map((empId: string) =>
        prisma.overtimeRequest.create({
          data: {
            employeeId: empId,
            otDate: parsedDate,
            startTime,
            endTime,
            totalHours: hours,
            otType: type,
            rateMultiplier: multiplier,
            reason: reason || 'Production Workload',
            notes: notes || null,
            status: status || 'PENDING',
            approvedBy: approvedBy || null,
            approvedAt: status === 'APPROVED' ? new Date() : null,
          }
        })
      );

      const created = await prisma.$transaction(createOps);
      return NextResponse.json({ success: true, count: created.length });
    }

    // Single Request
    if (!employeeId || !otDate || !startTime || !endTime) {
      return NextResponse.json({ error: 'Employee, Date, Start & End Time are required' }, { status: 400 });
    }

    const newRequest = await prisma.overtimeRequest.create({
      data: {
        employeeId,
        otDate: parsedDate,
        startTime,
        endTime,
        totalHours: hours,
        otType: type,
        rateMultiplier: multiplier,
        reason: reason || 'Production Workload',
        notes: notes || null,
        status: status || 'PENDING',
        approvedBy: approvedBy || null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstNameEn: true,
            lastNameEn: true,
            firstNameKh: true,
            lastNameKh: true,
            position: true,
            department: true,
          }
        }
      }
    });

    // Notify via Telegram group/channel
    const empName = `${newRequest.employee.firstNameKh || ''} ${newRequest.employee.lastNameKh || ''} (${newRequest.employee.firstNameEn} ${newRequest.employee.lastNameEn})`;
    const otMsg = `⏰ <b>សំណើថែមម៉ោងថ្មី (New OT Request)</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>បុគ្គលិក:</b> ${empName}
📌 <b>អត្តលេខ:</b> ${newRequest.employee.employeeId} | <b>ផ្នែក:</b> ${newRequest.employee.department}
📅 <b>កាលបរិច្ឆេទ:</b> ${new Date(newRequest.otDate).toLocaleDateString('km-KH')}
⏱ <b>ម៉ោង:</b> ${newRequest.startTime} - ${newRequest.endTime} (<b>${newRequest.totalHours} ម៉ោង</b>)
🏷 <b>ប្រភេទ OT:</b> ${newRequest.otType} (មេគុណ ${newRequest.rateMultiplier}x)
📝 <b>មូលហេតុ:</b> ${newRequest.reason || '-'}
━━━━━━━━━━━━━━━━━━━━
<i>រង់ចាំការអនុម័តពីប្រធានផ្នែក/HR (Pending Approval).</i>`;

    sendTelegramNotification(otMsg).catch(e => console.error('Error sending OT telegram notification:', e));

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error: any) {
    console.error('Error creating overtime request:', error);
    return NextResponse.json({ error: 'Failed to create overtime request' }, { status: 500 });
  }
}

// PUT: កែប្រែ ឬ អនុម័ត / បដិសេធ (Approve / Reject)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      ids, // For bulk approve/reject
      otDate,
      startTime,
      endTime,
      totalHours,
      otType,
      reason,
      notes,
      status,
      approvedBy,
      rejectionReason
    } = body;

    // Bulk status update
    if (ids && Array.isArray(ids) && ids.length > 0 && status) {
      const updated = await prisma.overtimeRequest.updateMany({
        where: { id: { in: ids } },
        data: {
          status,
          approvedBy: approvedBy || 'HR / Manager',
          approvedAt: status === 'APPROVED' ? new Date() : undefined,
          rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
        }
      });
      return NextResponse.json({ success: true, count: updated.count });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const type = otType;
    const multiplier = type ? getMultiplier(type) : undefined;

    const updated = await prisma.overtimeRequest.update({
      where: { id },
      data: {
        otDate: otDate ? new Date(otDate) : undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        totalHours: totalHours !== undefined ? Number(totalHours) : undefined,
        otType: type || undefined,
        rateMultiplier: multiplier,
        reason: reason !== undefined ? reason : undefined,
        notes: notes !== undefined ? notes : undefined,
        status: status || undefined,
        approvedBy: approvedBy !== undefined ? approvedBy : undefined,
        approvedAt: status === 'APPROVED' ? new Date() : undefined,
        rejectionReason: rejectionReason !== undefined ? rejectionReason : undefined,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstNameEn: true,
            lastNameEn: true,
            firstNameKh: true,
            lastNameKh: true,
            position: true,
            department: true,
          }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating overtime request:', error);
    return NextResponse.json({ error: 'Failed to update overtime request' }, { status: 500 });
  }
}

// DELETE: លុបសំណើថែមម៉ោង
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.overtimeRequest.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Overtime request deleted' });
  } catch (error: any) {
    console.error('Error deleting overtime request:', error);
    return NextResponse.json({ error: 'Failed to delete overtime request' }, { status: 500 });
  }
}
