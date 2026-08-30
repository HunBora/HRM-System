import { prisma } from '@/lib/prisma';

export async function sendTelegramNotification(message: string) {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings || !settings.telegramBotToken || !settings.telegramChatId) {
      console.log('Telegram settings not configured. Skipping notification.');
      return false;
    }

    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: settings.telegramChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      console.error('Failed to send Telegram message:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}
