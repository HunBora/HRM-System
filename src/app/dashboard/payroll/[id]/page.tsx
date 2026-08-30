import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PayrollEditForm from '@/components/PayrollEditForm';

export default async function EditPayrollPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const payroll = await prisma.payroll.findUnique({
    where: { id },
    include: { employee: true }
  });

  if (!payroll) notFound();

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="title kh-text">កែប្រែប្រាក់ខែ (Edit Payroll) - {payroll.month}/{payroll.year}</h1>
        <p className="kh-text" style={{ color: 'var(--text-muted)' }}>
          បុគ្គលិក: {payroll.employee.employeeId} - {payroll.employee.firstNameEn} {payroll.employee.lastNameEn}
        </p>
      </div>

      <PayrollEditForm payroll={payroll} />
    </div>
  );
}
