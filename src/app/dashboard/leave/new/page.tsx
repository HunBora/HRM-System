import { prisma } from '@/lib/prisma';
import { getDictionary } from '@/i18n/getDictionary';
import LeaveForm from '@/components/LeaveForm';

export default async function NewLeavePage() {
  const t = await getDictionary();
  const [employees, companySettings] = await Promise.all([
    prisma.employee.findMany({
      orderBy: { employeeId: 'asc' }
    }),
    prisma.companySettings.findUnique({ where: { id: 'default' } })
  ]);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="title kh-text">{t.leave.form.newTitle}</h1>
      </div>
      
      <LeaveForm 
        employees={JSON.parse(JSON.stringify(employees))} 
        t={t} 
        companySettings={JSON.parse(JSON.stringify(companySettings || {}))}
      />
    </div>
  );
}
