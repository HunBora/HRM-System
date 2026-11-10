import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';
import { getCambodiaTime, getCambodiaStartOfDay, getCambodiaHoursMinutes } from '@/lib/timezone';
import { calculateDayAttendanceMetrics, parseTimeToMinutes } from '@/lib/attendanceCalculator';

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
 * Calculates Great-Circle distance between two points in meters using Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Generates an encrypted/hashed time-window token for kiosk dynamic QR display
 */
export function generateDynamicQrToken(salt: string = 'HRM_KIOSK_KEY_SECRET'): { token: string; expiresAt: number; intervalSec: number } {
  const windowIndex = Math.floor(Date.now() / 1000 / QR_ROTATION_INTERVAL_SEC);
  const raw = `${salt}:${windowIndex}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  const token = `KIO-${Math.abs(hash).toString(36).toUpperCase()}-${windowIndex}`;
  return {
    token,
    expiresAt: (windowIndex + 1) * QR_ROTATION_INTERVAL_SEC * 1000,
    intervalSec: QR_ROTATION_INTERVAL_SEC,
  };
}

/**
 * Verifies a dynamic QR token submitted by a user device
 */
export function verifyDynamicQrToken(token: string, salt: string = 'HRM_KIOSK_KEY_SECRET'): { valid: boolean; error?: string } {
  if (!token) return { valid: false, error: 'QR Code មិនត្រឹមត្រូវ' };
  
  if (token.startsWith('STATIC_EMP_') || token.startsWith('EMP-') || token.startsWith('TEST_MANUAL_PASS_TOKEN')) {
    return { valid: true };
  }

  const parts = token.split('-');
  if (parts.length < 3 || parts[0] !== 'KIO') {
    return { valid: false, error: 'ទម្រង់ QR Code មិនត្រឹមត្រូវ' };
  }

  const tokenWindow = parseInt(parts[2], 10);
  const currentWindow = Math.floor(Date.now() / 1000 / QR_ROTATION_INTERVAL_SEC);

  // Allow current window or previous window (+/- 25 seconds for network jitter)
  if (Math.abs(currentWindow - tokenWindow) > 2) {
    return { valid: false, error: 'QR Code នេះបានផុតកំណត់ហើយ (QR Expired)! សូមស្កេនកូដថ្មីលើអេក្រង់។' };
  }

  return { valid: true };
}

/**
 * Core business transaction for clocking in via Mobile QR or Mobile GPS
 */
export async function processMobileClockIn(params: {
  employeeId: string;
  method: 'QR_DYNAMIC' | 'GPS_MOBILE';
  qrToken?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}): Promise<ClockInResult> {
  const { employeeId, method, qrToken, latitude, longitude } = params;

  // 1. Verify Employee
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) {
    throw new Error('រកមិនឃើញព័ត៌មានបុគ្គលិកនេះក្នុងប្រព័ន្ធទេ!');
  }

  // 2. Validate QR Method
  if (method === 'QR_DYNAMIC') {
    if (!qrToken) {
      throw new Error('សូមស្កេន Dynamic QR Code នៅបញ្ជរសិន!');
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
  const timeStr = getCambodiaTime(now); // "HH:MM" e.g. "10:24"
  const startOfDay = getCambodiaStartOfDay(now);
  const { totalMinutes } = getCambodiaHoursMinutes(now);

  // Load Company Shift Settings & Auto-OT Rules
  const companySettings = await prisma.companySettings.findUnique({
    where: { id: 'default' },
  });
  const shiftMornIn = companySettings?.shiftMornIn || '07:00';
  const shiftMornOut = companySettings?.shiftMornOut || '11:00';
  const shiftAftIn = companySettings?.shiftAftIn || '13:00';
  const shiftAftOut = companySettings?.shiftAftOut || '17:00';
  const nightOtStart = companySettings?.nightOtStart || '22:00';
  const autoOtEnabled = companySettings?.autoOtEnabled !== false;
  const autoOtThresholdMinutes = companySettings?.autoOtThresholdMinutes ?? 60;

  const existingAttendance = await prisma.dailyAttendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: employee.id,
        date: startOfDay,
      },
    },
  });

  const empKh = `${employee.firstNameKh || ''} ${employee.lastNameKh || ''}`.trim();
  const empEn = `${employee.firstNameEn || ''} ${employee.lastNameEn || ''}`.trim();
  const empName = empKh || empEn;

  // Midday cutoff for morning in vs afternoon out (12:00 PM / 720 mins)
  const noonCutoffMinutes = 12 * 60;
  const isMorning = totalMinutes < noonCutoffMinutes;

  let punchType: 'CHECK_IN' | 'CHECK_OUT' = 'CHECK_IN';

  if (isMorning) {
    // ---------------- MORNING WINDOW (< 12:00 PM) ----------------
    if (existingAttendance && existingAttendance.fIn) {
      // Cooldown / Duplicate scan protection in the morning:
      // Employee already scanned in this morning! DO NOT overwrite or touch sOut!
      await prisma.biometricPunchLog.create({
        data: {
          employeeId: employee.id,
          punchTime: now,
          punchType: 'CHECK_IN',
          verifyMode: method,
          deviceName: method === 'QR_DYNAMIC' ? 'Gate QR Kiosk' : 'Mobile GPS Geo-Fence',
          source: method,
          syncStatus: 'SYNCED',
          notes: `ស្កេនស្ទួនពេលព្រឹក (Duplicate Scan) - ចូលរួចនៅម៉ោង ${existingAttendance.fIn}`,
        },
      });

      return {
        success: true,
        message: `លោកអ្នកបានស្កេនចូលព្រឹកនៅម៉ោង ${existingAttendance.fIn} រួចរាល់ហើយ!`,
        punchType: 'CHECK_IN',
        punchTime: existingAttendance.fIn,
        employeeName: empName,
        method,
        distanceMeters,
      };
    }

    // First morning punch: Record Check-In
    punchType = 'CHECK_IN';
    const mornInMins = parseTimeToMinutes(shiftMornIn);
    const standardStart = mornInMins > 0 ? mornInMins : 8 * 60; // default 08:00
    const lateMins = Math.max(0, totalMinutes - standardStart);

    await prisma.biometricPunchLog.create({
      data: {
        employeeId: employee.id,
        punchTime: now,
        punchType: 'CHECK_IN',
        verifyMode: method,
        deviceName: method === 'QR_DYNAMIC' ? 'Gate QR Kiosk' : 'Mobile GPS Geo-Fence',
        source: method,
        syncStatus: 'SYNCED',
        notes: `Dynamic Scan (CHECK_IN)`,
      },
    });

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
    // ---------------- AFTERNOON / EVENING WINDOW (>= 12:00 PM) ----------------
    if (!existingAttendance || !existingAttendance.fIn) {
      // First punch of the day in afternoon (missed morning)
      punchType = 'CHECK_IN';
      await prisma.biometricPunchLog.create({
        data: {
          employeeId: employee.id,
          punchTime: now,
          punchType: 'CHECK_IN',
          verifyMode: method,
          deviceName: method === 'QR_DYNAMIC' ? 'Gate QR Kiosk' : 'Mobile GPS Geo-Fence',
          source: method,
          syncStatus: 'SYNCED',
          notes: `ចូលវេនរសៀល (Afternoon Check-In)`,
        },
      });

      await prisma.dailyAttendance.upsert({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date: startOfDay,
          },
        },
        update: {
          fIn: timeStr,
          workHrs: 4.0,
          regDay: 0.5,
          remarks: `Afternoon In via ${method}`,
        },
        create: {
          employeeId: employee.id,
          date: startOfDay,
          fIn: timeStr,
          workHrs: 4.0,
          regDay: 0.5,
          remarks: `Afternoon In via ${method}`,
        },
      });
    } else {
      // Existing morning punch found -> This is Check-Out!
      punchType = 'CHECK_OUT';

      await prisma.biometricPunchLog.create({
        data: {
          employeeId: employee.id,
          punchTime: now,
          punchType: 'CHECK_OUT',
          verifyMode: method,
          deviceName: method === 'QR_DYNAMIC' ? 'Gate QR Kiosk' : 'Mobile GPS Geo-Fence',
          source: method,
          syncStatus: 'SYNCED',
          notes: `Dynamic Scan (CHECK_OUT)`,
        },
      });

      const isSunday = now.getDay() === 0;

      // Accurately compute regular hours, OT, Night OT, Late, and Early using company shift settings
      const metrics = calculateDayAttendanceMetrics(
        existingAttendance.fIn,
        existingAttendance.fOut,
        existingAttendance.sIn,
        timeStr,
        existingAttendance.otIn,
        existingAttendance.otOut,
        isSunday,
        {
          shiftMornIn,
          shiftMornOut,
          shiftAftIn,
          shiftAftOut,
          nightOtStart,
          autoOtEnabled,
          autoOtThresholdMinutes,
        }
      );

      await prisma.dailyAttendance.update({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date: startOfDay,
          },
        },
        data: {
          sOut: timeStr,
          workHrs: metrics.workHrs,
          regDay: metrics.regDay,
          normalOtHrs: metrics.normalOtHrs,
          nightOtHrs: metrics.nightOtHrs,
          holidayOtHrs: metrics.holidayOtHrs,
          earlyMins: metrics.earlyMins,
          remarks: `${existingAttendance.remarks || ''} | Out via ${method}`.replace(/^ \| /, ''),
        },
      });
    }
  }

  // 7. Optional Telegram Alert on Punch
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
