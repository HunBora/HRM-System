import { getDictionary } from '@/i18n/getDictionary';
import { cookies } from "next/headers";
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DraggableSummaryCards from '@/components/DraggableSummaryCards';
import DraggableBottomGrid from '@/components/DraggableBottomGrid';
import DashboardKpiChart from '@/components/DashboardKpiChart';
import CustomizableDashboard from '@/components/CustomizableDashboard';
import LiveDigitalClock from '@/components/LiveDigitalClock';


const dashT = {
  kh: {
    title: "ទំព័រដើមគ្រប់គ្រងធនធានមនុស្ស", hasLeave: "មានច្បាប់", noLeave: "អត់ច្បាប់", departmentLabel: "ផ្នែក", totalLabel: "ចំនួនសរុប", fmLabel: "ស្រី/ប្រុស",
    totalEmployees: "បុគ្គលិកសរុប",
    temps: "កិច្ចសន្យា",
    interns: "កម្មសិក្សាការី",
    interviewing: "កំពុងសម្ភាសន៍",
    openPositions: "ទីតាំងទំនេរ",
    applicants: "អ្នកដាក់ពាក្យ",
    candidatesAdded: "បេក្ខជនថ្មី",
    onboarding: "កំពុងរៀបចំចូលធ្វើការ",
    outstandingOffers: "សំណើការងាររង់ចាំ",
    currentlyOnboarding: "កំពុងរៀបចំឯកសារ",
    q1NewHires: "បុគ្គលិកថ្មីត្រីមាសទី១",
    q2NewHires: "បុគ្គលិកថ្មីត្រីមាសទី២",
    q3NewHires: "បុគ្គលិកថ្មីត្រីមាសទី៣",
    q4NewHires: "បុគ្គលិកថ្មីត្រីមាសទី៤",
    yoy: "ធៀបឆ្នាំមុន:",
    hrContact: "ផ្នែកទំនាក់ទំនង",
    incomingNewHire: "បុគ្គលិកទើបចូលថ្មី",
    onboardingComplete: "ឯកសារ",
    primary: "ឈ្មោះ",
    dept: "ផ្នែក",
    startDate: "ថ្ងៃចាប់ផ្តើម",
    hiringRate: "អត្រាជ្រើសរើស:"
  },
  en: {
    title: "HR Hiring Dashboard", hasLeave: "On Leave", noLeave: "Absent", departmentLabel: "Dept.", totalLabel: "Total", fmLabel: "F/M",
    totalEmployees: "Total Employees",
    temps: "Temps",
    interns: "Interns",
    interviewing: "Interviewing",
    openPositions: "Open Positions",
    applicants: "Applicants",
    candidatesAdded: "Candidates Added",
    onboarding: "Onboarding",
    outstandingOffers: "Outstanding Offers",
    currentlyOnboarding: "Currently Onboarding",
    q1NewHires: "Q1 NEW HIRES",
    q2NewHires: "Q2 NEW HIRES",
    q3NewHires: "Q3 NEW HIRES",
    q4NewHires: "Q4 NEW HIRES",
    yoy: "Δ YoY:",
    hrContact: "HR Contact",
    incomingNewHire: "Incoming New Hire",
    onboardingComplete: "Onboarding Complete",
    primary: "Primary",
    dept: "Dept",
    startDate: "Start Date",
    hiringRate: "Hiring Rate:"
  },
  zh: {
    title: "人力资源招聘仪表板", hasLeave: "休假", noLeave: "缺勤", departmentLabel: "部门", totalLabel: "总数", fmLabel: "女/男",
    totalEmployees: "总员工人数",
    temps: "临时工",
    interns: "实习生",
    interviewing: "面试中",
    openPositions: "空缺职位",
    applicants: "申请人",
    candidatesAdded: "新增候选人",
    onboarding: "入职中",
    outstandingOffers: "待定录用",
    currentlyOnboarding: "当前入职",
    q1NewHires: "第一季度新进",
    q2NewHires: "第二季度新进",
    q3NewHires: "第三季度新进",
    q4NewHires: "第四季度新进",
    yoy: "同比:",
    hrContact: "人力资源联系人",
    incomingNewHire: "新进员工",
    onboardingComplete: "入职完成",
    primary: "姓名",
    dept: "部门",
    startDate: "开始日期",
    hiringRate: "招聘率:"
  }
};

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ month?: string, year?: string, date?: string }> }) {

  const t = await getDictionary();
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || 'kh') as 'kh'|'en'|'zh';
  const l = dashT[locale] || dashT.kh;

  const resolvedParams = await searchParams;

  // Accurate Cambodia Timezone (Asia/Phnom_Penh - GMT+7)
  const nowInCambodia = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Phnom_Penh" }));
  const todayKh = new Date(nowInCambodia.getFullYear(), nowInCambodia.getMonth(), nowInCambodia.getDate());
  const today = todayKh;
  const todayKhStr = `${todayKh.getFullYear()}-${String(todayKh.getMonth() + 1).padStart(2, '0')}-${String(todayKh.getDate()).padStart(2, '0')}`;

  const isCustomFiltered = Boolean(resolvedParams?.date && resolvedParams.date !== todayKhStr);

  let actualDateObj = todayKh;
  if (resolvedParams?.date) {
    const parts = resolvedParams.date.split('-');
    if (parts.length === 3) {
      const parsedDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      if (!isNaN(parsedDate.getTime())) {
        actualDateObj = parsedDate;
      }
    }
  }

  const actualDateStart = new Date(actualDateObj);
  actualDateStart.setHours(0, 0, 0, 0);
  const actualDateEnd = new Date(actualDateObj);
  actualDateEnd.setHours(23, 59, 59, 999);

  const actualDateStr = `${actualDateObj.getFullYear()}-${String(actualDateObj.getMonth() + 1).padStart(2, '0')}-${String(actualDateObj.getDate()).padStart(2, '0')}`;
  const formattedActualDateKh = `${String(actualDateObj.getDate()).padStart(2, '0')}/${String(actualDateObj.getMonth() + 1).padStart(2, '0')}/${actualDateObj.getFullYear()}`;

  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const filterMonth = resolvedParams?.month ? parseInt(resolvedParams.month) : (resolvedParams?.date ? actualDateObj.getMonth() + 1 : currentMonth);
  const filterYear = resolvedParams?.year ? parseInt(resolvedParams.year) : (resolvedParams?.date ? actualDateObj.getFullYear() : currentYear);

  const session = await getSession();

  if (session?.role === 'EMPLOYEE') {
    const employeeId = session.employeeId;
    let employeeData = null;
    let recentLeaves: any[] = [];
    let recentAttendances: any[] = [];
    let recentPayrolls: any[] = [];

    if (employeeId) {
      employeeData = await prisma.employee.findUnique({
        where: { id: employeeId }
      });
      if (employeeData) {
        recentLeaves = await prisma.leaveRequest.findMany({
          where: { employeeId: employeeId },
          orderBy: { createdAt: 'desc' },
          take: 5
        });
        recentAttendances = await prisma.dailyAttendance.findMany({
          where: { employeeId: employeeId },
          orderBy: { date: 'desc' },
          take: 5
        });
        recentPayrolls = await prisma.payroll.findMany({
          where: { employeeId: employeeId, status: { in: ['APPROVED', 'PAID'] } },
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 3
        });
      }
    }

    const EmployeeDashboard = (await import('@/components/EmployeeDashboard')).default;
    return (
      <EmployeeDashboard 
        employee={employeeData} 
        recentLeaves={recentLeaves} 
        recentAttendances={recentAttendances} 
        recentPayrolls={recentPayrolls} 
        l={l} 
        locale={locale} 
      />
    );
  }

  // Fetch metrics
  const [
    totalEmployees,
    currentMonthPayrolls,
    todayAttendances,
    todayLeaves,
    monthAdvances,
    payrollsForFilter,
    companySettings,
    allEmployees,
    departmentGroupsDb,
    recentLeaveRequests,
    weeklyAttendance,
    allJobPostings,
    allCandidates,
    allEmployeeLoans,
    yearPayrolls,
    yearTerminations,
    yearExitInterviews
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.payroll.aggregate({
      where: { month: currentMonth, year: currentYear },
      _sum: { netSalaryUsd: true }
    }),
    prisma.dailyAttendance.findMany({
      where: { date: { gte: actualDateStart, lte: actualDateEnd } },
      select: { employeeId: true }
    }),
    prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: actualDateEnd },
        endDate: { gte: actualDateStart }
      },
      select: { employeeId: true }
    }),
    prisma.advanceSalary.findMany({
      where: { 
        month: filterMonth,
        year: filterYear,
        status: { in: ['APPROVED', 'DEDUCTED'] } 
      },
      select: { employeeId: true, amount: true, status: true }
    }),
    prisma.payroll.findMany({
      where: { month: filterMonth, year: filterYear },
      include: { employee: true }
    }),
    prisma.companySettings.findUnique({ where: { id: 'default' } }),
    prisma.employee.findMany({
      orderBy: { hireDate: 'desc' },
      select: {
        id: true,
        employeeId: true,
        firstNameKh: true,
        lastNameKh: true,
        firstNameEn: true,
        lastNameEn: true,
        gender: true,
        department: true,
        position: true,
        hireDate: true,
        dob: true,
        probationStart: true,
        probationEnd: true,
        regularContract1: true,
        regularContract2: true,
        regularContract3: true,
        basicSalary: true,
        placeOfBirth: true,
        nationality: true,
        photoUrl: true,
        status: true,
      },
    }),
    prisma.departmentGroup.findMany({ orderBy: { orderIdx: 'asc' } }),
    // New query: recent leave requests
    prisma.leaveRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { employee: true }
    }),
    // New query: 7 days attendance
    prisma.dailyAttendance.findMany({
      where: {
        date: { gte: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000) }
      },
      select: { date: true }
    }),
    // Recruitment ATS queries
    prisma.jobPosting.findMany({
      include: { candidates: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.candidate.findMany({
      select: {
        id: true,
        status: true,
        appliedAt: true,
        jobPosting: {
          select: { department: true, title: true }
        }
      }
    }),
    // Employee Loans query
    prisma.employeeLoan.findMany({
      where: { status: { in: ['ACTIVE', 'PENDING', 'PAID_OFF'] } },
      include: {
        employee: {
          select: { firstNameKh: true, lastNameKh: true, firstNameEn: true, lastNameEn: true, department: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    // 12-Month Payroll records for the filterYear
    prisma.payroll.findMany({
      where: { year: filterYear },
      select: {
        id: true,
        month: true,
        year: true,
        basicSalary: true,
        workingSalary: true,
        totalSalary: true,
        netSalaryUsd: true,
        taxPayment: true,
        nssf: true,
        loanPension: true,
        severancePay: true,
        otWage: true,
        attendanceBonus: true,
        transportation: true,
        lunchAllowance: true,
        status: true,
        employeeId: true,
      }
    }),
    // Terminations for filterYear
    prisma.termination.findMany({
      where: {
        terminationDate: {
          gte: new Date(filterYear, 0, 1),
          lte: new Date(filterYear, 11, 31, 23, 59, 59, 999)
        }
      },
      select: {
        id: true,
        employeeId: true,
        terminationDate: true,
        reason: true,
        status: true,
      }
    }),
    // Exit Interviews for filterYear
    prisma.exitInterview.findMany({
      where: {
        resignationDate: {
          gte: new Date(filterYear, 0, 1),
          lte: new Date(filterYear, 11, 31, 23, 59, 59, 999)
        }
      },
      select: {
        id: true,
        employeeId: true,
        resignationDate: true,
        primaryReason: true,
      }
    })
  ]);

  const settings = {
    payment1StartDate: companySettings?.payment1StartDate ?? 1,
    payment1EndDate: companySettings?.payment1EndDate ?? 15,
    payment2StartDate: companySettings?.payment2StartDate ?? 16,
    payment2EndDate: companySettings?.payment2EndDate ?? 31
  };

  const totalPayrollValue = currentMonthPayrolls._sum.netSalaryUsd || 0;
  const uniqueBorrowers = new Set(monthAdvances.map(a => a.employeeId)).size;
  const totalAdvanceValue = monthAdvances.reduce((sum, a) => sum + a.amount, 0);
  
  // Calculate Totals for Summary Cards based on filterMonth
  let filterTotalAdvance = 0;
  let filterTotalTax = 0;
  
  // Compute advanceStats
  const advanceStats = { paid: 0, remaining: 0, count: 0 };
  const advanceSet = new Set();
  monthAdvances.forEach((adv) => {
    if (adv.status === 'DEDUCTED') {
      advanceStats.paid += adv.amount;
    } else if (adv.status === 'APPROVED') {
      advanceStats.remaining += adv.amount;
    }
    advanceSet.add(adv.employeeId);
  });
  advanceStats.count = advanceSet.size;

  // Compute loanStats from EmployeeLoan table
  const activeLoans = (allEmployeeLoans || []).filter(l => l.status === 'ACTIVE');
  const loanStats = {
    activeCount: activeLoans.length,
    totalPrincipal: activeLoans.reduce((sum, l) => sum + l.loanAmount, 0),
    totalRepaid: activeLoans.reduce((sum, l) => sum + l.totalRepaid, 0),
    totalRemaining: activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0),
    monthlyDeduction: activeLoans.reduce((sum, l) => sum + l.monthlyDeduction, 0),
    loans: (allEmployeeLoans || []).slice(0, 6).map(l => ({
      id: l.id,
      loanCode: l.loanCode,
      empName: l.employee ? `${l.employee.lastNameKh || ''} ${l.employee.firstNameKh || ''} (${l.employee.firstNameEn || ''})`.trim() : 'បុគ្គលិក',
      loanAmount: l.loanAmount,
      remainingBalance: l.remainingBalance,
      monthlyDeduction: l.monthlyDeduction,
      purpose: l.purpose,
      status: l.status,
    })),
  };

  // Compute rich recruitment ATS stats & pipeline
  const totalOpenJobs = allJobPostings.filter(j => j.status === 'OPEN').length;
  const totalCandidates = allCandidates.length;

  const stageCounts: Record<string, number> = {
    NEW: 0,
    REVIEWING: 0,
    INTERVIEWING: 0,
    OFFERED: 0,
    HIRED: 0,
    REJECTED: 0,
  };
  allCandidates.forEach(c => {
    const s = c.status || 'NEW';
    if (stageCounts[s] !== undefined) {
      stageCounts[s]++;
    } else {
      stageCounts.NEW++;
    }
  });

  const recruitmentPipeline = [
    { key: 'NEW', nameKh: 'ដាក់ពាក្យថ្មី', nameEn: 'Applied', count: stageCounts.NEW, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: '📩' },
    { key: 'REVIEWING', nameKh: 'ត្រួតពិនិត្យ', nameEn: 'Screening', count: stageCounts.REVIEWING, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: '🔍' },
    { key: 'INTERVIEWING', nameKh: 'សម្ភាសន៍', nameEn: 'Interview', count: stageCounts.INTERVIEWING, color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', icon: '🎙️' },
    { key: 'OFFERED', nameKh: 'ផ្តល់សំណើ', nameEn: 'Offer', count: stageCounts.OFFERED, color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', icon: '📝' },
    { key: 'HIRED', nameKh: 'ជាប់ស្ថាពរ', nameEn: 'Hired', count: stageCounts.HIRED, color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', icon: '✅' },
  ];

  // Group demand by department from JobPostings & Candidates, fallback to active departments
  const jobDeptCount: Record<string, { openJobs: number; candidates: number }> = {};
  allJobPostings.forEach(j => {
    const dept = j.department || 'General';
    if (!jobDeptCount[dept]) jobDeptCount[dept] = { openJobs: 0, candidates: 0 };
    if (j.status === 'OPEN') jobDeptCount[dept].openJobs += 1;
    jobDeptCount[dept].candidates += (j.candidates?.length || 0);
  });

  if (Object.keys(jobDeptCount).length === 0) {
    allEmployees.forEach(emp => {
      const dept = emp.department || 'General';
      if (!jobDeptCount[dept]) jobDeptCount[dept] = { openJobs: 1, candidates: 0 };
    });
  }

  const recruitmentByDept = Object.entries(jobDeptCount)
    .map(([name, data]) => ({
      name,
      count: data.openJobs || (data.candidates > 0 ? data.candidates : 1),
      openJobs: data.openJobs,
      candidates: data.candidates,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recruitmentStats = {
    totalOpenJobs,
    totalCandidates,
    hiredCount: stageCounts.HIRED,
    pipeline: recruitmentPipeline,
    byDept: recruitmentByDept,
  };

  // Compute weeklyAttendanceData
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysKh = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
  const attCountByDay: Record<number, number> = {};
  weeklyAttendance.forEach(att => {
    const d = new Date(att.date).getDay();
    attCountByDay[d] = (attCountByDay[d] || 0) + 1;
  });
  
  const weeklyAttendanceData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dayIndex = d.getDay();
    const presentCount = attCountByDay[dayIndex] || 0;
    const absentCount = Math.max(0, totalEmployees - presentCount);
    const rate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;
    weeklyAttendanceData.push({
      name: days[dayIndex],
      nameKh: daysKh[dayIndex],
      dateStr: `${d.getDate()}/${d.getMonth() + 1}`,
      present: presentCount,
      absent: absentCount,
      rate
    });
  }
  
  let filterTotalNSSF = 0;
  let filterGrandTotalSalary = 0;
  let filterGrandNetSalary = 0;
  let filterTotalBasicSalary1 = 0;

  if (payrollsForFilter.length > 0) {
    // Exact calculation based on generated payroll
    filterTotalAdvance = payrollsForFilter.reduce((sum, p) => sum + p.loanPension, 0);
    filterTotalTax = payrollsForFilter.reduce((sum, p) => sum + p.taxPayment, 0);
    filterTotalNSSF = payrollsForFilter.reduce((sum, p) => sum + p.nssf, 0);
    filterGrandTotalSalary = payrollsForFilter.reduce((sum, p) => sum + p.totalSalary, 0);
    filterGrandNetSalary = payrollsForFilter.reduce((sum, p) => sum + p.netSalaryUsd, 0);
    filterTotalBasicSalary1 = payrollsForFilter.reduce((sum, p) => sum + (p.employee?.basicSalary1 || 0), 0);
  } else {
    // Projected auto-calculation for the dashboard before payroll generation
    const projectedAdvances = await prisma.advanceSalary.aggregate({
      where: { month: filterMonth, year: filterYear, status: 'APPROVED' },
      _sum: { amount: true }
    });
    filterTotalAdvance = projectedAdvances._sum.amount || 0;
    
    // Projected gross: Basic Salary + $15 (Attendance) + $7 (Transport) + $13 (Lunch estimate: 26*0.5)
    const employees = await prisma.employee.findMany({ select: { basicSalary: true, basicSalary1: true } });
    filterGrandTotalSalary = employees.reduce((sum, emp) => {
       const basic = emp.basicSalary || 0;
       const fixedAllowances = 15 + 7 + (26 * 0.5); // Attendance + Transport + Lunch
       return sum + basic + fixedAllowances;
    }, 0);
    
    filterTotalBasicSalary1 = employees.reduce((sum, emp) => sum + (emp.basicSalary1 || 0), 0);

    // Projected Severance (5%)
    const projectedSeverance = filterGrandTotalSalary * 0.05;
    
    filterTotalTax = 0; // Tax is projected at 0 until finalized
    filterTotalNSSF = 0; // NSSF is projected at 0 until finalized
    filterGrandNetSalary = (filterGrandTotalSalary + projectedSeverance) - filterTotalAdvance - filterTotalTax - filterTotalNSSF;
  }

  const date1Start = settings.payment1StartDate.toString().padStart(2, '0');
  const date1End = settings.payment1EndDate >= 31 
    ? new Date(filterYear, filterMonth, 0).getDate().toString().padStart(2, '0') 
    : settings.payment1EndDate.toString().padStart(2, '0');
    
  const date2Start = settings.payment2StartDate.toString().padStart(2, '0');
  const date2End = settings.payment2EndDate >= 31 
    ? new Date(filterYear, filterMonth, 0).getDate().toString().padStart(2, '0') 
    : settings.payment2EndDate.toString().padStart(2, '0');

  const date1 = `${date1Start}-${date1End}`;
  const date2 = `${date2Start}-${date2End}`;

  // 12-Month Annual Payroll Trends calculation
  const KHMER_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const annualPayrollData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const records = (yearPayrolls || []).filter(p => p.month === m);
    const count = records.length;

    let gross = 0;
    let net = 0;
    let allowances = 0;
    let ot = 0;
    let deductions = 0;
    let isProjected = false;

    if (count > 0) {
      gross = records.reduce((sum, p) => sum + (p.totalSalary || 0), 0);
      net = records.reduce((sum, p) => sum + (p.netSalaryUsd || 0), 0);
      allowances = records.reduce((sum, p) => sum + (p.attendanceBonus || 0) + (p.transportation || 0) + (p.lunchAllowance || 0), 0);
      ot = records.reduce((sum, p) => sum + (p.otWage || 0), 0);
      deductions = records.reduce((sum, p) => sum + (p.taxPayment || 0) + (p.nssf || 0) + (p.loanPension || 0), 0);
    } else if (m === filterMonth && filterGrandTotalSalary > 0) {
      gross = filterGrandTotalSalary;
      net = filterGrandNetSalary;
      allowances = (15 + 7 + 13) * allEmployees.length;
      deductions = filterTotalAdvance;
      isProjected = true;
    }

    return {
      month: m,
      monthKh: KHMER_MONTHS[i],
      monthEn: EN_MONTHS[i],
      label: `${KHMER_MONTHS[i]} (${EN_MONTHS[i]})`,
      empCount: count > 0 ? count : (isProjected ? allEmployees.length : 0),
      grossSalary: Math.round(gross * 100) / 100,
      netSalary: Math.round(net * 100) / 100,
      allowances: Math.round(allowances * 100) / 100,
      otWage: Math.round(ot * 100) / 100,
      deductions: Math.round(deductions * 100) / 100,
      isProjected,
      hasData: count > 0 || (m === filterMonth && filterGrandTotalSalary > 0),
      status: count > 0 ? (records[0]?.status || 'APPROVED') : (isProjected ? 'PROJECTED' : 'PENDING'),
      momDiffAmount: 0,
      momDiffPercent: 0,
    };
  });

  // Calculate MoM Growth rates
  for (let i = 0; i < annualPayrollData.length; i++) {
    const cur = annualPayrollData[i];
    const prev = i > 0 ? annualPayrollData[i - 1] : null;

    if (prev && prev.hasData && cur.hasData && prev.netSalary > 0) {
      const diffAmount = cur.netSalary - prev.netSalary;
      const diffPercent = (diffAmount / prev.netSalary) * 100;
      cur.momDiffAmount = Math.round(diffAmount * 100) / 100;
      cur.momDiffPercent = Math.round(diffPercent * 10) / 10;
    }
  }

  // 12-Month Employee Headcount & Turnover Trends calculation
  const annualEmployeeData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const mEnd = new Date(filterYear, m, 0, 23, 59, 59, 999);

    const newHires = allEmployees.filter(e => {
      if (!e.hireDate) return false;
      const h = new Date(e.hireDate);
      return h.getFullYear() === filterYear && (h.getMonth() + 1) === m;
    });

    const departures = [
      ...(yearTerminations || []).filter(t => {
        const d = new Date(t.terminationDate);
        return d.getFullYear() === filterYear && (d.getMonth() + 1) === m;
      }),
      ...(yearExitInterviews || []).filter(ei => {
        const d = new Date(ei.resignationDate);
        return d.getFullYear() === filterYear && (d.getMonth() + 1) === m;
      })
    ];
    const exitEmpIds = new Set(departures.map(d => d.employeeId));
    const exitsCount = exitEmpIds.size;

    const activeAtMonthEnd = allEmployees.filter(e => {
      if (!e.hireDate) return false;
      const h = new Date(e.hireDate);
      if (h > mEnd) return false;
      const term = (yearTerminations || []).find(t => t.employeeId === e.id);
      if (term && new Date(term.terminationDate) <= mEnd) return false;
      return true;
    });

    const fCount = activeAtMonthEnd.filter(e => e.gender === 'Female' || e.gender === 'F' || e.gender === 'ស្រី').length;
    const mCount = activeAtMonthEnd.length - fCount;
    const netChange = newHires.length - exitsCount;
    const turnoverRate = activeAtMonthEnd.length > 0
      ? Math.round((exitsCount / activeAtMonthEnd.length) * 100 * 10) / 10
      : 0;

    return {
      month: m,
      monthKh: KHMER_MONTHS[i],
      monthEn: EN_MONTHS[i],
      label: `${KHMER_MONTHS[i]} (${EN_MONTHS[i]})`,
      totalHeadcount: activeAtMonthEnd.length,
      femaleCount: fCount,
      maleCount: mCount,
      newHiresCount: newHires.length,
      exitsCount: exitsCount,
      netChange: netChange,
      turnoverRate: turnoverRate,
      hiresList: newHires.map(e => ({
        id: e.id,
        empId: e.employeeId,
        name: `${e.lastNameKh || ''} ${e.firstNameKh || ''} (${e.firstNameEn || ''})`.trim(),
        dept: e.department || 'ទូទៅ',
        position: e.position || 'បុគ្គលិក',
        hireDate: e.hireDate ? new Date(e.hireDate).toISOString().slice(0, 10) : '',
      })),
    };
  });


  
  

  // Compute Attendance Stats
  const leaveEmpIds = new Set(todayLeaves.map(l => l.employeeId));
  const presentEmpIds = new Set(todayAttendances.map(a => a.employeeId));
  
  const employeesOnLeave = allEmployees.filter(e => leaveEmpIds.has(e.id));
  const employeesAbsent = allEmployees.filter(e => !leaveEmpIds.has(e.id) && !presentEmpIds.has(e.id));

  const leaveStats = {
    deptCount: new Set(employeesOnLeave.map(e => e.department)).size,
    total: employeesOnLeave.length,
    female: employeesOnLeave.filter(e => e.gender === 'Female' || e.gender === 'F' || e.gender === 'ស្រី').length,
    male: employeesOnLeave.filter(e => e.gender === 'Male' || e.gender === 'M' || e.gender === 'ប្រុស').length
  };

  const absentStats = {
    deptCount: new Set(employeesAbsent.map(e => e.department)).size,
    total: employeesAbsent.length,
    female: employeesAbsent.filter(e => e.gender === 'Female' || e.gender === 'F' || e.gender === 'ស្រី').length,
    male: employeesAbsent.filter(e => e.gender === 'Male' || e.gender === 'M' || e.gender === 'ប្រុស').length
  };

  // Compute grouped stats by department for Leave and Absent
  const leaveByDept = employeesOnLeave.reduce((acc, emp) => {
    if (!acc[emp.department]) acc[emp.department] = { total: 0, f: 0, m: 0 };
    acc[emp.department].total++;
    if (emp.gender === 'Female' || emp.gender === 'F' || emp.gender === 'ស្រី') acc[emp.department].f++;
    if (emp.gender === 'Male' || emp.gender === 'M' || emp.gender === 'ប្រុស') acc[emp.department].m++;
    return acc;
  }, {} as Record<string, {total: number, f: number, m: number}>);

  const absentByDept = employeesAbsent.reduce((acc, emp) => {
    if (!acc[emp.department]) acc[emp.department] = { total: 0, f: 0, m: 0 };
    acc[emp.department].total++;
    if (emp.gender === 'Female' || emp.gender === 'F' || emp.gender === 'ស្រី') acc[emp.department].f++;
    if (emp.gender === 'Male' || emp.gender === 'M' || emp.gender === 'ប្រុស') acc[emp.department].m++;
    return acc;
  }, {} as Record<string, {total: number, f: number, m: number}>);

  // Unified Landscape Table for Leave and Absent
  const allDepts = new Set([...Object.keys(leaveByDept), ...Object.keys(absentByDept)]);
  const unifiedDeptStats = Array.from(allDepts).map(dept => ({
    dept,
    leave: leaveByDept[dept] || { total: 0, f: 0, m: 0 },
    absent: absentByDept[dept] || { total: 0, f: 0, m: 0 }
  })).sort((a, b) => (b.leave.total + b.absent.total) - (a.leave.total + a.absent.total));

  const renderUnifiedList = () => {
    return (
      <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
        
        {/* On Leave Block */}
        <div style={{ backgroundColor: '#fdf9ff', border: '1px solid #ebccff', borderRadius: '6px', padding: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px dashed #ebccff', paddingBottom: '6px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.929em', color: '#9c27b0' }} className={locale === 'kh' ? 'kh-text' : ''}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9c27b0', marginRight: '6px' }}></span>
              {l.hasLeave}
            </div>
            <div style={{ fontSize: '0.786em', color: '#555' }} className={locale === 'kh' ? 'kh-text' : ''}>
              {locale === 'kh' ? 'សរុបរួម' : 'Total'}: <span style={{ fontWeight: 'bold', color: '#9c27b0', fontSize: '0.929em' }}>{leaveStats.total}</span> ( {l.fmLabel} {leaveStats.female}/{leaveStats.male} )
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(leaveByDept).map(([dept, stats]) => (
              <div key={dept} style={{ backgroundColor: '#fff', border: '1px solid #f0e6ff', borderRadius: '4px', padding: '4px 8px', fontSize: '0.786em', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <span style={{ fontWeight: 'bold', color: '#333' }}>{dept}</span>
                <span style={{ backgroundColor: '#fcf4ff', color: '#9c27b0', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{stats.total}</span>
                <span style={{ color: '#888', fontSize: '0.714em' }}>{stats.f}ស្រី/{stats.m}ប្រុស</span>
              </div>
            ))}
            {Object.keys(leaveByDept).length === 0 && <span style={{ fontSize: '0.786em', color: '#aaa', fontStyle: 'italic' }}>គ្មានអវត្តមានទេ</span>}
          </div>
        </div>

        {/* Absent Block */}
        <div style={{ backgroundColor: '#f7fbff', border: '1px solid #99c2ff', borderRadius: '6px', padding: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px dashed #99c2ff', paddingBottom: '6px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.929em', color: '#1976d2' }} className={locale === 'kh' ? 'kh-text' : ''}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1976d2', marginRight: '6px' }}></span>
              {l.noLeave}
            </div>
            <div style={{ fontSize: '0.786em', color: '#555' }} className={locale === 'kh' ? 'kh-text' : ''}>
              {locale === 'kh' ? 'សរុបរួម' : 'Total'}: <span style={{ fontWeight: 'bold', color: '#d32f2f', fontSize: '0.929em' }}>{absentStats.total}</span> ( {l.fmLabel} {absentStats.female}/{absentStats.male} )
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(absentByDept).map(([dept, stats]) => (
              <div key={dept} style={{ backgroundColor: '#fff', border: '1px solid #e6f0ff', borderRadius: '4px', padding: '4px 8px', fontSize: '0.786em', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <span style={{ fontWeight: 'bold', color: '#333' }}>{dept}</span>
                <span style={{ backgroundColor: '#fff0f0', color: '#d32f2f', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{stats.total}</span>
                <span style={{ color: '#888', fontSize: '0.714em' }}>{stats.f}ស្រី/{stats.m}ប្រុស</span>
              </div>
            ))}
            {Object.keys(absentByDept).length === 0 && <span style={{ fontSize: '0.786em', color: '#aaa', fontStyle: 'italic' }}>គ្មានអវត្តមានទេ</span>}
          </div>
        </div>

      </div>
    );
  };

  // Compute Hiring Stats for Current and Previous Year
  const currentY = today.getFullYear();
  const prevY = currentY - 1;

  const qHires = {
    current: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
    prev: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }
  };
  
  const getDeptGroup = (dept: string) => {
      const d = (dept || '').toLowerCase();
      for (const group of departmentGroupsDb) {
        if (!group.keywords) continue;
        const keywords = group.keywords.split(',').map(k => k.trim().toLowerCase());
        if (keywords.some(k => k && d.includes(k))) return group.name;
      }
      return 'Other';
    };

    const groupHires: Record<string, { current: number, prev: number, count: number, color: string, textColor: string }> = {};
    departmentGroupsDb.forEach(g => {
      groupHires[g.name] = { current: 0, prev: 0, count: 0, color: g.color, textColor: g.textColor };
    });
    // Add default Other group if not configured
    if (!groupHires['Other']) {
      groupHires['Other'] = { current: 0, prev: 0, count: 0, color: '#f3f4f6', textColor: '#4b5563' };
    }
  
    allEmployees.forEach(emp => {
      const group = getDeptGroup(emp.department);
      groupHires[group as keyof typeof groupHires].count++;
  
      const d = new Date(emp.hireDate);
      const y = d.getFullYear();
      const m = d.getMonth() + 1; // 1-12
      const q = m <= 3 ? 'Q1' : m <= 6 ? 'Q2' : m <= 9 ? 'Q3' : 'Q4';
      
      if (y === currentY) {
        qHires.current[q]++;
        groupHires[group as keyof typeof groupHires].current++;
      } else if (y === prevY) {
        qHires.prev[q]++;
        groupHires[group as keyof typeof groupHires].prev++;
      }
    });

  const renderTrend = (current: number, prev: number) => {
    if (current > prev) return <span style={{ color: '#388e3c' }}>▲</span>;
    if (current < prev) return <span style={{ color: '#d32f2f' }}>▼</span>;
    return <span style={{ color: '#f57c00' }}>—</span>;
  };

  return (
    <div>
      {/* Global Executive Standard Header with Live Walking Clock */}
      <div
        className="animate-fade-in no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '12px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)',
        }}
      >
        {/* Left: Global Dashboard Brand & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              flexShrink: 0,
            }}
          >
            🏢
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                className="kh-text"
                style={{
                  margin: 0,
                  fontSize: '1.22rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.25,
                }}
              >
                {t.sidebar.dashboard}
              </h1>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#15803d',
                  backgroundColor: '#dcfce7',
                  border: '1px solid #bbf7d0',
                  padding: '2px 7px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  lineHeight: 1.2,
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#16a34a',
                    display: 'inline-block',
                  }}
                />
                Global Standard
              </span>
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: '#64748b',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Enterprise HR Management System</span>
              <span>•</span>
              <span style={{ color: '#0284c7', fontWeight: 600 }}>v2.5 Live</span>
            </div>
          </div>
        </div>

        {/* Center: Unified Live Walking Clock & Modern Cambodian Calendar */}
        <div style={{ display: 'flex', justifyContent: 'center', flex: '1 1 auto', minWidth: '280px' }}>
          <LiveDigitalClock locale={locale} actualDateStr={isCustomFiltered ? actualDateStr : ''} isCustomFiltered={isCustomFiltered} />
        </div>

        {/* Right: Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          {/* Department Group Settings */}
          <Link
            href="/settings"
            style={{
              padding: '6px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#334155',
              fontSize: '0.78rem',
              fontWeight: 700,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
              height: '48px',
              whiteSpace: 'nowrap',
            }}
            title="ការកំណត់ក្រុមផ្នែក"
            className="hover-elevate kh-text"
          >
            <span style={{ fontSize: '1rem' }}>⚙️</span>
            <span>ការកំណត់ក្រុមផ្នែក</span>
          </Link>
        </div>
      </div>

      
      
      
      <CustomizableDashboard
        locale={locale}
        l={l}
        leaveStats={leaveStats}
        absentStats={absentStats}
        leaveByDept={leaveByDept}
        absentByDept={absentByDept}
        qHires={qHires}
        currentY={currentY}
        prevY={prevY}
        allEmployees={allEmployees}
        groupHires={groupHires}
        recentLeaveRequests={recentLeaveRequests}
        advanceStats={advanceStats}
        loanStats={loanStats}
        recruitmentByDept={recruitmentByDept}
        recruitmentStats={recruitmentStats}
        weeklyAttendanceData={weeklyAttendanceData}
        totalPayrollValue={totalPayrollValue}
        totalAdvanceValue={totalAdvanceValue}
        filterGrandTotalSalary={filterGrandTotalSalary}
        filterMonth={filterMonth}
        filterYear={filterYear}
        todayAttendancesCount={todayAttendances.length}
        hrContactUrl={companySettings?.hrContactUrl || 'https://i.pravatar.cc/100?img=5'}
        annualPayrollData={annualPayrollData}
        annualEmployeeData={annualEmployeeData}
      />

      {/* Hidden legacy grid */}


      <div style={{ display: 'none' }}>

      
      {/* Payroll Summary Highlights */}
      <div className="animate-slide-up" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.1rem', fontWeight: 'bold' }} className="kh-text">
            📊 របាយការណ៍សរុប (ខែ {filterMonth}/{filterYear})
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '10px' }}>Summary for selected month</span>
        </div>
        
        <DraggableSummaryCards initialCards={[
          {
            id: 'advance',
            title: `ប្រាក់ខែបើកទី១ (${date1})`,
            amount: filterTotalAdvance === 0 ? '$-' : `$${filterTotalAdvance.toFixed(2)}`,
            gradient: 'linear-gradient(135deg, #6ee7b7, #3b82f6)',
            icon: <svg key="adv-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path key="p1" d="M21 12V7H5a2 0 0 1 0-4h14v4"/><path key="p2" d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path key="p3" d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
            href: '/dashboard/payroll'
          },
          {
            id: 'net2',
            title: `ប្រាក់ខែបើកទី២ (${date2})`,
            amount: filterGrandNetSalary === 0 ? '$-' : `$${filterGrandNetSalary.toFixed(2)}`,
            gradient: 'linear-gradient(135deg, #4f46e5, #4338ca)',
            icon: <svg key="net2-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect key="r1" width="20" height="12" x="2" y="6" rx="2"/><circle key="c1" cx="12" cy="12" r="2"/><path key="p1" d="M6 12h.01M18 12h.01"/></svg>,
            href: '/dashboard/payroll'
          },
          {
            id: 'tax',
            title: 'ប្រាក់កាត់ពន្ធ',
            amount: filterTotalTax === 0 ? '$-' : `$${filterTotalTax.toFixed(2)}`,
            gradient: 'linear-gradient(135deg, #c4b5fd, #a78bfa)',
            icon: <svg key="tax-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line key="l1" x1="19" y1="5" x2="5" y2="19"></line><circle key="c1" cx="6.5" cy="6.5" r="2.5"></circle><circle key="c2" cx="17.5" cy="17.5" r="2.5"></circle></svg>,
            href: '/dashboard/payroll'
          },
          {
            id: 'nssf',
            title: 'ប្រាក់កាត់បសស',
            amount: filterTotalNSSF === 0 ? '$-' : `$${filterTotalNSSF.toFixed(2)}`,
            gradient: 'linear-gradient(135deg, #818cf8, #6366f1)',
            icon: <svg key="nssf-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle key="c1" cx="8" cy="8" r="6"/><path key="p1" d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path key="p2" d="M7 6h1v4"/><path key="p3" d="m16.71 13.88.7.71-2.82 2.82"/></svg>,
            href: '/dashboard/payroll'
          }
        ]} />
      </div>
      
      <DraggableBottomGrid initialCards={[
        {
          id: 'employees',
          element: (
            <Link key="emp-el" href="/dashboard/employees" className="card animate-slide-up" style={{ animationDelay: '0.1s', display: 'flex', flexDirection: 'column', textDecoration: 'none', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="kh-text">{t.dashboard.totalEmployees}</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px', lineHeight: 1 }}>
                    {totalEmployees}
                  </p>
                </div>
                <div className="interactive-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}>
                  👥
                </div>
              </div>
            </Link>
          )
        },
        {
          id: 'kpi',
          element: (
            <div key="kpi-el" style={{ animationDelay: '0.2s', height: '100%' }}>
              <DashboardKpiChart kpiScore={85} />
            </div>
          )
        },
        {
          id: 'attendance',
          element: (
            <Link key="att-el" href="/dashboard/attendance" className="card animate-slide-up" style={{ animationDelay: '0.3s', display: 'flex', flexDirection: 'column', textDecoration: 'none', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="kh-text">វត្តមានជាក់ស្តែង ({formattedActualDateKh})</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px', lineHeight: 1 }}>
                    {todayAttendances.length} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {totalEmployees}</span>
                  </p>
                </div>
                <div className="interactive-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}>
                  📅
                </div>
              </div>
            </Link>
          )
        },
        {
          id: 'leave',
          element: (
            <Link key="leave-el" href="/dashboard/leave" className="card animate-slide-up" style={{ animationDelay: '0.4s', display: 'flex', flexDirection: 'column', textDecoration: 'none', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="kh-text">ច្បាប់ឈប់សម្រាក ({formattedActualDateKh})</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px', lineHeight: 1 }}>
                    {todayLeaves.length}
                  </p>
                </div>
                <div className="interactive-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}>
                  🌴
                </div>
              </div>
            </Link>
          )
        },
        {
          id: 'advance',
          element: (
            <Link key="adv-el" href="/dashboard/advance" className="card animate-slide-up" style={{ animationDelay: '0.5s', display: 'flex', flexDirection: 'column', textDecoration: 'none', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="kh-text">{t.sidebar.advance || "ប្រាក់បុរេប្រទាន"}</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px', lineHeight: 1 }}>
                    <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 500 }}>{uniqueBorrowers}នាក់ / </span>
                    <span style={{ fontSize: '1.5rem', verticalAlign: 'top', color: 'var(--text-muted)', marginRight: '2px' }}>$</span>
                    {totalAdvanceValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="interactive-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}>
                  💵
                </div>
              </div>
            </Link>
          )
        }
      ]} />
      </div>
    </div>
  );
}
