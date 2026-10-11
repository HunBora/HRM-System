import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import LoansClient from './LoansClient';

export default async function LoansPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Pre-fetch initial loans and active employees
  const [initialLoans, employees] = await Promise.all([
    prisma.employeeLoan.findMany({
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
            phone: true,
            photoUrl: true,
            basicSalary: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.employee.findMany({
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
        basicSalary: true,
      },
      orderBy: { employeeId: 'asc' },
    }),
  ]);

  return (
    <div style={{ padding: '24px', maxWidth: '1500px', margin: '0 auto' }}>
      <LoansClient
        initialLoans={JSON.parse(JSON.stringify(initialLoans))}
        employees={JSON.parse(JSON.stringify(employees))}
        currentUserRole={session.role}
      />
    </div>
  );
}
