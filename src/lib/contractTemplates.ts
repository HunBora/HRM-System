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

  // Terms & Job Scope
  probationCategory?: 'EMPLOYEE' | 'SPECIALISED' | 'NON_SPECIALISED'; // 3, 2, or 1 mo (Article 68)
  positionTitle: string;
  department: string;
  workplace: string;
  supervisorRole?: string;
  jobScope?: string;
  jobScopeKh?: string;
  jobScopeEn?: string;
  jobScopeZh?: string;

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
  lawRefKh: string;
  lawRefEn: string;
}> = {
  FDC: {
    nameKh: 'កិច្ចសន្យាការងារមានថិរវេលាកំណត់',
    nameEn: 'FIXED DURATION EMPLOYMENT CONTRACT (FDC)',
    nameZh: '固定期限劳动合同',
    badgeColor: '#2563eb',
    badgeBg: '#eff6ff',
    defaultDocPrefix: 'HR-FDC',
    lawRefKh: 'អនុលោមតាមមាត្រា ៦៧, ៧៣ នៃច្បាប់ស្តីពីការងារ និងសេចក្តីណែនាំលេខ ០៥០/១៩ របស់ក្រសួងការងារ',
    lawRefEn: 'Pursuant to Articles 67, 73 of the Labour Law & MLVT Instruction No. 050/19',
  },
  PROBATION: {
    nameKh: 'កិច្ចសន្យាសាកល្បងការងារ',
    nameEn: 'PROBATIONARY EMPLOYMENT CONTRACT',
    nameZh: '试用期劳动合同',
    badgeColor: '#d97706',
    badgeBg: '#fffbeb',
    defaultDocPrefix: 'HR-PRB',
    lawRefKh: 'អនុលោមតាមមាត្រា ៦៨, ៨២ នៃច្បាប់ស្តីពីការងារ',
    lawRefEn: 'Pursuant to Articles 68, 82 of the Labour Law',
  },
  UDC: {
    nameKh: 'កិច្ចសន្យាការងារមានថិរវេលាមិនកំណត់',
    nameEn: 'UNDETERMINED DURATION EMPLOYMENT CONTRACT (UDC)',
    nameZh: '无固定期限劳动合同',
    badgeColor: '#059669',
    badgeBg: '#ecfdf5',
    defaultDocPrefix: 'HR-UDC',
    lawRefKh: 'អនុលោមតាមមាត្រា ៧៤, ៧៥, ៨៩ ថ្មី នៃច្បាប់ស្តីពីការងារ',
    lawRefEn: 'Pursuant to Articles 74, 75, New Article 89 of the Labour Law',
  },
  FOREIGN_FDC: {
    nameKh: 'កិច្ចសន្យាការងារបុគ្គលិកជនបរទេស (មានថិរវេលាកំណត់)',
    nameEn: 'EMPLOYMENT CONTRACT FOR FOREIGN EMPLOYEE (FIXED DURATION)',
    nameZh: '外籍员工劳动合同（固定期限）',
    badgeColor: '#7c3aed',
    badgeBg: '#f5f3ff',
    defaultDocPrefix: 'HR-EXP',
    lawRefKh: 'អនុលោមតាមមាត្រា ៦៧ នៃច្បាប់ការងារ និងបទប្បញ្ញត្តិប័ណ្ណការងារជនបរទេសនៃក្រសួងការងារ',
    lawRefEn: 'Pursuant to Article 67 of Labour Law & MLVT Foreign Work Permit Regulations',
  },
};

export interface JobScopePreset {
  id: string;
  titleKh: string;
  titleEn: string;
  titleZh: string;
  scopeKh: string;
  scopeEn: string;
  scopeZh: string;
}

export const JOB_SCOPE_PRESETS: JobScopePreset[] = [
  {
    id: 'ADMIN',
    titleKh: 'រដ្ឋបាលទូទៅ / ការិយាល័យ (General Administration)',
    titleEn: 'General Administration / Office',
    titleZh: '综合行政 / 办公室',
    scopeKh: 'ទទួលបន្ទុករៀបចំ និងគ្រប់គ្រងឯកសារ លិខិតស្នាម និងកំណត់ត្រារដ្ឋបាលឱ្យមានសណ្តាប់ធ្នាប់; សម្របសម្រួលកិច្ចការទំនាក់ទំនងទូទៅ ការទទួលភ្ញៀវ និងការរៀបចំកិច្ចប្រជុំ; គាំទ្រដល់ប្រតិបត្តិការប្រចាំថ្ងៃរបស់ការិយាល័យ និងអនុវត្តភារកិច្ចផ្សេងៗទៀតតាមការចាត់តាំងរបស់ថ្នាក់ដឹកនាំ។',
    scopeEn: 'Manage administrative filings, official correspondence, and company documentation; coordinate general communications, guest reception, and meeting schedules; support daily office operations and perform tasks assigned by management.',
    scopeZh: '负责管理行政文档、公文函件及归档；协调日常外部联络、来访接待及会议安排；支持办公室日常运营并执行管理层指派的工作。',
  },
  {
    id: 'ACCOUNTING',
    titleKh: 'គណនេយ្យ និងហិរញ្ញវត្ថុ (Accounting & Finance)',
    titleEn: 'Accounting & Finance',
    titleZh: '财务会计',
    scopeKh: 'ត្រួតពិនិត្យ និងកត់ត្រាចំណូល-ចំណាយប្រចាំថ្ងៃ ព្រមទាំងរៀបចំរបាយការណ៍ហិរញ្ញវត្ថុឱ្យទាន់ពេលវេលា; គ្រប់គ្រងវិក្កយបត្រ បង្កាន់ដៃ និងឯកសារទូទាត់ឱ្យបានត្រឹមត្រូវតាមស្តង់ដារ; គណនាប្រាក់បៀវត្សរ៍ កាតព្វកិច្ចពន្ធ និងការប្រកាសរបបសន្តិសុខសង្គម ប.ស.ស.។',
    scopeEn: 'Examine and record daily revenues and expenditures, preparing timely financial statements; handle invoices, receipts, and vouchers according to accounting regulations; compute payroll, withholding tax obligations, and file NSSF social security reports.',
    scopeZh: '审核并登记日常收支，及时编制财务会计报表；严格依照合规准则管理发票、收据及支付凭单；核算员工工资、代扣税金并办理国家社保（NSSF）申报。',
  },
  {
    id: 'HR',
    titleKh: 'ធនធានមនុស្ស (Human Resources)',
    titleEn: 'Human Resources',
    titleZh: '人力资源',
    scopeKh: 'គ្រប់គ្រងទិន្នន័យបុគ្គលិក កិច្ចសន្យាការងារ វត្តមាន និងការឈប់សម្រាកប្រចាំខែ; សម្របសម្រួលដំណើរការជ្រើសរើសបុគ្គលិក ការបណ្តុះបណ្តាល និងការវាយតម្លៃការងារ; ធានាការអនុវត្តបទបញ្ជាផ្ទៃក្នុង សុវត្ថិភាពការងារ និងច្បាប់ស្តីពីការងារឱ្យបានម៉ឺងម៉ាត់។',
    scopeEn: 'Administer employee records, employment contracts, attendance tracking, and monthly leaves; coordinate recruitment, staff onboarding, training sessions, and appraisals; ensure strict observance of internal work rules, occupational health, and Cambodian Labour Law.',
    scopeZh: '管理员工花名册、劳动合同、考勤记录与休假审批；统筹招聘选拔、新员工入职培训及考评；确保全面遵守厂规、劳动安全规程及柬埔寨劳动法规。',
  },
  {
    id: 'IT',
    titleKh: 'បច្ចេកវិទ្យាព័ត៌មាន (IT & Software)',
    titleEn: 'Information Technology (IT)',
    titleZh: '信息技术 (IT)',
    scopeKh: 'ថែទាំ ជួសជុល និងគ្រប់គ្រងប្រព័ន្ធកុំព្យូទ័រ បណ្តាញ Network និងឧបករណ៍បច្ចេកវិទ្យា; អភិវឌ្ឍន៍ ថែទាំ និងគាំទ្រដល់ការប្រើប្រាស់ប្រព័ន្ធកម្មវិធីគ្រប់គ្រងរបស់ស្ថាប័ន; ធានាសុវត្ថិភាពទិន្នន័យ ការបម្រុងទុក (Data Backup) និងការពារព័ត៌មានសម្ងាត់។',
    scopeEn: 'Maintain, troubleshoot, and administer computer workstations, network infrastructure, and office hardware; configure, update, and support enterprise application usage; enforce data security protocols, periodic data backup routines, and confidentiality measures.',
    scopeZh: '日常维护与管理电脑网络、弱电系统与办公硬件；维护并支持公司业务软件系统的稳定运行；保障企业数据安全、定期备份及商业秘密保密。',
  },
  {
    id: 'PRODUCTION',
    titleKh: 'កម្មករផលិតកម្ម / ប្រតិបត្តិការ (Production & Factory)',
    titleEn: 'Production / Factory Worker',
    titleZh: '生产操作工',
    scopeKh: 'បំពេញការងារតាមខ្សែចង្វាក់ផលិតកម្មតាមការណែនាំ និងគោលដៅផលិតកម្មដែលបានកំណត់; គោរពយ៉ាងម៉ឺងម៉ាត់នូវវិធានសុវត្ថិភាពការងារ និងពាក់ឧបករណ៍ការពារ (PPE) គ្រប់ពេលវេលា; ថែរក្សាឧបករណ៍ ម៉ាស៊ីន និងអនាម័យបរិស្ថានការងារឱ្យមានរបៀបរៀបរយ។',
    scopeEn: 'Perform assigned operational tasks along the production line in accordance with instructions and production quotas; strictly observe workplace safety guidelines and wear personal protective equipment (PPE); keep machines, tools, and work stations clean and safe.',
    scopeZh: '按照作业指导书及排产定额认真操作，按时保质完成生产线任务；严格遵守安全操作规程，规范穿戴劳保防护用品（PPE）；做好工位清扫与设备保养。',
  },
  {
    id: 'SALES',
    titleKh: 'ផ្នែកលក់ និងទីផ្សារ (Sales & Marketing)',
    titleEn: 'Sales & Marketing',
    titleZh: '销售与市场',
    scopeKh: 'ស្វែងរកអតិថិជនថ្មី ថែរក្សាទំនាក់ទំនងល្អជាមួយអតិថិជន និងសម្រេចឱ្យបាននូវគោលដៅលក់; ណែនាំផលិតផល និងសេវាកម្មរបស់ក្រុមហ៊ុនប្រកបដោយវិជ្ជាជីវៈ; ចូលរួមក្នុងការរៀបចំផែនការទីផ្សារ ផ្សព្វផ្សាយ និងរាយការណ៍អំពីស្ថានភាពទីផ្សារជូនថ្នាក់ដឹកនាំ។',
    scopeEn: 'Identify prospective customers, build solid relationships with existing clients, and achieve target sales volumes; present products and services with high professionalism; support promotional marketing campaigns and report market dynamics.',
    scopeZh: '拓展新客户资源，维护客情关系，积极达成既定销售业绩；专业讲解展示产品与服务；协同执行市场推广活动并向领导汇报市场动态。',
  },
  {
    id: 'LOGISTICS',
    titleKh: 'ដឹកជញ្ជូន និងបើកបរ (Logistics & Driver)',
    titleEn: 'Logistics & Driver',
    titleZh: '物流 / 司机',
    scopeKh: 'បើកបរដោយសុវត្ថិភាព គោរពច្បាប់ចរាចរណ៍ផ្លូវគោក និងមិនសេពគ្រឿងស្រវឹងក្នុងពេលបំពេញការងារ; ត្រួតពិនិត្យ ថែទាំយានយន្តឱ្យស្ថិតក្នុងស្ថានភាពបច្ចេកទេសល្អ និងស្អាតជាប្រចាំ; ដឹកជញ្ជូនបុគ្គលិក ទំនិញ ឬឯកសារទៅកាន់គោលដៅឱ្យបានទាន់ពេលវេលា និងមានសុវត្ថិភាព។',
    scopeEn: 'Drive safely, strictly follow Cambodian traffic regulations, and maintain zero tolerance for alcohol or controlled substances; carry out regular vehicle checkups and cleaning; transport personnel, products, or documents safely and punctually.',
    scopeZh: '谨慎文明驾驶，严守交通交规，工作期间绝对禁酒；日常按时检查维护车况及车内卫生；安全、准时运送公司人员、物资及重要文件。',
  },
  {
    id: 'CUSTOM',
    titleKh: 'កំណត់ដោយខ្លួនឯង (Custom Job Scope)',
    titleEn: 'Custom Scope of Work',
    titleZh: '自定义工作职责',
    scopeKh: 'អនុវត្តភារកិច្ចស្នូលប្រចាំថ្ងៃស្របតាមមុខតំណែង និងការណែនាំស្របច្បាប់របស់ថ្នាក់ដឹកនាំ; គោរពបទបញ្ជាផ្ទៃក្នុង គោលការណ៍វិជ្ជាជីវៈ និងច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា។',
    scopeEn: 'Execute key daily responsibilities in line with the position and lawful instructions of management; observe internal company regulations, professional standards, and the Labour Law of Cambodia.',
    scopeZh: '根据岗位说明及管理人员正当工作指派履行日常职责；严格遵守内部规程、职业道德及柬埔寨王国劳动法。',
  },
];

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
