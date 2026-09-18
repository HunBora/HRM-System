'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function createAsset(formData: FormData) {
  const session = await getSession();
  if (!session || !['ADMIN', 'HR_MANAGER', 'HR'].includes(session.role)) {
    return { error: 'គ្មានសិទ្ធិអនុម័ត!' };
  }

  const employeeIdStr = formData.get('employeeId') as string || null;
  const name = formData.get('name') as string;
  const serialNumber = formData.get('serialNumber') as string || null;
  const assignDate = formData.get('assignDate') as string;
  const status = formData.get('status') as string || 'IN_USE';
  const remarks = formData.get('remarks') as string || null;
  const assetCode = formData.get('assetCode') as string || null;
  const itemType = formData.get('itemType') as string || null;
  const description = formData.get('description') as string || null;
  const uom = formData.get('uom') as string || 'Unit';
  const qtyInList = parseInt(formData.get('qtyInList') as string) || 1;
  const counting = formData.get('counting') ? parseInt(formData.get('counting') as string) : null;
  const variance = formData.get('variance') ? parseInt(formData.get('variance') as string) : null;
  const quality = formData.get('quality') as string || null;

  if (!name || !assignDate) {
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
      assetCode,
      itemType,
      description,
      uom,
      qtyInList,
      counting,
      variance,
      quality,
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
