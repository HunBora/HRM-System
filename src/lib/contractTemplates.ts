export type ContractType = 'FDC' | 'PROBATION' | 'UDC' | 'FOREIGN_FDC';

export interface ContractFormData {
  id?: string;
  contractNo: string;
  revision: string;
  contractType: ContractType;
  signedAtLocation: string;
  signedDate: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (or empty for UDC)
  
  // Employer
  companyName: string;
  companyNameKh?: string;
  companyNameZh?: string;
  companyAddress: string;
  representative: string;
  representativeRole: string;

  // Employee
  employeeId: string;
  employeeNameKh: string;
  employeeNameEn: string;
  gender: string; // MALE, FEMALE
  dob: string; // YYYY-MM-DD
  nationalIdOrPassport: string;
  address: string;
  nationality: string;
  isForeigner: boolean;
  passportNo?: string;
  passportExpiry?: string;
  visaNo?: string;
  visaExpiry?: string;
  workPermitNo?: string;
  workPermitExpiry?: string;

  // Terms
  probationCategory?: 'EMPLOYEE' | 'SPECIALISED' | 'NON_SPECIALISED'; // 3, 2, or 1 mo
  positionTitle: string;
  department: string;
  workplace: string;

  // Wages
  basicSalaryUsd: number;
  basicSalaryKhr: number;
  paymentDay: string;
  paymentMethod: string;

  // Working Hours
  workingHours: string;
  mealBreak: string;
  workingDays: string;

  // Custom Editable Clauses
  clause1Title?: string;
  clause1BodyKh?: string;
  clause1BodyEn?: string;
  clause1BodyZh?: string;
  
  clause2BodyKh?: string;
  clause2BodyEn?: string;
  clause2BodyZh?: string;

  clause3BodyKh?: string;
  clause3BodyEn?: string;
  clause3BodyZh?: string;

  clause4BodyKh?: string;
  clause4BodyEn?: string;
  clause4BodyZh?: string;

  clause5BodyKh?: string;
  clause5BodyEn?: string;
  clause5BodyZh?: string;

  clause6BodyKh?: string;
  clause6BodyEn?: string;
  clause6BodyZh?: string;

  clause7BodyKh?: string;
  clause7BodyEn?: string;
  clause7BodyZh?: string;

  clause8BodyKh?: string;
  clause8BodyEn?: string;
  clause8BodyZh?: string;

  clause9BodyKh?: string;
  clause9BodyEn?: string;
  clause9BodyZh?: string;

  specialNotes?: string;
}

export const CONTRACT_TYPE_METADATA: Record<ContractType, {
  nameKh: string;
  nameEn: string;
  nameZh: string;
  badgeColor: string;
  badgeBg: string;
  defaultDocPrefix: string;
}> = {
  FDC: {
    nameKh: 'កិច្ចសន្យាការងារមានថិរវេលាកំណត់',
    nameEn: 'FIXED DURATION EMPLOYMENT CONTRACT (FDC)',
    nameZh: '固定期限劳动合同',
    badgeColor: '#2563eb',
    badgeBg: '#eff6ff',
    defaultDocPrefix: 'HR-FDC',
  },
  PROBATION: {
    nameKh: 'កិច្ចសន្យាសាកល្បងការងារ',
    nameEn: 'PROBATIONARY EMPLOYMENT CONTRACT',
    nameZh: '试用期劳动合同',
    badgeColor: '#d97706',
    badgeBg: '#fffbeb',
    defaultDocPrefix: 'HR-PRB',
  },
  UDC: {
    nameKh: 'កិច្ចសន្យាការងារមានថិរវេលាមិនកំណត់',
    nameEn: 'UNDETERMINED DURATION EMPLOYMENT CONTRACT (UDC)',
    nameZh: '无固定期限劳动合同',
    badgeColor: '#059669',
    badgeBg: '#ecfdf5',
    defaultDocPrefix: 'HR-UDC',
  },
  FOREIGN_FDC: {
    nameKh: 'កិច្ចសន្យាការងារបុគ្គលិកជនបរទេស (មានថិរវេលាកំណត់)',
    nameEn: 'EMPLOYMENT CONTRACT FOR FOREIGN EMPLOYEE (FIXED DURATION)',
    nameZh: '外籍员工劳动合同（固定期限）',
    badgeColor: '#7c3aed',
    badgeBg: '#f5f3ff',
    defaultDocPrefix: 'HR-EXP',
  },
};

export function getGenderLabel(gender: string | null | undefined): { kh: string; en: string; zh: string } {
  const g = (gender || '').toUpperCase();
  if (g === 'FEMALE' || g === 'ស្រី' || g === 'F') {
    return { kh: 'ស្រី', en: 'Female', zh: '女' };
  }
  return { kh: 'ប្រុស', en: 'Male', zh: '男' };
}

export function formatContractDate(dStr: string | null | undefined): string {
  if (!dStr) return '__________';
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dStr;
  }
}
