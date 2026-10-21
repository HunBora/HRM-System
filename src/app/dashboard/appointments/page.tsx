import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AppointmentClient from './AppointmentClient';

export const dynamic = 'force-dynamic';

export default async function AppointmentsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [appointments, employees, settings] = await Promise.all([
    prisma.appointmentLetter.findMany({
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
    <AppointmentClient
      initialAppointments={appointments}
      employees={employees}
      settings={settings}
      userRole={session.role}
    />
  );
}
