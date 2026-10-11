import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import DisciplinaryClient from './DisciplinaryClient';

export default async function DisciplinaryPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Pre-fetch disciplinary actions, active employees, and department list
  const [initialActions, employees, departments] = await Promise.all([
    prisma.disciplinaryAction.findMany({
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
          }
        }
      },
      orderBy: { incidentDate: 'desc' }
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
    <div style={{ padding: '24px', maxWidth: '1500px', margin: '0 auto' }}>
      <DisciplinaryClient
        initialActions={JSON.parse(JSON.stringify(initialActions))}
        employees={JSON.parse(JSON.stringify(employees))}
        departments={departmentList}
        userRole={session.role}
      />
    </div>
  );
}
