import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { analyzeContractAlert, ContractAlertItem } from '@/lib/contractAlerts';
import { sendTelegramNotification } from '@/lib/telegram';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contracts = await prisma.contract.findMany({
      where: {
        status: { not: 'TERMINATED' },
      },
      include: {
        employee: {
          select: {
            employeeId: true,
            firstNameKh: true,
            lastNameKh: true,
            firstNameEn: true,
            lastNameEn: true,
            department: true,
            position: true,
          },
        },
      },
    });

    const allAlerts: ContractAlertItem[] = [];
    contracts.forEach((c) => {
      const items = analyzeContractAlert(c);
      allAlerts.push(...items);
    });

    const fdcNoticeAlerts = allAlerts.filter((a) => a.alertType === 'FDC_CRITICAL' || a.alertType === 'FDC_WARNING');
    const foreignWpAlerts = allAlerts.filter((a) => a.alertType === 'FOREIGN_WP_CRITICAL' || a.alertType === 'FOREIGN_WP_WARNING');
    const foreignVisaAlerts = allAlerts.filter((a) => a.alertType === 'FOREIGN_VISA_CRITICAL' || a.alertType === 'FOREIGN_VISA_WARNING');
    const probationAlerts = allAlerts.filter((a) => a.alertType === 'PROBATION_ENDING');
    const expiredAlerts = allAlerts.filter((a) => a.alertType === 'EXPIRED');

    return NextResponse.json({
      success: true,
      totalAlerts: allAlerts.length,
      counts: {
        critical: allAlerts.filter((a) => a.alertLevel === 'CRITICAL').length,
        warning: allAlerts.filter((a) => a.alertLevel === 'WARNING').length,
        fdcNotice: fdcNoticeAlerts.length,
        foreignWp: foreignWpAlerts.length,
        foreignVisa: foreignVisaAlerts.length,
        probation: probationAlerts.length,
        expired: expiredAlerts.length,
      },
      alerts: allAlerts,
      categories: {
        fdcNoticeAlerts,
        foreignWpAlerts,
        foreignVisaAlerts,
        probationAlerts,
        expiredAlerts,
      },
    });
  } catch (error: any) {
    console.error('Error calculating contract alerts:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contracts = await prisma.contract.findMany({
      where: {
        status: { not: 'TERMINATED' },
      },
      include: {
        employee: {
          select: {
            employeeId: true,
            firstNameKh: true,
            lastNameKh: true,
            firstNameEn: true,
            lastNameEn: true,
            department: true,
            position: true,
          },
        },
      },
    });

    const allAlerts: ContractAlertItem[] = [];
    contracts.forEach((c) => {
      const items = analyzeContractAlert(c);
      allAlerts.push(...items);
    });

    if (allAlerts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'ពុំមានកិច្ចសន្យា ឬប័ណ្ណការងារណាដែលត្រូវដាស់តឿននៅពេលនេះឡើយ។',
      });
    }

    // Build Telegram HTML Message
    let msg = `🚨 <b>ប្រព័ន្ធជូនដំណឹងឆ្លាតវៃ៖ កិច្ចសន្យា & ប័ណ្ណការងារ (Smart Alerts)</b>\n`;
    msg += `📅 កាលបរិច្ឆេទ៖ <code>${new Date().toISOString().split('T')[0]}</code>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    const fdcList = allAlerts.filter((a) => a.alertType === 'FDC_CRITICAL' || a.alertType === 'FDC_WARNING');
    if (fdcList.length > 0) {
      msg += `📌 <b>កិច្ចសន្យា FDC ត្រូវជូនដំណឹងជាមុន (១០-១៥ ថ្ងៃ):</b>\n`;
      fdcList.slice(0, 5).forEach((a, i) => {
        msg += `${i + 1}. <b>${a.employeeName}</b> (${a.employeeId})\n   • នៅសល់៖ <b>${a.daysRemaining} ថ្ងៃ</b> | ផុតកំណត់៖ ${a.targetDate}\n   • ដំណឹងតាមច្បាប់៖ <b>${a.statutoryNoticeDays} ថ្ងៃ</b> (មាត្រា ៧៣)\n`;
      });
      if (fdcList.length > 5) msg += `   <i>...និង ${fdcList.length - 5} នាក់ផ្សេងទៀត</i>\n`;
      msg += `\n`;
    }

    const foreignList = allAlerts.filter(
      (a) =>
        a.alertType === 'FOREIGN_WP_CRITICAL' ||
        a.alertType === 'FOREIGN_WP_WARNING' ||
        a.alertType === 'FOREIGN_VISA_CRITICAL' ||
        a.alertType === 'FOREIGN_VISA_WARNING'
    );
    if (foreignList.length > 0) {
      msg += `🌐 <b>បុគ្គលិកជនបរទេសត្រូវបន្ត Work Permit / Visa (៣០-៦០ ថ្ងៃ):</b>\n`;
      foreignList.slice(0, 5).forEach((a, i) => {
        msg += `${i + 1}. <b>${a.employeeName}</b> (${a.employeeId})\n   • ${a.titleKh}\n   • នៅសល់៖ <b>${a.daysRemaining} ថ្ងៃ</b> (ត្រៀមឯកសារ MLVT)\n`;
      });
      if (foreignList.length > 5) msg += `   <i>...និង ${foreignList.length - 5} នាក់ផ្សេងទៀត</i>\n`;
      msg += `\n`;
    }

    const expiredList = allAlerts.filter((a) => a.alertType === 'EXPIRED');
    if (expiredList.length > 0) {
      msg += `⚠️ <b>កិច្ចសន្យាបានផុតកំណត់ហើយ (${expiredList.length} នាក់):</b>\n`;
      expiredList.slice(0, 3).forEach((a, i) => {
        msg += `${i + 1}. ${a.employeeName} (${a.employeeId}) - ហួស ${Math.abs(a.daysRemaining)} ថ្ងៃ\n`;
      });
      msg += `\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👉 <i>សូមចូលទៅកាន់ប្រព័ន្ធ HRM ផ្នែកកិច្ចសន្យាការងារ ដើម្បីចាត់វិធានការ!</i>`;

    const sent = await sendTelegramNotification(msg);

    return NextResponse.json({
      success: true,
      telegramSent: sent,
      alertCount: allAlerts.length,
      message: sent
        ? 'បានផ្ញើសេចក្តីដាស់តឿនទៅកាន់ Telegram ក្រុមហ៊ុនដោយជោគជ័យ!'
        : 'បានស្វែងរកទិន្នន័យរួចរាល់ ប៉ុន្តែ Telegram Bot មិនទាន់បានកំណត់ Token ក្នុង Settings ឡើយ។',
    });
  } catch (error: any) {
    console.error('Error sending Telegram alert:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
