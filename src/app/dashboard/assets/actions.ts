'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function createAsset(formData: FormData) {
  const session = await getSession();
  if (!session || !['ADMIN', 'HR_MANAGER', 'HR'].includes(session.role)) {
    return { error: 'គ្មានសិទ្ធិអនុម័ត!' };
  }

  const employeeIdStr = formData.get('employeeId') as string;
  const name = formData.get('name') as string;
  const serialNumber = formData.get('serialNumber') as string || null;
  const assignDate = formData.get('assignDate') as string;
  const status = formData.get('status') as string || 'IN_USE';
  const remarks = formData.get('remarks') as string || null;

  if (!employeeIdStr || !name || !assignDate) {
    return { error: 'សូមបំពេញព័ត៌មានដែលចាំបាច់ទាំងអស់!' };
  }

  await prisma.companyAsset.create({
    data: {
      employeeId: employeeIdStr,
      name,
      serialNumber,
      assignDate: new Date(assignDate),
      status,
      remarks,
    }
  });

  revalidatePath('/dashboard/assets');
  return { success: true };
}

export async function updateAssetStatus(id: string, newStatus: string) {
  const session = await getSession();
  if (!session || !['ADMIN', 'HR_MANAGER', 'HR'].includes(session.role)) {
    return { error: 'គ្មានសិទ្ធិអនុម័ត!' };
  }

  const updateData: any = { status: newStatus };
  
  if (newStatus === 'RETURNED') {
    updateData.returnDate = new Date();
  } else {
    updateData.returnDate = null;
  }

  await prisma.companyAsset.update({
    where: { id },
    data: updateData
  });

  revalidatePath('/dashboard/assets');
  return { success: true };
}

export async function deleteAsset(id: string) {
  const session = await getSession();
  if (!session || !['ADMIN', 'HR_MANAGER', 'HR'].includes(session.role)) {
    return { error: 'គ្មានសិទ្ធិអនុម័ត!' };
  }

  await prisma.companyAsset.delete({
    where: { id }
  });

  revalidatePath('/dashboard/assets');
  return { success: true };
}
