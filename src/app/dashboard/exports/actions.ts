'use server'

import { prisma } from '@/lib/prisma';

export async function fetchEmployeeReport() {
  const employees = await prisma.employee.findMany({
    orderBy: { employeeId: 'asc' }
  });
  
  return employees.map((emp, index) => ({
    no: index + 1,
    employeeId: emp.employeeId,
    nameKh: `${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.trim(),
    nameEn: `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim(),
    firstNameEn: emp.firstNameEn,
    lastNameEn: emp.lastNameEn,
    firstNameKh: emp.firstNameKh,
    lastNameKh: emp.lastNameKh,
    gender: emp.gender === 'ប្រុស' || emp.gender === 'MALE' ? 'ប្រុស' : 'ស្រី',
    dob: emp.dob ? new Date(emp.dob).toLocaleDateString('en-GB') : '',
    placeOfBirth: emp.placeOfBirth || '-',
    address: emp.address || '-',
    phone: emp.phone || '-',
    telegramChatId: emp.telegramChatId || '-',
    maritalStatus: emp.maritalStatus === 'MARRIED' || emp.maritalStatus === 'រៀបការរួច' ? 'រៀបការរួច' : 'នៅលីវ',
    spouseName: emp.spouseName || '-',
    numberOfChildren: emp.numberOfChildren || 0,
    hireDate: new Date(emp.hireDate).toLocaleDateString('en-GB'),
    department: emp.department,
    position: emp.position,
    probationStart: emp.probationStart ? new Date(emp.probationStart).toLocaleDateString('en-GB') : '-',
    probationEnd: emp.probationEnd ? new Date(emp.probationEnd).toLocaleDateString('en-GB') : '-',
    basicSalary: (emp.basicSalary1 ?? emp.basicSalary) || 0,
    skillAllowance: emp.skillAllowance1 || 0,
    positionAllowance: emp.positionAllowance1 || 0,
    nationalId: emp.nationalId || '-',
    bankCardNo: emp.bankCardNo || '-',
    nssfNo: emp.nssfNo || '-',
    education: emp.education || '-',
    healthBook: emp.healthBook || '-',
    healthCertificate: emp.healthCertificate || '-',
    remark: emp.remark || '-'
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
      firstSalary: p.loanPension || 0,
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

export async function fetchNssfReport(month: number, year: number) {
  const company = await prisma.companySettings.findFirst();
  const exchangeRate = company?.exchangeRate || 4000;

  const payrolls = await prisma.payroll.findMany({
    where: { month, year },
    include: { employee: true },
    orderBy: { employee: { employeeId: 'asc' } },
  });

  let sumGrossUsd = 0;
  let sumContribKhr = 0;
  let sumOccRisk = 0;
  let sumHealthCare = 0;
  let sumPensionOrg = 0;
  let sumPensionStaff = 0;
  let sumTotalKhr = 0;
  let sumTotalUsd = 0;

  const rows = payrolls.map((p, idx) => {
    const emp = p.employee;
    const actualGrossUsd = p.totalSalary || p.basicSalary || 0;
    const actualGrossKhr = actualGrossUsd * exchangeRate;
    const contributoryWageKhr = Math.min(1200000, Math.max(400000, actualGrossKhr));

    const occRisk = Math.round(contributoryWageKhr * 0.008);
    const healthCare = Math.round(contributoryWageKhr * 0.026);
    const pensionOrg = Math.round(contributoryWageKhr * 0.02);
    const pensionStaff = Math.round(contributoryWageKhr * 0.02);
    const rowTotalKhr = occRisk + healthCare + pensionOrg + pensionStaff;
    const rowTotalUsd = Math.round((rowTotalKhr / exchangeRate) * 100) / 100;

    sumGrossUsd += actualGrossUsd;
    sumContribKhr += contributoryWageKhr;
    sumOccRisk += occRisk;
    sumHealthCare += healthCare;
    sumPensionOrg += pensionOrg;
    sumPensionStaff += pensionStaff;
    sumTotalKhr += rowTotalKhr;
    sumTotalUsd += rowTotalUsd;

    return {
      no: idx + 1,
      empId: emp.employeeId,
      nssfNo: emp.nssfNo || '-',
      nationalId: emp.nationalId || '-',
      nameKh: `${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.trim() || emp.firstNameEn,
      nameEn: `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim(),
      gender: emp.gender === 'MALE' || emp.gender === 'ប្រុស' ? 'ប្រុស (M)' : 'ស្រី (F)',
      dob: emp.dob ? new Date(emp.dob).toLocaleDateString('en-GB') : '-',
      dept: `${emp.department} • ${emp.position}`,
      actualWage: `$${actualGrossUsd.toFixed(2)}`,
      contributoryWage: `${contributoryWageKhr.toLocaleString()} ៛`,
      occRisk: `${occRisk.toLocaleString()} ៛`,
      healthCare: `${healthCare.toLocaleString()} ៛`,
      pensionEmp: `${pensionOrg.toLocaleString()} ៛`,
      pensionWorker: `${pensionStaff.toLocaleString()} ៛`,
      totalKhr: `${rowTotalKhr.toLocaleString()} ៛`,
      totalUsd: `$${rowTotalUsd.toFixed(2)}`,
    };
  });

  const grandTotalRow = {
    no: '',
    empId: '',
    nssfNo: '',
    nationalId: '',
    nameKh: 'សរុបរួម (GRAND TOTAL • 总计)',
    nameEn: `GRAND TOTAL (${payrolls.length} Staff)`,
    gender: '',
    dob: '',
    dept: '',
    actualWage: `$${sumGrossUsd.toFixed(2)}`,
    contributoryWage: `${sumContribKhr.toLocaleString()} ៛`,
    occRisk: `${sumOccRisk.toLocaleString()} ៛`,
    healthCare: `${sumHealthCare.toLocaleString()} ៛`,
    pensionEmp: `${sumPensionOrg.toLocaleString()} ៛`,
    pensionWorker: `${sumPensionStaff.toLocaleString()} ៛`,
    totalKhr: `${sumTotalKhr.toLocaleString()} ៛`,
    totalUsd: `$${sumTotalUsd.toFixed(2)}`,
  };

  return [...rows, grandTotalRow];
}

function computeTOST(taxBaseKhr: number, isResident: boolean = true) {
  if (!isResident) return { taxKhr: Math.round(taxBaseKhr * 0.2), ratePercent: 20 };
  if (taxBaseKhr <= 1500000) return { taxKhr: 0, ratePercent: 0 };
  if (taxBaseKhr <= 2000000) return { taxKhr: Math.max(0, Math.round(taxBaseKhr * 0.05 - 75000)), ratePercent: 5 };
  if (taxBaseKhr <= 8500000) return { taxKhr: Math.max(0, Math.round(taxBaseKhr * 0.1 - 175000)), ratePercent: 10 };
  if (taxBaseKhr <= 12500000) return { taxKhr: Math.max(0, Math.round(taxBaseKhr * 0.15 - 600000)), ratePercent: 15 };
  return { taxKhr: Math.max(0, Math.round(taxBaseKhr * 0.2 - 1225000)), ratePercent: 20 };
}

export async function fetchGdtTaxReport(month: number, year: number) {
  const company = await prisma.companySettings.findFirst();
  const exchangeRate = company?.exchangeRate || 4000;

  const payrolls = await prisma.payroll.findMany({
    where: { month, year },
    include: { employee: true },
    orderBy: { employee: { employeeId: 'asc' } },
  });

  let sumReliefKhr = 0;
  let sumGrossUsd = 0;
  let sumGrossKhr = 0;
  let sumPensionDeductKhr = 0;
  let sumTaxBaseKhr = 0;
  let sumTaxPayableKhr = 0;
  let sumTaxPayableUsd = 0;
  let sumNetUsd = 0;

  const rows = payrolls.map((p, idx) => {
    const emp = p.employee;
    const grossWageUsd = p.totalSalary || p.basicSalary || 0;
    const grossWageKhr = Math.round(grossWageUsd * exchangeRate);

    const hasSpouse = emp.spouse || emp.maritalStatus === 'MARRIED';
    const spouseReliefKhr = hasSpouse ? 150000 : 0;
    const childrenReliefKhr = (emp.numberOfChildren || 0) * 150000;
    const totalReliefKhr = spouseReliefKhr + childrenReliefKhr;

    const contributoryKhr = Math.min(1200000, Math.max(400000, grossWageKhr));
    const pensionDeductKhr = Math.round(contributoryKhr * 0.02);
    const taxBaseKhr = Math.max(0, grossWageKhr - totalReliefKhr - pensionDeductKhr);

    const { taxKhr, ratePercent } = computeTOST(taxBaseKhr, true);
    const taxUsd = Math.round((taxKhr / exchangeRate) * 100) / 100;
    const netPayUsd = p.netSalaryUsd || (grossWageUsd - taxUsd);

    sumReliefKhr += totalReliefKhr;
    sumGrossUsd += grossWageUsd;
    sumGrossKhr += grossWageKhr;
    sumPensionDeductKhr += pensionDeductKhr;
    sumTaxBaseKhr += taxBaseKhr;
    sumTaxPayableKhr += taxKhr;
    sumTaxPayableUsd += taxUsd;
    sumNetUsd += netPayUsd;

    return {
      no: idx + 1,
      empId: emp.employeeId,
      tinOrId: emp.nationalId || emp.bankCardNo || '-',
      nameKh: `${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.trim() || emp.firstNameEn,
      nameEn: `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim(),
      resident: 'និវាសនជន',
      marital: hasSpouse ? 'រៀបការ (Married)' : 'នៅលីវ (Single)',
      spouse: spouseReliefKhr > 0 ? `${spouseReliefKhr.toLocaleString()} ៛` : '-',
      children: childrenReliefKhr > 0 ? `${childrenReliefKhr.toLocaleString()} ៛` : '-',
      totalReliefKhr: `${totalReliefKhr.toLocaleString()} ៛`,
      grossWageUsd: `$${grossWageUsd.toFixed(2)}`,
      grossWageKhr: `${grossWageKhr.toLocaleString()} ៛`,
      pensionDeductKhr: `${pensionDeductKhr.toLocaleString()} ៛`,
      taxBaseKhr: `${taxBaseKhr.toLocaleString()} ៛`,
      taxRate: `${ratePercent}%`,
      taxPayableKhr: `${taxKhr.toLocaleString()} ៛`,
      taxPayableUsd: `$${taxUsd.toFixed(2)}`,
      netSalaryUsd: `$${netPayUsd.toFixed(2)}`,
    };
  });

  const grandTotalRow = {
    no: '',
    empId: '',
    tinOrId: '',
    nameKh: 'សរុបរួម (GRAND TOTAL • 总计)',
    nameEn: `GRAND TOTAL (${payrolls.length} Staff)`,
    resident: '',
    marital: '',
    spouse: '',
    children: '',
    totalReliefKhr: `${sumReliefKhr.toLocaleString()} ៛`,
    grossWageUsd: `$${sumGrossUsd.toFixed(2)}`,
    grossWageKhr: `${sumGrossKhr.toLocaleString()} ៛`,
    pensionDeductKhr: `${sumPensionDeductKhr.toLocaleString()} ៛`,
    taxBaseKhr: `${sumTaxBaseKhr.toLocaleString()} ៛`,
    taxRate: '',
    taxPayableKhr: `${sumTaxPayableKhr.toLocaleString()} ៛`,
    taxPayableUsd: `$${sumTaxPayableUsd.toFixed(2)}`,
    netSalaryUsd: `$${sumNetUsd.toFixed(2)}`,
  };

  return [...rows, grandTotalRow];
}

