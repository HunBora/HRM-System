import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import BatchIDCardsClient from './BatchIDCardsClient';

export default async function BatchIDCardsPage({
  searchParams
}: {
  searchParams: Promise<{ dept?: string; ids?: string; q?: string }>;
}) {
  const session = await getSession();
  if (session?.role !== 'ADMIN' && session?.role !== 'HR_MANAGER' && session?.role !== 'HR') {
    redirect('/dashboard');
  }

  const resolved = await searchParams;
  const dept = resolved?.dept || '';
  const idsParam = resolved?.ids || '';
  const q = resolved?.q || '';

  const whereClause: any = {};
  if (idsParam) {
    const idList = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
    if (idList.length > 0) {
      whereClause.id = { in: idList };
    }
  } else {
    const andConditions: any[] = [];
    if (dept) andConditions.push({ department: dept });
    if (q) {
      andConditions.push({
        OR: [
          { firstNameEn: { contains: q, mode: 'insensitive' } },
          { lastNameEn: { contains: q, mode: 'insensitive' } },
          { firstNameKh: { contains: q } },
          { lastNameKh: { contains: q } },
          { employeeId: { contains: q, mode: 'insensitive' } }
        ]
      });
    }
    if (andConditions.length > 0) whereClause.AND = andConditions;
  }

  const [employees, allDepartmentsData, settings] = await Promise.all([
    prisma.employee.findMany({
      where: whereClause,
      orderBy: { employeeId: 'asc' }
    }),
    prisma.employee.findMany({
      select: { department: true },
      distinct: ['department'],
      where: { department: { not: '' } }
    }),
    prisma.companySettings.findUnique({
      where: { id: 'default' }
    })
  ]);

  const departments = allDepartmentsData.map((d) => d.department).filter(Boolean);

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '12px 16px' }}>
      <BatchIDCardsClient
        initialEmployees={employees}
        departments={departments}
        initialDept={dept}
        settings={settings}
      />
    </div>
  );
}
