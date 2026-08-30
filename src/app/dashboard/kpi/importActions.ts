'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import ExcelJS from 'exceljs';

export async function importEmployeeKpiExcel(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file || file.size === 0) {
    return { success: false, error: 'សូមជ្រើសរើសឯកសារ Excel (Please select an Excel file).' };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return { success: false, error: 'ឯកសារទទេ (Empty worksheet).' };
    }

    // Check where data starts (Row 7 for our standard export format with title headers, or Row 2 for simple header format)
    const a1Text = sheet.getCell('A1').text?.trim() || '';
    const dataStartRow = a1Text.includes('ក្រុមហ៊ុន') || a1Text.includes('EVERGREEN') ? 7 : 2;

    const employees = await prisma.employee.findMany({
      select: { id: true, employeeId: true }
    });
    const empMap = new Map(employees.map(e => [e.employeeId, e.id]));

    interface EmployeeKpiRow {
      empId: string;
      docDate: Date;
      kpiType: string;
      description: string | null;
      measurePercent: string | null;
      target: string | null;
      actual: number;
      status: string;
      tsRemark: string | null;
    }

    const rows: EmployeeKpiRow[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber < dataStartRow) return;

      const empId = row.getCell(1).text?.trim();
      if (!empId || empId === 'Employee ID' || empId === 'អត្តលេខ') return;

      const employeeDbId = empMap.get(empId);
      if (!employeeDbId) return; // Employee not found in DB

      // Extract date
      let docDate = new Date();
      const dateCell = row.getCell(4);
      if (dateCell.type === ExcelJS.ValueType.Date && dateCell.value) {
        docDate = dateCell.value as Date;
      } else if (dateCell.text) {
        const dateStr = dateCell.text.trim();
        if (dateStr.includes('-')) {
          const parts = dateStr.split('-');
          if (parts[0].length === 4) { // YYYY-MM-DD
            docDate = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
          }
        } else if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts[2].length === 4) { // DD/MM/YYYY
            docDate = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
          }
        }
      }
      if (isNaN(docDate.getTime())) docDate = new Date();

      const kpiType = row.getCell(5).text?.trim();
      if (!kpiType) return;

      const description = row.getCell(6).text?.trim() || null;
      const measurePercent = row.getCell(7).text?.trim() || null;
      const target = row.getCell(8).text?.trim() || null;
      
      const actualCell = row.getCell(9);
      let actual = 0;
      if (typeof actualCell.value === 'number') {
        actual = actualCell.value;
      } else if (actualCell.text) {
        actual = parseFloat(actualCell.text.trim()) || 0;
      }

      const statusText = row.getCell(10).text?.trim()?.toUpperCase() || 'PENDING';
      const status = ['APPROVED', 'REJECTED', 'PENDING'].includes(statusText) ? statusText : 'PENDING';
      const tsRemark = row.getCell(11).text?.trim() || null;

      rows.push({
        empId: employeeDbId,
        docDate,
        kpiType,
        description,
        measurePercent,
        target,
        actual,
        status,
        tsRemark
      });
    });

    let updatedCount = 0;
    let createdCount = 0;

    for (const item of rows) {
      const existing = await prisma.kpi.findFirst({
        where: {
          employeeId: item.empId,
          kpiType: item.kpiType,
          docDate: {
            gte: new Date(item.docDate.getFullYear(), item.docDate.getMonth(), 1),
            lt: new Date(item.docDate.getFullYear(), item.docDate.getMonth() + 1, 1)
          }
        }
      });

      if (existing) {
        await prisma.kpi.update({
          where: { id: existing.id },
          data: {
            actual: item.actual,
            status: item.status,
            description: item.description || existing.description,
            measurePercent: item.measurePercent || existing.measurePercent,
            target: item.target || existing.target,
            tsRemark: item.tsRemark || existing.tsRemark,
            docDate: item.docDate
          }
        });
        updatedCount++;
      } else {
        await prisma.kpi.create({
          data: {
            employeeId: item.empId,
            docDate: item.docDate,
            kpiType: item.kpiType,
            description: item.description,
            measurePercent: item.measurePercent,
            target: item.target,
            actual: item.actual,
            status: item.status,
            tsRemark: item.tsRemark
          }
        });
        createdCount++;
      }
    }

    revalidatePath('/dashboard/kpi');
    revalidatePath('/dashboard/kpi/approval');
    revalidatePath('/dashboard/kpi/matrix');
    revalidatePath('/dashboard/kpi/plan');

    return { success: true, updated: updatedCount, created: createdCount };
  } catch (error: any) {
    console.error('Error importing Employee KPI Excel:', error);
    return { success: false, error: 'បញ្ហាក្នុងការ Import ឯកសារ៖ ' + (error.message || 'Unknown error') };
  }
}

export async function importMasterKpiExcel(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file || file.size === 0) {
    return { success: false, error: 'សូមជ្រើសរើសឯកសារ Excel (Please select an Excel file).' };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return { success: false, error: 'ឯកសារទទេ (Empty worksheet).' };
    }

    const a1Text = sheet.getCell('A1').text?.trim() || '';
    const dataStartRow = a1Text.includes('ក្រុមហ៊ុន') || a1Text.includes('EVERGREEN') ? 7 : 2;

    const rows: { department: string; kpiType: string; description: string | null }[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber < dataStartRow) return;
      const department = row.getCell(1).text?.trim();
      const kpiType = row.getCell(2).text?.trim();
      const description = row.getCell(3).text?.trim() || null;

      if (department && kpiType && department !== 'Department' && kpiType !== 'KPI Type') {
        rows.push({ department, kpiType, description });
      }
    });

    for (const item of rows) {
      const existing = await prisma.masterKpi.findFirst({
        where: {
          department: item.department,
          kpiType: item.kpiType
        }
      });

      if (existing) {
        await prisma.masterKpi.update({
          where: { id: existing.id },
          data: { description: item.description || existing.description }
        });
      } else {
        await prisma.masterKpi.create({
          data: {
            department: item.department,
            kpiType: item.kpiType,
            description: item.description
          }
        });
      }
    }

    revalidatePath('/dashboard/kpi');
    revalidatePath('/dashboard/kpi/master');
    revalidatePath('/dashboard/kpi/setting');
    
    return { success: true, count: rows.length };
  } catch (error: any) {
    console.error('Error importing Master KPI Excel:', error);
    return { success: false, error: 'បញ្ហាក្នុងការ Import ឯកសារ៖ ' + (error.message || 'Unknown error') };
  }
}
