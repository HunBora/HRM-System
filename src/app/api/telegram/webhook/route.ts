import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  answerTelegramCallback,
  editTelegramMessageText,
  sendDirectTelegram,
  generateDailyAttendanceSummary,
} from '@/lib/telegram';
import { recordAudit } from '@/lib/audit';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'HRM Enterprise Telegram Bot Webhook',
    timestamp: new Date().toISOString(),
    supportedActions: ['APPROVE_LEAVE', 'APPROVE_ADVANCE', 'APPROVE_EXPENSE', 'APPROVE_OVERTIME'],
    commands: ['/start', '/help', '/today', '/summary', '/pending'],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Handle Inline Button Callback Queries (Approve / Reject)
    if (body.callback_query) {
      const cq = body.callback_query;
      const callbackData = cq.data as string;
      const from = cq.from || {};
      const approverName = from.username
        ? `@${from.username}`
        : [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Manager';

      // Pattern: ACTION:TYPE:ID e.g. APP:LEAVE:cm4xyz
      const parts = callbackData.split(':');
      if (parts.length >= 3) {
        const action = parts[0]; // APP or REJ
        const type = parts[1];   // LEAVE, ADV, EXP, OT
        const targetId = parts.slice(2).join(':');

        // A. LEAVE REQUEST APPROVAL
        if (type === 'LEAVE') {
          const leave = await prisma.leaveRequest.findUnique({
            where: { id: targetId },
            include: { employee: true },
          });

          if (!leave) {
            await answerTelegramCallback(cq.id, '❌ រកមិនឃើញទិន្នន័យសំណើនេះទេ! (Leave request not found)', true);
            return NextResponse.json({ ok: true });
          }

          if (leave.status !== 'PENDING') {
            await answerTelegramCallback(cq.id, `⚠️ សំណើនេះមានស្ថានភាព "${leave.status}" រួចរាល់ហើយ!`, true);
            return NextResponse.json({ ok: true });
          }

          const newStatus = action === 'APP' ? 'APPROVED' : 'REJECTED';

          if (leave.leaveType === 'ANNUAL' && newStatus === 'APPROVED') {
            await prisma.employee.update({
              where: { id: leave.employeeId },
              data: { annualLeaveDays: { decrement: leave.duration } },
            });
          }

          await prisma.leaveRequest.update({
            where: { id: targetId },
            data: { status: newStatus },
          });

          await recordAudit({
            action: action === 'APP' ? 'APPROVE' : 'REJECT',
            module: 'LEAVE',
            userName: `Telegram: ${approverName}`,
            targetId: leave.id,
            targetName: `${leave.employee.firstNameKh} ${leave.employee.lastNameKh}`,
            details: `Leave (${leave.duration}d, ${leave.leaveType}) ${newStatus} via Telegram by ${approverName}`,
          });

          await answerTelegramCallback(
            cq.id,
            action === 'APP' ? '✅ បានអនុម័តច្បាប់ជោគជ័យ!' : '❌ បានបដិសេធច្បាប់!'
          );

          if (cq.message?.chat?.id && cq.message?.message_id) {
            const oldText = cq.message.text || '';
            const statusBadge = action === 'APP'
              ? '✅ <b>ស្ថានភាព: បានអនុម័ត (APPROVED)</b>'
              : '❌ <b>ស្ថានភាព: បានបដិសេធ (REJECTED)</b>';
            const updated = `${oldText}\n\n━━━━━━━━━━━━━━━━━━━━\n${statusBadge}\n👤 <b>ដោយ (By):</b> ${approverName}\n🕒 <b>កាលបរិច្ឆេទ:</b> ${new Date().toLocaleString('km-KH')}`;
            await editTelegramMessageText(cq.message.chat.id, cq.message.message_id, updated);
          }

          return NextResponse.json({ ok: true });
        }

        // B. ADVANCE SALARY APPROVAL
        if (type === 'ADV') {
          const adv = await prisma.advanceSalary.findUnique({
            where: { id: targetId },
            include: { employee: true },
          });

          if (!adv) {
            await answerTelegramCallback(cq.id, '❌ រកមិនឃើញទិន្នន័យបុរេប្រទាននេះទេ!', true);
            return NextResponse.json({ ok: true });
          }

          if (adv.status !== 'PENDING') {
            await answerTelegramCallback(cq.id, `⚠️ សំណើនេះមានស្ថានភាព "${adv.status}" រួចរាល់ហើយ!`, true);
            return NextResponse.json({ ok: true });
          }

          const newStatus = action === 'APP' ? 'APPROVED' : 'REJECTED';

          await prisma.advanceSalary.update({
            where: { id: targetId },
            data: { status: newStatus },
          });

          await recordAudit({
            action: action === 'APP' ? 'APPROVE' : 'REJECT',
            module: 'LOANS',
            userName: `Telegram: ${approverName}`,
            targetId: adv.id,
            targetName: `${adv.employee.firstNameKh} ${adv.employee.lastNameKh}`,
            details: `Advance Salary ($${adv.amount}) ${newStatus} via Telegram by ${approverName}`,
          });

          await answerTelegramCallback(
            cq.id,
            action === 'APP' ? `✅ បានអនុម័តបុរេប្រទាន $${adv.amount} ជោគជ័យ!` : '❌ បានបដិសេធបុរេប្រទាន!'
          );

          if (cq.message?.chat?.id && cq.message?.message_id) {
            const oldText = cq.message.text || '';
            const statusBadge = action === 'APP'
              ? '✅ <b>ស្ថានភាព: បានអនុម័ត (APPROVED)</b>'
              : '❌ <b>ស្ថានភាព: បានបដិសេធ (REJECTED)</b>';
            const updated = `${oldText}\n\n━━━━━━━━━━━━━━━━━━━━\n${statusBadge}\n👤 <b>ដោយ (By):</b> ${approverName}\n🕒 <b>កាលបរិច្ឆេទ:</b> ${new Date().toLocaleString('km-KH')}`;
            await editTelegramMessageText(cq.message.chat.id, cq.message.message_id, updated);
          }

          return NextResponse.json({ ok: true });
        }

        // C. EXPENSE CLAIM APPROVAL
        if (type === 'EXP') {
          const exp = await prisma.expenseClaim.findUnique({
            where: { id: targetId },
            include: { employee: true },
          });

          if (!exp) {
            await answerTelegramCallback(cq.id, '❌ រកមិនឃើញទិន្នន័យចំណាយនេះទេ!', true);
            return NextResponse.json({ ok: true });
          }

          if (exp.status !== 'PENDING') {
            await answerTelegramCallback(cq.id, `⚠️ សំណើនេះមានស្ថានភាព "${exp.status}" រួចរាល់ហើយ!`, true);
            return NextResponse.json({ ok: true });
          }

          const newStatus = action === 'APP' ? 'APPROVED_HR' : 'REJECTED';

          await prisma.expenseClaim.update({
            where: { id: targetId },
            data: { status: newStatus },
          });

          await recordAudit({
            action: action === 'APP' ? 'APPROVE' : 'REJECT',
            module: 'PAYROLL',
            userName: `Telegram: ${approverName}`,
            targetId: exp.id,
            targetName: `${exp.employee.firstNameKh} ${exp.employee.lastNameKh}`,
            details: `Expense Claim ($${exp.amount}) ${newStatus} via Telegram by ${approverName}`,
          });

          await answerTelegramCallback(
            cq.id,
            action === 'APP' ? `✅ បានអនុម័តសំណើទូទាត់ចំណាយ $${exp.amount}!` : '❌ បានបដិសេធសំណើទូទាត់!'
          );

          if (cq.message?.chat?.id && cq.message?.message_id) {
            const oldText = cq.message.text || '';
            const statusBadge = action === 'APP'
              ? '✅ <b>ស្ថានភាព: បានអនុម័ត (APPROVED)</b>'
              : '❌ <b>ស្ថានភាព: បានបដិសេធ (REJECTED)</b>';
            const updated = `${oldText}\n\n━━━━━━━━━━━━━━━━━━━━\n${statusBadge}\n👤 <b>ដោយ (By):</b> ${approverName}\n🕒 <b>កាលបរិច្ឆេទ:</b> ${new Date().toLocaleString('km-KH')}`;
            await editTelegramMessageText(cq.message.chat.id, cq.message.message_id, updated);
          }

          return NextResponse.json({ ok: true });
        }

        // D. OVERTIME REQUEST APPROVAL
        if (type === 'OT') {
          const ot = await prisma.overtimeRequest.findUnique({
            where: { id: targetId },
            include: { employee: true },
          });

          if (!ot) {
            await answerTelegramCallback(cq.id, '❌ រកមិនឃើញទិន្នន័យថែមម៉ោងនេះទេ!', true);
            return NextResponse.json({ ok: true });
          }

          if (ot.status !== 'PENDING') {
            await answerTelegramCallback(cq.id, `⚠️ សំណើនេះមានស្ថានភាព "${ot.status}" រួចរាល់ហើយ!`, true);
            return NextResponse.json({ ok: true });
          }

          const newStatus = action === 'APP' ? 'APPROVED' : 'REJECTED';

          await prisma.overtimeRequest.update({
            where: { id: targetId },
            data: {
              status: newStatus,
              approvedBy: `Telegram (${approverName})`,
              approvedAt: newStatus === 'APPROVED' ? new Date() : null,
            },
          });

          await recordAudit({
            action: action === 'APP' ? 'APPROVE' : 'REJECT',
            module: 'ATTENDANCE',
            userName: `Telegram: ${approverName}`,
            targetId: ot.id,
            targetName: `${ot.employee.firstNameKh} ${ot.employee.lastNameKh}`,
            details: `Overtime (${ot.totalHours}h, ${ot.otType}) ${newStatus} via Telegram by ${approverName}`,
          });

          await answerTelegramCallback(
            cq.id,
            action === 'APP' ? `✅ បានអនុម័ត OT ចំនួន ${ot.totalHours} ម៉ោង!` : '❌ បានបដិសេធសំណើ OT!'
          );

          if (cq.message?.chat?.id && cq.message?.message_id) {
            const oldText = cq.message.text || '';
            const statusBadge = action === 'APP'
              ? '✅ <b>ស្ថានភាព: បានអនុម័ត (APPROVED)</b>'
              : '❌ <b>ស្ថានភាព: បានបដិសេធ (REJECTED)</b>';
            const updated = `${oldText}\n\n━━━━━━━━━━━━━━━━━━━━\n${statusBadge}\n👤 <b>ដោយ (By):</b> ${approverName}\n🕒 <b>កាលបរិច្ឆេទ:</b> ${new Date().toLocaleString('km-KH')}`;
            await editTelegramMessageText(cq.message.chat.id, cq.message.message_id, updated);
          }

          return NextResponse.json({ ok: true });
        }
      }

      await answerTelegramCallback(cq.id, '⚠️ សកម្មភាពមិនត្រឹមត្រូវ');
      return NextResponse.json({ ok: true });
    }

    // 2. Handle Text Commands (/start, /help, /today, /summary, /pending)
    if (body.message?.text) {
      const text = body.message.text.trim().toLowerCase();
      const chatId = String(body.message.chat.id);

      if (text.startsWith('/start') || text.startsWith('/help')) {
        const welcome = `🤖 <b>សួស្តី! នេះជា HRM Smart Bot ផ្លូវការ</b>
🏢 <b>G.STextileGarment (Cambodia) co.,Ltd</b>
━━━━━━━━━━━━━━━━━━━━
ប្រព័ន្ធឆ្លើយតប និងជូនដំណឹងស្វ័យប្រវត្តិសម្រាប់ថ្នាក់គ្រប់គ្រង និង HR។

⚡ <b>ពាក្យបញ្ជាដែលអាចប្រើប្រាស់បាន (Commands):</b>
• <code>/today</code> ឬ <code>/summary</code> — មើលរបាយការណ៍វត្តមាន និងសំណើថ្ងៃនេះ
• <code>/pending</code> — មើលសំណើទាំងអស់ដែលកំពុងរង់ចាំការអនុម័ត
• <code>/help</code> — មើលជំនួយការប្រើប្រាស់

✨ <i>រាល់ពេលមានសំណើសុំច្បាប់, បុរេប្រទាន, ទូទាត់ចំណាយ ឬ ថែមម៉ោង ប្រព័ន្ធនឹងផ្ញើប៊ូតុង [✅ អនុម័ត] / [❌ បដិសេធ] មកកាន់ទីនេះដោយស្វ័យប្រវត្តិ!</i>`;

        await sendDirectTelegram(chatId, welcome);
        return NextResponse.json({ ok: true });
      }

      if (text.startsWith('/today') || text.startsWith('/summary')) {
        const summary = await generateDailyAttendanceSummary();
        await sendDirectTelegram(chatId, summary);
        return NextResponse.json({ ok: true });
      }

      if (text.startsWith('/pending')) {
        const [pendingLeaves, pendingAdvances, pendingExpenses, pendingOT] = await Promise.all([
          prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
          prisma.advanceSalary.count({ where: { status: 'PENDING' } }),
          prisma.expenseClaim.count({ where: { status: 'PENDING' } }),
          prisma.overtimeRequest.count({ where: { status: 'PENDING' } }),
        ]);

        const totalPending = pendingLeaves + pendingAdvances + pendingExpenses + pendingOT;

        const reply = `🔔 <b>សំណើដែលកំពុងរង់ចាំការអនុម័ត (Pending Requests)</b>
━━━━━━━━━━━━━━━━━━━━
សរុបទាំងអស់: <b>${totalPending}</b> សំណើ

• 🌴 សុំច្បាប់សម្រាក (Leaves): <b>${pendingLeaves}</b>
• 💸 សុំបើកបុរេប្រទាន (Advances): <b>${pendingAdvances}</b>
• 💳 សុំទូទាត់ចំណាយ (Expenses): <b>${pendingExpenses}</b>
• ⏱ សុំថែមម៉ោង (Overtime): <b>${pendingOT}</b>
━━━━━━━━━━━━━━━━━━━━
<i>សូមចុចប៊ូតុងអនុម័តលើសារជូនដំណឹងនីមួយៗ ឬចូលទៅកាន់ផ្ទាំងគ្រប់គ្រងគេហទំព័រ។</i>`;

        await sendDirectTelegram(chatId, reply);
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error handling Telegram webhook:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
