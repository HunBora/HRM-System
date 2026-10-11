import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AnnouncementClient from './AnnouncementClient';

export default async function AnnouncementsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Pre-fetch announcements and department list
  const [initialAnnouncements, departments] = await Promise.all([
    prisma.companyAnnouncement.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { effectiveDate: 'desc' },
        { createdAt: 'desc' }
      ]
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
      <AnnouncementClient
        initialAnnouncements={JSON.parse(JSON.stringify(initialAnnouncements))}
        departments={departmentList}
        userRole={session.role}
      />
    </div>
  );
}
