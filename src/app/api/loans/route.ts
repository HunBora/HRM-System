import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all loans or filter by employeeId, status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const loans = await prisma.employeeLoan.findMany({
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
            department: true,
            position: true,
            phone: true,
            basicSalary: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(loans);
  } catch (error: any) {
    console.error('Error fetching loans:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch loans' }, { status: 500 });
  }
}

// POST create new loan application
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      employeeId,
      loanAmount,
      interestRate = 0,
      termMonths = 6,
      monthlyDeduction,
      startDeductionMonth,
      purpose,
      guarantorName,
      guarantorPhone,
      disbursedBy = 'Finance / HR',
      notes,
    } = body;

    if (!employeeId || !loanAmount || !termMonths || !startDeductionMonth || !purpose) {
      return NextResponse.json(
        { error: 'សូមបំពេញព័ត៌មានចាំបាច់ទាំងអស់ (Missing required fields)' },
        { status: 400 }
      );
    }

    const principal = parseFloat(loanAmount);
    const months = parseInt(termMonths, 10);
    const interest = parseFloat(interestRate || '0');

    // Calculate monthly deduction if not provided
    // Total interest = principal * (interest / 100) * (months / 12)
    const totalInterest = principal * (interest / 100) * (months / 12);
    const totalPayable = principal + totalInterest;
    const calculatedMonthly = monthlyDeduction ? parseFloat(monthlyDeduction) : Math.round((totalPayable / months) * 100) / 100;

    // Generate unique loan code LN-YYYYMM-XXXX
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await prisma.employeeLoan.count();
    const loanCode = `LN-${datePrefix}-${String(count + 1).padStart(4, '0')}`;

    // Build installment breakdown schedule
    const schedule = [];
    const [startYear, startMonth] = startDeductionMonth.split('-').map(Number);
    for (let i = 0; i < months; i++) {
      const d = new Date(startYear, startMonth - 1 + i, 25);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      schedule.push({
        installmentNo: i + 1,
        dueMonth: `${year}-${month}`,
        dueDate: `${year}-${month}-25`,
        amount: calculatedMonthly,
        status: 'PENDING',
        paidDate: null,
      });
    }

    const newLoan = await prisma.employeeLoan.create({
      data: {
        employeeId,
        loanCode,
        loanAmount: principal,
        interestRate: interest,
        termMonths: months,
        monthlyDeduction: calculatedMonthly,
        totalRepaid: 0,
        remainingBalance: totalPayable,
        disbursementDate: new Date(),
        startDeductionMonth,
        status: 'ACTIVE',
        purpose,
        guarantorName,
        guarantorPhone,
        disbursedBy,
        notes,
        repaymentSchedule: schedule,
      },
      include: {
        employee: true,
      },
    });

    return NextResponse.json(newLoan, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee loan:', error);
    return NextResponse.json({ error: error.message || 'Failed to create loan' }, { status: 500 });
  }
}

// PUT record repayment or update loan status
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, action, paymentAmount, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Loan ID required' }, { status: 400 });
    }

    const existing = await prisma.employeeLoan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    if (action === 'RECORD_PAYMENT') {
      const pAmount = parseFloat(paymentAmount || '0');
      if (pAmount <= 0) {
        return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
      }

      const newTotalRepaid = Math.round((existing.totalRepaid + pAmount) * 100) / 100;
      const newRemainingBalance = Math.max(0, Math.round((existing.remainingBalance - pAmount) * 100) / 100);
      const newStatus = newRemainingBalance <= 0 ? 'PAID_OFF' : existing.status;

      // Update schedule status if possible
      let schedule: any[] = Array.isArray(existing.repaymentSchedule) ? [...(existing.repaymentSchedule as any[])] : [];
      let pendingInst = schedule.find(s => s.status === 'PENDING');
      if (pendingInst) {
        pendingInst.status = 'PAID';
        pendingInst.paidDate = new Date().toISOString().slice(0, 10);
      }

      const updated = await prisma.employeeLoan.update({
        where: { id },
        data: {
          totalRepaid: newTotalRepaid,
          remainingBalance: newRemainingBalance,
          status: newStatus,
          repaymentSchedule: schedule,
        },
        include: { employee: true },
      });

      return NextResponse.json(updated);
    }

    // Direct update status / details
    const updated = await prisma.employeeLoan.update({
      where: { id },
      data: {
        status: status || existing.status,
        notes: notes !== undefined ? notes : existing.notes,
      },
      include: { employee: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating loan:', error);
    return NextResponse.json({ error: error.message || 'Failed to update loan' }, { status: 500 });
  }
}

// DELETE cancel loan
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Loan ID required' }, { status: 400 });
    }

    await prisma.employeeLoan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Loan deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting loan:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete loan' }, { status: 500 });
  }
}
