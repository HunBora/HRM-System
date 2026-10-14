import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import PerformanceClient from './PerformanceClient';

export default async function PerformancePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Pre-fetch appraisals, employees, and departments
  const [initialAppraisals, employees, departments] = await Promise.all([
    prisma.performanceAppraisal.findMany({
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
      orderBy: { reviewDate: 'desc' }
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
    <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
      <PerformanceClient
        initialAppraisals={JSON.parse(JSON.stringify(initialAppraisals))}
        employees={JSON.parse(JSON.stringify(employees))}
        departments={departmentList}
        userRole={session.role}
      />
    </div>
  );
}
