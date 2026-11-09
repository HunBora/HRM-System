import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';
import { getCambodiaTime, getCambodiaStartOfDay, getCambodiaHoursMinutes } from '@/lib/timezone';

export const DEFAULT_COMPANY_LAT = 11.5564;
export const DEFAULT_COMPANY_LNG = 104.9282;
export const DEFAULT_GEO_RADIUS_METERS = 500; // 500 meters
export const QR_ROTATION_INTERVAL_SEC = 25;

export async function getCompanyGeoSettings() {
  const settings = await prisma.companySettings.findUnique({
    where: { id: 'default' },
  });
  return {
    companyLat: (settings as any)?.companyLat ?? DEFAULT_COMPANY_LAT,
    companyLng: (settings as any)?.companyLng ?? DEFAULT_COMPANY_LNG,
    geoRadiusMeters: (settings as any)?.geoRadiusMeters ?? DEFAULT_GEO_RADIUS_METERS,
    geoFenceEnabled: (settings as any)?.geoFenceEnabled !== false,
  };
}

export interface ClockInResult {
  success: boolean;
  message: string;
  punchType: 'CHECK_IN' | 'CHECK_OUT';
  punchTime: string;
  employeeName: string;
  method: 'QR_DYNAMIC' | 'GPS_MOBILE';
  distanceMeters?: number;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Generate a rotating time-slotted QR token for Kiosk mode
 */
export function generateDynamicQrToken(): { token: string; expiresAt: number; intervalSec: number } {
  const now = Date.now();
  const slot = Math.floor(now / (QR_ROTATION_INTERVAL_SEC * 1000));
  const payload = {
    s: slot,
    t: now,
    c: 'GSTextileGarment_HRM',
  };
  const token = Buffer.from(JSON.stringify(payload)).toString('base64');
  return {
    token,
    expiresAt: (slot + 1) * QR_ROTATION_INTERVAL_SEC * 1000,
    intervalSec: QR_ROTATION_INTERVAL_SEC,
  };
}

/**
 * Verify incoming QR token
 */
export function verifyDynamicQrToken(token: string): { valid: boolean; error?: string } {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(raw);
    if (!data.t || data.s === undefined) {
      return { valid: false, error: 'ទម្រង់ QR មិនត្រឹមត្រូវ (Invalid QR format)' };
    }
    const now = Date.now();
    // Allow up to 45 seconds tolerance for camera lag & mobile time drift
    const ageMs = Math.abs(now - data.t);
    if (ageMs > 45 * 1000) {
      return { valid: false, error: 'QR Code នេះផុតកំណត់ហើយ សូមស្កេនម្តងទៀត (QR Expired, please rescan)' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'មិនអាចផ្ទៀងផ្ទាត់ QR Code បានទេ' };
  }
}

/**
 * Process a mobile punch (QR or GPS) and update PunchLog + DailyAttendance
 */
export async function processMobileClockIn(params: {
  employeeId: string;
  method: 'QR_DYNAMIC' | 'GPS_MOBILE';
  qrToken?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}): Promise<ClockInResult> {
  const { employeeId, method, qrToken, latitude, longitude, accuracy } = params;

  // 1. Fetch Employee
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new Error('រកមិនឃើញទិន្នន័យបុគ្គលិកនេះទេ (Employee not found)');
  }

  // 2. Validate QR Method
  if (method === 'QR_DYNAMIC') {
    if (!qrToken) {
      throw new Error('សូមស្កេន QR Code របស់ក្រុមហ៊ុន!');
    }
    const check = verifyDynamicQrToken(qrToken);
    if (!check.valid) {
      throw new Error(check.error || 'QR Code មិនត្រឹមត្រូវ');
    }
  }

  // 3. Validate GPS Method
  let distanceMeters: number | undefined;
  if (method === 'GPS_MOBILE') {
    if (latitude === undefined || longitude === undefined) {
      throw new Error('មិនអាចចាប់យកទីតាំង GPS បានទេ សូមបើក GPS លើទូរស័ព្ទរបស់អ្នក!');
    }
    const geo = await getCompanyGeoSettings();
    distanceMeters = calculateHaversineDistance(
      geo.companyLat,
      geo.companyLng,
      latitude,
      longitude
    );
    if (geo.geoFenceEnabled && distanceMeters > geo.geoRadiusMeters) {
      throw new Error(
        `អ្នកនៅក្រៅបរិវេណក្រុមហ៊ុន (~${distanceMeters} ម៉ែត្រ)! ចម្ងាយអនុញ្ញាតគឺត្រឹម ${geo.geoRadiusMeters} ម៉ែត្រពីទីតាំងរោងចក្រ/ក្រុមហ៊ុន។`
      );
    }
  }

  // 4. Compute Punch Time and Type in Cambodia Timezone (Asia/Phnom_Penh, UTC+7)
  const now = new Date();
  const timeStr = getCambodiaTime(now); // "HH:MM" e.g. "19:20"
  const startOfDay = getCambodiaStartOfDay(now);

  const existingAttendance = await prisma.dailyAttendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: employee.id,
        date: startOfDay,
      },
    },
  });

  const isFirstPunch = !existingAttendance || !existingAttendance.fIn;
  const punchType: 'CHECK_IN' | 'CHECK_OUT' = isFirstPunch ? 'CHECK_IN' : 'CHECK_OUT';

  // 5. Create BiometricPunchLog
  await prisma.biometricPunchLog.create({
    data: {
      employeeId: employee.id,
      punchTime: now,
      punchType,
      verifyMode: method,
      deviceName: method === 'QR_DYNAMIC' ? 'Gate QR Kiosk' : 'Mobile GPS Geo-Fence',
      source: method,
      syncStatus: 'SYNCED',
      notes:
        method === 'GPS_MOBILE'
          ? `GPS: ${latitude?.toFixed(5)}, ${longitude?.toFixed(5)} (~${distanceMeters}m)`
          : `Dynamic QR Scan (${punchType})`,
    },
  });

  // 6. Upsert DailyAttendance
  if (isFirstPunch) {
    // Check if late (after 08:00 AM) using Cambodia local time
    const { totalMinutes } = getCambodiaHoursMinutes(now);
    const standardStartMinutes = 8 * 60; // 08:00
    const lateMins = Math.max(0, totalMinutes - standardStartMinutes);

    await prisma.dailyAttendance.upsert({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: startOfDay,
        },
      },
      update: {
        fIn: timeStr,
        lateMins,
        workHrs: 4.0,
        regDay: 0.5,
        remarks: `Clock-In via ${method}`,
      },
      create: {
        employeeId: employee.id,
        date: startOfDay,
        fIn: timeStr,
        lateMins,
        workHrs: 4.0,
        regDay: 0.5,
        remarks: `Clock-In via ${method}`,
      },
    });
  } else {
    // Compute total work hours between fIn and sOut using Cambodia local time
    const [inHours, inMins] = (existingAttendance.fIn || '08:00').split(':').map(Number);
    const inTotalMins = inHours * 60 + inMins;
    const { totalMinutes: outTotalMins } = getCambodiaHoursMinutes(now);
    const diffMins = Math.max(0, outTotalMins - inTotalMins);
    let totalWorkHours = Math.round((diffMins / 60) * 10) / 10;
    if (totalWorkHours > 5) {
      totalWorkHours = Math.max(0, totalWorkHours - 1); // 1h lunch deduction
    }

    await prisma.dailyAttendance.update({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: startOfDay,
        },
      },
      data: {
        sOut: timeStr,
        workHrs: totalWorkHours,
        regDay: totalWorkHours >= 7 ? 1.0 : totalWorkHours >= 4 ? 0.5 : 0.25,
        remarks: `${existingAttendance.remarks || ''} | Out via ${method}`,
      },
    });
  }

  const empKh = `${employee.firstNameKh || ''} ${employee.lastNameKh || ''}`.trim();
  const empEn = `${employee.firstNameEn || ''} ${employee.lastNameEn || ''}`.trim();
  const empName = empKh || empEn;

  // 7. Optional Telegram Alert on Mobile Punch
  const methodLabel = method === 'QR_DYNAMIC' ? '📷 QR Code Kiosk' : '📍 Mobile GPS Geo-Fence';
  const punchLabel = punchType === 'CHECK_IN' ? '🟢 ចូលធ្វើការ (CHECK-IN)' : '🔴 ចេញពីធ្វើការ (CHECK-OUT)';
  const msg = `⚡ <b>កត់ត្រាវត្តមានថ្មី (Attendance Punch)</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>បុគ្គលិក:</b> ${empName} (${employee.employeeId})
📌 <b>ផ្នែក:</b> ${employee.department}
⏱ <b>ម៉ោង:</b> <b>${timeStr}</b> (${punchLabel})
🛠 <b>មធ្យោបាយ:</b> ${methodLabel}
${distanceMeters !== undefined ? `📍 <b>ចម្ងាយ GPS:</b> ~${distanceMeters} ម៉ែត្រ\n` : ''}━━━━━━━━━━━━━━━━━━━━`;

  sendTelegramNotification(msg).catch((e) => console.error('Error sending telegram clock-in log:', e));

  return {
    success: true,
    message: `បានកត់ត្រាវត្តមាន ${punchLabel} ជោគជ័យនៅម៉ោង ${timeStr}!`,
    punchType,
    punchTime: timeStr,
    employeeName: empName,
    method,
    distanceMeters,
  };
}
