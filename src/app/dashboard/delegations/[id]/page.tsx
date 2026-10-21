import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { notFound, redirect } from 'next/navigation';
import DelegationDetailClient from './DelegationDetailClient';

export default async function DelegationDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  const [delegation, settings, employees] = await Promise.all([
    prisma.delegationOfAuthority.findUnique({
      where: { id },
      include: {
        delegator: true
      }
    }),
    prisma.companySettings.findUnique({
      where: { id: 'default' }
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
    })
  ]);

  if (!delegation) {
    return notFound();
  }

  return (
    <DelegationDetailClient
      delegation={delegation}
      settings={settings}
      employees={employees}
      userRole={session.role}
    />
  );
}
