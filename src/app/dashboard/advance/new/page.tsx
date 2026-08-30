import { prisma } from '@/lib/prisma';
import { getDictionary } from '@/i18n/getDictionary';
import AdvanceForm from '@/components/AdvanceForm';

export default async function NewAdvancePage() {
  const t = await getDictionary();
  const employees = await prisma.employee.findMany({
    orderBy: { employeeId: 'asc' }
  });

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="title kh-text">{t.advance.form.newTitle}</h1>
      </div>
      
      <AdvanceForm employees={employees} t={t} />
    </div>
  );
}
