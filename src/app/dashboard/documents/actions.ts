'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createDocument(data: { title: string, category: string, description?: string, fileData?: string, fileUrl?: string }) {
  await prisma.document.create({
    data
  });
  revalidatePath('/dashboard/documents');
}

export async function updateDocument(id: string, data: { title: string, category: string, description?: string, fileData?: string, fileUrl?: string }) {
  await prisma.document.update({
    where: { id },
    data
  });
  revalidatePath('/dashboard/documents');
}

export async function deleteDocument(id: string) {
  await prisma.document.delete({
    where: { id }
  });
  revalidatePath('/dashboard/documents');
}
