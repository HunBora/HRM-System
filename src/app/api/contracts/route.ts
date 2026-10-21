import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    const where: any = {};
    if (employeeId) {
      where.employeeId = employeeId;
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstNameKh: true,
            lastNameKh: true,
            firstNameEn: true,
            lastNameEn: true,
            gender: true,
            dob: true,
            nationalId: true,
            position: true,
            department: true,
            address: true,
            nationality: true,
            basicSalary: true,
            hireDate: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, contracts });
  } catch (error: any) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      employeeId,
      contractNo,
      contractType,
      status,
      signedAtLocation,
      signedDate,
      startDate,
      endDate,
      companyNameKh,
      companyNameEn,
      companyNameZh,
      companyAddress,
      representative,
      representativeRole,
      positionTitle,
      department,
      workplace,
      basicSalaryUsd,
      basicSalaryKhr,
      paymentDay,
      paymentMethod,
      workingHours,
      mealBreak,
      workingDays,
      probationCategory,
      severancePercent,
      isForeigner,
      passportNo,
      passportExpiry,
      visaNo,
      visaExpiry,
      workPermitNo,
      workPermitExpiry,
      customClausesJson,
      notes,
    } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee is required' }, { status: 400 });
    }

    // Auto-generate Contract No if missing
    let finalContractNo = contractNo;
    if (!finalContractNo) {
      const prefix = contractType === 'PROBATION' ? 'HR-PRB' : contractType === 'UDC' ? 'HR-UDC' : contractType === 'FOREIGN_FDC' ? 'HR-EXP' : 'HR-FDC';
      const year = new Date().getFullYear();
      const count = await prisma.contract.count();
      finalContractNo = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    const dataPayload: any = {
      contractNo: finalContractNo,
      employeeId,
      contractType: contractType || 'FDC',
      status: status || 'ACTIVE',
      signedAtLocation: signedAtLocation || 'Phnom Penh',
      signedDate: signedDate ? new Date(signedDate) : new Date(),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      companyNameKh: companyNameKh || null,
      companyNameEn: companyNameEn || null,
      companyNameZh: companyNameZh || null,
      companyAddress: companyAddress || null,
      representative: representative || null,
      representativeRole: representativeRole || null,
      positionTitle: positionTitle || 'Employee',
      department: department || 'General',
      workplace: workplace || null,
      basicSalaryUsd: Number(basicSalaryUsd) || 0,
      basicSalaryKhr: Number(basicSalaryKhr) || 0,
      paymentDay: paymentDay || '01-05',
      paymentMethod: paymentMethod || 'Bank Transfer',
      workingHours: workingHours || '07:00 - 11:00 / 13:00 - 17:00',
      mealBreak: mealBreak || '11:00 - 13:00',
      workingDays: workingDays || 'ច័ន្ទ ដល់ សៅរ៍ / Monday to Saturday / 周一至周六',
      probationCategory: probationCategory || null,
      severancePercent: Number(severancePercent) || 5,
      isForeigner: Boolean(isForeigner),
      passportNo: passportNo || null,
      passportExpiry: passportExpiry ? new Date(passportExpiry) : null,
      visaNo: visaNo || null,
      visaExpiry: visaExpiry ? new Date(visaExpiry) : null,
      workPermitNo: workPermitNo || null,
      workPermitExpiry: workPermitExpiry ? new Date(workPermitExpiry) : null,
      customClausesJson: typeof customClausesJson === 'string' ? customClausesJson : (customClausesJson ? JSON.stringify(customClausesJson) : null),
      notes: notes || null,
    };

    let contract;
    if (id) {
      contract = await prisma.contract.update({
        where: { id },
        data: dataPayload,
        include: {
          employee: true,
        },
      });
    } else {
      contract = await prisma.contract.create({
        data: dataPayload,
        include: {
          employee: true,
        },
      });
    }

    return NextResponse.json({ success: true, contract });
  } catch (error: any) {
    console.error('Error saving contract:', error);
    return NextResponse.json({ error: error.message || 'Failed to save contract' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }

    await prisma.contract.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Contract deleted' });
  } catch (error: any) {
    console.error('Error deleting contract:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete contract' }, { status: 500 });
  }
}
