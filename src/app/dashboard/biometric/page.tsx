import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import BiometricClient from './BiometricClient';

export default async function BiometricPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [initialLogs, initialDevices, employees] = await Promise.all([
    prisma.biometricPunchLog.findMany({
      take: 150,
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
            phone: true,
            photoUrl: true,
          },
        },
        device: {
          select: {
            id: true,
            deviceName: true,
            deviceIp: true,
            location: true,
          },
        },
      },
      orderBy: { punchTime: 'desc' },
    }),
    prisma.biometricDevice.findMany({
      include: {
        _count: {
          select: { logs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
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
        cardNo: true,
        phone: true,
      },
      orderBy: { employeeId: 'asc' },
    }),
  ]);

  return (
    <BiometricClient
      initialLogs={initialLogs as any}
      initialDevices={initialDevices as any}
      employees={employees as any}
      currentUserRole={session.role}
    />
  );
}
