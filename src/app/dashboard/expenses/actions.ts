'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { sendTelegramNotificationWithButtons, sendTelegramNotification } from '@/lib/telegram';

export async function submitExpenseClaim(formData: FormData) {
  const session = await getSession();
  let targetEmployeeId = session?.employeeId;

  const formEmpId = formData.get('empId') as string;
  if (formEmpId) {
    const employee = await prisma.employee.findUnique({ where: { employeeId: formEmpId } });
    if (employee) {
      targetEmployeeId = employee.id;
    } else {
      return { error: 'រកមិនឃើញលេខសម្គាល់បុគ្គលិកនេះទេ! (Employee ID not found)' };
    }
  }

  if (!targetEmployeeId) {
    return { error: 'មិនអាចស្វែងរកទិន្នន័យបុគ្គលិករបស់អ្នកបានទេ! (No Employee linked to your account)' };
  }

  const date = formData.get('date') as string;
  const category = formData.get('category') as string;
  const amountStr = formData.get('amount') as string;
  const currency = formData.get('currency') as string || 'USD';
  const description = formData.get('description') as string;
  const receiptUrl = formData.get('receiptUrl') as string || '';

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: 'ចំនួនទឹកប្រាក់មិនត្រឹមត្រូវ!' };
  }

  const claim = await prisma.expenseClaim.create({
    data: {
      employeeId: targetEmployeeId,
      date: new Date(date),
      category,
      amount,
      currency,
      description,
      receiptUrl,
      status: 'PENDING'
    },
    include: { employee: true }
  });

  // Send Interactive Telegram Notification with 1-click Approve / Reject buttons
  const empKh = `${claim.employee.firstNameKh || ''} ${claim.employee.lastNameKh || ''}`.trim();
  const empEn = `${claim.employee.firstNameEn || ''} ${claim.employee.lastNameEn || ''}`.trim();
  const msg = `💳 <b>សំណើសុំទូទាត់ចំណាយថ្មី (New Expense Claim)</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>បុគ្គលិក:</b> ${empKh || empEn} ${empEn && empKh ? `(${empEn})` : ''}
📌 <b>អត្តលេខ:</b> ${claim.employee.employeeId} | <b>ផ្នែក:</b> ${claim.employee.department}
📂 <b>ប្រភេទចំណាយ:</b> ${claim.category}
💵 <b>ទឹកប្រាក់:</b> <b>${claim.amount.toLocaleString()} ${claim.currency}</b>
📅 <b>កាលបរិច្ឆេទ:</b> ${new Date(claim.date).toLocaleDateString('km-KH')}
📝 <b>បរិយាយ:</b> ${claim.description || '-'}
${claim.receiptUrl ? `📎 <b>បង្កាន់ដៃ:</b> <a href="${claim.receiptUrl}">មើលរូបភាព</a>\n` : ''}━━━━━━━━━━━━━━━━━━━━
<i>សូមចុចប៊ូតុងខាងក្រោមដើម្បីអនុម័ត ឬបដិសេធភ្លាមៗ៖</i>`;

  sendTelegramNotificationWithButtons(msg, [
    [
      { text: '✅ អនុម័ត (Approve)', callback_data: `APP:EXP:${claim.id}` },
      { text: '❌ បដិសេធ (Reject)', callback_data: `REJ:EXP:${claim.id}` },
    ]
  ]).catch(err => console.error('Error sending expense telegram notification:', err));

  revalidatePath('/dashboard/expenses');
  return { success: true };
}

export async function updateExpenseStatus(id: string, newStatus: string) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  // Only DEPT_HEAD, HR, ADMIN, PAYROLL_ADMIN can update status
  if (['EMPLOYEE'].includes(session.role)) {
    return { error: 'គ្មានសិទ្ធិអនុម័ត!' };
  }

  const updated = await prisma.expenseClaim.update({
    where: { id },
    data: { status: newStatus },
    include: { employee: true }
  });

  const statusKh = newStatus === 'APPROVED_HR' || newStatus === 'APPROVED_DEPT' || newStatus === 'PAID'
    ? `✅ <b>អនុម័ត (${newStatus})</b>`
    : newStatus === 'REJECTED'
    ? '❌ <b>បដិសេធ (REJECTED)</b>'
    : newStatus;

  const msg = `💳 <b>ព័ត៌មានទូទាត់ចំណាយ (Expense Update)</b>\n\nបុគ្គលិក: <b>${updated.employee.firstNameKh} ${updated.employee.lastNameKh}</b>\nចំនួន: ${updated.amount} ${updated.currency}\nស្ថានភាព: ${statusKh}`;
  sendTelegramNotification(msg).catch(err => console.error('Error notifying expense status update:', err));

  revalidatePath('/dashboard/expenses');
  return { success: true };
}
