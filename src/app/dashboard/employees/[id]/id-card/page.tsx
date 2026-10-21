import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import IDCardClient from './IDCardClient';

export default async function IDCardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const employee = await prisma.employee.findUnique({
    where: { id }
  });

  if (!employee) {
    return notFound();
  }

  const settings = await prisma.companySettings.findUnique({
    where: { id: 'default' }
  });

  const companyName = settings?.companyName || 'G.S TEXTILE GARMENT (CAMBODIA) CO., LTD.';

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '12px 16px' }}>
      <IDCardClient
        employee={employee}
        companyName={companyName}
        settings={settings}
      />
    </div>
  );
}
