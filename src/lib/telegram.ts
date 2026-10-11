import { prisma } from '@/lib/prisma';

export interface TelegramSendResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Send a notification message to the default Company Telegram Group/Channel
 */
export async function sendTelegramNotification(message: string): Promise<boolean> {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings || !settings.telegramBotToken || !settings.telegramChatId) {
      console.log('Telegram settings not configured. Skipping group notification.');
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
      const errText = await response.text();
      console.error('Failed to send Telegram message:', errText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}

/**
 * Send direct message to a specific Telegram Chat ID (e.g. Employee or Approver)
 */
export async function sendDirectTelegram(chatId: string, message: string): Promise<TelegramSendResult> {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings || !settings.telegramBotToken) {
      return { success: false, message: 'ប្រព័ន្ធមិនទាន់បានកំណត់ Telegram Bot Token (Bot Token missing in Settings)' };
    }

    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errData = await response.text();
      return { success: false, message: 'បរាជ័យក្នុងការផ្ញើទៅកាន់ Telegram', error: errData };
    }

    return { success: true, message: 'ផ្ញើសារបានជោគជ័យ (Message sent successfully)' };
  } catch (error: any) {
    return { success: false, message: 'មានបញ្ហាបច្ចេកទេស', error: error?.message };
  }
}

/**
 * Test the Telegram Bot configuration and send a ping notification
 */
export async function testTelegramBotConnection(botToken?: string, chatId?: string): Promise<TelegramSendResult> {
  try {
    let token = botToken;
    let targetChat = chatId;

    if (!token || !targetChat) {
      const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
      token = token || settings?.telegramBotToken || '';
      targetChat = targetChat || settings?.telegramChatId || '';
    }

    if (!token) {
      return { success: false, message: 'សូមបញ្ចូល Telegram Bot Token ជាមុនសិន! (Bot Token is missing)' };
    }

    if (!targetChat) {
      return { success: false, message: 'សូមបញ្ចូល Telegram Chat ID គោលដៅជាមុនសិន! (Chat ID is missing)' };
    }

    // 1. Verify Bot Token validity via getMe
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await meRes.json();
    if (!meRes.ok || !meData.ok) {
      return {
        success: false,
        message: `Bot Token មិនត្រឹមត្រូវ: ${meData.description || 'Invalid Token'}`,
      };
    }

    const botUsername = meData.result?.username || 'Bot';

    // 2. Send test message to Chat ID
    const testMsg = `🤖 <b>HRM SYSTEM • TELEGRAM TEST CONNECTION</b>
━━━━━━━━━━━━━━━━━━━━
✅ <b>ស្ថានភាព (Status):</b> បានតភ្ជាប់ជោគជ័យ (Connected)
🤖 <b>Bot Name:</b> @${botUsername}
🕒 <b>កាលបរិច្ឆេទ (Date):</b> ${new Date().toLocaleString('km-KH')}
🏢 <b>ប្រព័ន្ធ (System):</b> HRM Enterprise Cloud

<i>ការជូនដំណឹងស្វ័យប្រវត្តិនឹងដំណើរការធម្មតា (Automated notifications are ready to dispatch).</i>`;

    const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChat,
        text: testMsg,
        parse_mode: 'HTML',
      }),
    });

    const sendData = await sendRes.json();
    if (!sendRes.ok || !sendData.ok) {
      return {
        success: false,
        message: `មិនអាចផ្ញើសារទៅកាន់ Chat ID នេះបានទេ: ${sendData.description || 'Failed to send'} (សូមប្រាកដថាអ្នកបានចុច /start ក្នុង bot ឬ add bot ចូល group រួចរាល់)`,
      };
    }

    return {
      success: true,
      message: `តភ្ជាប់ជោគជ័យ! សារសាកល្បងត្រូវបានផ្ញើទៅកាន់ @${botUsername} (Chat ID: ${targetChat})`,
    };
  } catch (error: any) {
    return { success: false, message: error.message || 'Network error occurred while contacting Telegram API' };
  }
}
