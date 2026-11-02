import React from 'react';
import { getEhsDashboardData } from './actions';
import EhsClient from './EhsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EHS & Factory Clinic (សុខភាព & សុវត្ថិភាពការងារ) | HRM System',
  description: 'Factory clinic, medical visits, accident logs, NSSF injury claims, and occupational health records',
};

export const dynamic = 'force-dynamic';

export default async function EhsPage() {
  const data = await getEhsDashboardData();

  if (!data.success) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#dc2626' }}>
        <h3>មានបញ្ហាក្នុងការទាញយកទិន្នន័យ (Failed to load EHS data)</h3>
        <p>{data.error}</p>
      </div>
    );
  }

  return (
    <EhsClient
      initialData={{
        employees: data.employees || [],
        clinicVisits: data.clinicVisits || [],
        incidents: data.incidents || [],
        checkups: data.checkups || [],
        stats: data.stats || {},
      }}
    />
  );
}
