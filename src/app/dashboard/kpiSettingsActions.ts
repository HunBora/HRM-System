'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getDepartmentGroups() {
  return await prisma.departmentGroup.findMany({
    orderBy: { orderIdx: 'asc' },
    select: { name: true }
  });
}

export async function getMasterKpis() {
  return await prisma.masterKpi.findMany({
    orderBy: [
      { department: 'asc' },
      { createdAt: 'desc' }
    ]
  });
}

export async function saveMasterKpi(data: { id?: string; department: string; kpiType: string; description: string }) {
  if (data.id) {
    await prisma.masterKpi.update({
      where: { id: data.id },
      data: {
        department: data.department,
        kpiType: data.kpiType,
        description: data.description,
      }
    });
  } else {
    await prisma.masterKpi.create({
      data: {
        department: data.department,
        kpiType: data.kpiType,
        description: data.description,
      }
    });
  }
  revalidatePath('/dashboard/settings', 'page');
}

export async function deleteMasterKpi(id: string) {
  await prisma.masterKpi.delete({
    where: { id }
  });
  revalidatePath('/dashboard/settings', 'page');
}
