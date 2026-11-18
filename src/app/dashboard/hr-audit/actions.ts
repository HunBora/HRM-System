'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export interface AutoAuditIssue {
  id: string;
  category: 'CONTRACT' | 'NSSF' | 'FOREIGNER' | 'OVERTIME' | 'PROBATION' | 'ID';
  categoryKh: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  titleKh: string;
  titleEn: string;
  descriptionKh: string;
  employeeId?: string;
  employeeName?: string;
  relatedDoc?: string;
  recommendedActionKh: string;
  legalReferenceKh: string;
}

export interface AutoAuditReport {
  scannedAt: string;
  totalEmployeesScanned: number;
  totalContractsScanned: number;
  totalOtScanned: number;
  healthScore: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  issues: AutoAuditIssue[];
}

export async function runAutomatedDataAudit(): Promise<{ success: boolean; report?: AutoAuditReport; error?: string }> {
  try {
    const session = await getSession();
    if (!session || !['ADMIN', 'HR_MANAGER', 'HR'].includes(session.role)) {
      return { success: false, error: 'មិនមានសិទ្ធិអនុវត្តសវនកម្ម (Unauthorized)' };
    }

    const issues: AutoAuditIssue[] = [];
    const now = new Date();

    // 1. Fetch active employees
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        employeeId: true,
        firstNameKh: true,
        lastNameKh: true,
        firstNameEn: true,
        lastNameEn: true,
        gender: true,
        nationality: true,
        nationalId: true,
        nssfNo: true,
        basicSalary: true,
        hireDate: true,
        probationStart: true,
        probationEnd: true,
      },
    });

    // 2. Fetch contracts
    const contracts = await prisma.contract.findMany({
      include: {
        employee: {
          select: {
            employeeId: true,
            firstNameKh: true,
            lastNameKh: true,
            firstNameEn: true,
            lastNameEn: true,
          },
        },
      },
    });

    // 3. Fetch recent approved Overtime requests (last 60 days)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const overtimeRequests = await prisma.overtimeRequest.findMany({
      where: {
        status: 'APPROVED',
        otDate: { gte: sixtyDaysAgo },
      },
      include: {
        employee: {
          select: {
            employeeId: true,
            firstNameKh: true,
            lastNameKh: true,
          },
        },
      },
      take: 200,
    });

    // --- CHECK 1: Missing NSSF Registration ---
    for (const emp of employees) {
      const empName = `${emp.lastNameKh || ''} ${emp.firstNameKh || ''} (${emp.firstNameEn} ${emp.lastNameEn})`.trim();
      if (!emp.nssfNo || emp.nssfNo.trim() === '') {
        issues.push({
          id: `nssf-missing-${emp.id}`,
          category: 'NSSF',
          categoryKh: 'បេឡាជាតិសន្តិសុខសង្គម (ប.ស.ស.)',
          severity: 'HIGH',
          titleKh: 'បុគ្គលិកមិនទាន់មានលេខកាត ប.ស.ស.',
          titleEn: 'Employee missing registered NSSF number',
          descriptionKh: `បុគ្គលិកឈ្មោះ ${empName} (អត្តលេខ: ${emp.employeeId}) មិនទាន់មានលេខកាត ប.ស.ស. ក្នុងប្រព័ន្ធនៅឡើយ។`,
          employeeId: emp.employeeId,
          employeeName: empName,
          recommendedActionKh: 'រៀបចំឯកសារបញ្ជូនទៅ ប.ស.ស. ដើម្បីចុះឈ្មោះ និងបើកកាត ប.ស.ស. ជាបន្ទាន់។',
          legalReferenceKh: 'ច្បាប់ស្តីពីរបបសន្តិសុខសង្គម មាត្រា ៧៖ សហគ្រាសត្រូវចុះបញ្ជីបុគ្គលិកក្នុងរយៈពេលយ៉ាងយូរ ៣០ ថ្ងៃ។',
        });
      }

      // CHECK 2: Missing National ID for Cambodians
      const isKhmer = !emp.nationality || emp.nationality.toLowerCase().includes('cambodia') || emp.nationality.toLowerCase().includes('khmer');
      if (isKhmer && (!emp.nationalId || emp.nationalId.trim() === '')) {
        issues.push({
          id: `id-missing-${emp.id}`,
          category: 'ID',
          categoryKh: 'ឯកសារអត្តសញ្ញាណ',
          severity: 'MEDIUM',
          titleKh: 'ខ្វះលេខអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ',
          titleEn: 'Cambodian employee missing National ID Number',
          descriptionKh: `បុគ្គលិកឈ្មោះ ${empName} (អត្តលេខ: ${emp.employeeId}) មិនទាន់មានលេខអត្តសញ្ញាណប័ណ្ណក្នុងប្រវត្តិរូប។`,
          employeeId: emp.employeeId,
          employeeName: empName,
          recommendedActionKh: 'ស្នើសុំច្បាប់ចម្លងអត្តសញ្ញាណប័ណ្ណដែលមានសុពលភាពមកបញ្ចូលក្នុងប្រព័ន្ធ។',
          legalReferenceKh: 'បទបញ្ជាផ្ទៃក្នុង និងច្បាប់ការងារស្តីពីការគ្រប់គ្រងសំណុំឯកសារផ្ទាល់ខ្លួនរបស់កម្មករនិយោជិត។',
        });
      }

      // CHECK 3: Probation ended but status not confirmed
      if (emp.probationEnd && new Date(emp.probationEnd) < now) {
        const hasRegularContract = contracts.some(
          (c) => c.employeeId === emp.id && (c.contractType === 'FDC' || c.contractType === 'UDC') && c.status === 'ACTIVE'
        );
        if (!hasRegularContract) {
          issues.push({
            id: `probation-expired-${emp.id}`,
            category: 'PROBATION',
            categoryKh: 'សាកល្បងការងារ',
            severity: 'MEDIUM',
            titleKh: 'ផុតកំណត់សាកល្បងការងារ តែមិនទាន់ចេញកិច្ចសន្យាពេញសិទ្ធិ',
            titleEn: 'Probation period passed without formal regular contract transition',
            descriptionKh: `បុគ្គលិកឈ្មោះ ${empName} បានផុតកំណត់សាកល្បងនៅថ្ងៃ ${new Date(emp.probationEnd).toLocaleDateString()} ប៉ុន្តែមិនទាន់មានកិច្ចសន្យា FDC ឬ UDC ផ្លូវការ។`,
            employeeId: emp.employeeId,
            employeeName: empName,
            recommendedActionKh: 'រៀបចំទម្រង់វាយតម្លៃសាកល្បង និងចុះកិច្ចសន្យាការងារកំណត់ថិរវេលា ឬមិនកំណត់ថិរវេលា។',
            legalReferenceKh: 'ច្បាប់ស្តីពីការងារ មាត្រា ៦៨៖ កាលណាហួសថិរវេលាសាកល្បង ការងារត្រូវបានចាត់ទុកថាពេញសិទ្ធិ។',
          });
        }
      }
    }

    // --- CHECK 4: Contract Audits (FDC duration > 2 years & expired active contracts) ---
    for (const c of contracts) {
      const empName = c.employee
        ? `${c.employee.lastNameKh || ''} ${c.employee.firstNameKh || ''} (${c.employee.firstNameEn} ${c.employee.lastNameEn})`.trim()
        : 'បុគ្គលិកមិនស្គាល់';

      // Check Expired Contracts that are still marked ACTIVE
      if (c.status === 'ACTIVE' && c.endDate && new Date(c.endDate) < now) {
        issues.push({
          id: `contract-expired-${c.id}`,
          category: 'CONTRACT',
          categoryKh: 'កិច្ចសន្យាការងារ',
          severity: 'HIGH',
          titleKh: 'កិច្ចសន្យាការងារផុតកំណត់ តែនៅបន្តដំណើរការ (Active)',
          titleEn: 'Contract expired past end date but remains in Active status',
          descriptionKh: `កិច្ចសន្យាលេខ ${c.contractNo} របស់បុគ្គលិក ${empName} បានផុតកំណត់នៅថ្ងៃ ${new Date(c.endDate).toLocaleDateString()} ដោយគ្មានការបន្ត ឬបញ្ចប់កិច្ចសន្យា។`,
          employeeId: c.employee?.employeeId,
          employeeName: empName,
          relatedDoc: c.contractNo,
          recommendedActionKh: 'ធ្វើកិច្ចសន្យាបន្ត (Renewal) ឬរៀបចំនីតិវិធីបញ្ចប់កិច្ចសន្យា និងទូទាត់ប្រាក់បំណាច់។',
          legalReferenceKh: 'ច្បាប់ស្តីពីការងារ មាត្រា ៧៣៖ កិច្ចសន្យាមានថិរវេលាកំណត់ត្រូវផុតរលត់នៅថ្ងៃផុតកំណត់។ ការបន្តដោយស្ងៀមស្ងាត់អាចប្រែក្លាយជា UDC។',
        });
      }

      // Check FDC duration > 2 years (730 days)
      if (c.contractType === 'FDC' && c.startDate && c.endDate) {
        const durationDays = (new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) / (1000 * 3600 * 24);
        if (durationDays > 730 || c.renewalCount >= 3) {
          issues.push({
            id: `fdc-over-limit-${c.id}`,
            category: 'CONTRACT',
            categoryKh: 'កិច្ចសន្យាការងារ',
            severity: 'HIGH',
            titleKh: 'កិច្ចសន្យា FDC លើសពី ២ ឆ្នាំ (ប្រឈមនឹងការក្លាយជា UDC)',
            titleEn: 'FDC Contract cumulative duration exceeds 2 years legal limit',
            descriptionKh: `កិច្ចសន្យាលេខ ${c.contractNo} របស់បុគ្គលិក ${empName} មានរយៈពេល ${Math.round(durationDays / 30)} ខែ (លើស ២៤ ខែ) ឬបន្តលើសកំណត់។`,
            employeeId: c.employee?.employeeId,
            employeeName: empName,
            relatedDoc: c.contractNo,
            recommendedActionKh: 'ត្រូវប្តូរកិច្ចសន្យាទៅជា UDC (កិច្ចសន្យាមិនកំណត់ថិរវេលា) ឱ្យបានត្រឹមត្រូវតាមច្បាប់។',
            legalReferenceKh: 'ច្បាប់ស្តីពីការងារ មាត្រា ៦៧ និង ៧៣៖ កិច្ចសន្យា FDC អាចបន្តបានម្តង ឬច្រើនដង តែថិរវេលាសរុបមិនត្រូវលើសពី ២ ឆ្នាំឡើយ។',
          });
        }
      }

      // Check Foreign Worker compliance
      if (c.isForeigner) {
        if (!c.workPermitNo || c.workPermitNo.trim() === '') {
          issues.push({
            id: `foreign-wp-missing-${c.id}`,
            category: 'FOREIGNER',
            categoryKh: 'ពលករបរទេស',
            severity: 'HIGH',
            titleKh: 'បុគ្គលិកបរទេសមិនទាន់មានប័ណ្ណការងារ (Work Permit)',
            titleEn: 'Foreign employee missing official foreign work permit record',
            descriptionKh: `បុគ្គលិកបរទេសឈ្មោះ ${empName} (កិច្ចសន្យា: ${c.contractNo}) មិនទាន់មានលេខប័ណ្ណការងារ។`,
            employeeId: c.employee?.employeeId,
            employeeName: empName,
            relatedDoc: c.contractNo,
            recommendedActionKh: 'ដាក់ពាក្យស្នើសុំប័ណ្ណការងារ និងកាតការងារជនបរទេសតាមប្រព័ន្ធ FWEMS របស់ក្រសួងការងារជាបន្ទាន់។',
            legalReferenceKh: 'ច្បាប់ស្តីពីការងារ មាត្រា ២៦១៖ ជនបរទេសណាដែលគ្មានប័ណ្ណការងារ និងសៀវភៅការងារ មិនអាចត្រូវបានជួលឱ្យធ្វើការបានឡើយ។',
          });
        } else if (c.workPermitExpiry && new Date(c.workPermitExpiry) < now) {
          issues.push({
            id: `foreign-wp-expired-${c.id}`,
            category: 'FOREIGNER',
            categoryKh: 'ពលករបរទេស',
            severity: 'HIGH',
            titleKh: 'ប័ណ្ណការងារជនបរទេសបានផុតកំណត់',
            titleEn: 'Foreign work permit expired past validity date',
            descriptionKh: `ប័ណ្ណការងារលេខ ${c.workPermitNo} របស់បុគ្គលិក ${empName} បានផុតកំណត់នៅថ្ងៃ ${new Date(c.workPermitExpiry).toLocaleDateString()}។`,
            employeeId: c.employee?.employeeId,
            employeeName: empName,
            relatedDoc: c.workPermitNo,
            recommendedActionKh: 'ធ្វើការបន្តសុពលភាពប័ណ្ណការងារប្រចាំឆ្នាំតាមប្រព័ន្ធ FWEMS។',
            legalReferenceKh: 'ប្រកាសក្រសួងការងារស្តីពីការប្រើប្រាស់កម្លាំងពលករបរទេស និងការពិន័យចំពោះប័ណ្ណការងារផុតកំណត់។',
          });
        }
      }
    }

    // --- CHECK 5: Overtime Violations (> 2 hours/day on regular work) ---
    for (const ot of overtimeRequests) {
      if (ot.totalHours > 2.0 && ot.otType === 'REGULAR_OT') {
        const empName = ot.employee
          ? `${ot.employee.lastNameKh || ''} ${ot.employee.firstNameKh || ''}`.trim()
          : 'បុគ្គលិក';
        issues.push({
          id: `ot-excessive-${ot.id}`,
          category: 'OVERTIME',
          categoryKh: 'ការថែមម៉ោង (OT)',
          severity: 'MEDIUM',
          titleKh: 'ការថែមម៉ោងថ្ងៃធម្មតាលើសពី ២ ម៉ោងក្នុងមួយថ្ងៃ',
          titleEn: 'Daily regular overtime exceeds 2 hours statutory threshold',
          descriptionKh: `ការស្នើសុំថែមម៉ោងរបស់ ${empName} នៅថ្ងៃ ${new Date(ot.otDate).toLocaleDateString()} មានចំនួន ${ot.totalHours} ម៉ោង (លើស ២ ម៉ោង)។`,
          employeeId: ot.employee?.employeeId,
          employeeName: empName,
          recommendedActionKh: 'ពិនិត្យឡើងវិញនូវការបែងចែកវេនការងារ និងធានាមិនឱ្យថែមម៉ោងលើសកំណត់ច្បាប់។',
          legalReferenceKh: 'ច្បាប់ស្តីពីការងារ មាត្រា ១៣៩៖ ការថែមម៉ោងបន្ទាន់អាចអនុញ្ញាតបាន តែមិនត្រូវលើសពី ២ ម៉ោងក្នុងមួយថ្ងៃឡើយ។',
        });
      }
    }

    // Calculate score
    const highRisk = issues.filter((i) => i.severity === 'HIGH').length;
    const mediumRisk = issues.filter((i) => i.severity === 'MEDIUM').length;
    const lowRisk = issues.filter((i) => i.severity === 'LOW').length;

    // Health Score calculation (Base 100, High -5, Medium -2, Low -1)
    const deduction = highRisk * 6 + mediumRisk * 2.5 + lowRisk * 1;
    const healthScore = Math.max(10, Math.min(100, Math.round(100 - deduction)));

    const report: AutoAuditReport = {
      scannedAt: now.toISOString(),
      totalEmployeesScanned: employees.length,
      totalContractsScanned: contracts.length,
      totalOtScanned: overtimeRequests.length,
      healthScore,
      highRiskCount: highRisk,
      mediumRiskCount: mediumRisk,
      lowRiskCount: lowRisk,
      issues,
    };

    return { success: true, report };
  } catch (error: any) {
    console.error('Error running automated audit:', error);
    return { success: false, error: error.message || 'កំហុសបច្ចេកទេសក្នុងការស្កេនទិន្នន័យ' };
  }
}
