'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// MOLVT Calculation logic
export async function calculateFinalSettlement(
  employeeId: string, 
  terminationDateStr: string, 
  reason: 'NO_OFFENSE' | 'SERIOUS_OFFENSE' | 'CLOSURE' | 'RESIGNATION',
  noticeGiven: boolean
) {
  const terminationDate = new Date(terminationDateStr);
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      advances: {
        where: { status: 'PENDING' }
      }
    }
  });

  if (!employee) throw new Error("Employee not found");

  const basicSalary = employee.basicSalary;
  const dailyRate = basicSalary / 26; 
  
  // Unpaid Wages
  const daysWorkedThisMonth = terminationDate.getDate();
  const unpaidWages = (basicSalary / 30) * daysWorkedThisMonth;
  
  // Annual Leave Pay
  const annualLeavePay = employee.annualLeaveDays * dailyRate;
  
  // Contract Type
  const contractType = employee.regularContract1 ? 'FDC' : 'UDC';

  let severancePay = 0;
  let noticePay = 0;
  let seniorityIndemnity = 0;
  let damagesPay = 0;

  // Deductions
  const unpaidAdvances = employee.advances.reduce((sum, adv) => sum + adv.amount, 0);

  if (reason === 'SERIOUS_OFFENSE') {
    // Only wages and annual leave
  } else if (contractType === 'FDC') {
    if (reason === 'NO_OFFENSE' || reason === 'CLOSURE' || reason === 'RESIGNATION') { 
      // Severance = 5% of total wages. Approximation: 5% of 1 year salary.
      severancePay = (basicSalary * 12) * 0.05; 
      
      if (reason === 'NO_OFFENSE') {
        // Damages = wages remaining. Approx 3 months.
        damagesPay = basicSalary * 3;
      }
    }
  } else {
    // UDC
    if (reason === 'NO_OFFENSE' || reason === 'CLOSURE') {
      if (!noticeGiven) {
        // Notice Pay: 1 month salary approx
        noticePay = basicSalary;
      }
      
      // Seniority Indemnity: 15 days per year
      seniorityIndemnity = 15 * dailyRate;
      
      if (reason === 'NO_OFFENSE') {
        // Damages = equal to seniority indemnity received
        damagesPay = seniorityIndemnity; 
      }
    }
  }

  const totalFinalPay = unpaidWages + annualLeavePay + severancePay + noticePay + seniorityIndemnity + damagesPay - unpaidAdvances;

  return {
    contractType,
    unpaidWages,
    annualLeavePay,
    severancePay,
    noticePay,
    seniorityIndemnity,
    damagesPay,
    unpaidAdvances,
    assetDeductions: 0,
    otherDeductions: 0,
    totalFinalPay
  };
}

export async function initiateTermination(data: any) {
  const result = await calculateFinalSettlement(data.employeeId, data.terminationDate, data.reason, data.noticeGiven);
  
  const termination = await prisma.termination.create({
    data: {
      employeeId: data.employeeId,
      terminationDate: new Date(data.terminationDate),
      contractType: result.contractType,
      reason: data.reason,
      noticeGiven: data.noticeGiven,
      unpaidWages: result.unpaidWages,
      annualLeavePay: result.annualLeavePay,
      severancePay: result.severancePay,
      noticePay: result.noticePay,
      seniorityIndemnity: result.seniorityIndemnity,
      damagesPay: result.damagesPay,
      unpaidAdvances: result.unpaidAdvances,
      totalFinalPay: result.totalFinalPay,
    }
  });
  
  revalidatePath('/dashboard/offboarding');
  return termination;
}

export async function approveTermination(id: string) {
  const termination = await prisma.termination.findUnique({ where: { id } });
  if (!termination) throw new Error("Not found");
  
  await prisma.$transaction([
    prisma.termination.update({
      where: { id },
      data: { status: 'APPROVED' }
    }),
    prisma.employee.update({
      where: { id: termination.employeeId },
      data: { status: 'TERMINATED' }
    })
  ]);
  
  revalidatePath('/dashboard/offboarding');
  return true;
}

export async function getTerminations() {
  return await prisma.termination.findMany({
    include: {
      employee: {
        select: {
          firstNameEn: true,
          lastNameEn: true,
          firstNameKh: true,
          lastNameKh: true,
          employeeId: true,
          department: true,
          position: true,
          hireDate: true,
          cardNo: true,
          nationalId: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getActiveEmployees() {
  return await prisma.employee.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      firstNameEn: true,
      lastNameEn: true,
      firstNameKh: true,
      lastNameKh: true,
      employeeId: true,
      department: true
    },
    orderBy: { firstNameEn: 'asc' }
  });
}
