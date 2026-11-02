'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendTelegramNotificationWithButtons, sendTelegramNotification } from '@/lib/telegram'

export async function createAdvanceRequest(formData: FormData) {
  const amountStr = formData.get('amount') as string;
  const amount = parseFloat(amountStr);
  
  const newAdv = await prisma.advanceSalary.create({
    data: {
      employeeId: formData.get('employeeId') as string,
      amount: isNaN(amount) ? 0 : amount,
      requestDate: new Date(formData.get('requestDate') as string),
      month: parseInt(formData.get('month') as string),
      year: parseInt(formData.get('year') as string),
      reason: formData.get('reason') as string,
      status: 'PENDING'
    },
    include: { employee: true }
  });

  // Send Interactive Telegram Notification with 1-click Approve / Reject buttons
  const empKh = `${newAdv.employee.firstNameKh || ''} ${newAdv.employee.lastNameKh || ''}`.trim();
  const empEn = `${newAdv.employee.firstNameEn || ''} ${newAdv.employee.lastNameEn || ''}`.trim();
  const msg = `💸 <b>សំណើសុំបុរេប្រទានថ្មី (Salary Advance Request)</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>បុគ្គលិក:</b> ${empKh || empEn} ${empEn && empKh ? `(${empEn})` : ''}
📌 <b>អត្តលេខ:</b> ${newAdv.employee.employeeId} | <b>ផ្នែក:</b> ${newAdv.employee.department}
💵 <b>ទឹកប្រាក់ស្នើសុំ:</b> <b>$${newAdv.amount.toLocaleString()}</b>
📅 <b>កាលវិភាគកាត់:</b> ខែ ${newAdv.month}/${newAdv.year}
📝 <b>មូលហេតុ:</b> ${newAdv.reason || '-'}
━━━━━━━━━━━━━━━━━━━━
<i>សូមចុចប៊ូតុងខាងក្រោមដើម្បីអនុម័ត ឬបដិសេធភ្លាមៗ៖</i>`;

  await sendTelegramNotificationWithButtons(msg, [
    [
      { text: '✅ អនុម័ត (Approve)', callback_data: `APP:ADV:${newAdv.id}` },
      { text: '❌ បដិសេធ (Reject)', callback_data: `REJ:ADV:${newAdv.id}` },
    ]
  ]);

  revalidatePath('/dashboard/advance');
  redirect('/dashboard/advance');
}

export async function updateAdvanceStatus(id: string, status: string) {
  const updated = await prisma.advanceSalary.update({
    where: { id },
    data: { status },
    include: { employee: true }
  });

  const statusKh = status === 'APPROVED' ? '✅ <b>អនុម័ត (APPROVED)</b>' : status === 'REJECTED' ? '❌ <b>បដិសេធ (REJECTED)</b>' : status;
  const msg = `💸 <b>ព័ត៌មានបុរេប្រទាន (Advance Update)</b>\n\nបុគ្គលិក: <b>${updated.employee.firstNameKh} ${updated.employee.lastNameKh}</b>\nចំនួន: $${updated.amount}\nស្ថានភាព: ${statusKh}`;
  await sendTelegramNotification(msg);

  revalidatePath('/dashboard/advance');
}

export async function deleteAdvanceRequest(id: string) {
  await prisma.advanceSalary.delete({
    where: { id }
  });
  revalidatePath('/dashboard/advance');
}
