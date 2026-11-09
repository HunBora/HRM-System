export const CAMBODIA_TIMEZONE = 'Asia/Phnom_Penh';

/**
 * Returns formatted 24-hour "HH:MM" in Cambodia timezone (Asia/Phnom_Penh, UTC+7)
 */
export function getCambodiaTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-GB', {
    timeZone: CAMBODIA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Returns formatted 24-hour "HH:MM:SS" in Cambodia timezone
 */
export function getCambodiaTimeWithSeconds(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-GB', {
    timeZone: CAMBODIA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Returns formatted 12-hour "hh:mm AM/PM" in Cambodia timezone
 */
export function getCambodiaTime12(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    timeZone: CAMBODIA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Returns formatted "YYYY-MM-DD" in Cambodia timezone
 */
export function getCambodiaDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', {
    timeZone: CAMBODIA_TIMEZONE,
  });
}

/**
 * Returns hours and minutes in Cambodia timezone as numbers
 */
export function getCambodiaHoursMinutes(date: Date = new Date()): { hours: number; minutes: number; totalMinutes: number } {
  const timeStr = getCambodiaTime(date); // "HH:MM"
  const [hStr, mStr] = timeStr.split(':');
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  return {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
  };
}

/**
 * Returns UTC Date object representing start of day (midnight 00:00:00) for the Cambodia calendar date
 */
export function getCambodiaStartOfDay(date: Date = new Date()): Date {
  const dateStr = getCambodiaDate(date); // "YYYY-MM-DD"
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}
