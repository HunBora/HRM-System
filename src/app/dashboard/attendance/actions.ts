'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import ExcelJS from 'exceljs';

const HOLIDAYS: Record<string, string> = {
  '1-1': 'ទិវាចូលឆ្នាំសកល',
  '1-7': 'ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍',
  '3-8': 'ទិវានារីអន្តរជាតិ',
  '4-14': 'បុណ្យចូលឆ្នាំខ្មែរ',
  '4-15': 'បុណ្យចូលឆ្នាំខ្មែរ',
  '4-16': 'បុណ្យចូលឆ្នាំខ្មែរ',
  '5-1': 'ទិវាពលកម្មអន្តរជាតិ',
  '5-14': 'ព្រះរាជពិធីចម្រើនព្រះជន្ម ព្រះមហាក្សត្រ',
  '5-31': 'ពិធីបុណ្យវិសាខបូជា', 
  '6-4': 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល',
  '9-24': 'ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ',
  '10-9': 'ពិធីបុណ្យភ្ជុំបិណ្ឌ',
  '10-10': 'ពិធីបុណ្យភ្ជុំបិណ្ឌ',
  '10-11': 'ពិធីបុណ្យភ្ជុំបិណ្ឌ',
  '10-15': 'ទិវាប្រារព្ធព្រះបរមរតនកោដ្ឋ',
  '10-29': 'ព្រះរាជពិធីគ្រងព្រះបរមរាជសម្បត្តិ',
  '11-9': 'ទិវាបុណ្យឯករាជ្យជាតិ',
  '11-23': 'ព្រះរាជពិធីបុណ្យអុំទូក',
  '11-24': 'ព្រះរាជពិធីបុណ្យអុំទូក',
  '11-25': 'ព្រះរាជពិធីបុណ្យអុំទូក',
};

function timeToMins(timeStr: string, isNightShift: boolean = false): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length !== 2) return 0;
  let mins = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  
  // For night shifts, any time before 12:00 PM (noon) is considered the next day (+24 hours)
  if (isNightShift && mins < 12 * 60) {
    mins += 24 * 60;
  }
  return mins;
}

function detectNightShift(fIn: string, fOut: string, sIn: string, sOut: string): boolean {
  const firstPunch = fIn || fOut || sIn || sOut;
  if (!firstPunch) return false;
  
  const parts = firstPunch.split(':');
  if (parts.length === 2) {
    const hours = parseInt(parts[0], 10);
    // If the first punch is at 2 PM (14:00) or later, it's considered a night shift
    if (hours >= 14) return true;
  }
  return false;
}

function calculateAttendanceMetrics(
  fIn: string, fOut: string, sIn: string, sOut: string, isOffDay: boolean,
  shiftMornIn: string = '07:00', shiftMornOut: string = '11:00',
  shiftAftIn: string = '13:00', shiftAftOut: string = '17:00', nightOtStart: string = '22:00',
  isNightShift: boolean = false
) {
  // Standard Shift Constants (can be adjusted)
  const SHIFT_MORN_IN = timeToMins(shiftMornIn, isNightShift);
  const SHIFT_MORN_OUT = timeToMins(shiftMornOut, isNightShift);
  const SHIFT_AFT_IN = timeToMins(shiftAftIn, isNightShift);
  const SHIFT_AFT_OUT = timeToMins(shiftAftOut, isNightShift);
  const NIGHT_OT_START = timeToMins(nightOtStart, isNightShift);

  const actualFIn = fIn ? timeToMins(fIn, isNightShift) : 0;
  const actualFOut = fOut ? timeToMins(fOut, isNightShift) : 0;
  const actualSIn = sIn ? timeToMins(sIn, isNightShift) : 0;
  const actualSOut = sOut ? timeToMins(sOut, isNightShift) : 0;

  let regDay = 0, workHrs = 0, normalOtHrs = 0, nightOtHrs = 0, holidayOtHrs = 0, lateMins = 0, earlyMins = 0;

  if (isOffDay) {
    const mornMins = Math.max(0, (actualFOut || 0) - (actualFIn || 0));
    const aftMins = Math.max(0, (actualSOut || 0) - (actualSIn || 0));
    holidayOtHrs = parseFloat(((mornMins + aftMins) / 60).toFixed(2));
  } else {
    // 1. Calculate Late / Early
    if (actualFIn > 0 && actualFIn > SHIFT_MORN_IN) lateMins += (actualFIn - SHIFT_MORN_IN);
    if (actualSIn > 0 && actualSIn > SHIFT_AFT_IN) lateMins += (actualSIn - SHIFT_AFT_IN);
    
    if (actualFOut > 0 && actualFOut < SHIFT_MORN_OUT) earlyMins += (SHIFT_MORN_OUT - actualFOut);
    if (actualSOut > 0 && actualSOut < SHIFT_AFT_OUT) earlyMins += (SHIFT_AFT_OUT - actualSOut);

    // 2. Calculate Work Hrs (within shift boundaries)
    let mornWork = 0;
    if (actualFIn > 0 && actualFOut > 0) {
      mornWork = Math.max(0, Math.min(actualFOut, SHIFT_MORN_OUT) - Math.max(actualFIn, SHIFT_MORN_IN));
    }
    let aftWork = 0;
    if (actualSIn > 0 && actualSOut > 0) {
      aftWork = Math.max(0, Math.min(actualSOut, SHIFT_AFT_OUT) - Math.max(actualSIn, SHIFT_AFT_IN));
    }
    workHrs = parseFloat(((mornWork + aftWork) / 60).toFixed(2));
    regDay = parseFloat(Math.min(1, workHrs / 8).toFixed(2));

    // 3. Calculate OT (Normal & Night)
    let normalOtMins = 0;
    let nightMins = 0;

    // Morning OT (before shift starts)
    if (actualFIn > 0 && actualFIn < SHIFT_MORN_IN) {
      normalOtMins += Math.min(actualFOut || SHIFT_MORN_IN, SHIFT_MORN_IN) - actualFIn;
    }
    // Lunch OT from Morning shift (working past morning shift)
    if (actualFOut > SHIFT_MORN_OUT) {
      normalOtMins += actualFOut - Math.max(actualFIn, SHIFT_MORN_OUT);
    }
    // Lunch OT from Afternoon shift (working before afternoon shift starts)
    if (actualSIn > 0 && actualSIn < SHIFT_AFT_IN) {
      normalOtMins += Math.min(actualSOut || SHIFT_AFT_IN, SHIFT_AFT_IN) - actualSIn;
    }
    // Evening OT (after shift ends)
    if (actualSOut > SHIFT_AFT_OUT) {
      const eveStart = Math.max(actualSIn || SHIFT_AFT_OUT, SHIFT_AFT_OUT);
      if (actualSOut > eveStart) {
        if (actualSOut > NIGHT_OT_START) {
          const nightStart = Math.max(eveStart, NIGHT_OT_START);
          nightMins += (actualSOut - nightStart);
          normalOtMins += (nightStart - eveStart);
        } else {
          normalOtMins += (actualSOut - eveStart);
        }
      }
    }

    normalOtHrs = parseFloat((normalOtMins / 60).toFixed(2));
    nightOtHrs = parseFloat((nightMins / 60).toFixed(2));
  }

  return { regDay, workHrs, normalOtHrs, nightOtHrs, holidayOtHrs, lateMins, earlyMins };
}

// Function for processing uploaded fingerprint CSV/Excel
export async function processFingerprintData(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const fileName = file.name.toLowerCase();
    
    interface RecordType { empId: string; dateStr: string; fIn: string; fOut: string; sIn: string; sOut: string }
    const records: RecordType[] = [];

    if (fileName.endsWith('.csv')) {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      // Expected: EmpID, Date, F-In, F-Out, S-In, S-Out
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.trim());
        if (parts.length >= 2) {
          records.push({
            empId: parts[0],
            dateStr: parts[1],
            fIn: parts[2] || '',
            fOut: parts[3] || '',
            sIn: parts[4] || '',
            sOut: parts[5] || ''
          });
        }
      }
    } else if (fileName.endsWith('.xlsx')) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.worksheets[0];
      
      let isExportFormat = false;
      let exportFormatEmpId = '';
      
      const extractTime = (cell: ExcelJS.Cell): string => {
        if (!cell || cell.value === null || cell.value === undefined) return '';
        
        if (cell.type === ExcelJS.ValueType.Date) {
          const d = cell.value as Date;
          const hh = String(d.getUTCHours()).padStart(2, '0');
          const mm = String(d.getUTCMinutes()).padStart(2, '0');
          return `${hh}:${mm}`;
        }
        
        let text = cell.text?.trim() || '';
        if (!text && cell.value) {
          text = cell.value.toString().trim();
        }
        
        if (text.includes('1899') || text.includes('GMT') || text.includes('Time')) {
          const match = text.match(/\b(\d{1,2}):(\d{2})(:\d{2})?\b/);
          if (match) {
            return `${match[1].padStart(2, '0')}:${match[2]}`;
          }
        }
        return text;
      };

      sheet.eachRow((row, rowNumber) => {
        // Detect if it's the "Attendance Log" export format
        if (rowNumber === 1) {
          const a1Text = row.getCell(1).text?.trim() || '';
          if (a1Text.includes('ឈ្មោះ-Name:') || a1Text.includes('ឈ្មោះ (Name):') || a1Text.includes('EmpID-Name')) {
            isExportFormat = true;
          }
          // If it's the old format, ID is on row 1
          if (a1Text.includes('EmpID-Name')) {
            const match = a1Text.match(/:\s*([^\/]+)\s*\//);
            if (match && match[1]) {
              exportFormatEmpId = match[1].trim();
            }
          }
        }
        // If it's the new format, ID is on row 2
        if (rowNumber === 2 && isExportFormat) {
          const a2Text = row.getCell(1).text?.trim() || '';
          if (a2Text.includes('លេខកាត-ID No:') || a2Text.includes('អត្តលេខ (ID-NO):')) {
            const match = a2Text.match(/:\s*(.+)$/);
            if (match && match[1]) {
              exportFormatEmpId = match[1].trim();
            }
          }
        }

        if (isExportFormat) {
          // New format data starts at 8, old format data starts at 7
          const a2Text = row.getCell(1).text?.trim() || '';
          const dataStartRow = (a2Text.includes('លេខកាត-ID No:') || a2Text.includes('អត្តលេខ (ID-NO):')) ? 8 : 7;
          // But actually we can just check if rowNumber >= 7 and skip non-date rows
          if (rowNumber >= 7) { 
            let dateStr = row.getCell(2).text?.trim();
            
            // Handle Excel date objects
            if (row.getCell(2).type === ExcelJS.ValueType.Date) {
               const d = row.getCell(2).value as Date;
               dateStr = d.toISOString().split('T')[0];
            }

            if (exportFormatEmpId && dateStr && dateStr !== '') {
              // Usually dateStr is DD-MM-YY, we will handle that below in the date parsing
              // But if it's "សរុប-Total", it will skip later since it's an invalid date
              records.push({
                empId: exportFormatEmpId,
                dateStr,
                fIn: extractTime(row.getCell(4)),
                fOut: extractTime(row.getCell(5)),
                sIn: extractTime(row.getCell(6)),
                sOut: extractTime(row.getCell(7))
              });
            }
          }
        } else {
          // Standard generic format: Row 1 is header
          if (rowNumber > 1) { 
            const empId = row.getCell(1).text?.trim();
            let dateStr = row.getCell(2).text?.trim();
            
            // Handle Excel date objects
            if (row.getCell(2).type === ExcelJS.ValueType.Date) {
               const d = row.getCell(2).value as Date;
               dateStr = d.toISOString().split('T')[0];
            }

            if (empId && dateStr) {
              records.push({
                empId,
                dateStr,
                fIn: extractTime(row.getCell(3)),
                fOut: extractTime(row.getCell(4)),
                sIn: extractTime(row.getCell(5)),
                sOut: extractTime(row.getCell(6))
              });
            }
          }
        }
      });
    } else {
      throw new Error('Unsupported file format. Please upload CSV or XLSX.');
    }

    // Process parsed records
    for (const rec of records) {
      if (!rec.empId || !rec.dateStr) continue;
      
      const employee = await prisma.employee.findUnique({
        where: { employeeId: rec.empId }
      });
      
      if (employee) {
        // Fix date string if it's like DD/MM/YYYY or DD-MM-YY
        let isoDate = rec.dateStr;
        if (rec.dateStr.includes('/')) {
          const parts = rec.dateStr.split('/');
          if (parts[2].length === 4) { // DD/MM/YYYY
            isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        } else if (rec.dateStr.includes('-')) {
          const parts = rec.dateStr.split('-');
          if (parts[2] && parts[2].length === 2) { // DD-MM-YY
            isoDate = `20${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
        
        const date = new Date(isoDate);
        if (isNaN(date.getTime())) continue; // Skip invalid dates
        
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        // Determine if off day
        const dayName = dateOnly.toLocaleDateString('en-US', { weekday: 'short' });
        const isWeekend = dayName === 'Sun';
        const isHoliday = !!HOLIDAYS[`${dateOnly.getMonth() + 1}-${dateOnly.getDate()}`];
        const isOffDay = isWeekend || isHoliday;
        
        let settings = {
          shiftMornIn: '07:00',
          shiftMornOut: '11:00',
          shiftAftIn: '13:00',
          shiftAftOut: '17:00',
          nightShiftMornIn: '17:00',
          nightShiftMornOut: '22:00',
          nightShiftAftIn: '23:00',
          nightShiftAftOut: '04:00',
          nightOtStart: '22:00'
        };

        try {
          const pSettings = await (prisma as any).companySettings?.findUnique({ where: { id: 'default' } });
          if (pSettings) {
            settings = { ...settings, ...pSettings };
          } else if ((prisma as any).companySettings) {
            const newSettings = await (prisma as any).companySettings.create({ data: { id: 'default' } });
            settings = { ...settings, ...newSettings };
          }
        } catch (e) {
          console.warn('CompanySettings table not generated yet, using defaults');
        }
        
        const isNightShift = detectNightShift(rec.fIn, rec.fOut, rec.sIn, rec.sOut);
        
        let shiftMornIn, shiftMornOut, shiftAftIn, shiftAftOut;
        if (isNightShift) {
           shiftMornIn = settings.nightShiftMornIn;
           shiftMornOut = settings.nightShiftMornOut;
           shiftAftIn = settings.nightShiftAftIn;
           shiftAftOut = settings.nightShiftAftOut;
        } else {
           shiftMornIn = settings.shiftMornIn;
           shiftMornOut = settings.shiftMornOut;
           shiftAftIn = settings.shiftAftIn;
           shiftAftOut = settings.shiftAftOut;
        }

        const metrics = calculateAttendanceMetrics(
          rec.fIn, rec.fOut, rec.sIn, rec.sOut, isOffDay,
          shiftMornIn, shiftMornOut, shiftAftIn, shiftAftOut, settings.nightOtStart, isNightShift
        );
        
        await prisma.dailyAttendance.upsert({
          where: {
            employeeId_date: {
              employeeId: employee.id,
              date: dateOnly
            }
          },
          update: {
            fIn: rec.fIn || null,
            fOut: rec.fOut || null,
            sIn: rec.sIn || null,
            sOut: rec.sOut || null,
            regDay: metrics.regDay,
            workHrs: metrics.workHrs,
            normalOtHrs: metrics.normalOtHrs,
            nightOtHrs: metrics.nightOtHrs,
            holidayOtHrs: metrics.holidayOtHrs,
            lateMins: metrics.lateMins,
            earlyMins: metrics.earlyMins,
          },
          create: {
            employeeId: employee.id,
            date: dateOnly,
            fIn: rec.fIn || null,
            fOut: rec.fOut || null,
            sIn: rec.sIn || null,
            sOut: rec.sOut || null,
            regDay: metrics.regDay,
            workHrs: metrics.workHrs,
            normalOtHrs: metrics.normalOtHrs,
            nightOtHrs: metrics.nightOtHrs,
            holidayOtHrs: metrics.holidayOtHrs,
            lateMins: metrics.lateMins,
            earlyMins: metrics.earlyMins,
          }
        });
      }
    }
    
    revalidatePath('/dashboard/attendance');
    return { success: true };
  } catch (error) {
    console.error('Failed to process fingerprint data:', error);
    return { success: false, error: 'Upload failed' };
  }
}
