import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/database/restore -> Restores tables from uploaded JSON backup
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.data) {
      return NextResponse.json({ success: false, error: 'ទម្រង់ឯកសារ Backup មិនត្រឹមត្រូវ (Invalid backup format)' }, { status: 400 });
    }

    const { data } = body;
    let counts = {
      employees: 0,
      users: 0,
      payrolls: 0,
      leaves: 0,
      settings: 0
    };

    // 1. Company Settings
    if (Array.isArray(data.companySettings)) {
      for (const s of data.companySettings) {
        await prisma.companySettings.upsert({ where: { id: s.id }, update: s, create: s });
        counts.settings++;
      }
    }

    // 2. Department Groups
    if (Array.isArray(data.departmentGroups)) {
      for (const d of data.departmentGroups) {
        await prisma.departmentGroup.upsert({ where: { id: d.id }, update: d, create: d });
      }
    }

    // 3. Employees
    if (Array.isArray(data.employees)) {
      for (const emp of data.employees) {
        const payload = {
          ...emp,
          dob: emp.dob ? new Date(emp.dob) : null,
          hireDate: emp.hireDate ? new Date(emp.hireDate) : new Date(),
          probationStart: emp.probationStart ? new Date(emp.probationStart) : null,
          probationEnd: emp.probationEnd ? new Date(emp.probationEnd) : null,
          regularContract1: emp.regularContract1 ? new Date(emp.regularContract1) : null,
          regularContract2: emp.regularContract2 ? new Date(emp.regularContract2) : null,
          regularContract3: emp.regularContract3 ? new Date(emp.regularContract3) : null,
        };
        await prisma.employee.upsert({ where: { id: emp.id }, update: payload, create: payload });
        counts.employees++;
      }
    }

    // 4. Users
    if (Array.isArray(data.users)) {
      for (const u of data.users) {
        await prisma.user.upsert({ where: { id: u.id }, update: u, create: u });
        counts.users++;
      }
    }

    // 5. Job Postings (before Candidates)
    if (Array.isArray(data.jobPostings)) {
      for (const j of data.jobPostings) {
        await prisma.jobPosting.upsert({ where: { id: j.id }, update: j, create: j });
      }
    }

    // 6. Candidates
    if (Array.isArray(data.candidates)) {
      for (const c of data.candidates) {
        await prisma.candidate.upsert({ where: { id: c.id }, update: c, create: c });
      }
    }

    // 7. Leave Requests
    if (Array.isArray(data.leaveRequests)) {
      for (const l of data.leaveRequests) {
        const payload = {
          ...l,
          startDate: l.startDate ? new Date(l.startDate) : new Date(),
          endDate: l.endDate ? new Date(l.endDate) : new Date(),
        };
        await prisma.leaveRequest.upsert({ where: { id: l.id }, update: payload, create: payload });
        counts.leaves++;
      }
    }

    // 8. Overtime Requests
    if (Array.isArray(data.overtimeRequests)) {
      for (const o of data.overtimeRequests) {
        const payload = {
          ...o,
          date: o.date ? new Date(o.date) : new Date(),
        };
        await prisma.overtimeRequest.upsert({ where: { id: o.id }, update: payload, create: payload });
      }
    }

    // 9. Payrolls
    if (Array.isArray(data.payrolls)) {
      for (const p of data.payrolls) {
        await prisma.payroll.upsert({ where: { id: p.id }, update: p, create: p });
        counts.payrolls++;
      }
    }

    // 10. Advance Salary
    if (Array.isArray(data.advanceSalaries)) {
      for (const adv of data.advanceSalaries) {
        await prisma.advanceSalary.upsert({ where: { id: adv.id }, update: adv, create: adv });
      }
    }

    // 11. Employee Loans
    if (Array.isArray(data.employeeLoans)) {
      for (const ln of data.employeeLoans) {
        await prisma.employeeLoan.upsert({ where: { id: ln.id }, update: ln, create: ln });
      }
    }

    // 12. Documents
    if (Array.isArray(data.documents)) {
      for (const doc of data.documents) {
        await prisma.document.upsert({ where: { id: doc.id }, update: doc, create: doc });
      }
    }

    // 13. Assets
    if (Array.isArray(data.companyAssets)) {
      for (const ast of data.companyAssets) {
        await prisma.companyAsset.upsert({ where: { id: ast.id }, update: ast, create: ast });
      }
    }

    // 14. Expense Claims
    if (Array.isArray(data.expenseClaims)) {
      for (const exp of data.expenseClaims) {
        await prisma.expenseClaim.upsert({ where: { id: exp.id }, update: exp, create: exp });
      }
    }

    // 15. Certificate Requests
    if (Array.isArray(data.certificateRequests)) {
      for (const cert of data.certificateRequests) {
        await prisma.certificateRequest.upsert({ where: { id: cert.id }, update: cert, create: cert });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'បាន Restore ទិន្នន័យដោយជោគជ័យ!',
      counts
    });
  } catch (error: any) {
    console.error('Restore API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
