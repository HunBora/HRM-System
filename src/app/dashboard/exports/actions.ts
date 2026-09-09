'use server'

import { prisma } from '@/lib/prisma';

export async function fetchEmployeeReport() {
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  return employees.map(emp => ({
    employeeId: emp.employeeId,
    firstNameEn: emp.firstNameEn,
    lastNameEn: emp.lastNameEn,
    firstNameKh: emp.firstNameKh,
    lastNameKh: emp.lastNameKh,
    gender: emp.gender,
    dob: emp.dob ? new Date(emp.dob).toLocaleDateString('en-GB') : '',
    hireDate: new Date(emp.hireDate).toLocaleDateString('en-GB'),
    position: emp.position,
    department: emp.department,
    basicSalary: emp.basicSalary,
    phone: emp.phone || ''
  }));
}

export async function fetchAttendanceReport(month: number, year: number) {
  const attendances = await prisma.monthlyAttendance.findMany({
    where: { month, year },
    include: { employee: true },
    orderBy: { employee: { employeeId: 'asc' } }
  });

  return attendances.map(a => ({
    id: a.employee.employeeId,
    name: `${a.employee.firstNameEn} ${a.employee.lastNameEn}`,
    dept: a.employee.department,
    position: a.employee.position,
    daysWorked: a.daysWorked,
    absentDays: a.absentDays,
    leaveDays: a.leaveDays,
    otHours: a.otHours
  }));
}

export async function fetchPayrollReport(month: number, year: number) {
  const payrolls = await prisma.payroll.findMany({
    where: { month, year },
    include: { employee: true },
    orderBy: { employee: { employeeId: 'asc' } }
  });

  return payrolls.map((p, index) => {
    const emp = p.employee;
    return {
      no: index + 1,
      id: emp.employeeId,
      nameKh: `${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.trim(),
      nameEn: `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim(),
      dept: emp.department || '',
      line: emp.line || '-',
      position: emp.position || '',
      shift: emp.shift || '-',
      gender: emp.gender === 'MALE' ? 'ប្រុស' : 'ស្រី',
      wife: emp.spouse ? 1 : 0,
      child: emp.numberOfChildren || 0,
      startDate: emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('en-GB') : '-',
      basicSalary: p.basicSalary,
      basicPayScale: p.basicPayScale,
      workingDays: p.workingDays,
      absent: p.absentDays,
      permission: p.permissionDays,
      workingSalary: p.workingSalary,
      payScaleIncentive: p.payScaleIncentive,
      otHour: p.otHours,
      otWage: p.otWage,
      sunOtHour: p.sunOtHours,
      sunOtWage: p.sunOtWage,
      nightOtHour: p.nightOtHours,
      nightOtWage: p.nightOtWage,
      annualLeave: p.annualLeaveAmount,
      attBonus: p.attendanceBonus,
      transportation: p.transportation,
      lunchAllowance: p.lunchAllowance,
      otMealAllowance: p.otMealAllowance,
      dayCareAllowance: p.dayCareAllowance,
      seniority: p.seniority,
      seniorityIndemnity: p.seniorityIndemnity,
      productionIncentive: p.productionIncentive,
      adjust: p.adjustmentSkill,
      totalSalary: p.totalSalary,
      severancePay: p.severancePay,
      taxPayment: p.taxPayment,
      loanPension: p.loanPension,
      firstSalary: emp.basicSalary1 || 0,
      unionDeduction: p.unionDeduction,
      secondSalary: p.netSalaryUsd,
      paidSalaryUsd: p.paidSalaryUsd,
      riel: p.netSalaryRiel,
      signature: ''
    };
  });
}

export async function fetchBankTransferReport(month: number, year: number) {
  const payrolls = await prisma.payroll.findMany({
    where: { month, year },
    include: { employee: true },
    orderBy: { employee: { employeeId: 'asc' } }
  });

  return payrolls.map(p => ({
    name: `${p.employee.firstNameEn || ''} ${p.employee.lastNameEn || ''}`.trim(),
    empId: p.employee.employeeId,
    accountNumber: p.employee.bankCardNo || '',
    amount: p.netSalaryUsd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
    remark: ''
  }));
}

export async function fetchExpenseReport(month: number, year: number) {
  // 1. Payrolls for the month
  const payrolls = await prisma.payroll.findMany({
    where: { month, year },
    include: { employee: true }
  });

  // 2. Terminations for the month
  // Start and end of the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const terminations = await prisma.termination.findMany({
    where: {
      terminationDate: {
        gte: startDate,
        lte: endDate
      },
      status: 'APPROVED'
    },
    include: { employee: true }
  });

  // Group by department
  const depts: Record<string, any> = {};

  payrolls.forEach(p => {
    const d = p.employee.department || 'Other';
    if (!depts[d]) depts[d] = { dept: d, empCount: 0, regularNetSalary: 0, offboardingNet: 0, totalExpense: 0, termCount: 0 };
    depts[d].empCount += 1;
    depts[d].regularNetSalary += p.netSalaryUsd;
    depts[d].totalExpense += p.netSalaryUsd;
  });

  terminations.forEach(t => {
    const d = t.employee.department || 'Other';
    if (!depts[d]) depts[d] = { dept: d, empCount: 0, regularNetSalary: 0, offboardingNet: 0, totalExpense: 0, termCount: 0 };
    depts[d].termCount += 1;
    depts[d].offboardingNet += t.totalFinalPay;
    depts[d].totalExpense += t.totalFinalPay;
  });

  // Convert to array and calculate total row
  const result = Object.values(depts);
  
  const total = {
    dept: 'TOTAL (សរុបរួម)',
    empCount: result.reduce((s, r) => s + r.empCount, 0),
    regularNetSalary: result.reduce((s, r) => s + r.regularNetSalary, 0),
    termCount: result.reduce((s, r) => s + r.termCount, 0),
    offboardingNet: result.reduce((s, r) => s + r.offboardingNet, 0),
    totalExpense: result.reduce((s, r) => s + r.totalExpense, 0)
  };

  return [...result, total];
}

