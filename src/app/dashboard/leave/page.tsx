import { prisma } from '@/lib/prisma';
import { getDictionary } from '@/i18n/getDictionary';
import LiveLeaveTable from '@/components/Leave/LiveLeaveTable';

export default async function LeavePage() {
  const t = await getDictionary();
  
  const leaveRequestsData = await prisma.leaveRequest.findMany({
    include: { employee: true },
    orderBy: { createdAt: 'desc' }
  });

  const leaveRequests = leaveRequestsData.map(req => ({
    ...req,
    startDate: req.startDate.toISOString(),
    endDate: req.endDate.toISOString(),
  }));

  return (
    <LiveLeaveTable leaveRequests={leaveRequests as any} dictionary={t} />
  );
}
