import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import ContractClient from './ContractClient';

export default async function ContractsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [contracts, employees, companySettings] = await Promise.all([
    prisma.contract.findMany({
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstNameKh: true,
            lastNameKh: true,
            firstNameEn: true,
            lastNameEn: true,
            gender: true,
            dob: true,
            nationalId: true,
            position: true,
            department: true,
            address: true,
            nationality: true,
            basicSalary: true,
            hireDate: true,
            photoUrl: true,
            probationStart: true,
            probationEnd: true,
            regularContract1: true,
            regularContract2: true,
            regularContract3: true,
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
        firstNameKh: true,
        lastNameKh: true,
        firstNameEn: true,
        lastNameEn: true,
        gender: true,
        dob: true,
        nationalId: true,
        position: true,
        department: true,
        address: true,
        nationality: true,
        basicSalary: true,
        hireDate: true,
        photoUrl: true,
        probationStart: true,
        probationEnd: true,
        regularContract1: true,
        regularContract2: true,
        regularContract3: true,
      },
      orderBy: { employeeId: 'asc' },
    }),
    prisma.companySettings.findUnique({
      where: { id: 'default' },
    }),
  ]);

  return (
    <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto', padding: '0 1rem' }}>
      <ContractClient
        initialContracts={JSON.parse(JSON.stringify(contracts))}
        employees={JSON.parse(JSON.stringify(employees))}
        companySettings={JSON.parse(JSON.stringify(companySettings || {}))}
        userRole={session.role}
      />
    </div>
  );
}
