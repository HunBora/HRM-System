import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import OvertimeClient from './OvertimeClient';

export default async function OvertimePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Pre-fetch initial overtime requests, active employees, and department list
  const [initialRequests, employees, departments] = await Promise.all([
    prisma.overtimeRequest.findMany({
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
      },
      orderBy: { employeeId: 'asc' }
    }),
    prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { department: true },
      distinct: ['department']
    })
  ]);

  const departmentList = departments
    .map(d => d.department)
    .filter((d): d is string => Boolean(d))
    .sort();

  return (
    <div style={{ width: '100%', padding: '0 0.5rem', boxSizing: 'border-box' }}>
      <OvertimeClient
        initialRequests={JSON.parse(JSON.stringify(initialRequests))}
        employees={JSON.parse(JSON.stringify(employees))}
        departments={departmentList}
        userRole={session.role}
        initialYear={year}
        initialMonth={month}
      />
    </div>
  );
}
