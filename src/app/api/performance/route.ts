import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Calculate grade from overall score
function calculateGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// GET: ទទួលបានទិន្នន័យវាយតម្លៃការងារ (Performance Appraisals)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const period = searchParams.get('period');
    const department = searchParams.get('department');
    const grade = searchParams.get('grade');
    const status = searchParams.get('status');

    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (period && period !== 'ALL') {
      where.period = period;
    }

    if (grade && grade !== 'ALL') {
      where.grade = grade;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (department && department !== 'ALL') {
      where.employee = {
        department: department
      };
    }

    const appraisals = await prisma.performanceAppraisal.findMany({
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
            position: true,
            department: true,
            line: true,
            photoUrl: true,
          }
        }
      },
      orderBy: { reviewDate: 'desc' }
    });

    return NextResponse.json(appraisals);
  } catch (error: any) {
    console.error('Error fetching appraisals:', error);
    return NextResponse.json({ error: 'Failed to fetch performance appraisals' }, { status: 500 });
  }
}

// POST: បង្កើត ឬ Upsert ការវាយតម្លៃការងារថ្មី (Create Appraisal)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      employeeId,
      period,
      reviewDate,
      reviewerName,
      workQualityScore,
      productivityScore,
      teamworkScore,
      skillKnowledgeScore,
      disciplineScore,
      strengths,
      improvements,
      recommendation,
      remarks,
      status,
    } = body;

    if (!employeeId || !period) {
      return NextResponse.json({ error: 'Employee and Period are required' }, { status: 400 });
    }

    const wq = Number(workQualityScore) || 80;
    const pr = Number(productivityScore) || 80;
    const tw = Number(teamworkScore) || 80;
    const sk = Number(skillKnowledgeScore) || 80;
    const dc = Number(disciplineScore) || 80;

    const overallScore = Math.round(((wq + pr + tw + sk + dc) / 5) * 10) / 10;
    const grade = calculateGrade(overallScore);

    const appraisal = await prisma.performanceAppraisal.upsert({
      where: {
        employeeId_period: {
          employeeId,
          period,
        }
      },
      update: {
        reviewDate: reviewDate ? new Date(reviewDate) : new Date(),
        reviewerName: reviewerName || 'HR / Dept Manager',
        workQualityScore: wq,
        productivityScore: pr,
        teamworkScore: tw,
        skillKnowledgeScore: sk,
        disciplineScore: dc,
        overallScore,
        grade,
        strengths: strengths || null,
        improvements: improvements || null,
        recommendation: recommendation || 'MAINTAIN',
        remarks: remarks || null,
        status: status || 'SUBMITTED',
      },
      create: {
        employeeId,
        period,
        reviewDate: reviewDate ? new Date(reviewDate) : new Date(),
        reviewerName: reviewerName || 'HR / Dept Manager',
        workQualityScore: wq,
        productivityScore: pr,
        teamworkScore: tw,
        skillKnowledgeScore: sk,
        disciplineScore: dc,
        overallScore,
        grade,
        strengths: strengths || null,
        improvements: improvements || null,
        recommendation: recommendation || 'MAINTAIN',
        remarks: remarks || null,
        status: status || 'SUBMITTED',
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstNameEn: true,
            lastNameEn: true,
            firstNameKh: true,
            lastNameKh: true,
            position: true,
            department: true,
          }
        }
      }
    });

    return NextResponse.json(appraisal, { status: 201 });
  } catch (error: any) {
    console.error('Error saving appraisal:', error);
    return NextResponse.json({ error: 'Failed to save appraisal record' }, { status: 500 });
  }
}

// PUT: កែប្រែព័ត៌មានវាយតម្លៃ
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      reviewDate,
      reviewerName,
      workQualityScore,
      productivityScore,
      teamworkScore,
      skillKnowledgeScore,
      disciplineScore,
      strengths,
      improvements,
      recommendation,
      remarks,
      status,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const wq = Number(workQualityScore) || 80;
    const pr = Number(productivityScore) || 80;
    const tw = Number(teamworkScore) || 80;
    const sk = Number(skillKnowledgeScore) || 80;
    const dc = Number(disciplineScore) || 80;

    const overallScore = Math.round(((wq + pr + tw + sk + dc) / 5) * 10) / 10;
    const grade = calculateGrade(overallScore);

    const updated = await prisma.performanceAppraisal.update({
      where: { id },
      data: {
        reviewDate: reviewDate ? new Date(reviewDate) : undefined,
        reviewerName: reviewerName !== undefined ? reviewerName : undefined,
        workQualityScore: wq,
        productivityScore: pr,
        teamworkScore: tw,
        skillKnowledgeScore: sk,
        disciplineScore: dc,
        overallScore,
        grade,
        strengths: strengths !== undefined ? strengths : undefined,
        improvements: improvements !== undefined ? improvements : undefined,
        recommendation: recommendation !== undefined ? recommendation : undefined,
        remarks: remarks !== undefined ? remarks : undefined,
        status: status || undefined,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstNameEn: true,
            lastNameEn: true,
            firstNameKh: true,
            lastNameKh: true,
            position: true,
            department: true,
          }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating appraisal:', error);
    return NextResponse.json({ error: 'Failed to update appraisal' }, { status: 500 });
  }
}

// DELETE: លុបការវាយតម្លៃ
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.performanceAppraisal.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Appraisal deleted' });
  } catch (error: any) {
    console.error('Error deleting appraisal:', error);
    return NextResponse.json({ error: 'Failed to delete appraisal' }, { status: 500 });
  }
}
