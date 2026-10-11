import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import MyPortalClient from './MyPortalClient';

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

    // 2. Identify the active employee for this portal
    let targetEmployee: any = null;

    if (requestedEmpId) {
      targetEmployee = allEmployees.find(
        (e) => e.id === requestedEmpId || e.employeeId === requestedEmpId
      );
    }

    if (!targetEmployee && session.userId) {
      targetEmployee = await prisma.employee.findFirst({
        where: { userId: session.userId },
        include: {
          payrolls: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 12 },
          leaveRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
          overtimeRequests: { orderBy: { otDate: 'desc' }, take: 10 },
          certificateRequests: { orderBy: { requestDate: 'desc' }, take: 5 },
          loans: { orderBy: { createdAt: 'desc' }, take: 5 },
          attendances: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 6 },
          biometricLogs: { orderBy: { punchTime: 'desc' }, take: 15 },
        },
      });
    }

    // Fallback to first active employee if Admin/HR previewing
    if (!targetEmployee && allEmployees.length > 0) {
      const firstEmp = allEmployees[0];
      targetEmployee = await prisma.employee.findUnique({
        where: { id: firstEmp.id },
        include: {
          payrolls: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 12 },
          leaveRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
          overtimeRequests: { orderBy: { otDate: 'desc' }, take: 10 },
          certificateRequests: { orderBy: { requestDate: 'desc' }, take: 5 },
          loans: { orderBy: { createdAt: 'desc' }, take: 5 },
          attendances: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 6 },
          biometricLogs: { orderBy: { punchTime: 'desc' }, take: 15 },
        },
      });
    } else if (targetEmployee && !targetEmployee.payrolls) {
      targetEmployee = await prisma.employee.findUnique({
        where: { id: targetEmployee.id },
        include: {
          payrolls: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 12 },
          leaveRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
          overtimeRequests: { orderBy: { otDate: 'desc' }, take: 10 },
          certificateRequests: { orderBy: { requestDate: 'desc' }, take: 5 },
          loans: { orderBy: { createdAt: 'desc' }, take: 5 },
          attendances: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 6 },
          biometricLogs: { orderBy: { punchTime: 'desc' }, take: 15 },
        },
      });
    }

    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <MyPortalClient
          employee={JSON.parse(JSON.stringify(targetEmployee || null))}
          allEmployees={JSON.parse(JSON.stringify(allEmployees || []))}
          currentUserRole={session.role}
        />
      </div>
    );
  } catch (error) {
    console.error('Error in MyPortalPage:', error);
    // Safe graceful fallback
    const fallbackEmp = await prisma.employee.findFirst({ where: { status: 'ACTIVE' } });
    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <MyPortalClient
          employee={JSON.parse(JSON.stringify(fallbackEmp || null))}
          allEmployees={[]}
          currentUserRole={session.role}
        />
      </div>
    );
  }
}
