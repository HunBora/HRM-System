'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createAdvanceRequest(formData: FormData) {
  const amountStr = formData.get('amount') as string;
  const amount = parseFloat(amountStr);
  
  await prisma.advanceSalary.create({
    data: {
      employeeId: formData.get('employeeId') as string,
      amount: isNaN(amount) ? 0 : amount,
      requestDate: new Date(formData.get('requestDate') as string),
      month: parseInt(formData.get('month') as string),
      year: parseInt(formData.get('year') as string),
      reason: formData.get('reason') as string,
      status: 'PENDING'
    }
  });

  revalidatePath('/dashboard/advance');
  redirect('/dashboard/advance');
}

export async function updateAdvanceStatus(id: string, status: string) {
  await prisma.advanceSalary.update({
    where: { id },
    data: { status }
  });

  revalidatePath('/dashboard/advance');
}

export async function deleteAdvanceRequest(id: string) {
  await prisma.advanceSalary.delete({
    where: { id }
  });
  revalidatePath('/dashboard/advance');
}
