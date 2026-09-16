import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import ExpenseClient from './ExpenseClient';
import { getDictionary } from '@/i18n/getDictionary';
import { cookies } from "next/headers";

export default async function ExpensesPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const role = session.role;
  let claims: any[] = [];

  if (role === 'EMPLOYEE') {
    if (session.employeeId) {
      claims = await prisma.expenseClaim.findMany({
        where: { employeeId: session.employeeId },
        orderBy: { createdAt: 'desc' }
      });
    }
  } else if (role === 'DEPT_HEAD') {
    if (session.employeeId) {
      // Find the dept head's department
      const headEmployee = await prisma.employee.findUnique({ where: { id: session.employeeId } });
      if (headEmployee) {
        claims = await prisma.expenseClaim.findMany({
          where: { employee: { department: headEmployee.department } },
          include: { employee: true },
          orderBy: { createdAt: 'desc' }
        });
      }
    }
  } else {
    // Admin, HR_MANAGER, PAYROLL_ADMIN can see all claims
    claims = await prisma.expenseClaim.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || 'kh') as 'kh'|'en'|'zh';
  const t = await getDictionary();

  return (
    <div style={{ padding: '20px' }}>
      <ExpenseClient 
        role={role} 
        currentEmployeeId={session.employeeId} 
        claims={claims} 
        l={t} 
        locale={locale} 
      />
    </div>
  );
}
