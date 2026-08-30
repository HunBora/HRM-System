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

  const companyName = settings?.companyName || 'HRM System';

  return (
    <div>
      <h1 className="title kh-text no-print" style={{ textAlign: 'center' }}>Employee ID Card</h1>
      <IDCardClient employee={employee} companyName={companyName} />
    </div>
  );
}
