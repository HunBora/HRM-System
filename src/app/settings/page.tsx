import React from 'react';
import SettingsControlPanel from '@/components/SettingsControlPanel';
import { prisma } from '@/lib/prisma';

export default async function SettingsPage() {
  const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });

  return <SettingsControlPanel initialCompanySettings={settings || {}} />;
}
