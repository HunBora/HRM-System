import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AuditClient from './AuditClient';

export default async function AuditPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Pre-fetch latest audit logs
  const initialLogs = await prisma.auditLog.findMany({
    take: 200,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <AuditClient
      initialLogs={initialLogs as any}
      currentUserRole={session.role}
    />
  );
}
