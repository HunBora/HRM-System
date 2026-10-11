import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/database/backup -> Exports all tables as JSON backup
export async function GET() {
  try {
    const [
      companySettings,
      departmentGroups,
      employees,
      users,
      dailyAttendance,
      monthlyAttendance,
      leaveRequests,
      overtimeRequests,
      payrolls,
      advanceSalaries,
      employeeLoans,
      jobPostings,
      candidates,
      terminations,
      exitInterviews,
      biometricDevices,
      biometricPunchLogs,
      shiftRosters,
      masterKpis,
      kpis,
      performanceAppraisals,
      disciplinaryActions,
      trainingPrograms,
      trainingEnrollments,
      documents,
      employeeDocuments,
      companyAssets,
      expenseClaims,
      certificateRequests,
      companyAnnouncements,
      auditLogs
    ] = await Promise.all([
      prisma.companySettings.findMany(),
      prisma.departmentGroup.findMany(),
      prisma.employee.findMany(),
      prisma.user.findMany(),
      prisma.dailyAttendance.findMany(),
      prisma.monthlyAttendance.findMany(),
      prisma.leaveRequest.findMany(),
      prisma.overtimeRequest.findMany(),
      prisma.payroll.findMany(),
      prisma.advanceSalary.findMany(),
      prisma.employeeLoan.findMany(),
      prisma.jobPosting.findMany(),
      prisma.candidate.findMany(),
      prisma.termination.findMany(),
      prisma.exitInterview.findMany(),
      prisma.biometricDevice.findMany(),
      prisma.biometricPunchLog.findMany(),
      prisma.shiftRoster.findMany(),
      prisma.masterKpi.findMany(),
      prisma.kpi.findMany(),
      prisma.performanceAppraisal.findMany(),
      prisma.disciplinaryAction.findMany(),
      prisma.trainingProgram.findMany(),
      prisma.trainingEnrollment.findMany(),
      prisma.document.findMany(),
      prisma.employeeDocument.findMany(),
      prisma.companyAsset.findMany(),
      prisma.expenseClaim.findMany(),
      prisma.certificateRequest.findMany(),
      prisma.companyAnnouncement.findMany(),
      prisma.auditLog.findMany()
    ]);

    const backupPayload = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      source: 'HRM_ENTERPRISE_SYSTEM',
      data: {
        companySettings,
        departmentGroups,
        employees,
        users,
        dailyAttendance,
        monthlyAttendance,
        leaveRequests,
        overtimeRequests,
        payrolls,
        advanceSalaries,
        employeeLoans,
        jobPostings,
        candidates,
        terminations,
        exitInterviews,
        biometricDevices,
        biometricPunchLogs,
        shiftRosters,
        masterKpis,
        kpis,
        performanceAppraisals,
        disciplinaryActions,
        trainingPrograms,
        trainingEnrollments,
        documents,
        employeeDocuments,
        companyAssets,
        expenseClaims,
        certificateRequests,
        companyAnnouncements,
        auditLogs
      }
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `hrm_full_backup_${dateStr}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error: any) {
    console.error('Backup API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
