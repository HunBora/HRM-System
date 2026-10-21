export interface ContractAlertItem {
  contractId: string;
  contractNo: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  contractType: string;
  isForeigner: boolean;
  alertType: 'FDC_CRITICAL' | 'FDC_WARNING' | 'FOREIGN_WP_CRITICAL' | 'FOREIGN_WP_WARNING' | 'FOREIGN_VISA_CRITICAL' | 'FOREIGN_VISA_WARNING' | 'PROBATION_ENDING' | 'EXPIRED' | 'NORMAL';
  alertLevel: 'CRITICAL' | 'WARNING' | 'INFO' | 'NORMAL';
  titleKh: string;
  titleEn: string;
  messageKh: string;
  daysRemaining: number;
  targetDate: string;
  statutoryNoticeDays?: number;
}

/**
 * Calculates smart alerts for a contract according to Cambodian Labour Law (MLVT 2026)
 * - FDC: 10 days notice (>6mo-1yr), 15 days notice (>1yr) (Art 73)
 * - Foreigners: 30-60 days alert for Work Permit (FWEMS) & Visa renewal
 * - Probation: 7 days alert before end of probationary period
 */
export function analyzeContractAlert(contract: {
  id: string;
  contractNo: string;
  contractType: string;
  startDate: string | Date;
  endDate?: string | Date | null;
  isForeigner?: boolean;
  workPermitExpiry?: string | Date | null;
  visaExpiry?: string | Date | null;
  passportExpiry?: string | Date | null;
  employee?: {
    employeeId: string;
    firstNameKh?: string | null;
    lastNameKh?: string | null;
    firstNameEn?: string;
    lastNameEn?: string;
    department?: string;
    position?: string;
  };
}): ContractAlertItem[] {
  const alerts: ContractAlertItem[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const empName = contract.employee
    ? `${contract.employee.lastNameKh || ''} ${contract.employee.firstNameKh || ''} (${contract.employee.firstNameEn || ''} ${contract.employee.lastNameEn || ''})`.trim()
    : 'Unknown Employee';
  const empId = contract.employee?.employeeId || 'N/A';
  const dept = contract.employee?.department || 'N/A';
  const pos = contract.employee?.position || 'N/A';

  // 1. Contract End Date Analysis (FDC, Probation, Foreign FDC)
  if (contract.endDate && contract.contractType !== 'UDC') {
    const end = new Date(contract.endDate);
    end.setHours(0, 0, 0, 0);
    const start = new Date(contract.startDate);
    start.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalTermDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Determine legal statutory notice period per Article 73
    const statutoryNoticeDays = totalTermDays > 365 ? 15 : totalTermDays > 180 ? 10 : 7;

    if (diffDays < 0) {
      alerts.push({
        contractId: contract.id,
        contractNo: contract.contractNo,
        employeeId: empId,
        employeeName: empName,
        department: dept,
        position: pos,
        contractType: contract.contractType,
        isForeigner: Boolean(contract.isForeigner),
        alertType: 'EXPIRED',
        alertLevel: 'CRITICAL',
        titleKh: 'កិច្ចសន្យាផុតកំណត់ហើយ',
        titleEn: 'Contract Expired',
        messageKh: `កុងត្រាបានផុតកំណត់ចំនួន ${Math.abs(diffDays)} ថ្ងៃកន្លងមកហើយ! ត្រូវរៀបចំបន្ត ឬបញ្ចប់កិច្ចសន្យាជាបន្ទាន់។`,
        daysRemaining: diffDays,
        targetDate: end.toISOString().split('T')[0],
        statutoryNoticeDays,
      });
    } else if (contract.contractType === 'PROBATION') {
      if (diffDays <= 7) {
        alerts.push({
          contractId: contract.id,
          contractNo: contract.contractNo,
          employeeId: empId,
          employeeName: empName,
          department: dept,
          position: pos,
          contractType: contract.contractType,
          isForeigner: Boolean(contract.isForeigner),
          alertType: 'PROBATION_ENDING',
          alertLevel: diffDays <= 3 ? 'CRITICAL' : 'WARNING',
          titleKh: 'សាកល្បងការងារជិតចប់',
          titleEn: 'Probation Ending Soon',
          messageKh: `រយៈពេលសាកល្បងការងារនៅសល់ ${diffDays} ថ្ងៃ។ សូមធ្វើការវាយតម្លៃដើម្បីសម្រេចបន្តកុងត្រា FDC ឬ UDC!`,
          daysRemaining: diffDays,
          targetDate: end.toISOString().split('T')[0],
        });
      }
    } else {
      // FDC or FOREIGN_FDC
      if (diffDays <= statutoryNoticeDays) {
        alerts.push({
          contractId: contract.id,
          contractNo: contract.contractNo,
          employeeId: empId,
          employeeName: empName,
          department: dept,
          position: pos,
          contractType: contract.contractType,
          isForeigner: Boolean(contract.isForeigner),
          alertType: 'FDC_CRITICAL',
          alertLevel: 'CRITICAL',
          titleKh: `ត្រូវជូនដំណឹងជាបន្ទាន់ (${statutoryNoticeDays} ថ្ងៃ តាមមាត្រា ៧៣)`,
          titleEn: `Urgent Statutory Notice (${statutoryNoticeDays} days)`,
          messageKh: `នៅសល់តែ ${diffDays} ថ្ងៃទៀតដល់ថ្ងៃផុតកំណត់កុងត្រា! ត្រូវធ្វើលិខិតជូនដំណឹងជាមុនយ៉ាងតិច ${statutoryNoticeDays} ថ្ងៃ ដើម្បីកុំឱ្យកុងត្រាក្លាយជា UDC ឬជាប់កាតព្វកិច្ចសងជំងឺចិត្ត។`,
          daysRemaining: diffDays,
          targetDate: end.toISOString().split('T')[0],
          statutoryNoticeDays,
        });
      } else if (diffDays <= statutoryNoticeDays + 15) {
        alerts.push({
          contractId: contract.id,
          contractNo: contract.contractNo,
          employeeId: empId,
          employeeName: empName,
          department: dept,
          position: pos,
          contractType: contract.contractType,
          isForeigner: Boolean(contract.isForeigner),
          alertType: 'FDC_WARNING',
          alertLevel: 'WARNING',
          titleKh: 'ត្រៀមជូនដំណឹងកុងត្រាជិតផុតកំណត់',
          titleEn: 'Upcoming Contract Expiry',
          messageKh: `កុងត្រានៅសល់ ${diffDays} ថ្ងៃ។ ត្រូវត្រៀមលិខិតជូនដំណឹងជាមុនចំនួន ${statutoryNoticeDays} ថ្ងៃ។`,
          daysRemaining: diffDays,
          targetDate: end.toISOString().split('T')[0],
          statutoryNoticeDays,
        });
      }
    }
  }

  // 2. Foreign Employee: Work Permit Expiry Alert (30 to 60 days)
  if (contract.isForeigner && contract.workPermitExpiry) {
    const wpDate = new Date(contract.workPermitExpiry);
    wpDate.setHours(0, 0, 0, 0);
    const diffWp = Math.ceil((wpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffWp <= 30 && diffWp >= 0) {
      alerts.push({
        contractId: contract.id,
        contractNo: contract.contractNo,
        employeeId: empId,
        employeeName: empName,
        department: dept,
        position: pos,
        contractType: contract.contractType,
        isForeigner: true,
        alertType: 'FOREIGN_WP_CRITICAL',
        alertLevel: 'CRITICAL',
        titleKh: '🚨 ប័ណ្ណការងារ MLVT ត្រូវបន្តបន្ទាន់ (<= ៣០ ថ្ងៃ)',
        titleEn: 'Urgent Work Permit Renewal',
        messageKh: `ប័ណ្ណការងារជនបរទេសនៅសល់ ${diffWp} ថ្ងៃ (ផុតកំណត់: ${wpDate.toISOString().split('T')[0]})។ ត្រូវដាក់ពាក្យបន្តតាមប្រព័ន្ធ FWEMS ក្រសួងការងារជាបន្ទាន់!`,
        daysRemaining: diffWp,
        targetDate: wpDate.toISOString().split('T')[0],
      });
    } else if (diffWp > 30 && diffWp <= 60) {
      alerts.push({
        contractId: contract.id,
        contractNo: contract.contractNo,
        employeeId: empId,
        employeeName: empName,
        department: dept,
        position: pos,
        contractType: contract.contractType,
        isForeigner: true,
        alertType: 'FOREIGN_WP_WARNING',
        alertLevel: 'WARNING',
        titleKh: '🟡 ត្រៀមឯកសារបន្តប័ណ្ណការងារជនបរទេស (៣០-៦០ ថ្ងៃ)',
        titleEn: 'Prepare Work Permit Extension',
        messageKh: `ប័ណ្ណការងារជនបរទេសនៅសល់ ${diffWp} ថ្ងៃ។ សូមរៀបចំឯកសារ (ពិនិត្យសុខភាព, កូតាជនបរទេស, និងលិខិតបញ្ជាក់) ទៅក្រសួងការងារទាន់ពេលវេលា។`,
        daysRemaining: diffWp,
        targetDate: wpDate.toISOString().split('T')[0],
      });
    }
  }

  // 3. Foreign Employee: Visa Expiry Alert (30 to 60 days)
  if (contract.isForeigner && contract.visaExpiry) {
    const visaDate = new Date(contract.visaExpiry);
    visaDate.setHours(0, 0, 0, 0);
    const diffVisa = Math.ceil((visaDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffVisa <= 30 && diffVisa >= 0) {
      alerts.push({
        contractId: contract.id,
        contractNo: contract.contractNo,
        employeeId: empId,
        employeeName: empName,
        department: dept,
        position: pos,
        contractType: contract.contractType,
        isForeigner: true,
        alertType: 'FOREIGN_VISA_CRITICAL',
        alertLevel: 'CRITICAL',
        titleKh: '🚨 ទិដ្ឋាការ Visa ត្រូវបន្តបន្ទាន់ (<= ៣០ ថ្ងៃ)',
        titleEn: 'Urgent Business Visa Renewal',
        messageKh: `ទិដ្ឋាការស្នាក់នៅ (EB Visa) នៅសល់ ${diffVisa} ថ្ងៃ។ ត្រូវរៀបចំបន្តសុពលភាពជាបន្ទាន់ដើម្បីកុំឱ្យជាប់ពិន័យហួសទិដ្ឋាការ។`,
        daysRemaining: diffVisa,
        targetDate: visaDate.toISOString().split('T')[0],
      });
    } else if (diffVisa > 30 && diffVisa <= 60) {
      alerts.push({
        contractId: contract.id,
        contractNo: contract.contractNo,
        employeeId: empId,
        employeeName: empName,
        department: dept,
        position: pos,
        contractType: contract.contractType,
        isForeigner: true,
        alertType: 'FOREIGN_VISA_WARNING',
        alertLevel: 'WARNING',
        titleKh: '🟡 ត្រៀមឯកសារបន្ត Visa (៣០-៦០ ថ្ងៃ)',
        titleEn: 'Prepare Visa Renewal',
        messageKh: `ទិដ្ឋាការ (Visa) នៅសល់ ${diffVisa} ថ្ងៃ។ សូមត្រៀមលិខិតបញ្ជាក់ការងារពីក្រុមហ៊ុន។`,
        daysRemaining: diffVisa,
        targetDate: visaDate.toISOString().split('T')[0],
      });
    }
  }

  return alerts;
}
