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
import { redirect } from 'next/navigation';

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

  if (session?.role !== 'ADMIN' && session?.role !== 'HR_MANAGER' && session?.role !== 'HR') {
    redirect('/dashboard');
  }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h1 className="title kh-text" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
          {t.employee.listTitle}
        </h1>
        
        <SearchFilter q={q} dept={dept} departments={departments} t={t} />

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {(session?.role === 'DEVELOPER' || session?.role === 'ADMIN') && (
            <ClearAllDataButton />
          )}
          <EmployeeExportImportButtons />
          <Link
            href={`/dashboard/employees/batch-id-cards${dept ? `?dept=${encodeURIComponent(dept)}` : ''}`}
            className="kh-text"
            style={{
              padding: '5px 10px',
              backgroundColor: '#4f46e5',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
            title="បោះពុម្ពកាតជាដុំ (Batch ID Cards Print)"
          >
            🪪 Print Cards
          </Link>
          <Link 
            href="/dashboard/employees/new" 
            className="btn-primary kh-text" 
            style={{ 
              textDecoration: 'none',
              padding: '5px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              height: '34px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
            title="បញ្ចូលបុគ្គលិកថ្មី (Add New Employee)"
          >
            + New
          </Link>
        </div>
      </div>

      <EmployeeTable employees={employees} t={t} />
    </div>
  );
}
