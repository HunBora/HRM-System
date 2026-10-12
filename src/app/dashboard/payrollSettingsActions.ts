'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updatePayrollDates(data: {
  payment1StartDate: number;
  payment1EndDate: number;
  payment2StartDate: number;
  payment2EndDate: number;
  exchangeRate?: number;
}) {
  const exchangeRate = data.exchangeRate ? Number(data.exchangeRate) : undefined;

  await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {
      payment1StartDate: data.payment1StartDate,
      payment1EndDate: data.payment1EndDate,
      payment2StartDate: data.payment2StartDate,
      payment2EndDate: data.payment2EndDate,
      ...(exchangeRate !== undefined ? { exchangeRate } : {})
    },
    create: {
      id: 'default',
      payment1StartDate: data.payment1StartDate,
      payment1EndDate: data.payment1EndDate,
      payment2StartDate: data.payment2StartDate,
      payment2EndDate: data.payment2EndDate,
      ...(exchangeRate !== undefined ? { exchangeRate } : {})
    }
  });
  
  revalidatePath('/dashboard', 'page');
  revalidatePath('/dashboard/payroll', 'page');
  revalidatePath('/dashboard/settings', 'page');
}
