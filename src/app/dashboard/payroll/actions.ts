'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function generatePayroll(month: number, year: number) {
  try {
    const employees = await prisma.employee.findMany();
    
    // Create draft payrolls for all employees who don't have one for this month
    for (const emp of employees) {
      const existing = await prisma.payroll.findUnique({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month,
            year
          }
        }
      });
      
      if (!existing || existing.status === 'DRAFT') {
        // 1. Check MonthlyAttendance or calculate from DailyAttendance
        const attendance = await prisma.monthlyAttendance.findUnique({
          where: { employeeId_month_year: { employeeId: emp.id, month, year } }
        });

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const dailyRecords = await prisma.dailyAttendance.findMany({
          where: {
            employeeId: emp.id,
            date: { gte: startDate, lte: endDate }
          }
        });

        let workingDays = 26;
        let absentDays = 0;
        let leaveDays = 0;
        let otHours = 0;
        let sunOtHours = 0;
        let nightOtHours = 0;

        if (dailyRecords.length > 0) {
          const sumRegDays = dailyRecords.reduce((sum, r) => sum + (r.regDay || 0), 0);
          workingDays = sumRegDays > 0 ? sumRegDays : dailyRecords.length;
          otHours = dailyRecords.reduce((sum, r) => sum + (r.normalOtHrs || 0), 0);
          nightOtHours = dailyRecords.reduce((sum, r) => sum + (r.nightOtHrs || 0), 0);
          sunOtHours = dailyRecords.reduce((sum, r) => sum + (r.holidayOtHrs || 0), 0);
          absentDays = Math.max(0, 26 - workingDays);

          // Keep MonthlyAttendance table in sync with daily records
          await prisma.monthlyAttendance.upsert({
            where: { employeeId_month_year: { employeeId: emp.id, month, year } },
            update: { daysWorked: workingDays, absentDays, leaveDays, otHours },
            create: { employeeId: emp.id, month, year, daysWorked: workingDays, absentDays, leaveDays, otHours }
          });
        } else if (attendance) {
          workingDays = attendance.daysWorked;
          absentDays = attendance.absentDays;
          leaveDays = attendance.leaveDays;
          otHours = attendance.otHours;
        }

        const basicSalary = emp.basicSalary || 0;
        
        // --- 2025 Salary Calculation Formulas (Cambodian Labor Law Standard) ---
        const dailyRate = basicSalary / 26;
        const hourlyRate = dailyRate / 8;

        const workingSalary = dailyRate * workingDays;

        // OT Calculations
        const otWage = hourlyRate * 1.5 * otHours; // 150% for Normal Overtime
        const sunOtWage = hourlyRate * 2.0 * sunOtHours; // 200% for Sunday/Holiday Overtime
        const nightOtWage = hourlyRate * 2.0 * nightOtHours; // 200% for Night Overtime

        // Allowances & Incentives
        const lunchAllowance = workingDays * 0.50; // 2000៛ ($0.50) per working day
        const otMealAllowance = (otHours + sunOtHours + nightOtHours) >= 2 ? 0.50 : 0; // Meal allowance if total OT >= 2 hrs
        const transportation = 7; // Fixed $7 transportation allowance
        const attendanceBonus = absentDays > 0 ? 0 : 15; // $15 bonus if no unexcused absences
        
        const payScaleIncentive = emp.positionAllowance1 || 0; // Connect to employee position allowance
        const adjustmentSkill = emp.skillAllowance1 || 0; // Connect to employee skill allowance
        const annualLeaveAmount = 0;
        const dayCareAllowance = 0;
        const seniority = 0;
        const seniorityIndemnity = 0;
        const productionIncentive = 0;
        const otherAllowance = 0;
        const otherAllowanceDesc = '';

        const totalSalary = workingSalary + payScaleIncentive + otWage + sunOtWage + nightOtWage 
                          + annualLeaveAmount + attendanceBonus + transportation + lunchAllowance 
                          + otMealAllowance + dayCareAllowance + seniority + seniorityIndemnity 
                          + productionIncentive + adjustmentSkill + otherAllowance;

        const severancePay = totalSalary * 0.05; // 5% Severance Pay
        
        // Find approved and previously deducted advances for this month
        const advances = await prisma.advanceSalary.findMany({
          where: { 
            employeeId: emp.id, 
            month, 
            year, 
            status: { in: ['APPROVED', 'DEDUCTED'] } 
          }
        });
        
        const totalAdvance = advances.reduce((sum, adv) => sum + adv.amount, 0);

        // NSSF Calculation: 2% of contributory wage (max capped at $300 = $6.00 deduction) if registered
        const nssf = emp.nssfNo && basicSalary > 0 ? Math.min(basicSalary, 300) * 0.02 : 0; 
        const taxPayment = 0; 
        const unionDeduction = 0;
        const loanPension = totalAdvance;
        const basicSalary1 = emp.basicSalary1 || 0;
        
        const netSalaryUsd = totalSalary + severancePay - loanPension - nssf - taxPayment - unionDeduction - basicSalary1;
        const exchangeRate = 4000;
        
        // Auto-calculate Paid USD and Riel based on Factory Logic
        let paidSalaryUsd = 0;
        let netSalaryRiel = 0;
        
        if (netSalaryUsd > 0) {
          paidSalaryUsd = Math.floor(netSalaryUsd / 10) * 10;
          let remainder = netSalaryUsd - paidSalaryUsd;
          
          // If remainder is less than $7.50, subtract another $10 to ensure enough Riel
          if (remainder < 7.50 && paidSalaryUsd > 0) {
            paidSalaryUsd -= 10;
            remainder = netSalaryUsd - paidSalaryUsd;
          }
          
          netSalaryRiel = remainder * exchangeRate;
          netSalaryRiel = Math.floor(netSalaryRiel / 100) * 100; // Round down to 100 Riel
        }

        const r2 = (num: number) => parseFloat(num.toFixed(2));
        
        const dataToSave = {
          workingDays, 
          workingSalary: r2(workingSalary), 
          basicSalary: r2(basicSalary),
          otHours, 
          otWage: r2(otWage), 
          sunOtHours, 
          sunOtWage: r2(sunOtWage), 
          nightOtHours, 
          nightOtWage: r2(nightOtWage),
          lunchAllowance: r2(lunchAllowance), 
          otMealAllowance: r2(otMealAllowance), 
          transportation: r2(transportation), 
          attendanceBonus: r2(attendanceBonus),
          payScaleIncentive: r2(payScaleIncentive), 
          annualLeaveAmount: r2(annualLeaveAmount), 
          dayCareAllowance: r2(dayCareAllowance),
          seniority: r2(seniority), 
          seniorityIndemnity: r2(seniorityIndemnity), 
          productionIncentive: r2(productionIncentive), 
          adjustmentSkill: r2(adjustmentSkill),
          otherAllowance: r2(otherAllowance),
          otherAllowanceDesc,
          totalSalary: r2(totalSalary), 
          severancePay: r2(severancePay), 
          loanPension: r2(loanPension), 
          nssf: r2(nssf), 
          taxPayment: r2(taxPayment), 
          unionDeduction: r2(unionDeduction),
          netSalaryUsd: r2(netSalaryUsd),
          paidSalaryUsd: r2(paidSalaryUsd),
          netSalaryRiel: r2(netSalaryRiel), 
          exchangeRate
        };

        if (existing) {
          await prisma.payroll.update({
            where: { id: existing.id },
            data: dataToSave
          });
        } else {
          await prisma.payroll.create({
            data: {
              employeeId: emp.id,
              month, year,
              ...dataToSave,
              status: 'DRAFT',
            }
          });
        }

        // Update advances to DEDUCTED
        for (const adv of advances) {
          await prisma.advanceSalary.update({
            where: { id: adv.id },
            data: { status: 'DEDUCTED' }
          });
        }
      }
    }
    
    revalidatePath('/dashboard/payroll');
    return { success: true };
  } catch (error) {
    console.error('Error generating payroll:', error);
    return { success: false, error: 'Failed to generate payroll' };
  }
}

export async function updatePayrollRecord(id: string, data: any) {
  try {
    const updated = await prisma.payroll.update({
      where: { id },
      data,
    });
    revalidatePath('/dashboard/payroll');
    revalidatePath(`/dashboard/payroll/${id}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error updating payroll:', error);
    return { success: false, error: 'Failed to update payroll' };
  }
}
