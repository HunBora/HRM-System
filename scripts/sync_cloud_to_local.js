// Script to clone all data from Cloud DB to Local PostgreSQL (HRM_DB01)
const { PrismaClient } = require('@prisma/client');

const cloudPrisma = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://neondb_owner:npg_xom7sfW8iEuh@ep-delicate-cloud-avf0ld3m-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require' }
  }
});

const localPrisma = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://postgres:123@127.0.0.1:5432/HRM_DB01' }
  }
});

async function syncAllData() {
  console.log('🔄 Starting full sync from Cloud Neon DB to Local HRM_DB01...');

  try {
    // 1. Company Settings
    const settings = await cloudPrisma.companySettings.findMany();
    for (const s of settings) {
      await localPrisma.companySettings.upsert({
        where: { id: s.id },
        update: s,
        create: s
      });
    }
    console.log(`✅ CompanySettings synced (${settings.length})`);

    // 2. Department Groups
    const deptGroups = await cloudPrisma.departmentGroup.findMany();
    for (const d of deptGroups) {
      await localPrisma.departmentGroup.upsert({
        where: { id: d.id },
        update: d,
        create: d
      });
    }
    console.log(`✅ DepartmentGroups synced (${deptGroups.length})`);

    // 3. Employees
    const employees = await cloudPrisma.employee.findMany();
    for (const emp of employees) {
      await localPrisma.employee.upsert({
        where: { id: emp.id },
        update: emp,
        create: emp
      });
    }
    console.log(`✅ Employees synced (${employees.length})`);

    // 4. Users
    const users = await cloudPrisma.user.findMany();
    for (const u of users) {
      await localPrisma.user.upsert({
        where: { id: u.id },
        update: u,
        create: u
      });
    }
    console.log(`✅ Users synced (${users.length})`);

    // 5. Daily Attendance
    const attendances = await cloudPrisma.dailyAttendance.findMany();
    for (const a of attendances) {
      await localPrisma.dailyAttendance.upsert({
        where: { id: a.id },
        update: a,
        create: a
      });
    }
    console.log(`✅ DailyAttendance synced (${attendances.length})`);

    // 6. Monthly Attendance
    const monthlyAtt = await cloudPrisma.monthlyAttendance.findMany();
    for (const m of monthlyAtt) {
      await localPrisma.monthlyAttendance.upsert({
        where: { id: m.id },
        update: m,
        create: m
      });
    }
    console.log(`✅ MonthlyAttendance synced (${monthlyAtt.length})`);

    // 7. Leave Requests
    const leaves = await cloudPrisma.leaveRequest.findMany();
    for (const l of leaves) {
      await localPrisma.leaveRequest.upsert({
        where: { id: l.id },
        update: l,
        create: l
      });
    }
    console.log(`✅ LeaveRequests synced (${leaves.length})`);

    // 8. Overtime Requests
    const overtimes = await cloudPrisma.overtimeRequest.findMany();
    for (const o of overtimes) {
      await localPrisma.overtimeRequest.upsert({
        where: { id: o.id },
        update: o,
        create: o
      });
    }
    console.log(`✅ OvertimeRequests synced (${overtimes.length})`);

    // 9. Payrolls
    const payrolls = await cloudPrisma.payroll.findMany();
    for (const p of payrolls) {
      await localPrisma.payroll.upsert({
        where: { id: p.id },
        update: p,
        create: p
      });
    }
    console.log(`✅ Payrolls synced (${payrolls.length})`);

    // 10. Advance Salary
    const advances = await cloudPrisma.advanceSalary.findMany();
    for (const adv of advances) {
      await localPrisma.advanceSalary.upsert({
        where: { id: adv.id },
        update: adv,
        create: adv
      });
    }
    console.log(`✅ AdvanceSalary synced (${advances.length})`);

    // 11. Employee Loans
    const loans = await cloudPrisma.employeeLoan.findMany();
    for (const ln of loans) {
      await localPrisma.employeeLoan.upsert({
        where: { id: ln.id },
        update: ln,
        create: ln
      });
    }
    console.log(`✅ EmployeeLoans synced (${loans.length})`);

    // 12. Job Postings FIRST (before Candidates)
    const jobs = await cloudPrisma.jobPosting.findMany();
    for (const j of jobs) {
      await localPrisma.jobPosting.upsert({
        where: { id: j.id },
        update: j,
        create: j
      });
    }
    console.log(`✅ JobPostings synced (${jobs.length})`);

    // 13. Candidates
    const candidates = await cloudPrisma.candidate.findMany();
    for (const c of candidates) {
      await localPrisma.candidate.upsert({
        where: { id: c.id },
        update: c,
        create: c
      });
    }
    console.log(`✅ Candidates synced (${candidates.length})`);

    // 14. Terminations & Exit Interviews
    const terminations = await cloudPrisma.termination.findMany();
    for (const t of terminations) {
      await localPrisma.termination.upsert({
        where: { id: t.id },
        update: t,
        create: t
      });
    }
    console.log(`✅ Terminations synced (${terminations.length})`);

    const exitInterviews = await cloudPrisma.exitInterview.findMany();
    for (const e of exitInterviews) {
      await localPrisma.exitInterview.upsert({
        where: { id: e.id },
        update: e,
        create: e
      });
    }
    console.log(`✅ ExitInterviews synced (${exitInterviews.length})`);

    // 15. Biometric Devices & Punch Logs
    const devices = await cloudPrisma.biometricDevice.findMany();
    for (const dev of devices) {
      await localPrisma.biometricDevice.upsert({
        where: { id: dev.id },
        update: dev,
        create: dev
      });
    }
    console.log(`✅ BiometricDevices synced (${devices.length})`);

    const punchLogs = await cloudPrisma.biometricPunchLog.findMany();
    for (const punch of punchLogs) {
      await localPrisma.biometricPunchLog.upsert({
        where: { id: punch.id },
        update: punch,
        create: punch
      });
    }
    console.log(`✅ BiometricPunchLogs synced (${punchLogs.length})`);

    // 16. Shift Rosters
    const rosters = await cloudPrisma.shiftRoster.findMany();
    for (const r of rosters) {
      await localPrisma.shiftRoster.upsert({
        where: { id: r.id },
        update: r,
        create: r
      });
    }
    console.log(`✅ ShiftRosters synced (${rosters.length})`);

    // 17. Master KPIs then KPIs
    const masterKpis = await cloudPrisma.masterKpi.findMany();
    for (const mk of masterKpis) {
      await localPrisma.masterKpi.upsert({
        where: { id: mk.id },
        update: mk,
        create: mk
      });
    }
    console.log(`✅ MasterKpis synced (${masterKpis.length})`);

    const kpis = await cloudPrisma.kpi.findMany();
    for (const kp of kpis) {
      await localPrisma.kpi.upsert({
        where: { id: kp.id },
        update: kp,
        create: kp
      });
    }
    console.log(`✅ Kpis synced (${kpis.length})`);

    // 18. Performance Appraisals
    const appraisals = await cloudPrisma.performanceAppraisal.findMany();
    for (const app of appraisals) {
      await localPrisma.performanceAppraisal.upsert({
        where: { id: app.id },
        update: app,
        create: app
      });
    }
    console.log(`✅ PerformanceAppraisals synced (${appraisals.length})`);

    // 19. Disciplinary Actions
    const actions = await cloudPrisma.disciplinaryAction.findMany();
    for (const act of actions) {
      await localPrisma.disciplinaryAction.upsert({
        where: { id: act.id },
        update: act,
        create: act
      });
    }
    console.log(`✅ DisciplinaryActions synced (${actions.length})`);

    // 20. Training Programs & Enrollments
    const programs = await cloudPrisma.trainingProgram.findMany();
    for (const prog of programs) {
      await localPrisma.trainingProgram.upsert({
        where: { id: prog.id },
        update: prog,
        create: prog
      });
    }
    console.log(`✅ TrainingPrograms synced (${programs.length})`);

    const enrollments = await cloudPrisma.trainingEnrollment.findMany();
    for (const enr of enrollments) {
      await localPrisma.trainingEnrollment.upsert({
        where: { id: enr.id },
        update: enr,
        create: enr
      });
    }
    console.log(`✅ TrainingEnrollments synced (${enrollments.length})`);

    // 21. Documents & Employee Documents
    const docs = await cloudPrisma.document.findMany();
    for (const doc of docs) {
      await localPrisma.document.upsert({
        where: { id: doc.id },
        update: doc,
        create: doc
      });
    }
    console.log(`✅ Documents synced (${docs.length})`);

    const empDocs = await cloudPrisma.employeeDocument.findMany();
    for (const edoc of empDocs) {
      await localPrisma.employeeDocument.upsert({
        where: { id: edoc.id },
        update: edoc,
        create: edoc
      });
    }
    console.log(`✅ EmployeeDocuments synced (${empDocs.length})`);

    // 22. Company Assets
    const assets = await cloudPrisma.companyAsset.findMany();
    for (const asset of assets) {
      await localPrisma.companyAsset.upsert({
        where: { id: asset.id },
        update: asset,
        create: asset
      });
    }
    console.log(`✅ CompanyAssets synced (${assets.length})`);

    // 23. Expense Claims
    const expenses = await cloudPrisma.expenseClaim.findMany();
    for (const exp of expenses) {
      await localPrisma.expenseClaim.upsert({
        where: { id: exp.id },
        update: exp,
        create: exp
      });
    }
    console.log(`✅ ExpenseClaims synced (${expenses.length})`);

    // 24. Certificate Requests
    const certs = await cloudPrisma.certificateRequest.findMany();
    for (const cert of certs) {
      await localPrisma.certificateRequest.upsert({
        where: { id: cert.id },
        update: cert,
        create: cert
      });
    }
    console.log(`✅ CertificateRequests synced (${certs.length})`);

    // 25. Company Announcements
    const announcements = await cloudPrisma.companyAnnouncement.findMany();
    for (const ann of announcements) {
      await localPrisma.companyAnnouncement.upsert({
        where: { id: ann.id },
        update: ann,
        create: ann
      });
    }
    console.log(`✅ CompanyAnnouncements synced (${announcements.length})`);

    // 26. Audit Logs
    const audits = await cloudPrisma.auditLog.findMany();
    for (const aud of audits) {
      await localPrisma.auditLog.upsert({
        where: { id: aud.id },
        update: aud,
        create: aud
      });
    }
    console.log(`✅ AuditLogs synced (${audits.length})`);

    console.log('🎉 ALL DATA FULLY SYNCED TO LOCAL POSTGRESQL (HRM_DB01) SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    await cloudPrisma.$disconnect();
    await localPrisma.$disconnect();
  }
}

syncAllData();
