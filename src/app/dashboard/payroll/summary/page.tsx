import { prisma } from '@/lib/prisma';
import MasterSalarySummaryClient from '@/components/MasterSalarySummaryClient';

export default async function MasterSalarySummaryPage({ searchParams }: { searchParams: Promise<{ month?: string, year?: string }> }) {
  const resolvedParams = await searchParams;
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const month = resolvedParams?.month ? parseInt(resolvedParams.month) : currentMonth;
  const year = resolvedParams?.year ? parseInt(resolvedParams.year) : currentYear;

  const payrolls = await prisma.payroll.findMany({
    where: {
      month,
      year
    },
    include: {
      employee: true
    }
  });

  // Calculate breakdown on the server to pass a clean data structure to client
  // But actually it's easier to pass all payrolls to client and let client calculate
  // However passing all payrolls is fine, but they only need the summary.
  // I will summarize it here to save bandwidth!

  type DeptSummary = {
    department: string;
    headcount: number;
    usd100: number;
    usd50: number;
    usd20: number;
    usd10: number;
    totalUsd: number;
    riel50k: number;
    riel20k: number;
    riel10k: number;
    riel5k: number;
    riel1k: number;
    riel500: number;
    riel100: number;
    totalRiel: number;
    totalNetUsd: number;
    totalFirstPayment: number;
  };

  const summaryMap: Record<string, DeptSummary> = {};

  payrolls.forEach(p => {
    const dept = p.employee.department || 'គ្មានផ្នែក / No Dept';
    
    if (!summaryMap[dept]) {
      summaryMap[dept] = {
        department: dept, headcount: 0,
        usd100: 0, usd50: 0, usd20: 0, usd10: 0, totalUsd: 0,
        riel50k: 0, riel20k: 0, riel10k: 0, riel5k: 0, riel1k: 0, riel500: 0, riel100: 0, totalRiel: 0,
        totalNetUsd: 0, totalFirstPayment: 0
      };
    }
    
    const sum = summaryMap[dept];
    sum.headcount++;
    
    // Add net salary and first payment to totals
    const firstPayment = p.employee.basicSalary1 || 0;
    sum.totalNetUsd += p.netSalaryUsd + firstPayment; // Total Net USD
    sum.totalFirstPayment += firstPayment; // 1st Payment

    // Calculate USD Breakdown
    let usd = Math.floor(p.paidSalaryUsd);
    sum.totalUsd += p.paidSalaryUsd;
    
    const u100 = Math.floor(usd / 100); usd %= 100;
    const u50 = Math.floor(usd / 50); usd %= 50;
    const u20 = Math.floor(usd / 20); usd %= 20;
    const u10 = Math.floor(usd / 10); usd %= 10;
    
    sum.usd100 += u100;
    sum.usd50 += u50;
    sum.usd20 += u20;
    sum.usd10 += u10;

    // Calculate Riel Breakdown
    let riel = Math.floor(p.netSalaryRiel);
    sum.totalRiel += p.netSalaryRiel;
    
    const r50k = Math.floor(riel / 50000); riel %= 50000;
    const r20k = Math.floor(riel / 20000); riel %= 20000;
    const r10k = Math.floor(riel / 10000); riel %= 10000;
    const r5k = Math.floor(riel / 5000); riel %= 5000;
    const r1k = Math.floor(riel / 1000); riel %= 1000;
    const r500 = Math.floor(riel / 500); riel %= 500;
    const r100 = Math.floor(riel / 100); riel %= 100;

    sum.riel50k += r50k;
    sum.riel20k += r20k;
    sum.riel10k += r10k;
    sum.riel5k += r5k;
    sum.riel1k += r1k;
    sum.riel500 += r500;
    sum.riel100 += r100;
  });

  const summaryData = Object.values(summaryMap).sort((a, b) => a.department.localeCompare(b.department));

  const company = await prisma.companySettings.findFirst();
  const companyName = company?.companyName || "GS ELETECH CAMBODIA .CO.,LTE";

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 kh-text">Master Salary Summary</h2>
          <p className="text-gray-500 text-sm mt-1">របាយការណ៍សរុបប្រាក់ខែ និងចំនួនក្រដាសប្រាក់</p>
        </div>
      </div>
      
      <MasterSalarySummaryClient 
        data={summaryData} 
        month={month} 
        year={year} 
        companyName={companyName}
      />
    </div>
  );
}
