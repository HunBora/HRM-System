export interface ShiftConfig {
  shiftMornIn?: string; // default "07:00"
  shiftMornOut?: string; // default "11:00"
  shiftAftIn?: string; // default "13:00"
  shiftAftOut?: string; // default "17:00"
  nightShiftMornIn?: string; // default "17:00"
  nightShiftMornOut?: string; // default "22:00"
  nightShiftAftIn?: string; // default "23:00"
  nightShiftAftOut?: string; // default "04:00"
  nightOtStart?: string; // default "22:00"
}

export interface AttendanceMetricsResult {
  regDay: number;
  workHrs: number;
  normalOtHrs: number;
  nightOtHrs: number;
  holidayOtHrs: number;
  lateMins: number;
  earlyMins: number;
}

export function parseTimeToMinutes(timeStr?: string | null): number {
  if (!timeStr) return -1;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return -1;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return -1;
  return h * 60 + m;
}

export function calculateDayAttendanceMetrics(
  fIn?: string | null,
  fOut?: string | null,
  sIn?: string | null,
  sOut?: string | null,
  otIn?: string | null,
  otOut?: string | null,
  isOffDay: boolean = false,
  config?: ShiftConfig
): AttendanceMetricsResult {
  const mornInCfg = parseTimeToMinutes(config?.shiftMornIn || '07:00');
  const mornOutCfg = parseTimeToMinutes(config?.shiftMornOut || '11:00');
  const aftInCfg = parseTimeToMinutes(config?.shiftAftIn || '13:00');
  const aftOutCfg = parseTimeToMinutes(config?.shiftAftOut || '17:00');
  const nightOtStartCfg = parseTimeToMinutes(config?.nightOtStart || '22:00');

  const actualFIn = parseTimeToMinutes(fIn);
  const actualFOut = parseTimeToMinutes(fOut);
  const actualSIn = parseTimeToMinutes(sIn);
  const actualSOut = parseTimeToMinutes(sOut);
  const actualOtIn = parseTimeToMinutes(otIn);
  const actualOtOut = parseTimeToMinutes(otOut);

  let regDay = 0;
  let workHrs = 0;
  let normalOtHrs = 0;
  let nightOtHrs = 0;
  let holidayOtHrs = 0;
  let lateMins = 0;
  let earlyMins = 0;

  // 1. Calculate Late Minutes
  if (actualFIn >= 0 && actualFIn > mornInCfg) {
    lateMins += actualFIn - mornInCfg;
  }
  if (actualSIn >= 0 && actualSIn > aftInCfg) {
    lateMins += actualSIn - aftInCfg;
  }

  // 2. Calculate Early Leave Minutes
  if (actualFOut >= 0 && actualFOut < mornOutCfg) {
    earlyMins += mornOutCfg - actualFOut;
  }
  if (actualSOut >= 0 && actualSOut < aftOutCfg) {
    earlyMins += aftOutCfg - actualSOut;
  }

  // 3. Calculate Regular Work Hours (Morning + Afternoon)
  let mornMins = 0;
  if (actualFIn >= 0 && actualFOut >= 0 && actualFOut > actualFIn) {
    mornMins = Math.max(0, Math.min(actualFOut, mornOutCfg) - Math.max(actualFIn, mornInCfg));
  } else if (actualFIn >= 0 && actualFIn <= mornInCfg + 30) {
    // If only checked in morning with no out, default to 4h if afternoon out exists
    if (actualSOut >= 0) mornMins = 4 * 60;
  }

  let aftMins = 0;
  if (actualSIn >= 0 && actualSOut >= 0 && actualSOut > actualSIn) {
    aftMins = Math.max(0, Math.min(actualSOut, aftOutCfg) - Math.max(actualSIn, aftInCfg));
  } else if (actualSOut >= 0 && actualSOut >= aftOutCfg - 30) {
    if (actualFIn >= 0) aftMins = 4 * 60;
  }

  // Standard 2-punch scenario (fIn and sOut only)
  if (actualFIn >= 0 && actualSOut >= 0 && actualFOut < 0 && actualSIn < 0) {
    let spanMins = Math.max(0, actualSOut - actualFIn);
    // Deduct 2 hours lunch break (11:00 to 13:00)
    if (spanMins >= 6 * 60) spanMins -= 2 * 60;
    workHrs = Math.min(8.0, Math.round((spanMins / 60) * 10) / 10);
  } else {
    workHrs = Math.round(((mornMins + aftMins) / 60) * 10) / 10;
  }

  // If both morning and afternoon completed normally (e.g. 07:00, 11:00, 13:00, 17:00)
  if (
    actualFIn >= 0 &&
    actualFOut >= 0 &&
    actualSIn >= 0 &&
    actualSOut >= 0 &&
    workHrs === 0
  ) {
    workHrs = 8.0;
  }

  if (isOffDay) {
    // On Sundays or Public Holidays, regular hours count as Holiday Overtime!
    holidayOtHrs += workHrs;
    workHrs = 0;
    regDay = 0;
  } else {
    if (workHrs >= 7.0) {
      regDay = 1.0;
    } else if (workHrs >= 3.5) {
      regDay = 0.5;
    } else {
      regDay = 0.0;
    }
  }

  // 4. Calculate Overtime (OT)
  let totalOtMins = 0;

  // Case A: Explicit OT punches (OT-In and OT-Out)
  if (actualOtIn >= 0 && actualOtOut >= 0) {
    let outM = actualOtOut;
    if (outM < actualOtIn) outM += 24 * 60; // crossed midnight
    totalOtMins += Math.max(0, outM - actualOtIn);
  }

  // Case B: If no explicit OT punches, but sOut stayed past shift end (17:00)
  if (actualOtIn < 0 && actualSOut > aftOutCfg) {
    totalOtMins += actualSOut - aftOutCfg;
  }

  // Split Overtime into Normal, Night, and Holiday
  if (totalOtMins > 0) {
    const otStartMinutes = actualOtIn >= 0 ? actualOtIn : aftOutCfg;
    let otEndMinutes = otStartMinutes + totalOtMins;

    if (isOffDay) {
      // All OT on Sunday or Holiday is Holiday OT
      holidayOtHrs += Math.round((totalOtMins / 60) * 10) / 10;
    } else {
      // Split between Normal OT (before 22:00) and Night OT (after 22:00)
      if (otEndMinutes > nightOtStartCfg) {
        const nightStart = Math.max(otStartMinutes, nightOtStartCfg);
        const nightMins = otEndMinutes - nightStart;
        const normMins = Math.max(0, nightStart - otStartMinutes);

        nightOtHrs += Math.round((nightMins / 60) * 10) / 10;
        normalOtHrs += Math.round((normMins / 60) * 10) / 10;
      } else {
        normalOtHrs += Math.round((totalOtMins / 60) * 10) / 10;
      }
    }
  }

  return {
    regDay: parseFloat(regDay.toFixed(1)),
    workHrs: parseFloat(workHrs.toFixed(1)),
    normalOtHrs: parseFloat(normalOtHrs.toFixed(1)),
    nightOtHrs: parseFloat(nightOtHrs.toFixed(1)),
    holidayOtHrs: parseFloat(holidayOtHrs.toFixed(1)),
    lateMins,
    earlyMins,
  };
}
