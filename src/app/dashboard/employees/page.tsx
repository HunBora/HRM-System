import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import DeleteEmployeeButton from '@/components/DeleteEmployeeButton';
import { deleteEmployee } from './actions';
import { getDictionary } from '@/i18n/getDictionary';
import EmployeeTable from '@/components/EmployeeTable';
import EmployeeExportImportButtons from './EmployeeExportImportButtons';
import ClearAllDataButton from '@/components/ClearAllDataButton';

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const q = resolvedParams?.q || '';
  const t = await getDictionary();

  const employees = await prisma.employee.findMany({
    where: {
      OR: [
        { firstNameEn: { contains: q } },
        { lastNameEn: { contains: q } },
        { firstNameKh: { contains: q } },
        { lastNameKh: { contains: q } },
        { employeeId: { contains: q } }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 className="title kh-text" style={{ marginBottom: 0 }}>{t.employee.listTitle}</h1>
        
        <form method="GET" style={{ display: 'flex', gap: '10px', flexGrow: 1, maxWidth: '400px' }}>
          <input 
            type="text" 
            name="q" 
            defaultValue={q} 
            placeholder={t.employee.searchPlaceholder} 
            className="input-field kh-text" 
            style={{ width: '100%', margin: 0 }} 
          />
          <button type="submit" className="btn-secondary kh-text">{t.employee.searchButton}</button>
        </form>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <ClearAllDataButton />
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
