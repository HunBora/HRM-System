import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { candidateId } = await request.json();

    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { jobPosting: true }
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Generate unique employee ID like EMP-xxxx
    const count = await prisma.employee.count();
    const nextEmpCode = `EMP-${String(count + 1).padStart(4, '0')}`;

    // Create new Employee record from Candidate data
    const newEmployee = await prisma.employee.create({
      data: {
        employeeId: nextEmpCode,
        firstNameEn: candidate.firstName,
        lastNameEn: candidate.lastName,
        gender: 'OTHER',
        position: candidate.jobPosting?.title || 'Staff',
        department: candidate.jobPosting?.department || 'General',
        phone: candidate.phone || null,
        hireDate: new Date(),
        basicSalary: 0,
        status: 'ACTIVE',
        remark: `Converted from Candidate ATS (${candidate.id})`,
      }
    });

    // Update candidate status to HIRED
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        status: 'HIRED',
        notes: (candidate.notes ? candidate.notes + ' | ' : '') + `Converted to Employee ID: ${nextEmpCode}`,
      }
    });

    return NextResponse.json({
      success: true,
      message: `Candidate converted to employee successfully with ID ${nextEmpCode}`,
      employee: newEmployee
    });
  } catch (error: any) {
    console.error('Error converting candidate to employee:', error);
    return NextResponse.json({ error: error.message || 'Failed to convert candidate' }, { status: 500 });
  }
}
