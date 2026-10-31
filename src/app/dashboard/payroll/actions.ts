'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { calculateDayAttendanceMetrics } from '@/lib/attendanceCalculator';
import { calculateNssf } from '@/lib/nssf';

export async function generatePayroll(month: number, year: number) {
  try {
    const [employees, companySettings] = await Promise.all([
      prisma.employee.findMany(),
      prisma.companySettings.findUnique({ where: { id: 'default' } })
    ]);
    const defaultExchangeRate = companySettings?.exchangeRate || 4000;
    
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
        const [dailyRecords, approvedOtRequests, approvedLeaveRequests] = await Promise.all([
          prisma.dailyAttendance.findMany({
            where: {
              employeeId: emp.id,
              date: { gte: startDate, lte: endDate }
            }
          }),
          prisma.overtimeRequest.findMany({
            where: {
              employeeId: emp.id,
              status: 'APPROVED',
              otDate: { gte: startDate, lte: endDate }
            }
          }),
          prisma.leaveRequest.findMany({
            where: {
              employeeId: emp.id,
              status: 'APPROVED',
              startDate: { lte: endDate },
              endDate: { gte: startDate }
            }
          })
        ]);

        const HOLIDAYS: Record<string, string> = {
          '1-1': 'ទិវាចូលឆ្នាំសកល',
          '1-7': 'ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍',
          '3-8': 'ទិវានារីអន្តរជាតិ',
          '4-14': 'បុណ្យចូលឆ្នាំខ្មែរ',
          '4-15': 'បុណ្យចូលឆ្នាំខ្មែរ',
          '4-16': 'បុណ្យចូលឆ្នាំខ្មែរ',
          '5-1': 'ទិវាពលកម្មអន្តរជាតិ',
          '5-14': 'ព្រះរាជពិធីចម្រើនព្រះជន្ម ព្រះមហាក្សត្រ',
          '5-31': 'ពិធីបុណ្យវិសាខបូជា', 
          '6-4': 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល',
          '9-24': 'ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ',
          '10-9': 'ពិធីបុណ្យភ្ជុំបិណ្ឌ',
          '10-10': 'ពិធីបុណ្យភ្ជុំបិណ្ឌ',
          '10-11': 'ពិធីបុណ្យភ្ជុំបិណ្ឌ',
          '10-15': 'ទិវាប្រារព្ធព្រះបរមរតនកោដ្ឋ',
          '10-29': 'ព្រះរាជពិធីគ្រងព្រះបរមរាជសម្បត្តិ',
          '11-9': 'ទិវាបុណ្យឯករាជ្យជាតិ',
          '11-23': 'ព្រះរាជពិធីបុណ្យអុំទូក',
          '11-24': 'ព្រះរាជពិធីបុណ្យអុំទូក',
          '11-25': 'ព្រះរាជពិធីបុណ្យអុំទូក',
        };

        let workingDays = 26;
        let absentDays = 0;
        let leaveDays = 0;
        let otHours = 0;
        let sunOtHours = 0;
        let nightOtHours = 0;
        let otDaysWithMeal = 0;

        if (dailyRecords.length > 0) {
          let sumRegDays = 0;
          let sumNormOt = 0;
          let sumNightOt = 0;
          let sumHolidayOt = 0;

          for (const r of dailyRecords) {
            let rNormalOt = r.normalOtHrs || 0;
            let rNightOt = r.nightOtHrs || 0;
            let rHolidayOt = r.holidayOtHrs || 0;
            let rRegDay = (r.regDay !== undefined && r.regDay !== null) ? r.regDay : 0;

            const rDate = new Date(r.date);
            const isSunday = rDate.getDay() === 0;
            const isHoliday = !!HOLIDAYS[`${rDate.getMonth() + 1}-${rDate.getDate()}`];
            const isOffDay = isSunday || isHoliday;

            // Auto-calculate from punch timestamps if metrics are missing/0
            if (rNormalOt === 0 && rNightOt === 0 && rHolidayOt === 0 && ((r.otIn && r.otOut) || (r.sOut && r.sOut > '17:00'))) {
              const metrics = calculateDayAttendanceMetrics(r.fIn, r.fOut, r.sIn, r.sOut, r.otIn, r.otOut, isOffDay);
              rNormalOt = metrics.normalOtHrs;
              rNightOt = metrics.nightOtHrs;
              rHolidayOt = metrics.holidayOtHrs;
              if (rRegDay === 0 && metrics.regDay > 0) rRegDay = metrics.regDay;

              // Save to database so dailyAttendance record is permanently accurate
              await prisma.dailyAttendance.update({
                where: { id: r.id },
                data: {
                  normalOtHrs: rNormalOt,
                  nightOtHrs: rNightOt,
                  holidayOtHrs: rHolidayOt,
                  lateMins: r.lateMins > 0 ? r.lateMins : metrics.lateMins,
                  earlyMins: r.earlyMins > 0 ? r.earlyMins : metrics.earlyMins,
                  workHrs: r.workHrs > 0 ? r.workHrs : metrics.workHrs,
                  regDay: rRegDay,
                }
              });
            }

            sumRegDays += rRegDay;
            sumNormOt += rNormalOt;
            sumNightOt += rNightOt;
            sumHolidayOt += rHolidayOt;

            const dayTotalOt = rNormalOt + rNightOt + rHolidayOt;
            if (dayTotalOt >= 2) otDaysWithMeal++;
          }

          workingDays = sumRegDays > 0 ? sumRegDays : dailyRecords.length;
          otHours = sumNormOt;
          nightOtHours = sumNightOt;
          sunOtHours = sumHolidayOt;
          absentDays = Math.max(0, 26 - workingDays);
        } else if (attendance) {
          workingDays = attendance.daysWorked;
          absentDays = attendance.absentDays;
          leaveDays = attendance.leaveDays;
          otHours = attendance.otHours;
        }

        // Merge approved Overtime Requests if any exist (avoid double counting if punches already recorded on same day)
        approvedOtRequests.forEach((ot) => {
          const otDate = new Date(ot.otDate);
          const hasPunchedOnDate = dailyRecords.some((r) => {
            const rd = new Date(r.date);
            return rd.getFullYear() === otDate.getFullYear() &&
                   rd.getMonth() === otDate.getMonth() &&
                   rd.getDate() === otDate.getDate() &&
                   ((r.normalOtHrs || 0) > 0 || (r.nightOtHrs || 0) > 0 || (r.holidayOtHrs || 0) > 0 || (r.otIn && r.otOut));
          });

          if (!hasPunchedOnDate) {
            if (ot.otType === 'NIGHT_OT') {
              nightOtHours += ot.totalHours;
            } else if (ot.otType === 'SUNDAY_OT' || ot.otType === 'HOLIDAY_OT') {
              sunOtHours += ot.totalHours;
            } else {
              otHours += ot.totalHours;
            }
            if (ot.totalHours >= 2) otDaysWithMeal++;
          }
        });

        // Merge approved Leave Requests if any exist
        const reqLeaveDays = approvedLeaveRequests.reduce((sum, lv) => sum + (lv.duration || 1), 0);
        leaveDays += reqLeaveDays;

        // Keep MonthlyAttendance table in sync
        await prisma.monthlyAttendance.upsert({
          where: { employeeId_month_year: { employeeId: emp.id, month, year } },
          update: { daysWorked: workingDays, absentDays, leaveDays, otHours },
          create: { employeeId: emp.id, month, year, daysWorked: workingDays, absentDays, leaveDays, otHours }
        });

        const basicSalary = emp.basicSalary || 0;
        
        // --- 2025 Salary Calculation Formulas (Cambodian Labor Law Standard) ---
        const dailyRate = basicSalary / 26;
        const hourlyRate = dailyRate / 8;

        const workingSalary = dailyRate * workingDays;

        // OT Calculations
        const otWage = hourlyRate * 1.5 * otHours; // 150% for Normal Overtime
        const sunOtWage = hourlyRate * 2.0 * sunOtHours; // 200% for Sunday/Holiday Overtime
        const nightOtWage = hourlyRate * 2.0 * nightOtHours; // 200% for Night Overtime

        // Allowances & Incentives configured dynamically by the company/factory
        const lunchRate = companySettings?.lunchAllowancePerDay ?? 0.50;
        const lunchAllowance = workingDays * lunchRate;
        
        const otMealRate = companySettings?.otMealAllowance ?? 0.50;
        const otMealAllowance = otDaysWithMeal > 0 ? otDaysWithMeal * otMealRate : 0;
        
        const transportation = companySettings?.transportationAllowance ?? 7.0;
        
        const attBonusSetting = companySettings?.attendanceBonus ?? 15.0;
        const attendanceBonus = absentDays > 0 ? 0 : attBonusSetting;
        
        const payScaleIncentive = emp.positionAllowance1 || 0; // Connect to employee position allowance
        const adjustmentSkill = emp.skillAllowance1 || 0; // Connect to employee skill allowance
        const annualLeaveAmount = 0;
        
        const dayCareRate = companySettings?.dayCareAllowancePerChild ?? 0.0;
        const dayCareAllowance = (emp.numberOfChildren || 0) * dayCareRate;
        // Seniority Allowance ($2 - $11/mo): based on full years from hireDate (Cambodian Labor Standard)
        let seniority = 0;
        if (emp.hireDate) {
          const hire = new Date(emp.hireDate);
          const targetDate = new Date(year, month - 1, 1);
          const diffMonths = (targetDate.getFullYear() - hire.getFullYear()) * 12 + (targetDate.getMonth() - hire.getMonth());
          const fullYears = Math.floor(diffMonths / 12);
          if (fullYears >= 1) {
            seniority = Math.min(fullYears + 1, 11); // 1yr=$2, 2yr=$3, ..., 10+yr=$11
          }
        }

        // Seniority Indemnity (UDC 15 days/year: 7.5 days in June [month 6] and December [month 12] - New Article 89 & Prakas 442/18)
        let seniorityIndemnity = 0;
        const isSeniorityMonth = month === 6 || month === 12;
        const isUdc = !emp.regularContract1;
        if (isSeniorityMonth && isUdc && workingDays >= 21) {
          seniorityIndemnity = dailyRate * 7.5;
        }
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

        const exchangeRate = defaultExchangeRate;

        // NSSF Contribution: 2% of contributory wage based on Cambodian Law
        // - Prior to Nov 2026: Min 400,000 KHR ($100), Ceiling 1,200,000 KHR ($300) -> Max $6.00
        // - From Nov 2026 onwards (Prakas 234/26 & Notice 3134/26): Min 600,000 KHR ($150), Ceiling 1,500,000 KHR ($375) -> Max $7.50
        const nssf = calculateNssf(basicSalary, !!emp.nssfNo, month, year, exchangeRate);
        const taxPayment = 0; 
        const unionDeduction = 0;
        const loanPension = totalAdvance;
        
        const netSalaryUsd = totalSalary + severancePay - loanPension - nssf - taxPayment - unionDeduction;
        
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
          absentDays: r2(absentDays),
          permissionDays: r2(leaveDays),
          workingSalary: r2(workingSalary), 
          basicSalary: r2(basicSalary),
          basicPayScale: r2(emp.basicSalary1 || 0),
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

export async function updateExchangeRateAndRecalculate(newRate: number, month?: number, year?: number) {
  try {
    const rate = Math.max(1000, Number(newRate) || 4000);
    // 1. Update company settings
    await prisma.companySettings.upsert({
      where: { id: 'default' },
      update: { exchangeRate: rate },
      create: { id: 'default', exchangeRate: rate }
    });

    // 2. If month and year provided, update all DRAFT payrolls for that month/year
    const whereClause: any = { status: 'DRAFT' };
    if (month && year) {
      whereClause.month = month;
      whereClause.year = year;
    }

    const draftPayrolls = await prisma.payroll.findMany({ where: whereClause });
    for (const p of draftPayrolls) {
      const netSalaryUsd = p.netSalaryUsd;
      let paidSalaryUsd = 0;
      let netSalaryRiel = 0;
      if (netSalaryUsd > 0) {
        paidSalaryUsd = Math.floor(netSalaryUsd / 10) * 10;
        let remainder = netSalaryUsd - paidSalaryUsd;
        if (remainder < 7.50 && paidSalaryUsd > 0) {
          paidSalaryUsd -= 10;
          remainder = netSalaryUsd - paidSalaryUsd;
        }
        netSalaryRiel = remainder * rate;
        netSalaryRiel = Math.floor(netSalaryRiel / 100) * 100;
      }
      await prisma.payroll.update({
        where: { id: p.id },
        data: {
          exchangeRate: rate,
          paidSalaryUsd,
          netSalaryRiel
        }
      });
    }

    revalidatePath('/dashboard/payroll');
    revalidatePath('/dashboard/settings');
    return { success: true, count: draftPayrolls.length, rate };
  } catch (err: any) {
    console.error('Error updating exchange rate:', err);
    return { success: false, error: err.message };
  }
}

export async function recalculateDraftsWithNewAllowances(month?: number, year?: number) {
  try {
    const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    const exchangeRate = settings?.exchangeRate || 4000;
    const lunchRate = settings?.lunchAllowancePerDay ?? 0.50;
    const otMealRate = settings?.otMealAllowance ?? 0.50;
    const transpRate = settings?.transportationAllowance ?? 7.0;
    const attBonusRate = settings?.attendanceBonus ?? 15.0;
    const dayCareRate = settings?.dayCareAllowancePerChild ?? 0.0;

    const whereClause: any = { status: 'DRAFT' };
    if (month && year) {
      whereClause.month = month;
      whereClause.year = year;
    }

    const draftPayrolls = await prisma.payroll.findMany({
      where: whereClause,
      include: { employee: true }
    });

    const r2 = (num: number) => Math.round(num * 100) / 100;

    for (const p of draftPayrolls) {
      const emp = p.employee;
      const workingDays = p.workingDays;
      const absentDays = p.absentDays;

      // Re-calculate allowances based on new company settings
      const lunchAllowance = r2(workingDays * lunchRate);
      const otMealAllowance = p.otMealAllowance > 0 && otMealRate > 0 ? r2((p.otMealAllowance / 0.50) * otMealRate) : p.otMealAllowance;
      const transportation = r2(transpRate);
      const attendanceBonus = absentDays > 0 ? 0 : r2(attBonusRate);
      const dayCareAllowance = r2((emp.numberOfChildren || 0) * dayCareRate);

      // Re-calculate total salary
      const totalSalary = r2(
        p.workingSalary + p.payScaleIncentive + p.otWage + p.sunOtWage + p.nightOtWage
        + p.annualLeaveAmount + attendanceBonus + transportation + lunchAllowance
        + otMealAllowance + dayCareAllowance + p.seniority + p.seniorityIndemnity
        + p.productionIncentive + p.adjustmentSkill + (p.otherAllowance || 0)
      );

      const severancePay = r2(totalSalary * 0.05);

      // Re-calculate NSSF according to statutory floor & ceiling for this month/year
      const nssf = calculateNssf(p.basicSalary, !!emp.nssfNo, p.month, p.year, exchangeRate);

      const netSalaryUsd = r2(
        totalSalary + severancePay - (p.loanPension || 0) - nssf - (p.taxPayment || 0) - (p.unionDeduction || 0)
      );

      // Currency split
      let paidSalaryUsd = 0;
      let netSalaryRiel = 0;
      if (netSalaryUsd > 0) {
        paidSalaryUsd = Math.floor(netSalaryUsd / 10) * 10;
        let remainder = netSalaryUsd - paidSalaryUsd;
        if (remainder < 7.50 && paidSalaryUsd > 0) {
          paidSalaryUsd -= 10;
          remainder = netSalaryUsd - paidSalaryUsd;
        }
        netSalaryRiel = remainder * exchangeRate;
        netSalaryRiel = Math.floor(netSalaryRiel / 100) * 100;
      }

      await prisma.payroll.update({
        where: { id: p.id },
        data: {
          lunchAllowance,
          otMealAllowance,
          transportation,
          attendanceBonus,
          dayCareAllowance,
          totalSalary,
          severancePay,
          nssf,
          basicPayScale: emp.basicSalary1 || p.basicPayScale || 0,
          netSalaryUsd,
          paidSalaryUsd,
          netSalaryRiel,
        }
      });
    }

    revalidatePath('/dashboard/payroll');
    revalidatePath('/dashboard/settings');
    return { success: true, count: draftPayrolls.length };
  } catch (error: any) {
    console.error('Failed to recalculate draft allowances:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Recalculate NSSF and re-split currency for draft payrolls based on latest NSSF Prakas 234/26
 */
export async function recalculateNssfOnDrafts(month?: number, year?: number) {
  try {
    const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    const exchangeRate = settings?.exchangeRate || 4000;

    const whereClause: any = { status: 'DRAFT' };
    if (month && year) {
      whereClause.month = month;
      whereClause.year = year;
    }

    const draftPayrolls = await prisma.payroll.findMany({
      where: whereClause,
      include: { employee: true }
    });

    const r2 = (num: number) => Math.round(num * 100) / 100;

    for (const p of draftPayrolls) {
      const emp = p.employee;
      const nssf = calculateNssf(p.basicSalary, !!emp.nssfNo, p.month, p.year, exchangeRate);

      const totalSalary = p.totalSalary;
      const severancePay = p.severancePay;
      const netSalaryUsd = r2(
        totalSalary + severancePay - (p.loanPension || 0) - nssf - (p.taxPayment || 0) - (p.unionDeduction || 0)
      );

      let paidSalaryUsd = 0;
      let netSalaryRiel = 0;
      if (netSalaryUsd > 0) {
        paidSalaryUsd = Math.floor(netSalaryUsd / 10) * 10;
        let remainder = netSalaryUsd - paidSalaryUsd;
        if (remainder < 7.50 && paidSalaryUsd > 0) {
          paidSalaryUsd -= 10;
          remainder = netSalaryUsd - paidSalaryUsd;
        }
        netSalaryRiel = remainder * exchangeRate;
        netSalaryRiel = Math.floor(netSalaryRiel / 100) * 100;
      }

      await prisma.payroll.update({
        where: { id: p.id },
        data: {
          nssf,
          netSalaryUsd,
          paidSalaryUsd,
          netSalaryRiel,
        }
      });
    }

    revalidatePath('/dashboard/payroll');
    revalidatePath('/dashboard/settings');
    return { success: true, count: draftPayrolls.length };
  } catch (error: any) {
    console.error('Failed to recalculate NSSF on drafts:', error);
    return { success: false, error: error.message };
  }
}
