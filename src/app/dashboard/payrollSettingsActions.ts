'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updatePayrollDates(data: {
  payment1StartDate: number;
  payment1EndDate: number;
  payment2StartDate: number;
  payment2EndDate: number;
}) {
  // Using executeRaw to bypass Prisma Client schema validation in case the dev server hasn't been restarted
  await prisma.$executeRaw`
    INSERT INTO CompanySettings (id, payment1StartDate, payment1EndDate, payment2StartDate, payment2EndDate, updatedAt)
    VALUES ('default', ${data.payment1StartDate}, ${data.payment1EndDate}, ${data.payment2StartDate}, ${data.payment2EndDate}, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      payment1StartDate = ${data.payment1StartDate},
      payment1EndDate = ${data.payment1EndDate},
      payment2StartDate = ${data.payment2StartDate},
      payment2EndDate = ${data.payment2EndDate},
      updatedAt = CURRENT_TIMESTAMP
  `;
  
  revalidatePath('/dashboard', 'page');
  revalidatePath('/dashboard/payroll', 'page');
}
