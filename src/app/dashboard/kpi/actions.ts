'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function submitKpi(formData: FormData) {
  const employeeId = formData.get('employeeId') as string;
  const docDateStr = formData.get('docDate') as string;
  const kpiType = formData.get('kpiType') as string;
  const description = formData.get('description') as string;
  const measurePercent = formData.get('measurePercent') as string;
  const target = formData.get('target') as string;
  const actualStr = formData.get('actual') as string;
  const tsStart = formData.get('tsStart') as string;
  const tsEnd = formData.get('tsEnd') as string;
  const tsTotalHoursStr = formData.get('tsTotalHours') as string;
  const tsRemark = formData.get('tsRemark') as string;
  
  if (!employeeId || !kpiType || !docDateStr) {
    redirect('/dashboard/kpi/setting?error=missing_fields');
  }

  const docDate = new Date(docDateStr);
  const actual = parseFloat(actualStr) || 0;
  const tsTotalHours = tsTotalHoursStr ? parseFloat(tsTotalHoursStr) : null;

  try {
    await prisma.kpi.create({
      data: {
        employeeId,
        docDate,
        kpiType,
        description,
        measurePercent,
        target,
        actual,
        tsStart,
        tsEnd,
        tsTotalHours,
        tsRemark,
      }
    });

    revalidatePath('/dashboard/kpi/setting');
    revalidatePath('/dashboard/kpi');
    
  } catch (error) {
    console.error('Error submitting KPI:', error);
    // Don't return an object, just redirect on error
    redirect('/dashboard/kpi/setting?error=db_error');
  }
  
  // If success:
  redirect('/dashboard/kpi');
}

export async function updateKpiStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;

  if (!id || !status) return;

  try {
    await prisma.kpi.update({
      where: { id },
      data: { status }
    });
    
    revalidatePath('/dashboard/kpi/approval');
    revalidatePath('/dashboard/kpi');
  } catch (error) {
    console.error('Error updating KPI status:', error);
  }
}
