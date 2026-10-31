/**
 * បទប្បញ្ញត្តិ និងរូបមន្តគណនាភាគទាន ប.ស.ស. (National Social Security Fund - NSSF Cambodia)
 *
 * យោងតាម៖
 * 1. ប្រកាសអន្តរក្រសួងលេខ ២៣៤/២៦ ក.ប/ប្រ.ក.ប.ស.ស ចុះថ្ងៃទី ១៩ ខែតុលា ឆ្នាំ២០២៦
 * 2. សេចក្តីជូនដំណឹងលេខ ៣១៣៤/២៦ ប.ស.ស. ចុះថ្ងៃទី ២៨ ខែតុលា ឆ្នាំ២០២៦
 *    ស្តីពី «ការអនុវត្តការកែសម្រួលកម្រិតអប្បបរមានិងពិដាននៃប្រាក់ឈ្នួលជាប់ភាគទាន»
 *
 * កាលបរិច្ឆេទអនុវត្ត៖ ចាប់ពីខែ វិច្ឆិកា ឆ្នាំ ២០២៦ តទៅ (Effective from November 2026 onwards)
 *
 * កម្រិតប្រាក់ឈ្នួលជាប់ភាគទានថ្មី (New Contributory Wage Limits):
 * - ប្រាក់ឈ្នួលជាប់ភាគទានអប្បបរមា (Minimum Wage): ៦០០ ០០០ (ប្រាំមួយសែន) រៀល
 * - ប្រាក់ឈ្នួលជាប់ភាគទានពិដាន (Ceiling / Maximum Wage): ១ ៥០០ ០០០ (មួយលានប្រាំសែន) រៀល
 *
 * អត្រាភាគទានសោធន (Pension Scheme):
 * - ភាគីកម្មករនិយោជិត (Employee Portion): ២% (កាត់កងពីប្រាក់ខែ)
 * - ភាគីនិយោជក (Employer Portion): ២%
 *
 * មុនខែវិច្ឆិកា ឆ្នាំ២០២៦ (ច្បាប់ចាស់):
 * - អប្បបរមា: ៤០០ ០០០ រៀល ($100 តាមអត្រា ៤ ០០០៛)
 * - ពិដាន: ១ ២០០ ០០០ រៀល ($300 តាមអត្រា ៤ ០០០៛) -> កាត់កងអតិបរមា $6.00 (២៤ ០០០៛)
 *
 * ចាប់ពីខែវិច្ឆិកា ឆ្នាំ២០២៦ តទៅ (ច្បាប់ថ្មី):
 * - អប្បបរមា: ៦០០ ០០០ រៀល ($150 តាមអត្រា ៤ ០០០៛) -> កាត់កងអប្បបរមា ២% = ១២ ០០០ រៀល ($3.00)
 * - ពិដាន: ១ ៥០០ ០០០ រៀល ($375 តាមអត្រា ៤ ០០០៛) -> កាត់កងអតិបរមា ២% = ៣០ ០០០ រៀល ($7.50)
 */

export const NSSF_CONFIG = {
  // ច្បាប់ចាស់ (មុនខែវិច្ឆិកា ឆ្នាំ២០២៦)
  OLD: {
    MIN_WAGE_KHR: 400_000,
    MAX_WAGE_KHR: 1_200_000,
    EMPLOYEE_RATE: 0.02,
    EMPLOYER_RATE: 0.02,
    LABEL: 'ច្បាប់ចាស់ (មុនខែវិច្ឆិកា ឆ្នាំ២០២៦)',
  },
  // ច្បាប់ថ្មី (ចាប់ពីខែវិច្ឆិកា ឆ្នាំ២០២៦ តទៅ)
  NEW_2026: {
    MIN_WAGE_KHR: 600_000,
    MAX_WAGE_KHR: 1_500_000,
    EMPLOYEE_RATE: 0.02,
    EMPLOYER_RATE: 0.02,
    PRAKAS_NO: '២៣៤/២៦ ក.ប/ប្រ.ក.ប.ស.ស',
    NOTICE_NO: '៣១៣៤/២៦ ប.ស.ស.',
    EFFECTIVE_MONTH: 11,
    EFFECTIVE_YEAR: 2026,
    LABEL: 'ច្បាប់ថ្មី (ចាប់ពីខែវិច្ឆិកា ឆ្នាំ២០២៦ តទៅ)',
  }
} as const;

/**
 * ពិនិត្យមើលថាតើខែ និងឆ្នាំនៃប្រាក់ខែ ត្រូវអនុវត្តតាមច្បាប់ ប.ស.ស ថ្មី ឬចាស់
 */
export function isNewNssfLaw(month: number, year: number): boolean {
  if (year > 2026) return true;
  if (year === 2026 && month >= 11) return true;
  return false;
}

/**
 * ទទួលបានដែនកំណត់ប្រាក់ឈ្នួលជាប់ភាគទាន ប.ស.ស. តាមខែ និងឆ្នាំ
 */
export function getNssfWageLimits(month: number, year: number, exchangeRate: number = 4000) {
  const rate = exchangeRate > 0 ? exchangeRate : 4000;
  const isNew = isNewNssfLaw(month, year);
  const cfg = isNew ? NSSF_CONFIG.NEW_2026 : NSSF_CONFIG.OLD;

  return {
    isNewLaw: isNew,
    minWageKhr: cfg.MIN_WAGE_KHR,
    maxWageKhr: cfg.MAX_WAGE_KHR,
    minWageUsd: cfg.MIN_WAGE_KHR / rate,
    maxWageUsd: cfg.MAX_WAGE_KHR / rate,
    minDeductionKhr: cfg.MIN_WAGE_KHR * cfg.EMPLOYEE_RATE,
    maxDeductionKhr: cfg.MAX_WAGE_KHR * cfg.EMPLOYEE_RATE,
    minDeductionUsd: (cfg.MIN_WAGE_KHR * cfg.EMPLOYEE_RATE) / rate,
    maxDeductionUsd: (cfg.MAX_WAGE_KHR * cfg.EMPLOYEE_RATE) / rate,
    label: cfg.LABEL,
    prakas: isNew ? NSSF_CONFIG.NEW_2026.PRAKAS_NO : 'ច្បាប់មុន',
  };
}

export interface NssfCalculationResult {
  hasNssf: boolean;
  basicSalaryUsd: number;
  salaryKhr: number;
  contributoryWageKhr: number;
  contributoryWageUsd: number;
  employeeRate: number;
  nssfKhr: number;
  nssfUsd: number;
  isNewLaw: boolean;
  minWageKhr: number;
  maxWageKhr: number;
  maxDeductionUsd: number;
}

/**
 * គណនាលម្អិតអំពីភាគទាន ប.ស.ស.
 */
export function calculateNssfDetails(
  basicSalaryUsd: number,
  hasNssfNo: boolean,
  month: number,
  year: number,
  exchangeRate: number = 4000
): NssfCalculationResult {
  const rate = exchangeRate > 0 ? exchangeRate : 4000;
  const limits = getNssfWageLimits(month, year, rate);

  if (!hasNssfNo || basicSalaryUsd <= 0) {
    return {
      hasNssf: false,
      basicSalaryUsd,
      salaryKhr: basicSalaryUsd * rate,
      contributoryWageKhr: 0,
      contributoryWageUsd: 0,
      employeeRate: 0.02,
      nssfKhr: 0,
      nssfUsd: 0,
      isNewLaw: limits.isNewLaw,
      minWageKhr: limits.minWageKhr,
      maxWageKhr: limits.maxWageKhr,
      maxDeductionUsd: limits.maxDeductionUsd,
    };
  }

  const salaryKhr = Math.round(basicSalaryUsd * rate);
  // Clamped between Min (Floor) and Max (Ceiling)
  const contributoryWageKhr = Math.min(Math.max(salaryKhr, limits.minWageKhr), limits.maxWageKhr);
  const contributoryWageUsd = contributoryWageKhr / rate;

  const employeeRate = 0.02; // 2%
  const nssfKhr = Math.round(contributoryWageKhr * employeeRate);
  const nssfUsd = Math.round((nssfKhr / rate) * 100) / 100;

  return {
    hasNssf: true,
    basicSalaryUsd,
    salaryKhr,
    contributoryWageKhr,
    contributoryWageUsd,
    employeeRate,
    nssfKhr,
    nssfUsd,
    isNewLaw: limits.isNewLaw,
    minWageKhr: limits.minWageKhr,
    maxWageKhr: limits.maxWageKhr,
    maxDeductionUsd: limits.maxDeductionUsd,
  };
}

/**
 * គណនាប្រាក់កាត់ ប.ស.ស. ជាដុល្លារ (USD) សម្រាប់ប្រើប្រាស់ក្នុងតារាង Payroll
 *
 * @param basicSalaryUsd ប្រាក់ខែគោលគិតជាដុល្លារ
 * @param hasNssfNo បុគ្គលិកមានកាត ប.ស.ស ឬអត់
 * @param month ខែបើកប្រាក់ខែ (1-12)
 * @param year ឆ្នាំបើកប្រាក់ខែ
 * @param exchangeRate អត្រាប្តូរប្រាក់ (លំនាំដើម 4,000៛)
 * @returns ចំនួនទឹកប្រាក់កាត់ ប.ស.ស. ជាដុល្លារ (USD) ត្រឹមទសភាគ ២ ខ្ទង់
 */
export function calculateNssf(
  basicSalaryUsd: number,
  hasNssfNo: boolean,
  month: number,
  year: number,
  exchangeRate: number = 4000
): number {
  const result = calculateNssfDetails(basicSalaryUsd, hasNssfNo, month, year, exchangeRate);
  return result.nssfUsd;
}
