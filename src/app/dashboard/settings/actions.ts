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
  const exchangeRateRaw = formData.get('exchangeRate') as string;
  const exchangeRate = exchangeRateRaw ? parseFloat(exchangeRateRaw) : 4000;
  
  const companyLatRaw = formData.get('companyLat') as string;
  const companyLngRaw = formData.get('companyLng') as string;
  const geoRadiusMetersRaw = formData.get('geoRadiusMeters') as string;
  const geoFenceEnabledRaw = formData.get('geoFenceEnabled') as string;

  const companyLat = companyLatRaw ? parseFloat(companyLatRaw) : 11.5564;
  const companyLng = companyLngRaw ? parseFloat(companyLngRaw) : 104.9282;
  const geoRadiusMeters = geoRadiusMetersRaw ? parseFloat(geoRadiusMetersRaw) : 500.0;
  const geoFenceEnabled = geoFenceEnabledRaw === 'true' || geoFenceEnabledRaw === 'on';
  
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
    exchangeRate,
    telegramBotToken,
    telegramChatId,
    contactPhone,
    telegramLink,
    telegramQrUrl,
    companyLat,
    companyLng,
    geoRadiusMeters,
    geoFenceEnabled,
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

export async function testTelegramBotAction(botToken?: string, chatId?: string) {
  const { testTelegramBotConnection } = await import('@/lib/telegram');
  return await testTelegramBotConnection(botToken, chatId);
}

export async function setupTelegramWebhookAction(webhookUrl: string) {
  const { setTelegramWebhook } = await import('@/lib/telegram');
  return await setTelegramWebhook(webhookUrl);
}

export async function getTelegramWebhookInfoAction() {
  const { getTelegramWebhookInfo } = await import('@/lib/telegram');
  return await getTelegramWebhookInfo();
}

export async function deleteTelegramWebhookAction() {
  const { deleteTelegramWebhook } = await import('@/lib/telegram');
  return await deleteTelegramWebhook();
}

export async function sendDailySummaryAction() {
  const { sendDailyAttendanceSummary } = await import('@/lib/telegram');
  const ok = await sendDailyAttendanceSummary();
  return {
    success: ok,
    message: ok ? 'បានផ្ញើសេចក្តីសង្ខេបវត្តមាន & សំណើទៅកាន់ Telegram ដោយជោគជ័យ!' : 'បរាជ័យក្នុងការផ្ញើ (សូមពិនិត្យមើល Bot Token & Chat ID)',
  };
}
