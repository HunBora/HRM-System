'use server';

import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';

export async function sendPayslipToTelegram(payrollId: string) {
  try {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { employee: true }
    });

    if (!payroll || !payroll.employee.telegramChatId) {
      return { success: false, message: 'បុគ្គលិកនេះមិនទាន់មាន Telegram Chat ID ទេ (Employee has no Telegram Chat ID)' };
    }

    const m = payroll.month.toString().padStart(2, '0');
    const y = payroll.year;

    // Formatting the message
    const msg = `💰 <b>វិក្កយបត្រប្រាក់ខែ (PAYSLIP) - ${m}/${y}</b>
=======================
👤 <b>ឈ្មោះ (Name):</b> ${payroll.employee.firstNameKh} ${payroll.employee.lastNameKh}
📌 <b>អត្តលេខ (ID):</b> ${payroll.employee.employeeId}
🏢 <b>ផ្នែក (Dept):</b> ${payroll.employee.department}

💵 <b>ប្រាក់ខែគោល (Basic):</b> $${payroll.basicSalary.toFixed(2)}
🕒 <b>ថ្ងៃធ្វើការ (Days):</b> ${payroll.workingDays} ថ្ងៃ
🚫 <b>អវត្តមាន (Absent):</b> ${payroll.absentDays} ថ្ងៃ

➕ <b>ប្រាក់ចំណូលបន្ថែម (EARNINGS):</b>
• ថែមម៉ោង (OT): $${payroll.otWage.toFixed(2)}
• ប្រាក់រង្វាន់ (Bonus): $${payroll.attendanceBonus.toFixed(2)}
• ប្រាក់អាហារ/ធ្វើដំណើរ: $${(payroll.lunchAllowance + payroll.transportation).toFixed(2)}

➖ <b>ប្រាក់កាត់កង (DEDUCTIONS):</b>
• បេឡាជាតិ (NSSF): $${payroll.nssf.toFixed(2)}
• ប្រាក់បុរេប្រទាន (Advance): $${payroll.loanPension.toFixed(2)}

=======================
🟢 <b>ប្រាក់បៀវត្សទទួលបាន (NET PAY):</b>
👉 <b>$${payroll.netSalaryUsd.toFixed(2)}</b> (រៀល: ${payroll.netSalaryRiel.toLocaleString()} ៛)
=======================
🙏 <i>សូមអរគុណចំពោះការខិតខំប្រឹងប្រែងរបស់អ្នក!</i>`;

    // We can't use the global sendTelegramNotification easily if we want to send to a SPECIFIC chat ID, 
    // because sendTelegramNotification uses the global settings.telegramChatId.
    // Let's modify our logic here to send directly to the employee's chat ID.
    
    const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    if (!settings || !settings.telegramBotToken) {
      return { success: false, message: 'ប្រព័ន្ធមិនទាន់បានភ្ជាប់ Telegram Bot (Bot Token missing)' };
    }

    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: payroll.employee.telegramChatId,
        text: msg,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      return { success: false, message: 'បរាជ័យក្នុងការផ្ញើទៅកាន់ Telegram (Failed to send)' };
    }

    return { success: true, message: 'បានផ្ញើប្រាក់ខែចូល Telegram ដោយជោគជ័យ! (Payslip sent successfully!)' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'មានបញ្ហាបច្ចេកទេស (Internal Error)' };
  }
}
