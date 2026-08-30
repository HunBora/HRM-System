import { prisma } from '@/lib/prisma';
import { getDictionary } from '@/i18n/getDictionary';
import LiveAttendanceTable from '@/components/Attendance/LiveAttendanceTable';

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const t = await getDictionary();
  const resolvedParams = await searchParams;
  const q = resolvedParams?.q || '';

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

  // Fetch today's attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0); // start of today

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAttendances = await prisma.dailyAttendance.findMany({
    where: {
      date: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  return (
    <LiveAttendanceTable 
      employees={employees} 
      todayAttendances={todayAttendances} 
      searchParams={resolvedParams} 
      dictionary={t} 
    />
  );
}
