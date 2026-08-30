'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateAboutSettings(data: { contactPhone?: string, telegramLink?: string, telegramQrUrl?: string }) {
  await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: data,
    create: {
      id: 'default',
      ...data
    }
  });
  
  revalidatePath('/dashboard/about');
}
