import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/i18n/getDictionary';
import EmployeeProfileTabs from '@/components/EmployeeProfileTabs';

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const t = await getDictionary();

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      documents: { orderBy: { createdAt: 'desc' } },
      assets: { orderBy: { assignDate: 'desc' } }
    }
  });

  if (!employee) {
    notFound();
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="title kh-text">ប្រវត្តិរូបបុគ្គលិក (Employee Profile)</h1>
      </div>
      <EmployeeProfileTabs 
        employee={employee} 
        documents={employee.documents || []} 
        assets={employee.assets || []} 
        t={t} 
      />
    </div>
  );
}
