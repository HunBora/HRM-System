import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import DelegationClient from './DelegationClient';

export const dynamic = 'force-dynamic';

export default async function DelegationsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [delegations, employees, settings] = await Promise.all([
    prisma.delegationOfAuthority.findMany({
      include: {
        delegator: {
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
            phone: true,
            photoUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
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
        phone: true,
        photoUrl: true
      },
      orderBy: { employeeId: 'asc' }
    }),
    prisma.companySettings.findUnique({
      where: { id: 'default' }
    })
  ]);

  return (
    <DelegationClient
      initialDelegations={delegations}
      employees={employees}
      settings={settings}
      userRole={session.role}
    />
  );
}
