import { prisma } from '@/lib/prisma';
import { getDictionary } from '@/i18n/getDictionary';
import LiveLeaveTable from '@/components/Leave/LiveLeaveTable';

export default async function LeavePage() {
  const t = await getDictionary();
  
  const [leaveRequestsData, companySettings, employees] = await Promise.all([
    prisma.leaveRequest.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.companySettings.findUnique({ where: { id: 'default' } }),
    prisma.employee.findMany({
      orderBy: { employeeId: 'asc' },
      select: {
        id: true,
        employeeId: true,
        firstNameKh: true,
        lastNameKh: true,
        firstNameEn: true,
        lastNameEn: true,
        gender: true,
        position: true,
        department: true,
        annualLeaveDays: true,
      }
    })
  ]);

  const leaveRequests = leaveRequestsData.map(req => ({
    ...req,
    startDate: req.startDate.toISOString(),
    endDate: req.endDate.toISOString(),
  }));

  return (
    <LiveLeaveTable 
      leaveRequests={leaveRequests as any} 
      dictionary={t} 
      companySettings={JSON.parse(JSON.stringify(companySettings || {}))}
      employees={JSON.parse(JSON.stringify(employees || []))}
    />
  );
}
