'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updatePayrollDates(data: {
  payment1StartDate: number;
  payment1EndDate: number;
  payment2StartDate: number;
  payment2EndDate: number;
  exchangeRate?: number;
  transportationAllowance?: number;
  attendanceBonus?: number;
  lunchAllowancePerDay?: number;
  otMealAllowance?: number;
  dayCareAllowancePerChild?: number;
  unionMonthlyFee?: number;
  unionDeductionPolicy?: string;
}) {
  const exchangeRate = data.exchangeRate !== undefined ? Number(data.exchangeRate) : undefined;
  const transportationAllowance = data.transportationAllowance !== undefined ? Number(data.transportationAllowance) : undefined;
  const attendanceBonus = data.attendanceBonus !== undefined ? Number(data.attendanceBonus) : undefined;
  const lunchAllowancePerDay = data.lunchAllowancePerDay !== undefined ? Number(data.lunchAllowancePerDay) : undefined;
  const otMealAllowance = data.otMealAllowance !== undefined ? Number(data.otMealAllowance) : undefined;
  const dayCareAllowancePerChild = data.dayCareAllowancePerChild !== undefined ? Number(data.dayCareAllowancePerChild) : undefined;
  const unionMonthlyFee = data.unionMonthlyFee !== undefined ? Number(data.unionMonthlyFee) : undefined;
  const unionDeductionPolicy = data.unionDeductionPolicy !== undefined ? String(data.unionDeductionPolicy) : undefined;

  await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {
      payment1StartDate: data.payment1StartDate,
      payment1EndDate: data.payment1EndDate,
      payment2StartDate: data.payment2StartDate,
      payment2EndDate: data.payment2EndDate,
      ...(exchangeRate !== undefined ? { exchangeRate } : {}),
      ...(transportationAllowance !== undefined ? { transportationAllowance } : {}),
      ...(attendanceBonus !== undefined ? { attendanceBonus } : {}),
      ...(lunchAllowancePerDay !== undefined ? { lunchAllowancePerDay } : {}),
      ...(otMealAllowance !== undefined ? { otMealAllowance } : {}),
      ...(dayCareAllowancePerChild !== undefined ? { dayCareAllowancePerChild } : {}),
      ...(unionMonthlyFee !== undefined ? { unionMonthlyFee } : {}),
      ...(unionDeductionPolicy !== undefined ? { unionDeductionPolicy } : {}),
    },
    create: {
      id: 'default',
      payment1StartDate: data.payment1StartDate,
      payment1EndDate: data.payment1EndDate,
      payment2StartDate: data.payment2StartDate,
      payment2EndDate: data.payment2EndDate,
      ...(exchangeRate !== undefined ? { exchangeRate } : {}),
      transportationAllowance: transportationAllowance ?? 7.0,
      attendanceBonus: attendanceBonus ?? 15.0,
      lunchAllowancePerDay: lunchAllowancePerDay ?? 0.50,
      otMealAllowance: otMealAllowance ?? 0.50,
      dayCareAllowancePerChild: dayCareAllowancePerChild ?? 0.0,
      unionMonthlyFee: unionMonthlyFee ?? 1.0,
      unionDeductionPolicy: unionDeductionPolicy ?? 'VOLUNTARY',
    }
  });
  
  revalidatePath('/dashboard', 'page');
  revalidatePath('/dashboard/payroll', 'page');
  revalidatePath('/dashboard/settings', 'page');
}
