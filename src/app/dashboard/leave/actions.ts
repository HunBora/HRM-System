'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendTelegramNotification, sendTelegramNotificationWithButtons } from '@/lib/telegram'

export async function createLeaveRequest(formData: FormData) {
  const req = await prisma.leaveRequest.create({
    data: {
      employeeId: formData.get('employeeId') as string,
      leaveType: formData.get('leaveType') as string,
      startDate: new Date(formData.get('startDate') as string),
      endDate: new Date(formData.get('endDate') as string),
      duration: parseFloat(formData.get('duration') as string) || 1,
      reason: formData.get('reason') as string,
      status: 'PENDING'
    },
    include: { employee: true }
  });

  // Send Interactive Telegram Notification with 1-click Approve / Reject buttons
  const empKh = `${req.employee.firstNameKh || ''} ${req.employee.lastNameKh || ''}`.trim();
  const empEn = `${req.employee.firstNameEn || ''} ${req.employee.lastNameEn || ''}`.trim();
  const msg = `🌴 <b>សំណើសុំច្បាប់ថ្មី (New Leave Request)</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>បុគ្គលិក:</b> ${empKh || empEn} ${empEn && empKh ? `(${empEn})` : ''}
📌 <b>អត្តលេខ:</b> ${req.employee.employeeId} | <b>ផ្នែក:</b> ${req.employee.department}
🏷 <b>ប្រភេទច្បាប់:</b> ${req.leaveType}
⏱ <b>ចំនួន:</b> <b>${req.duration} ថ្ងៃ</b>
📅 <b>កាលបរិច្ឆេទ:</b> ${new Date(req.startDate).toLocaleDateString('km-KH')} ➔ ${new Date(req.endDate).toLocaleDateString('km-KH')}
📝 <b>មូលហេតុ:</b> ${req.reason || '-'}
━━━━━━━━━━━━━━━━━━━━
<i>សូមចុចប៊ូតុងខាងក្រោមដើម្បីអនុម័ត ឬបដិសេធភ្លាមៗ៖</i>`;

  await sendTelegramNotificationWithButtons(msg, [
    [
      { text: '✅ អនុម័ត (Approve)', callback_data: `APP:LEAVE:${req.id}` },
      { text: '❌ បដិសេធ (Reject)', callback_data: `REJ:LEAVE:${req.id}` },
    ]
  ]);

  revalidatePath('/dashboard/leave');
  redirect('/dashboard/leave');
}

export async function updateLeaveStatus(id: string, status: string) {
  const existingReq = await prisma.leaveRequest.findUnique({ 
    where: { id },
    include: { employee: true }
  });
  
  if (!existingReq) return;
  
  if (existingReq.leaveType === 'ANNUAL' && existingReq.status !== status) {
     if (status === 'APPROVED') {
        await prisma.employee.update({
          where: { id: existingReq.employeeId },
          data: { annualLeaveDays: { decrement: existingReq.duration } }
        });
     } else if (existingReq.status === 'APPROVED') {
        await prisma.employee.update({
          where: { id: existingReq.employeeId },
          data: { annualLeaveDays: { increment: existingReq.duration } }
        });
     }
  }

  await prisma.leaveRequest.update({
    where: { id },
    data: { status }
  });

  // Send Telegram Notification
  if (existingReq.status !== status) {
    const statusKh = status === 'APPROVED' ? '✅ <b>អនុម័ត (APPROVED)</b>' : status === 'REJECTED' ? '❌ <b>បដិសេធ (REJECTED)</b>' : status;
    const msg = `📋 <b>ព័ត៌មានសុំច្បាប់ (Leave Update)</b>\n\nបុគ្គលិក: <b>${existingReq.employee.firstNameKh} ${existingReq.employee.lastNameKh}</b>\nស្ថានភាព: ${statusKh}`;
    await sendTelegramNotification(msg);
  }

  revalidatePath('/dashboard/leave');
}

export async function deleteLeaveRequest(id: string) {
  await prisma.leaveRequest.delete({
    where: { id }
  });
  revalidatePath('/dashboard/leave');
}
