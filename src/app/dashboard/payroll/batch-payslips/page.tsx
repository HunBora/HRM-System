import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import BatchPayslipsView from '@/components/Payroll/BatchPayslipsView';

export const metadata = {
  title: 'បោះពុម្ពវិក្កយបត្រប្រាក់បៀវត្សរ៍ (Batch Payslips) | HRM Enterprise',
};

export default async function BatchPayslipsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; department?: string; q?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Access check
  const allowedRoles = ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD'];
  if (!allowedRoles.includes(session.role)) {
    redirect('/dashboard/payroll');
  }

  const resolvedParams = await searchParams;
  const month = parseInt(resolvedParams.month || (new Date().getMonth() + 1).toString());
  const year = parseInt(resolvedParams.year || new Date().getFullYear().toString());
  const department = resolvedParams.department || '';

  const [payrolls, companySettings, distinctDepts] = await Promise.all([
    prisma.payroll.findMany({
      where: {
        month,
        year,
        ...(department ? { employee: { department } } : {}),
      },
      include: {
        employee: true,
      },
      orderBy: {
        employee: {
          employeeId: 'asc',
        },
      },
    }),
    prisma.companySettings.findUnique({ where: { id: 'default' } }),
    prisma.employee.findMany({
      select: { department: true },
      distinct: ['department'],
      where: { department: { not: '' } },
    }),
  ]);

  const uniqueDepartments = distinctDepts
    .map((d) => d.department)
    .filter(Boolean)
    .sort() as string[];

  return (
    <div>
      <BatchPayslipsView
        payrolls={payrolls}
        settings={companySettings}
        month={month}
        year={year}
        department={department}
        departments={uniqueDepartments}
      />
    </div>
  );
}
