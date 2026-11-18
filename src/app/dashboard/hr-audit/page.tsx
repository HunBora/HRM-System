import React from 'react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import HrAuditClient from './HrAuditClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HR Audit & Compliance (សវនកម្មធនធានមនុស្ស & ច្បាប់) | HRM System',
  description: 'HR Audit Handbook, labor compliance checklist, scoring matrix, and corrective action plans (CAP)',
};

export const dynamic = 'force-dynamic';

export default async function HrAuditPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Allow ADMIN, HR_MANAGER, HR
  const allowedRoles = ['ADMIN', 'HR_MANAGER', 'HR'];
  if (!allowedRoles.includes(session.role)) {
    redirect('/dashboard');
  }

  return (
    <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
      <HrAuditClient userRole={session.role} />
    </div>
  );
}
