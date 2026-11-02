import React from 'react';
import { prisma } from '@/lib/prisma';
import QrKioskClient from './QrKioskClient';

export default async function QrKioskPage() {
  const settings = await prisma.companySettings.findUnique({
    where: { id: 'default' },
  });

  return <QrKioskClient settings={settings} />;
}
