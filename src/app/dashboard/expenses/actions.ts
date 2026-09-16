'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function submitExpenseClaim(formData: FormData) {
  const session = await getSession();
  if (!session?.employeeId) {
    return { error: 'មិនអាចស្វែងរកទិន្នន័យបុគ្គលិករបស់អ្នកបានទេ!' };
  }

  const date = formData.get('date') as string;
  const category = formData.get('category') as string;
  const amountStr = formData.get('amount') as string;
  const currency = formData.get('currency') as string || 'USD';
  const description = formData.get('description') as string;
  const receiptUrl = formData.get('receiptUrl') as string || '';

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: 'ចំនួនទឹកប្រាក់មិនត្រឹមត្រូវ!' };
  }

  await prisma.expenseClaim.create({
    data: {
      employeeId: session.employeeId,
      date: new Date(date),
      category,
      amount,
      currency,
      description,
      receiptUrl,
      status: 'PENDING'
    }
  });

  revalidatePath('/dashboard/expenses');
  return { success: true };
}

export async function updateExpenseStatus(id: string, newStatus: string) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  // Only DEPT_HEAD, HR, ADMIN, PAYROLL_ADMIN can update status
  if (['EMPLOYEE'].includes(session.role)) {
    return { error: 'គ្មានសិទ្ធិអនុម័ត!' };
  }

  await prisma.expenseClaim.update({
    where: { id },
    data: { status: newStatus }
  });

  revalidatePath('/dashboard/expenses');
  return { success: true };
}
