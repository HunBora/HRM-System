import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import DeleteEmployeeButton from '@/components/DeleteEmployeeButton';
import { deleteEmployee } from './actions';
import { getDictionary } from '@/i18n/getDictionary';
import EmployeeTable from '@/components/EmployeeTable';
import EmployeeExportImportButtons from './EmployeeExportImportButtons';
import ClearAllDataButton from '@/components/ClearAllDataButton';
import SearchFilter from '@/components/SearchFilter';
import { getSession } from '@/lib/session';

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dept?: string; sort?: string }>;
}) {
  const resolvedParams = await searchParams;
  const q = resolvedParams?.q || '';
  const dept = resolvedParams?.dept || '';
  const sort = resolvedParams?.sort || 'desc';
  const t = await getDictionary();
  const session = await getSession();

  const departmentsData = await prisma.employee.findMany({
    select: { department: true },
    distinct: ['department'],
    where: { department: { not: '' } }
  });
  const departments = departmentsData.map(d => d.department).filter(Boolean);

  const whereClause: any = {
    AND: []
  };

  if (q) {
    whereClause.AND.push({
      OR: [
        { firstNameEn: { contains: q, mode: 'insensitive' } },
        { lastNameEn: { contains: q, mode: 'insensitive' } },
        { firstNameKh: { contains: q } },
        { lastNameKh: { contains: q } },
        { employeeId: { contains: q, mode: 'insensitive' } }
      ]
    });
  }

  if (dept) {
    whereClause.AND.push({ department: dept });
  }

  // If no filters, remove AND
  const finalWhere = whereClause.AND.length > 0 ? whereClause : {};

  const employees = await prisma.employee.findMany({
    where: finalWhere,
    orderBy: sort === 'dept_asc' ? { department: 'asc' } : { createdAt: 'desc' }
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 className="title kh-text" style={{ marginBottom: 0 }}>{t.employee.listTitle}</h1>
        
        <SearchFilter q={q} dept={dept} departments={departments} t={t} />

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {(session?.role === 'DEVELOPER' || session?.role === 'ADMIN') && (
            <ClearAllDataButton />
          )}
          <EmployeeExportImportButtons />
          <Link href="/dashboard/employees/new" className="btn-primary kh-text" style={{ textDecoration: 'none' }}>
            {t.employee.newEmployeeBtn}
          </Link>
        </div>
      </div>

      <EmployeeTable employees={employees} t={t} />
    </div>
  );
}
