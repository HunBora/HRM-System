import { prisma } from '@/lib/prisma';

export interface TelegramSendResult {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
}

export interface TelegramInlineButton {
  text: string;
  callback_data?: string;
  url?: string;
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
 * Send an interactive notification with Inline Buttons (e.g. Approve / Reject)
 * to the default Company Telegram Group/Channel
 */
export async function sendTelegramNotificationWithButtons(
  message: string,
  inlineKeyboard: TelegramInlineButton[][]
): Promise<boolean> {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings || !settings.telegramBotToken || !settings.telegramChatId) {
      console.log('Telegram settings not configured. Skipping interactive notification.');
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
        reply_markup: {
          inline_keyboard: inlineKeyboard
        }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Failed to send Telegram message with buttons:', errText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram interactive notification:', error);
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
 * Send direct message with buttons to a specific Telegram Chat ID
 */
export async function sendDirectTelegramWithButtons(
  chatId: string,
  message: string,
  inlineKeyboard: TelegramInlineButton[][]
): Promise<TelegramSendResult> {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings || !settings.telegramBotToken) {
      return { success: false, message: 'ប្រព័ន្ធមិនទាន់បានកំណត់ Telegram Bot Token' };
    }

    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: inlineKeyboard
        }
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
 * Answer an incoming Telegram Callback Query (shows toast or alert on Telegram client)
 */
export async function answerTelegramCallback(
  callbackQueryId: string,
  text: string,
  showAlert: boolean = false
): Promise<boolean> {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings || !settings.telegramBotToken) return false;

    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/answerCallbackQuery`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: showAlert,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error answering Telegram callback query:', error);
    return false;
  }
}

/**
 * Edit existing Telegram message text (e.g. to update status and remove buttons after approval)
 */
export async function editTelegramMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
  inlineKeyboard?: TelegramInlineButton[][]
): Promise<boolean> {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings || !settings.telegramBotToken) return false;

    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/editMessageText`;
    const bodyPayload: any = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'HTML',
    };

    if (inlineKeyboard && inlineKeyboard.length > 0) {
      bodyPayload.reply_markup = { inline_keyboard: inlineKeyboard };
    } else {
      bodyPayload.reply_markup = { inline_keyboard: [] }; // Clears buttons
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Failed to edit Telegram message text:', err);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error editing Telegram message:', error);
    return false;
  }
}

/**
 * Register the Webhook URL with Telegram Bot API
 */
export async function setTelegramWebhook(webhookUrl: string): Promise<TelegramSendResult> {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings || !settings.telegramBotToken) {
      return { success: false, message: 'សូមបញ្ចូល Telegram Bot Token ជាមុនសិន!' };
    }

    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/setWebhook`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: false,
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return {
        success: true,
        message: `កំណត់ Webhook ជោគជ័យ! Telegram នឹងបញ្ជូនសកម្មភាពមកកាន់ ${webhookUrl}`,
        data: data.result,
      };
    } else {
      return {
        success: false,
        message: `បរាជ័យក្នុងការកំណត់ Webhook: ${data.description || 'Unknown error'}`,
        error: data.description,
      };
    }
  } catch (error: any) {
    return { success: false, message: error.message || 'Error configuring Telegram webhook' };
  }
}

/**
 * Get current Webhook info from Telegram
 */
export async function getTelegramWebhookInfo(): Promise<TelegramSendResult> {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings || !settings.telegramBotToken) {
      return { success: false, message: 'Bot Token missing' };
    }

    const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/getWebhookInfo`);
    const data = await response.json();

    if (data.ok) {
      return {
        success: true,
        message: 'Webhook info retrieved',
        data: data.result,
      };
    } else {
      return {
        success: false,
        message: data.description || 'Failed to get Webhook info',
      };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Delete Webhook from Telegram
 */
export async function deleteTelegramWebhook(): Promise<TelegramSendResult> {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings || !settings.telegramBotToken) {
      return { success: false, message: 'Bot Token missing' };
    }

    const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/deleteWebhook`);
    const data = await response.json();

    return {
      success: data.ok,
      message: data.description || (data.ok ? 'Webhook removed' : 'Failed to remove webhook'),
    };
  } catch (error: any) {
    return { success: false, message: error.message };
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

    // 2. Send test message to Chat ID with test button
    const testMsg = `🤖 <b>HRM SYSTEM • TELEGRAM TEST CONNECTION</b>
━━━━━━━━━━━━━━━━━━━━
✅ <b>ស្ថានភាព (Status):</b> បានតភ្ជាប់ជោគជ័យ (Connected)
🤖 <b>Bot Name:</b> @${botUsername}
🕒 <b>កាលបរិច្ឆេទ (Date):</b> ${new Date().toLocaleString('km-KH')}
🏢 <b>ប្រព័ន្ធ (System):</b> HRM Enterprise Cloud

<i>ការជូនដំណឹងស្វ័យប្រវត្តិនឹងដំណើរការធម្មតា (Interactive approvals & automated notifications are ready).</i>`;

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

/**
 * Generate and format Daily Attendance and Pending Approvals Summary
 */
export async function generateDailyAttendanceSummary(): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalEmployees, attendances, pendingLeaves, pendingAdvances, pendingExpenses, pendingOT] = await Promise.all([
    prisma.employee.count(),
    prisma.dailyAttendance.findMany({
      where: {
        date: { gte: today, lt: tomorrow }
      }
    }),
    prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
    prisma.advanceSalary.count({ where: { status: 'PENDING' } }),
    prisma.expenseClaim.count({ where: { status: 'PENDING' } }),
    prisma.overtimeRequest.count({ where: { status: 'PENDING' } }),
  ]);

  const presentCount = attendances.filter(a => (a.fIn || a.sIn || (a.workHrs && a.workHrs > 0))).length;
  const lateCount = attendances.filter(a => a.lateMins && a.lateMins > 0).length;
  const absentCount = Math.max(0, totalEmployees - presentCount);
  const attendanceRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

  const dateStr = new Date().toLocaleDateString('km-KH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `📊 <b>សេចក្តីសង្ខេបវត្តមាន & សំណើប្រចាំថ្ងៃ (Daily Attendance & Approvals)</b>
📅 <b>កាលបរិច្ឆេទ:</b> ${dateStr}
🏢 <b>ក្រុមហ៊ុន:</b> G.STextileGarment (Cambodia) co.,Ltd
━━━━━━━━━━━━━━━━━━━━
👥 <b>បុគ្គលិកសរុប (Total Staff):</b> ${totalEmployees} នាក់
✅ <b>មានវត្តមាន (Present):</b> <b>${presentCount}</b> នាក់ (${attendanceRate}%)
❌ <b>អវត្តមាន/មិនទាន់កត់ (Absent/Pending):</b> <b>${absentCount}</b> នាក់
⏰ <b>មកយឺត (Late Arrivals):</b> <b>${lateCount}</b> នាក់

🔔 <b>សំណើរង់ចាំការអនុម័ត (Pending Approvals):</b>
• 🌴 សុំច្បាប់ (Leaves): <b>${pendingLeaves}</b>
• 💸 បុរេប្រទាន (Advances): <b>${pendingAdvances}</b>
• 💳 ទូទាត់ចំណាយ (Expenses): <b>${pendingExpenses}</b>
• ⏱ ថែមម៉ោង (Overtime): <b>${pendingOT}</b>
━━━━━━━━━━━━━━━━━━━━
<i>HRM Smart Automation System</i>`;
}

/**
 * Send Daily Attendance Summary to Telegram Channel/Group
 */
export async function sendDailyAttendanceSummary(): Promise<boolean> {
  const summaryText = await generateDailyAttendanceSummary();
  return await sendTelegramNotification(summaryText);
}
