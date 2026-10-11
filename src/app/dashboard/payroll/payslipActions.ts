'use server';

import { prisma } from '@/lib/prisma';
import { sendDirectTelegram } from '@/lib/telegram';
import { recordAudit } from '@/lib/audit';

export async function sendPayslipToTelegram(payrollId: string) {
  try {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { employee: true }
    });

    if (!payroll) {
      return { success: false, message: 'រកមិនឃើញទិន្នន័យប្រាក់ខែ (Payroll not found)' };
    }

    if (!payroll.employee?.telegramChatId) {
      return { success: false, message: `បុគ្គលិក ${payroll.employee.firstNameKh || payroll.employee.firstNameEn} មិនទាន់មាន Telegram Chat ID ទេ (Employee has no Telegram Chat ID)` };
    }

    const m = payroll.month.toString().padStart(2, '0');
    const y = payroll.year;

    const msg = `💰 <b>វិក្កយបត្រប្រាក់ខែ (PAYSLIP) • ${m}/${y}</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>ឈ្មោះ (Name):</b> ${payroll.employee.firstNameKh || ''} ${payroll.employee.lastNameKh || ''} (${payroll.employee.firstNameEn} ${payroll.employee.lastNameEn})
📌 <b>អត្តលេខ (Emp ID):</b> <code>${payroll.employee.employeeId}</code>
🏢 <b>ផ្នែក (Dept):</b> ${payroll.employee.department}
💼 <b>មុខងារ (Position):</b> ${payroll.employee.position}

💵 <b>ប្រាក់ខែគោល (Basic Salary):</b> $${payroll.basicSalary.toFixed(2)}
🕒 <b>ថ្ងៃធ្វើការជាក់ស្តែង (Days Worked):</b> ${payroll.workingDays} ថ្ងៃ
🚫 <b>អវត្តមាន (Absent Days):</b> ${payroll.absentDays} ថ្ងៃ

➕ <b>ប្រាក់ចំណូលបន្ថែម (EARNINGS):</b>
• ថែមម៉ោងធម្មតា (Regular OT): $${payroll.otWage.toFixed(2)} (${payroll.otHours} ម៉ោង)
• ថែមម៉ោងថ្ងៃអាទិត្យ/បុណ្យ (Sun/Holiday OT): $${payroll.sunOtWage.toFixed(2)} (${payroll.sunOtHours} ម៉ោង)
• ថែមម៉ោងយប់ (Night OT): $${payroll.nightOtWage.toFixed(2)} (${payroll.nightOtHours} ម៉ោង)
• ប្រាក់រង្វាន់ការងារ (Bonus): $${payroll.attendanceBonus.toFixed(2)}
• ប្រាក់អាហារ និងធ្វើដំណើរ: $${(payroll.lunchAllowance + payroll.transportation).toFixed(2)}
• ប្រាក់ដំណែង/ជំនាញ: $${(payroll.payScaleIncentive + payroll.adjustmentSkill).toFixed(2)}
• ប្រាក់អតីតភាព (Seniority): $${(payroll.seniority + payroll.seniorityIndemnity).toFixed(2)}
• សរុបប្រាក់ចំណូលសរុប (Gross): $${payroll.totalSalary.toFixed(2)}

➖ <b>ប្រាក់កាត់កង (DEDUCTIONS):</b>
• បេឡាជាតិ (NSSF): $${payroll.nssf.toFixed(2)}
• ប្រាក់បុរេប្រទាន/កម្ចី (Advance/Loan): $${payroll.loanPension.toFixed(2)}
• ពន្ធលើប្រាក់បៀវត្ស (Tax): $${payroll.taxPayment.toFixed(2)}
• កាត់សហជីព (Union): $${payroll.unionDeduction.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━
🟢 <b>ប្រាក់បៀវត្សត្រូវបើកជាក់ស្តែង (NET PAY):</b>
👉 <b>$${payroll.paidSalaryUsd.toFixed(2)} USD</b> + <b>៛${payroll.netSalaryRiel.toLocaleString()} KHR</b>
<i>(សរុបស្មើជាដុល្លារ: $${payroll.netSalaryUsd.toFixed(2)})</i>
━━━━━━━━━━━━━━━━━━━━
🙏 <i>សូមអរគុណចំពោះការខិតខំប្រឹងប្រែងរបស់អ្នកក្នុងការងារ!</i>`;

    const res = await sendDirectTelegram(payroll.employee.telegramChatId, msg);

    if (res.success) {
      await recordAudit({
        action: 'PAYROLL_RUN',
        module: 'PAYROLL',
        targetId: payroll.id,
        targetName: `${payroll.employee.employeeId} - ${payroll.employee.firstNameEn}`,
        details: `Dispatched payslip via Telegram to ${payroll.employee.telegramChatId} for ${m}/${y}`,
        status: 'SUCCESS'
      });
    }

    return res;
  } catch (error: any) {
    console.error('Error sending single payslip:', error);
    return { success: false, message: error.message || 'មានបញ្ហាបច្ចេកទេសក្នុងការផ្ញើសារ' };
  }
}

/**
 * Dispatch payslips in bulk to all employees who have a registered telegramChatId
 */
export async function sendBulkPayslipsToTelegram(month: number, year: number) {
  try {
    const payrolls = await prisma.payroll.findMany({
      where: {
        month,
        year,
        employee: {
          telegramChatId: {
            not: null,
          }
        }
      },
      include: {
        employee: true
      }
    });

    const eligible = payrolls.filter(p => p.employee?.telegramChatId && p.employee.telegramChatId.trim() !== '');

    if (eligible.length === 0) {
      return {
        success: false,
        total: 0,
        sent: 0,
        failed: 0,
        message: 'មិនមានបុគ្គលិកណាដែលមាន Telegram Chat ID នៅក្នុងតារាងប្រាក់ខែនេះទេ (No employees found with Telegram Chat ID)'
      };
    }

    let sent = 0;
    let failed = 0;

    for (const p of eligible) {
      const res = await sendPayslipToTelegram(p.id);
      if (res.success) {
        sent++;
      } else {
        failed++;
      }
      // Modest delay between dispatches to respect Telegram Bot rate limits (30 msgs/sec max)
      await new Promise(r => setTimeout(r, 100));
    }

    await recordAudit({
      action: 'PAYROLL_RUN',
      module: 'PAYROLL',
      targetId: `${month}-${year}`,
      targetName: `Bulk Telegram Payslip Dispatch (${month}/${year})`,
      details: `Dispatched ${sent} payslips via Telegram successfully, ${failed} failed out of ${eligible.length} employees`,
      status: failed === 0 ? 'SUCCESS' : 'WARNING'
    });

    return {
      success: true,
      total: eligible.length,
      sent,
      failed,
      message: `បានផ្ញើវិក្កយបត្រប្រាក់ខែតាម Telegram បានសម្រេច ${sent}/${eligible.length} នាក់! (Failed: ${failed})`
    };
  } catch (error: any) {
    console.error('Error bulk sending payslips:', error);
    return {
      success: false,
      total: 0,
      sent: 0,
      failed: 0,
      message: error.message || 'Failed to dispatch bulk telegram payslips'
    };
  }
}
