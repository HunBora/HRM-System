import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PayslipView from '@/components/Payroll/PayslipView';

export default async function PayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const payroll = await prisma.payroll.findUnique({
    where: { id: resolvedParams.id },
    include: { employee: true }
  });

  if (!payroll) {
    return notFound();
  }

  const settings = await prisma.companySettings.findUnique({
    where: { id: 'default' }
  });

  return (
    <div>
      <PayslipView payroll={payroll} settings={settings} />
    </div>
  );
}
