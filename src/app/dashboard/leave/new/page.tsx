import { prisma } from '@/lib/prisma';
import { getDictionary } from '@/i18n/getDictionary';
import LeaveForm from '@/components/LeaveForm';

export default async function NewLeavePage() {
  const t = await getDictionary();
  const employees = await prisma.employee.findMany({
    orderBy: { employeeId: 'asc' }
  });

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="title kh-text">{t.leave.form.newTitle}</h1>
      </div>
      
      <LeaveForm employees={employees} t={t} />
    </div>
  );
}
