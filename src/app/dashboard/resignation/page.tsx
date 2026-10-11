import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import ResignationClient from './ResignationClient';

export default async function ResignationPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Pre-fetch exit interviews, active employees, and department list
  const [initialRecords, employees, departments] = await Promise.all([
    prisma.exitInterview.findMany({
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
            hireDate: true,
          }
        }
      },
      orderBy: { resignationDate: 'desc' }
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
        hireDate: true,
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
      <ResignationClient
        initialRecords={JSON.parse(JSON.stringify(initialRecords))}
        employees={JSON.parse(JSON.stringify(employees))}
        departments={departmentList}
        userRole={session.role}
      />
    </div>
  );
}
