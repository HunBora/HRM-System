import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { notFound, redirect } from 'next/navigation';
import AppointmentDetailClient from './AppointmentDetailClient';

export default async function AppointmentDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  const [appointment, settings, employees] = await Promise.all([
    prisma.appointmentLetter.findUnique({
      where: { id },
      include: {
        employee: true
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

  if (!appointment) {
    return notFound();
  }

  return (
    <AppointmentDetailClient
      appointment={appointment}
      settings={settings}
      employees={employees}
      userRole={session.role}
    />
  );
}
