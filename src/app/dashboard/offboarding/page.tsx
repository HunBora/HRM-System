import React from 'react';
import OffboardingClient from './OffboardingClient';
import { getTerminations, getActiveEmployees } from './actions';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function OffboardingPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const terminations = await getTerminations();
  const employees = await getActiveEmployees();

  return (
    <div style={{ padding: '20px' }}>
      <OffboardingClient initialTerminations={terminations} employees={employees} />
    </div>
  );
}
