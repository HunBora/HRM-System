import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import MyPortalClient from './MyPortalClient';

export const dynamic = 'force-dynamic';

export default async function MyPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const requestedEmpId = resolvedParams?.employeeId;

  try {
    // 1. Fetch active employees list (for selector if Admin/HR)
    const allEmployees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
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
        phone: true,
        photoUrl: true,
        basicSalary: true,
        annualLeaveDays: true,
        hireDate: true,
      },
      orderBy: { employeeId: 'asc' },
    });

    // 2. Determine target employee ID
    let targetId: string | null = null;

    if (requestedEmpId) {
      const match = allEmployees.find(
        (e) => e.id === requestedEmpId || e.employeeId === requestedEmpId
      );
      if (match) targetId = match.id;
    }

    if (!targetId && session.userId) {
      const linked = await prisma.employee.findFirst({
        where: { userId: session.userId },
        select: { id: true },
      });
      if (linked) targetId = linked.id;
    }

    // Default to first employee in list if Admin/HR preview
    if (!targetId && allEmployees.length > 0) {
      targetId = allEmployees[0].id;
    }

    if (!targetId) {
      return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          <MyPortalClient employee={null} allEmployees={[]} currentUserRole={session.role || 'USER'} />
        </div>
      );
    }

    // 3. Fetch comprehensive employee profile with all relations safely
    const [rawEmployee, payrolls, leaveRequests, overtimeRequests, certificateRequests, loans, attendances, biometricLogs] =
      await Promise.all([
        prisma.employee.findUnique({
          where: { id: targetId },
        }),
        prisma.payroll.findMany({
          where: { employeeId: targetId },
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 12,
        }),
        prisma.leaveRequest.findMany({
          where: { employeeId: targetId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.overtimeRequest.findMany({
          where: { employeeId: targetId },
          orderBy: { otDate: 'desc' },
          take: 10,
        }),
        prisma.certificateRequest.findMany({
          where: { employeeId: targetId },
          orderBy: { requestDate: 'desc' },
          take: 5,
        }),
        prisma.employeeLoan.findMany({
          where: { employeeId: targetId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.monthlyAttendance.findMany({
          where: { employeeId: targetId },
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 6,
        }),
        prisma.biometricPunchLog.findMany({
          where: { employeeId: targetId },
          orderBy: { punchTime: 'desc' },
          take: 15,
        }),
      ]);

    if (!rawEmployee) {
      return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          <MyPortalClient employee={null} allEmployees={allEmployees as any} currentUserRole={session.role || 'USER'} />
        </div>
      );
    }

    // Map payroll fields to match client interface nicely
    const mappedPayrolls = (payrolls || []).map((p) => ({
      id: p.id,
      month: p.month,
      year: p.year,
      basicSalary: p.basicSalary || 0,
      otPay: (p.otWage || 0) + (p.sunOtWage || 0) + (p.nightOtWage || 0),
      bonus: p.attendanceBonus || 0,
      allowances:
        (p.lunchAllowance || 0) +
        (p.transportation || 0) +
        (p.payScaleIncentive || 0) +
        (p.adjustmentSkill || 0) +
        (p.seniority || 0) +
        (p.seniorityIndemnity || 0),
      deductions: (p.loanPension || 0) + (p.unionDeduction || 0) + (p.nssf || 0),
      tax: p.taxPayment || 0,
      netSalary: p.netSalaryUsd || 0,
      paidSalaryUsd: p.paidSalaryUsd || 0,
      netSalaryRiel: p.netSalaryRiel || 0,
      status: p.status || 'DRAFT',
      createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
    }));

    // Map leave requests
    const mappedLeaves = (leaveRequests || []).map((l) => ({
      id: l.id,
      leaveType: l.leaveType,
      startDate: l.startDate ? l.startDate.toISOString() : '',
      endDate: l.endDate ? l.endDate.toISOString() : '',
      days: l.duration || 1,
      reason: l.reason || '-',
      status: l.status || 'PENDING',
      createdAt: l.createdAt ? l.createdAt.toISOString() : '',
    }));

    // Map overtime requests
    const mappedOvertimes = (overtimeRequests || []).map((ot) => ({
      id: ot.id,
      otDate: ot.otDate ? ot.otDate.toISOString() : '',
      startTime: ot.startTime,
      endTime: ot.endTime,
      totalHours: ot.totalHours || 0,
      rateMultiplier: ot.rateMultiplier || 1.5,
      reason: ot.reason || '-',
      status: ot.status || 'PENDING',
    }));

    // Map certificates
    const mappedCerts = (certificateRequests || []).map((c) => ({
      id: c.id,
      certificateType: c.certificateType,
      referenceNo: c.referenceNo,
      purpose: c.purpose,
      status: c.status,
      requestDate: c.requestDate ? c.requestDate.toISOString() : '',
    }));

    // Map loans
    const mappedLoans = (loans || []).map((ln) => ({
      id: ln.id,
      loanCode: ln.loanCode,
      loanAmount: ln.loanAmount || 0,
      termMonths: ln.termMonths || 0,
      monthlyDeduction: ln.monthlyDeduction || 0,
      totalRepaid: ln.totalRepaid || 0,
      remainingBalance: ln.remainingBalance || 0,
      status: ln.status || 'ACTIVE',
      startDeductionMonth: ln.startDeductionMonth || '',
      purpose: ln.purpose || 'Personal',
      repaymentSchedule: ln.repaymentSchedule || null,
    }));

    // Map attendances
    const mappedAttendances = (attendances || []).map((att) => ({
      id: att.id,
      month: att.month,
      year: att.year,
      daysWorked: att.daysWorked || 0,
      leaveDays: att.leaveDays || 0,
      absentDays: att.absentDays || 0,
      otHours: att.otHours || 0,
    }));

    // Map biometric punches
    const mappedPunches = (biometricLogs || []).map((p) => ({
      id: p.id,
      punchTime: p.punchTime ? p.punchTime.toISOString() : '',
      punchType: p.punchType || 'CHECK_IN',
      verifyMode: p.verifyMode || 'FINGERPRINT',
      deviceName: p.deviceName || 'Main Terminal',
    }));

    const fullEmployeeData = {
      id: rawEmployee.id,
      employeeId: rawEmployee.employeeId,
      firstNameEn: rawEmployee.firstNameEn,
      lastNameEn: rawEmployee.lastNameEn,
      firstNameKh: rawEmployee.firstNameKh,
      lastNameKh: rawEmployee.lastNameKh,
      position: rawEmployee.position,
      department: rawEmployee.department,
      line: rawEmployee.line,
      phone: rawEmployee.phone,
      photoUrl: rawEmployee.photoUrl,
      basicSalary: rawEmployee.basicSalary,
      annualLeaveDays: rawEmployee.annualLeaveDays,
      hireDate: rawEmployee.hireDate ? rawEmployee.hireDate.toISOString() : null,
      payrolls: mappedPayrolls,
      leaveRequests: mappedLeaves,
      overtimeRequests: mappedOvertimes,
      certificateRequests: mappedCerts,
      loans: mappedLoans,
      attendances: mappedAttendances,
      biometricLogs: mappedPunches,
    };

    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <MyPortalClient
          employee={fullEmployeeData as any}
          allEmployees={allEmployees as any}
          currentUserRole={session.role || 'USER'}
        />
      </div>
    );
  } catch (error: any) {
    console.error('Error rendering MyPortalPage:', error);
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '40px auto', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>
          ⚠️ មិនអាចទាញយកទិន្នន័យបានទេ (Could not load employee portal)
        </h2>
        <p style={{ color: '#64748b', marginTop: '10px' }}>
          {error?.message || 'សូមព្យាយាមម្តងទៀត ឬទាក់ទងមកកាន់ Administrator។'}
        </p>
        <a
          href="/dashboard"
          style={{
            display: 'inline-block',
            marginTop: '20px',
            padding: '10px 20px',
            background: '#2563eb',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          ត្រឡប់ទៅផ្ទាំង Dashboard
        </a>
      </div>
    );
  }
}
