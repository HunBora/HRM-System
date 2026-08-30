'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createMasterKpi(formData: FormData) {
  const department = formData.get('department') as string;
  const kpiType = formData.get('kpiType') as string;
  const description = formData.get('description') as string;

  if (!department || !kpiType) {
    return { error: 'Department and KPI Type are required.' };
  }

  try {
    await prisma.masterKpi.create({
      data: {
        department,
        kpiType,
        description,
      },
    });

    revalidatePath('/dashboard/kpi/master');
    revalidatePath('/dashboard/kpi/setting');
    return { success: true };
  } catch (error) {
    console.error('Error creating Master KPI:', error);
    return { error: 'Failed to create Master KPI.' };
  }
}

export async function deleteMasterKpi(id: string) {
  try {
    await prisma.masterKpi.delete({
      where: { id },
    });
    revalidatePath('/dashboard/kpi/master');
    revalidatePath('/dashboard/kpi/setting');
    return { success: true };
  } catch (error) {
    console.error('Error deleting Master KPI:', error);
    return { error: 'Failed to delete Master KPI.' };
  }
}
