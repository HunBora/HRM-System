import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDayAttendanceMetrics } from '@/lib/attendanceCalculator';

// GET punch logs with filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const punchType = searchParams.get('punchType');
    const date = searchParams.get('date');

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (punchType && punchType !== 'ALL') where.punchType = punchType;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.punchTime = { gte: start, lte: end };
    }

    const logs = await prisma.biometricPunchLog.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstNameEn: true,
            lastNameEn: true,
            firstNameKh: true,
            lastNameKh: true,
            department: true,
            position: true,
            photoUrl: true,
          },
        },
        device: {
          select: {
            id: true,
            deviceName: true,
            deviceIp: true,
            location: true,
          },
        },
      },
      orderBy: { punchTime: 'desc' },
      take: 200,
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Error fetching punch logs:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 });
  }
}

// POST create punch log (single or bulk from Excel import)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if bulk insert
    if (Array.isArray(body.logs)) {
      const createdLogs = [];
      for (const item of body.logs) {
        let empId = item.employeeId;
        // If passed device card or employee ID code, find employee by employeeId
        if (item.empCode) {
          const emp = await prisma.employee.findFirst({
            where: {
              OR: [
                { employeeId: item.empCode },
                { cardNo: item.empCode },
              ],
            },
          });
          if (emp) empId = emp.id;
        }

        if (empId) {
          const log = await prisma.biometricPunchLog.create({
            data: {
              employeeId: empId,
              punchTime: item.punchTime ? new Date(item.punchTime) : new Date(),
              punchType: item.punchType || 'CHECK_IN',
              verifyMode: item.verifyMode || 'FINGERPRINT',
              deviceId: item.deviceId || null,
              deviceName: item.deviceName || 'USB Import / Terminal',
              source: item.source || 'EXCEL_IMPORT',
              syncStatus: 'SYNCED',
              notes: item.notes || null,
            },
          });
          createdLogs.push(log);
        }
      }

      return NextResponse.json({ success: true, count: createdLogs.length, logs: createdLogs });
    }

    // Check if Auto-Fill Month for an employee (bulk fill missing days)
    if (body.isAutoFillMonth) {
      const { employeeId, year, month, shiftMornIn = '07:00', shiftMornOut = '11:00', shiftAftIn = '13:00', shiftAftOut = '17:00', remarks = 'ភ្លេចស្កេន (បំពេញស្វ័យប្រវត្តិ)' } = body;
      if (!employeeId || !year || month === undefined) {
        return NextResponse.json({ error: 'employeeId, year and month are required' }, { status: 400 });
      }

      const daysInMonth = new Date(year, month + 1, 0).getDate();
      let filledCount = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        dateObj.setHours(0, 0, 0, 0);

        // Check if Sunday (off day)
        if (dateObj.getDay() === 0) continue;

        // Upsert DailyAttendance
        await prisma.dailyAttendance.upsert({
          where: {
            employeeId_date: {
              employeeId,
              date: dateObj,
            },
          },
          update: {
            fIn: shiftMornIn,
            fOut: shiftMornOut,
            sIn: shiftAftIn,
            sOut: shiftAftOut,
            regDay: 1.0,
            workHrs: 8.0,
            remarks,
          },
          create: {
            employeeId,
            date: dateObj,
            fIn: shiftMornIn,
            fOut: shiftMornOut,
            sIn: shiftAftIn,
            sOut: shiftAftOut,
            regDay: 1.0,
            workHrs: 8.0,
            remarks,
          },
        });

        // Also add biometric punch logs
        const dateStr = dateObj.toISOString().slice(0, 10);
        await prisma.biometricPunchLog.createMany({
          data: [
            { employeeId, punchTime: new Date(`${dateStr}T${shiftMornIn}:00`), punchType: 'CHECK_IN', verifyMode: 'MANUAL', source: 'MANUAL', notes: remarks },
            { employeeId, punchTime: new Date(`${dateStr}T${shiftMornOut}:00`), punchType: 'BREAK_OUT', verifyMode: 'MANUAL', source: 'MANUAL', notes: remarks },
            { employeeId, punchTime: new Date(`${dateStr}T${shiftAftIn}:00`), punchType: 'BREAK_IN', verifyMode: 'MANUAL', source: 'MANUAL', notes: remarks },
            { employeeId, punchTime: new Date(`${dateStr}T${shiftAftOut}:00`), punchType: 'CHECK_OUT', verifyMode: 'MANUAL', source: 'MANUAL', notes: remarks },
          ],
        });

        filledCount++;
      }

      return NextResponse.json({ success: true, count: filledCount, message: `បានបំពេញវត្តមានពេញខែចំនួន ${filledCount} ថ្ងៃដោយជោគជ័យ!` });
    }

    // Check if Full Day Manual Punch (Forgot Scan for Entire Day)
    if (body.isFullDay) {
      const {
        employeeId,
        date,
        fIn = '07:00',
        fOut = '11:00',
        sIn = '13:00',
        sOut = '17:00',
        otIn,
        otOut,
        regDay = 1.0,
        workHrs = 8.0,
        normalOtHrs = 0,
        nightOtHrs = 0,
        holidayOtHrs = 0,
        remarks = 'ភ្លេចស្កេន (បំពេញដោយដៃពេញមួយថ្ងៃ)',
      } = body;

      if (!employeeId || !date) {
        return NextResponse.json({ error: 'Employee and date are required' }, { status: 400 });
      }

      const dateObj = new Date(date);
      dateObj.setHours(0, 0, 0, 0);
      const dateStr = dateObj.toISOString().slice(0, 10);

      // 1. Create biometric punch logs
      const punchData: any[] = [];
      if (fIn) punchData.push({ employeeId, punchTime: new Date(`${dateStr}T${fIn}:00`), punchType: 'CHECK_IN', verifyMode: 'MANUAL', deviceName: 'Manual Full Day (HR)', source: 'MANUAL', syncStatus: 'SYNCED', notes: remarks });
      if (fOut) punchData.push({ employeeId, punchTime: new Date(`${dateStr}T${fOut}:00`), punchType: 'BREAK_OUT', verifyMode: 'MANUAL', deviceName: 'Manual Full Day (HR)', source: 'MANUAL', syncStatus: 'SYNCED', notes: remarks });
      if (sIn) punchData.push({ employeeId, punchTime: new Date(`${dateStr}T${sIn}:00`), punchType: 'BREAK_IN', verifyMode: 'MANUAL', deviceName: 'Manual Full Day (HR)', source: 'MANUAL', syncStatus: 'SYNCED', notes: remarks });
      if (sOut) punchData.push({ employeeId, punchTime: new Date(`${dateStr}T${sOut}:00`), punchType: 'CHECK_OUT', verifyMode: 'MANUAL', deviceName: 'Manual Full Day (HR)', source: 'MANUAL', syncStatus: 'SYNCED', notes: remarks });
      if (otIn) punchData.push({ employeeId, punchTime: new Date(`${dateStr}T${otIn}:00`), punchType: 'OT_IN', verifyMode: 'MANUAL', deviceName: 'Manual Full Day (HR)', source: 'MANUAL', syncStatus: 'SYNCED', notes: remarks });
      if (otOut) punchData.push({ employeeId, punchTime: new Date(`${dateStr}T${otOut}:00`), punchType: 'OT_OUT', verifyMode: 'MANUAL', deviceName: 'Manual Full Day (HR)', source: 'MANUAL', syncStatus: 'SYNCED', notes: remarks });

      if (punchData.length > 0) {
        await prisma.biometricPunchLog.createMany({ data: punchData });
      }

      // Auto-calculate all metrics using standard calculation engine
      const isSunday = dateObj.getDay() === 0;
      const metrics = calculateDayAttendanceMetrics(fIn, fOut, sIn, sOut, otIn, otOut, isSunday);

      const parsedNormalOt = parseFloat(String(normalOtHrs)) || 0;
      const parsedNightOt = parseFloat(String(nightOtHrs)) || 0;
      const parsedHolidayOt = parseFloat(String(holidayOtHrs)) || 0;
      const parsedRegDay = parseFloat(String(regDay)) || 0;
      const parsedWorkHrs = parseFloat(String(workHrs)) || 0;

      const computedNormalOt = parsedNormalOt > 0 ? parsedNormalOt : metrics.normalOtHrs;
      const computedNightOt = parsedNightOt > 0 ? parsedNightOt : metrics.nightOtHrs;
      const computedHolidayOt = parsedHolidayOt > 0 ? parsedHolidayOt : metrics.holidayOtHrs;
      const computedLateMins = (parseFloat(String(body.lateMins)) || 0) > 0 ? parseFloat(String(body.lateMins)) : metrics.lateMins;
      const computedEarlyMins = (parseFloat(String(body.earlyMins)) || 0) > 0 ? parseFloat(String(body.earlyMins)) : metrics.earlyMins;
      const computedWorkHrs = parsedWorkHrs > 0 ? parsedWorkHrs : metrics.workHrs;
      const computedRegDay = parsedRegDay > 0 ? parsedRegDay : metrics.regDay;

      // 2. Direct upsert DailyAttendance so attendance report immediately reflects all hours
      const updatedAttendance = await prisma.dailyAttendance.upsert({
        where: {
          employeeId_date: {
            employeeId,
            date: dateObj,
          },
        },
        update: {
          fIn: fIn || null,
          fOut: fOut || null,
          sIn: sIn || null,
          sOut: sOut || null,
          otIn: otIn || null,
          otOut: otOut || null,
          regDay: computedRegDay,
          workHrs: computedWorkHrs,
          normalOtHrs: computedNormalOt,
          nightOtHrs: computedNightOt,
          holidayOtHrs: computedHolidayOt,
          lateMins: computedLateMins,
          earlyMins: computedEarlyMins,
          remarks,
        },
        create: {
          employeeId,
          date: dateObj,
          fIn: fIn || null,
          fOut: fOut || null,
          sIn: sIn || null,
          sOut: sOut || null,
          otIn: otIn || null,
          otOut: otOut || null,
          regDay: computedRegDay,
          workHrs: computedWorkHrs,
          normalOtHrs: computedNormalOt,
          nightOtHrs: computedNightOt,
          holidayOtHrs: computedHolidayOt,
          lateMins: computedLateMins,
          earlyMins: computedEarlyMins,
          remarks,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'បានកត់ត្រាវត្តមានពេញមួយថ្ងៃដោយជោគជ័យ!',
        attendance: updatedAttendance,
        punchesCount: punchData.length,
      }, { status: 201 });
    }

    // Single creation
    const { employeeId, punchTime, punchType, verifyMode, deviceId, deviceName, notes } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee is required' }, { status: 400 });
    }

    const pTime = punchTime ? new Date(punchTime) : new Date();

    const newLog = await prisma.biometricPunchLog.create({
      data: {
        employeeId,
        punchTime: pTime,
        punchType: punchType || 'CHECK_IN',
        verifyMode: verifyMode || 'MANUAL',
        deviceId: deviceId || null,
        deviceName: deviceName || 'Manual Entry / Terminal',
        source: 'MANUAL',
        syncStatus: 'SYNCED',
        notes: notes || null,
      },
      include: {
        employee: true,
        device: true,
      },
    });

    // Also update DailyAttendance for this punch
    try {
      const dateOnly = new Date(pTime);
      dateOnly.setHours(0, 0, 0, 0);
      const timeStr = pTime.toTimeString().slice(0, 5); // "HH:MM"

      const existingAtt = await prisma.dailyAttendance.findUnique({
        where: {
          employeeId_date: {
            employeeId,
            date: dateOnly,
          },
        },
      });

      const updateData: any = {};
      if (punchType === 'CHECK_IN' && (!existingAtt || !existingAtt.fIn)) updateData.fIn = timeStr;
      if (punchType === 'BREAK_OUT' && (!existingAtt || !existingAtt.fOut)) updateData.fOut = timeStr;
      if (punchType === 'BREAK_IN' && (!existingAtt || !existingAtt.sIn)) updateData.sIn = timeStr;
      if (punchType === 'CHECK_OUT' && (!existingAtt || !existingAtt.sOut)) updateData.sOut = timeStr;
      if (punchType === 'OT_IN' && (!existingAtt || !existingAtt.otIn)) updateData.otIn = timeStr;
      if (punchType === 'OT_OUT' && (!existingAtt || !existingAtt.otOut)) updateData.otOut = timeStr;

      if (notes) updateData.remarks = notes;

      const combinedFIn = updateData.fIn || existingAtt?.fIn;
      const combinedFOut = updateData.fOut || existingAtt?.fOut;
      const combinedSIn = updateData.sIn || existingAtt?.sIn;
      const combinedSOut = updateData.sOut || existingAtt?.sOut;
      const combinedOtIn = updateData.otIn || existingAtt?.otIn;
      const combinedOtOut = updateData.otOut || existingAtt?.otOut;
      const isSunday = dateOnly.getDay() === 0;

      const singleMetrics = calculateDayAttendanceMetrics(
        combinedFIn,
        combinedFOut,
        combinedSIn,
        combinedSOut,
        combinedOtIn,
        combinedOtOut,
        isSunday
      );

      updateData.normalOtHrs = singleMetrics.normalOtHrs;
      updateData.nightOtHrs = singleMetrics.nightOtHrs;
      updateData.holidayOtHrs = singleMetrics.holidayOtHrs;
      updateData.lateMins = singleMetrics.lateMins;
      updateData.earlyMins = singleMetrics.earlyMins;
      updateData.workHrs = singleMetrics.workHrs;
      updateData.regDay = singleMetrics.regDay;

      if (Object.keys(updateData).length > 0) {
        await prisma.dailyAttendance.upsert({
          where: {
            employeeId_date: {
              employeeId,
              date: dateOnly,
            },
          },
          update: updateData,
          create: {
            employeeId,
            date: dateOnly,
            ...updateData,
          },
        });
      }
    } catch (e) {
      console.warn('Could not auto-sync daily attendance for single punch:', e);
    }

    return NextResponse.json(newLog, { status: 201 });
  } catch (error: any) {
    console.error('Error creating punch log:', error);
    return NextResponse.json({ error: error.message || 'Failed to create punch log' }, { status: 500 });
  }
}

// DELETE log
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Log ID required' }, { status: 400 });
    }

    await prisma.biometricPunchLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting punch log:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
