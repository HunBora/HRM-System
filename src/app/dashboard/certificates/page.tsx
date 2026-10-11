import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import CertificateClient from './CertificateClient';

export default async function CertificatesPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Pre-fetch initial certificate requests, active employees, and departments
  const [initialCertificates, employees, departments] = await Promise.all([
    prisma.certificateRequest.findMany({
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
            basicSalary: true,
            gender: true,
          }
        }
      },
      orderBy: { requestDate: 'desc' }
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
        basicSalary: true,
        gender: true,
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
      <CertificateClient
        initialCertificates={JSON.parse(JSON.stringify(initialCertificates))}
        employees={JSON.parse(JSON.stringify(employees))}
        departments={departmentList}
        userRole={session.role}
      />
    </div>
  );
}
