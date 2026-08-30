'use server'

import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import path from 'path'
import { revalidatePath } from 'next/cache'

export async function updateSettings(formData: FormData) {
  const companyName = formData.get('companyName') as string;
  const logo = formData.get('logo') as File | null;
  
  const shiftMornIn = formData.get('shiftMornIn') as string;
  const shiftMornOut = formData.get('shiftMornOut') as string;
  const shiftAftIn = formData.get('shiftAftIn') as string;
  const shiftAftOut = formData.get('shiftAftOut') as string;
  const nightShiftMornIn = formData.get('nightShiftMornIn') as string;
  const nightShiftMornOut = formData.get('nightShiftMornOut') as string;
  const nightShiftAftIn = formData.get('nightShiftAftIn') as string;
  const nightShiftAftOut = formData.get('nightShiftAftOut') as string;
  const nightOtStart = formData.get('nightOtStart') as string;
  const telegramBotToken = formData.get('telegramBotToken') as string;
  const telegramChatId = formData.get('telegramChatId') as string;
  const contactPhone = formData.get('contactPhone') as string;
  const telegramLink = formData.get('telegramLink') as string;
  const telegramQrUrl = formData.get('telegramQrUrl') as string;
  
  let logoUrl = undefined;
  
  if (logo && logo.size > 0) {
    const bytes = await logo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const filename = `${Date.now()}-${logo.name.replace(/\s+/g, '-')}`;
    const filepath = path.join(process.cwd(), 'public/uploads', filename);
    await writeFile(filepath, buffer);
    logoUrl = `/uploads/${filename}`;
  }
  
  const data = {
    companyName,
    shiftMornIn,
    shiftMornOut,
    shiftAftIn,
    shiftAftOut,
    nightShiftMornIn,
    nightShiftMornOut,
    nightShiftAftIn,
    nightShiftAftOut,
    nightOtStart,
    telegramBotToken,
    telegramChatId,
    contactPhone,
    telegramLink,
    telegramQrUrl,
    ...(logoUrl ? { logoUrl } : {})
  };

  await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: data,
    create: {
      id: 'default',
      ...data
    }
  });
  
  revalidatePath('/', 'layout');
}
