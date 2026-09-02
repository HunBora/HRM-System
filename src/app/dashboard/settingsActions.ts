'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateAdvanceSalarySettings(data: {
  advanceMaxLimit: number;
  advanceEligibilityMonths: number;
  advanceRepaymentPolicy: string;
}) {
  // Use raw query in case schema is not yet migrated on DB
  // This will try to update the fields, but note that the table must have these columns
  await prisma.$executeRaw`
    INSERT INTO CompanySettings (id, advanceMaxLimit, advanceEligibilityMonths, advanceRepaymentPolicy, updatedAt)
    VALUES ('default', ${data.advanceMaxLimit}, ${data.advanceEligibilityMonths}, ${data.advanceRepaymentPolicy}, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      advanceMaxLimit = ${data.advanceMaxLimit},
      advanceEligibilityMonths = ${data.advanceEligibilityMonths},
      advanceRepaymentPolicy = ${data.advanceRepaymentPolicy},
      updatedAt = CURRENT_TIMESTAMP
  `;
  
  revalidatePath('/dashboard', 'page');
  revalidatePath('/dashboard/settings', 'page');
}
