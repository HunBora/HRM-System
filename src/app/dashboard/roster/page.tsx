import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import RosterClient from './RosterClient';

export default async function RosterPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  // Pre-fetch active employees, departments, and current month rosters
  const [employees, initialRosters, departments] = await Promise.all([
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
    prisma.shiftRoster.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        }
      },
      orderBy: { date: 'asc' }
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
      <RosterClient
        initialEmployees={JSON.parse(JSON.stringify(employees))}
        initialRosters={JSON.parse(JSON.stringify(initialRosters))}
        departments={departmentList}
        userRole={session.role}
        initialYear={year}
        initialMonth={month}
      />
    </div>
  );
}
