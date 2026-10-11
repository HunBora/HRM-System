import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import TrainingClient from './TrainingClient';

export default async function TrainingsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Pre-fetch initial trainings, enrollments, and active employees list
  const [initialTrainings, initialEnrollments, employees] = await Promise.all([
    prisma.trainingProgram.findMany({
      include: {
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { startDate: 'desc' }
    }),
    prisma.trainingEnrollment.findMany({
      include: {
        training: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            trainer: true,
          }
        },
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstNameEn: true,
            lastNameEn: true,
            position: true,
            department: true,
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    }),
    prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        employeeId: true,
        firstNameEn: true,
        lastNameEn: true,
        position: true,
        department: true,
      },
      orderBy: { firstNameEn: 'asc' }
    })
  ]);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <TrainingClient
        initialTrainings={JSON.parse(JSON.stringify(initialTrainings))}
        initialEnrollments={JSON.parse(JSON.stringify(initialEnrollments))}
        employees={JSON.parse(JSON.stringify(employees))}
        userRole={session.role}
      />
    </div>
  );
}
