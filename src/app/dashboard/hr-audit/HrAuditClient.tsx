'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';

interface ChecklistItem {
  id: string;
  category: string;
  categoryKh: string;
  titleKh: string;
  titleEn: string;
  evidenceKh: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT' | 'NA';
  findings: string;
}

interface CapItem {
  id: string;
  code: string;
  category: string;
  finding: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  pic: string;
  deadline: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
}

const INITIAL_CHECKLISTS: ChecklistItem[] = [
  // 1. Compliance Audit
  {
    id: 'comp-1',
    category: 'compliance',
    categoryKh: '១. អនុលោមភាពច្បាប់ (Compliance)',
    titleKh: 'បទបញ្ជាផ្ទៃក្នុងក្រុមហ៊ុន (Internal Regulations)',
    titleEn: 'Internal regulations officially certified by the Ministry of Labour (MLVT)',
    evidenceKh: 'សៀវភៅបទបញ្ជាផ្ទៃក្នុងមានត្រាក្រសួងការងារ និងកាលបរិច្ឆេទសុពលភាព',
    risk: 'HIGH',
    status: 'COMPLIANT',
    findings: 'បានចុះបញ្ជិកាត្រឹមត្រូវជាមួយក្រសួងការងារ',
  },
  {
    id: 'comp-2',
    category: 'compliance',
    categoryKh: '១. អនុលោមភាពច្បាប់ (Compliance)',
    titleKh: 'កិច្ចសន្យាការងារស្របច្បាប់ (Employment Contracts)',
    titleEn: 'Valid employment contracts (FDC/UDC) for all employees with copies stored',
    evidenceKh: 'សំណុំឯកសារកិច្ចសន្យាការងារដើម មានចុះហត្ថលេខាទាំងសងខាង',
    risk: 'HIGH',
    status: 'COMPLIANT',
    findings: 'កិច្ចសន្យា ៣ ភាសាត្រូវបានចុះហត្ថលេខាពេញលេញ',
  },
  {
    id: 'comp-3',
    category: 'compliance',
    categoryKh: '១. អនុលោមភាពច្បាប់ (Compliance)',
    titleKh: 'ការចុះឈ្មោះ និងបង់ភាគទាន ប.ស.ស. (NSSF Registration)',
    titleEn: 'Registration and timely payment of NSSF contributions (Occupational, Health, Pension)',
    evidenceKh: 'វិក្កយបត្របង់ប្រាក់ ប.ស.ស. ប្រចាំខែ និងកាត ប.ស.ស. របស់បុគ្គលិក',
    risk: 'HIGH',
    status: 'COMPLIANT',
    findings: 'បានបង់ភាគទានទៀងទាត់រៀងរាល់ខែ',
  },
  {
    id: 'comp-4',
    category: 'compliance',
    categoryKh: '១. អនុលោមភាពច្បាប់ (Compliance)',
    titleKh: 'ប្រាក់រំលឹកអតីតភាពការងារ (Seniority Indemnity)',
    titleEn: 'Bi-annual seniority indemnity payments for UDC contracts according to labor law',
    evidenceKh: 'តារាងគណនាប្រាក់រំលឹក និងភស្តុតាងផ្ទេរប្រាក់ក្នុងខែមិថុនា និងធ្នូ',
    risk: 'HIGH',
    status: 'COMPLIANT',
    findings: 'បានទូទាត់ត្រឹមត្រូវតាមកាលកំណត់',
  },
  {
    id: 'comp-5',
    category: 'compliance',
    categoryKh: '១. អនុលោមភាពច្បាប់ (Compliance)',
    titleKh: 'សៀវភៅការងារ និងប័ណ្ណការងារជនបរទេស (Workbooks & Permits)',
    titleEn: 'Employment workbooks for locals and valid foreign work permits',
    evidenceKh: 'សៀវភៅការងារបុគ្គលិកខ្មែរ និងកាតការងារជនបរទេសពីប្រព័ន្ធ FWEMS',
    risk: 'HIGH',
    status: 'PARTIAL',
    findings: 'នៅខ្វះសៀវភៅការងារបុគ្គលិកថ្មីចំនួន ៣ នាក់កំពុងរត់ការ',
  },

  // 2. Recruitment and Hiring
  {
    id: 'rec-1',
    category: 'recruitment',
    categoryKh: '២. ការជ្រើសរើសបុគ្គលិក (Recruitment)',
    titleKh: 'សេចក្តីពិពណ៌នាមុខតំណែងស្តង់ដា (Standard Job Descriptions)',
    titleEn: 'Accurate and compliant job descriptions for all active roles',
    evidenceKh: 'ឯកសារ JD ចុះហត្ថលេខាដោយបុគ្គលិក និងប្រធានផ្នែក',
    risk: 'MEDIUM',
    status: 'COMPLIANT',
    findings: 'គ្រប់តួនាទីមាន JD ពេញលេញ',
  },
  {
    id: 'rec-2',
    category: 'recruitment',
    categoryKh: '២. ការជ្រើសរើសបុគ្គលិក (Recruitment)',
    titleKh: 'ដំណើរការសម្ភាសន៍មានតម្លាភាព (Standardized Screening & Interview)',
    titleEn: 'Structured interview evaluation forms preventing discrimination and bias',
    evidenceKh: 'ទម្រង់វាយតម្លៃសម្ភាសន៍ (Interview Evaluation Forms) រក្សាទុកក្នុងប្រព័ន្ធ ATS',
    risk: 'MEDIUM',
    status: 'COMPLIANT',
    findings: 'មានកំណត់ត្រាពិន្ទុសម្ភាសន៍ច្បាស់លាស់',
  },
  {
    id: 'rec-3',
    category: 'recruitment',
    categoryKh: '២. ការជ្រើសរើសបុគ្គលិក (Recruitment)',
    titleKh: 'ការផ្ទៀងផ្ទាត់ប្រវត្តិរូប និងឯកសារយោង (Reference Checks)',
    titleEn: 'Background and prior employment checks compliant with privacy laws',
    evidenceKh: 'ទម្រង់ Reference Check Sheet រក្សាទុកក្នុងសំណុំឯកសារ',
    risk: 'LOW',
    status: 'PARTIAL',
    findings: 'មិនទាន់បានធ្វើ Reference check លើបុគ្គលិកកម្រិតទូទៅទាំងអស់នៅឡើយ',
  },

  // 3. Compensation & Benefits
  {
    id: 'cb-1',
    category: 'comp_benefits',
    categoryKh: '៣. បៀវត្សរ៍ & អត្ថប្រយោជន៍ (Comp & Ben)',
    titleKh: 'ការទូទាត់ប្រាក់ឈ្នួលមិនទាបជាងអប្បបរមា (Minimum Wage Adherence)',
    titleEn: 'Base wages strictly meet or exceed official national minimum wage regulations',
    evidenceKh: 'បញ្ជី Payroll ប្រចាំខែ និងប្រកាសប្រាក់ឈ្នួលអប្បបរមាក្រសួង',
    risk: 'HIGH',
    status: 'COMPLIANT',
    findings: 'ប្រាក់បៀវត្សរ៍គោលខ្ពស់ជាងកម្រិតអប្បបរមាដែលច្បាប់តម្រូវ',
  },
  {
    id: 'cb-2',
    category: 'comp_benefits',
    categoryKh: '៣. បៀវត្សរ៍ & អត្ថប្រយោជន៍ (Comp & Ben)',
    titleKh: 'ការគណនាប្រាក់ថែមម៉ោង OT ត្រឹមត្រូវ (Accurate OT Calculations)',
    titleEn: 'Overtime computed accurately (1.5x regular, 2.0x Sundays/Holidays, night allowance)',
    evidenceKh: 'Timesheet អេឡិចត្រូនិក, កំណត់ត្រា Fingerprint និង Pay slip បង្ហាញ OT ដាច់ដោយឡែក',
    risk: 'HIGH',
    status: 'COMPLIANT',
    findings: 'រូបមន្តគណនាលើប្រព័ន្ធផ្ទៀងផ្ទាត់ត្រឹមត្រូវតាមច្បាប់ការងារ',
  },
  {
    id: 'cb-3',
    category: 'comp_benefits',
    categoryKh: '៣. បៀវត្សរ៍ & អត្ថប្រយោជន៍ (Comp & Ben)',
    titleKh: 'តម្លាភាពក្នុងការដំឡើងប្រាក់ខែ (Documented Salary Review)',
    titleEn: 'Formal salary review criteria documented and linked to performance reviews',
    evidenceKh: 'គោលការណ៍ Salary Increment Policy និងឯកសារវាយតម្លៃសមិទ្ធកម្ម',
    risk: 'MEDIUM',
    status: 'COMPLIANT',
    findings: 'មានការពិនិត្យដំឡើងប្រាក់ខែប្រចាំឆ្នាំតាមគោលការណ៍ច្បាស់លាស់',
  },

  // 4. Performance Management
  {
    id: 'perf-1',
    category: 'performance',
    categoryKh: '៤. គ្រប់គ្រងសមិទ្ធកម្ម (Performance)',
    titleKh: 'កាលវិភាគវាយតម្លៃការងារទៀងទាត់ (Performance Appraisal Schedule)',
    titleEn: 'Bi-annual or annual performance evaluation conducted consistently',
    evidenceKh: 'កំណត់ត្រាវាយតម្លៃ 360 ដឺក្រេ និងពិន្ទុ KPI ក្នុងប្រព័ន្ធ',
    risk: 'MEDIUM',
    status: 'COMPLIANT',
    findings: 'ដំណើរការវាយតម្លៃ ២ ដងក្នុងមួយឆ្នាំ (Mid-year និង Year-end)',
  },
  {
    id: 'perf-2',
    category: 'performance',
    categoryKh: '៤. គ្រប់គ្រងសមិទ្ធកម្ម (Performance)',
    titleKh: 'ផែនការកែលម្អបុគ្គលិកក្រោមស្តង់ដា (Performance Improvement Plan - PIP)',
    titleEn: 'Documented PIP for underperforming staff with actionable goals and timelines',
    evidenceKh: 'ទម្រង់ PIP Forms និងកំណត់ត្រាប្រជុំប្រឹក្សាយោបល់ (Coaching logs)',
    risk: 'MEDIUM',
    status: 'PARTIAL',
    findings: 'ត្រូវការធ្វើបច្ចុប្បន្នភាពទម្រង់ PIP ឱ្យមាន Action Plan ច្បាស់លាស់ជាងមុន',
  },

  // 5. Employee Relations
  {
    id: 'er-1',
    category: 'relations',
    categoryKh: '៥. ទំនាក់ទំនងបុគ្គលិក (Employee Relations)',
    titleKh: 'នីតិវិធីដោះស្រាយបណ្តឹងតវ៉ា (Grievance Handling Procedure)',
    titleEn: 'Clear, accessible, and confidential grievance reporting and resolution channels',
    evidenceKh: 'ប្រអប់សំបុត្រ ឬឆានែលរាយការណ៍សម្ងាត់ និងកំណត់ត្រាដោះស្រាយវិវាទ',
    risk: 'HIGH',
    status: 'COMPLIANT',
    findings: 'មាននីតិវិធីកត់ត្រា និងដោះស្រាយបណ្តឹងតវ៉ាក្នុងរយៈពេល ៧ ថ្ងៃនៃថ្ងៃធ្វើការ',
  },
  {
    id: 'er-2',
    category: 'relations',
    categoryKh: '៥. ទំនាក់ទំនងបុគ្គលិក (Employee Relations)',
    titleKh: 'ការសម្ភាសន៍បុគ្គលិកលាលែង (Exit Interviews & Clearance)',
    titleEn: 'Structured exit interviews conducted to capture retention feedback and risk insights',
    evidenceKh: 'ទម្រង់ Exit Interview Questionnaires និងស្ថិតិ Turn-over analysis',
    risk: 'MEDIUM',
    status: 'COMPLIANT',
    findings: 'បុគ្គលិកលាលែង ៩៥% បានឆ្លងកាត់ការសម្ភាសន៍ Exit Interview',
  },

  // 6. Training & Development
  {
    id: 'td-1',
    category: 'training',
    categoryKh: '៦. បណ្តុះបណ្តាល & អភិវឌ្ឍន៍ (L&D)',
    titleKh: 'កម្មវិធីណែនាំការងារបុគ្គលិកថ្មី (Structured Orientation & Onboarding)',
    titleEn: 'Formal onboarding orientation covering safety, policies, culture, and compliance',
    evidenceKh: 'Onboarding Checklist ចុះហត្ថលេខាដោយបុគ្គលិកថ្មីក្នុងសប្តាហ៍ដំបូង',
    risk: 'MEDIUM',
    status: 'COMPLIANT',
    findings: 'មានកម្មវិធី Orientation ២ ថ្ងៃសម្រាប់បុគ្គលិកថ្មីគ្រប់រូប',
  },
  {
    id: 'td-2',
    category: 'training',
    categoryKh: '៦. បណ្តុះបណ្តាល & អភិវឌ្ឍន៍ (L&D)',
    titleKh: 'ការវិភាគតម្រូវការបណ្តុះបណ្តាល (Training Needs Analysis - TNA)',
    titleEn: 'Annual training plan aligned with business goals and employee skill gaps',
    evidenceKh: 'ផែនការបណ្តុះបណ្តាលប្រចាំឆ្នាំ និងកំណត់ត្រាវគ្គ LMS',
    risk: 'LOW',
    status: 'PARTIAL',
    findings: 'ត្រូវការបន្ថែមវគ្គបណ្តុះបណ្តាលផ្នែកជំនាញឌីជីថលបន្ថែមទៀត',
  },

  // 7. Policies and Procedures
  {
    id: 'pol-1',
    category: 'policies',
    categoryKh: '៧. គោលការណ៍ & នីតិវិធី (Policies & SOPs)',
    titleKh: 'សៀវភៅណែនាំបុគ្គលិកទាន់សម័យ (Current Employee Handbook)',
    titleEn: 'Employee handbook distributed, acknowledged by signature, and reviewed annually',
    evidenceKh: 'លិខិតទទួលស្គាល់សៀវភៅបុគ្គលិក និងឯកសារ SOP រក្សាទុកក្នុងប្រព័ន្ធ',
    risk: 'HIGH',
    status: 'COMPLIANT',
    findings: 'សៀវភៅបុគ្គលិកធ្វើបច្ចុប្បន្នភាពរៀងរាល់ឆ្នាំ',
  },
  {
    id: 'pol-2',
    category: 'policies',
    categoryKh: '៧. គោលការណ៍ & នីតិវិធី (Policies & SOPs)',
    titleKh: 'ការការពារទិន្នន័យបុគ្គលិក (Employee Data Privacy & Confidentiality)',
    titleEn: 'Secure handling of personal data, wage info, and restricted administrative access',
    evidenceKh: 'ការកំណត់សិទ្ធិ Role-based Access Control លើប្រព័ន្ធ HRIS និងកិច្ចសន្យាសម្ងាត់ NDA',
    risk: 'HIGH',
    status: 'COMPLIANT',
    findings: 'ទិន្នន័យប្រាក់ខែ និងឯកសារផ្ទាល់ខ្លួនការពារដោយលេខសម្ងាត់ច្បាស់លាស់',
  },

  // 8. Health, Safety & EHS
  {
    id: 'ehs-1',
    category: 'safety',
    categoryKh: '៨. សុខភាព & សុវត្ថិភាពការងារ (EHS)',
    titleKh: 'ឧបករណ៍ការពារសុវត្ថិភាព និងគ្លីនិក (PPE & Clinic Facilities)',
    titleEn: 'First aid kits, licensed factory clinic/nurses, and adequate PPE provision',
    evidenceKh: 'កំណត់ត្រា EHS Clinic Logs, របាយការណ៍ផ្គត់ផ្គង់ឧបករណ៍ PPE',
    risk: 'HIGH',
    status: 'COMPLIANT',
    findings: 'គ្លីនិកមានគិលានុបដ្ឋាយិកាប្រចាំការ និងប្រអប់ថ្នាំសង្គ្រោះបឋមគ្រប់គ្រាន់',
  },
  {
    id: 'ehs-2',
    category: 'safety',
    categoryKh: '៨. សុខភាព & សុវត្ថិភាពការងារ (EHS)',
    titleKh: 'ការហាត់សមពន្លត់អគ្គិភ័យ និងគ្រោះអាសន្ន (Fire Drills & Emergency Procedures)',
    titleEn: 'Bi-annual fire safety drills, clear exit signs, and fire extinguisher inspections',
    evidenceKh: 'របាយការណ៍ហាត់សមពន្លត់អគ្គិភ័យ និងកំណត់ត្រាពិនិត្យបំពង់ពន្លត់អគ្គិភ័យ',
    risk: 'HIGH',
    status: 'PARTIAL',
    findings: 'ទើបតែបានហាត់សម ១ ដងក្នុងឆ្នាំនេះ (ត្រូវការរៀបចំម្តងទៀតក្នុងឆមាសទី ២)',
  },

  // 9. Diversity, Equity & Inclusion (DEI)
  {
    id: 'dei-1',
    category: 'dei',
    categoryKh: '៩. សមធម៌ & បរិយាបន្ន (DEI & Non-Discrimination)',
    titleKh: 'គោលការណ៍ប្រឆាំងការបៀតបៀន និងការរើសអើង (Anti-Harassment Policy)',
    titleEn: 'Strict zero-tolerance policy against sexual harassment, bullying, and discrimination',
    evidenceKh: 'គោលការណ៍ប្រឆាំងការបៀតបៀនផ្លូវភេទ និងកម្រងព័ត៌មានអប់រំបុគ្គលិក',
    risk: 'HIGH',
    status: 'COMPLIANT',
    findings: 'មានគោលការណ៍ប្រឆាំងការបៀតបៀនច្បាស់លាស់ និងការផ្សព្វផ្សាយជាប្រចាំ',
  },
];

const INITIAL_CAPS: CapItem[] = [
  {
    id: 'cap-1',
    code: 'CAP-2026-001',
    category: '១. អនុលោមភាពច្បាប់',
    finding: 'នៅខ្វះសៀវភៅការងារបុគ្គលិកថ្មីចំនួន ៣ នាក់មិនទាន់បានបោះត្រាដោយមន្ទីរការងារ',
    risk: 'HIGH',
    action: 'រៀបចំសំណុំឯកសាររូបថត និងកិច្ចសន្យា យកទៅធ្វើសៀវភៅការងារនៅមន្ទីរការងាររាជធានី',
    pic: 'លោក សុខ វិសាល (HR Officer)',
    deadline: '2026-12-10',
    status: 'IN_PROGRESS',
  },
  {
    id: 'cap-2',
    code: 'CAP-2026-002',
    category: '៨. សុខភាព & សុវត្ថិភាព',
    finding: 'មិនទាន់បានធ្វើការហាត់សមពន្លត់អគ្គិភ័យជុំទី ២ ប្រចាំឆ្នាំ',
    risk: 'HIGH',
    action: 'សហការជាមួយការិយាល័យបង្ការអគ្គិភ័យ ដើម្បីរៀបចំកាលវិភាគហាត់សមជូនបុគ្គលិកទាំងអស់',
    pic: 'លោក ហេង វុទ្ធី (EHS Supervisor)',
    deadline: '2026-12-20',
    status: 'OPEN',
  },
  {
    id: 'cap-3',
    code: 'CAP-2026-003',
    category: '៤. គ្រប់គ្រងសមិទ្ធកម្ម',
    finding: 'ទម្រង់ផែនការកែលម្អការងារ (PIP Form) មិនទាន់មានលក្ខណៈស្តង់ដា',
    risk: 'MEDIUM',
    action: 'ធ្វើបច្ចុប្បន្នភាពទម្រង់ PIP ដោយដាក់បញ្ចូលគោលដៅ SMART និងកាលវិភាគ Follow-up',
    pic: 'កញ្ញា ម៉ៅ សុភា (HR Manager)',
    deadline: '2026-11-30',
    status: 'IN_PROGRESS',
  },
];

export default function HrAuditClient({ userRole }: { userRole: string }) {
  const [activeTab, setActiveTab] = useState<'handbook' | 'checklists' | 'cap' | 'templates'>('handbook');
  const [checklists, setChecklists] = useState<ChecklistItem[]>(INITIAL_CHECKLISTS);
  const [caps, setCaps] = useState<CapItem[]>(INITIAL_CAPS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // LocalStorage sync
  useEffect(() => {
    try {
      const savedChecklists = localStorage.getItem('hrm_audit_checklists');
      if (savedChecklists) setChecklists(JSON.parse(savedChecklists));

      const savedCaps = localStorage.getItem('hrm_audit_caps');
      if (savedCaps) setCaps(JSON.parse(savedCaps));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveChecklists = (items: ChecklistItem[]) => {
    setChecklists(items);
    localStorage.setItem('hrm_audit_checklists', JSON.stringify(items));
  };

  const saveCaps = (items: CapItem[]) => {
    setCaps(items);
    localStorage.setItem('hrm_audit_caps', JSON.stringify(items));
  };

  // Metrics
  const stats = useMemo(() => {
    const total = checklists.length;
    const compliant = checklists.filter((i) => i.status === 'COMPLIANT').length;
    const partial = checklists.filter((i) => i.status === 'PARTIAL').length;
    const nonCompliant = checklists.filter((i) => i.status === 'NON_COMPLIANT').length;
    const highRiskIssues = checklists.filter((i) => i.risk === 'HIGH' && i.status !== 'COMPLIANT').length;

    const applicableTotal = total - checklists.filter((i) => i.status === 'NA').length;
    const score = applicableTotal > 0 ? Math.round(((compliant * 1 + partial * 0.5) / applicableTotal) * 100) : 100;

    const openCaps = caps.filter((c) => c.status === 'OPEN').length;
    const inProgressCaps = caps.filter((c) => c.status === 'IN_PROGRESS').length;
    const closedCaps = caps.filter((c) => c.status === 'CLOSED').length;

    return {
      total,
      compliant,
      partial,
      nonCompliant,
      highRiskIssues,
      score,
      openCaps,
      inProgressCaps,
      closedCaps,
    };
  }, [checklists, caps]);

  // Update Status handler
  const handleStatusChange = (id: string, newStatus: ChecklistItem['status']) => {
    const updated = checklists.map((item) => (item.id === id ? { ...item, status: newStatus } : item));
    saveChecklists(updated);
  };

  const handleFindingsChange = (id: string, text: string) => {
    const updated = checklists.map((item) => (item.id === id ? { ...item, findings: text } : item));
    saveChecklists(updated);
  };

  // Add new CAP modal
  const handleAddNewCap = () => {
    Swal.fire({
      title: 'បន្ថែមសកម្មភាពកែលម្អថ្មី (New CAP Item)',
      html: `
        <div style="text-align: left; font-size: 0.9rem; display: flex; flex-direction: column; gap: 10px;">
          <div>
            <label style="font-weight: bold;">ផ្នែក / ជំពូក (Audit Module):</label>
            <input id="swal-cap-cat" class="swal2-input" placeholder="ឧ. ១. អនុលោមភាពច្បាប់" style="width: 100%; margin: 4px 0;">
          </div>
          <div>
            <label style="font-weight: bold;">បញ្ហាដែលបានរកឃើញ (Finding / Gap):</label>
            <textarea id="swal-cap-finding" class="swal2-textarea" placeholder="រៀបរាប់ពីបញ្ហា..." style="width: 100%; margin: 4px 0; height: 70px;"></textarea>
          </div>
          <div>
            <label style="font-weight: bold;">កម្រិតហានិភ័យ (Risk Level):</label>
            <select id="swal-cap-risk" class="swal2-select" style="width: 100%; margin: 4px 0;">
              <option value="HIGH">High (ហានិភ័យខ្ពស់ / ផ្លូវច្បាប់)</option>
              <option value="MEDIUM" selected>Medium (មធ្យម)</option>
              <option value="LOW">Low (ទាប)</option>
            </select>
          </div>
          <div>
            <label style="font-weight: bold;">វិធានការកែលម្អ (Action Plan):</label>
            <textarea id="swal-cap-action" class="swal2-textarea" placeholder="សកម្មភាពជាក់ស្តែងដើម្បីដោះស្រាយ..." style="width: 100%; margin: 4px 0; height: 70px;"></textarea>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-weight: bold;">អ្នកទទួលខុសត្រូវ (PIC):</label>
              <input id="swal-cap-pic" class="swal2-input" placeholder="ឈ្មោះបុគ្គលិក" style="width: 100%; margin: 4px 0;">
            </div>
            <div>
              <label style="font-weight: bold;">កាលបរិច្ឆេទ (Deadline):</label>
              <input id="swal-cap-deadline" type="date" class="swal2-input" style="width: 100%; margin: 4px 0;">
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'រក្សាទុក (Save)',
      cancelButtonText: 'បោះបង់ (Cancel)',
      confirmButtonColor: '#2563eb',
      focusConfirm: false,
      preConfirm: () => {
        const cat = (document.getElementById('swal-cap-cat') as HTMLInputElement).value;
        const finding = (document.getElementById('swal-cap-finding') as HTMLTextAreaElement).value;
        const risk = (document.getElementById('swal-cap-risk') as HTMLSelectElement).value as 'HIGH' | 'MEDIUM' | 'LOW';
        const action = (document.getElementById('swal-cap-action') as HTMLTextAreaElement).value;
        const pic = (document.getElementById('swal-cap-pic') as HTMLInputElement).value;
        const deadline = (document.getElementById('swal-cap-deadline') as HTMLInputElement).value;

        if (!finding || !action) {
          Swal.showValidationMessage('សូមបំពេញបញ្ហាដែលបានរកឃើញ និងវិធានការកែលម្អ!');
          return false;
        }

        return { cat, finding, risk, action, pic, deadline };
      },
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        const newCap: CapItem = {
          id: 'cap-' + Date.now(),
          code: `CAP-${new Date().getFullYear()}-${String(caps.length + 1).padStart(3, '0')}`,
          category: res.value.cat || 'ទូទៅ',
          finding: res.value.finding,
          risk: res.value.risk,
          action: res.value.action,
          pic: res.value.pic || 'HR Team',
          deadline: res.value.deadline || '2026-12-31',
          status: 'OPEN',
        };
        saveCaps([newCap, ...caps]);
        Swal.fire({
          icon: 'success',
          title: 'បានបញ្ចូលជោគជ័យ!',
          text: `លេខកូដសកម្មភាព៖ ${newCap.code}`,
          timer: 1600,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleCapStatusChange = (id: string, status: CapItem['status']) => {
    const updated = caps.map((c) => (c.id === id ? { ...c, status } : c));
    saveCaps(updated);
  };

  const handleDeleteCap = (id: string) => {
    Swal.fire({
      title: 'តើអ្នកប្រាកដទេ?',
      text: 'ទិន្នន័យផែនការកែលម្អនេះនឹងត្រូវបានលុប!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'លុប (Delete)',
      cancelButtonText: 'បោះបង់',
    }).then((r) => {
      if (r.isConfirmed) {
        saveCaps(caps.filter((c) => c.id !== id));
      }
    });
  };

  // Filter checklists
  const filteredChecklists = useMemo(() => {
    return checklists.filter((item) => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchSearch =
        item.titleKh.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryKh.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [checklists, selectedCategory, searchQuery]);

  return (
    <div style={{ padding: '24px 20px', minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      {/* Top Banner & Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.25)',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.8rem' }}>📋</span>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              សវនកម្មធនធានមនុស្ស & អនុលោមភាព (HR Audit & Compliance)
            </h1>
            <span
              style={{
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid rgba(56, 189, 248, 0.4)',
              }}
            >
              MHRM Standard v2.0
            </span>
          </div>
          <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', maxWidth: '750px' }}>
            សៀវភៅណែនាំសវនកម្មស្តង់ដា, តារាងផ្ទៀងផ្ទាត់អនុលោមភាពច្បាប់ការងារកម្ពុជា (MLVT/NSSF) និងការគ្រប់គ្រងផែនការកែលម្អ (CAP)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
            }}
          >
            🖨️ បោះពុម្ពរបាយការណ៍ (Print Report)
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            padding: '18px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>ពិន្ទុអនុលោមភាពសរុប (Compliance Score)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
            <span
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: stats.score >= 80 ? '#16a34a' : stats.score >= 60 ? '#d97706' : '#dc2626',
              }}
            >
              {stats.score}%
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {stats.score >= 80 ? '🟢 ល្អប្រសើរ (High)' : stats.score >= 60 ? '🟡 ត្រូវការកែលម្អ' : '🔴 ហានិភ័យខ្ពស់'}
            </span>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '18px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>ស្ថានភាពផ្ទៀងផ្ទាត់ (Verification Status)</div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '0.85rem' }}>
            <span style={{ color: '#16a34a', fontWeight: 700 }}>🟢 {stats.compliant} អនុលោម</span>
            <span style={{ color: '#d97706', fontWeight: 700 }}>🟡 {stats.partial} ដោយផ្នែក</span>
            <span style={{ color: '#dc2626', fontWeight: 700 }}>🔴 {stats.nonCompliant} មិនអនុលោម</span>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '18px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>ហានិភ័យច្បាប់ខ្ពស់ (High Risk Gaps)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: stats.highRiskIssues > 0 ? '#dc2626' : '#16a34a' }}>
              {stats.highRiskIssues}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>ចំណុចប្រឈមច្បាប់</span>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '18px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>ផែនការកែលម្អ (CAP Action Items)</div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '0.85rem' }}>
            <span style={{ color: '#dc2626', fontWeight: 700 }}>⏳ {stats.openCaps} កំពុងរង់ចាំ</span>
            <span style={{ color: '#2563eb', fontWeight: 700 }}>🔄 {stats.inProgressCaps} កំពុងដោះស្រាយ</span>
            <span style={{ color: '#16a34a', fontWeight: 700 }}>✅ {stats.closedCaps} រួចរាល់</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #e2e8f0',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        {[
          { key: 'handbook', labelKh: '📖 សៀវភៅណែនាំសវនកម្ម (Handbook)', count: null },
          { key: 'checklists', labelKh: '📋 តារាងត្រួតពិនិត្យអន្តរកម្ម (Audit Matrix)', count: checklists.length },
          { key: 'cap', labelKh: '🎯 ផែនការសកម្មភាពកែលម្អ (CAP Tracker)', count: caps.length },
          { key: 'templates', labelKh: '📁 ទម្រង់គំរូទាញយក (Templates & Forms)', count: 5 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              fontWeight: activeTab === tab.key ? 800 : 600,
              fontSize: '0.92rem',
              color: activeTab === tab.key ? '#1e40af' : '#64748b',
              borderBottom: activeTab === tab.key ? '3px solid #1e40af' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.labelKh}
            {tab.count !== null && (
              <span
                style={{
                  background: activeTab === tab.key ? '#dbeafe' : '#f1f5f9',
                  color: activeTab === tab.key ? '#1e40af' : '#475569',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: HANDBOOK */}
      {activeTab === 'handbook' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card: Guide Overview */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '28px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.6rem' }}>📘</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                ១. គោលបំណង និងអត្ថប្រយោជន៍នៃសវនកម្មធនធានមនុស្ស (Purpose & Benefits)
              </h2>
            </div>
            <p style={{ lineHeight: '1.7', color: '#334155', fontSize: '0.92rem', marginBottom: '16px' }}>
              <strong>HR Audit Handbook</strong> បម្រើជាមគ្គុទ្ទេសក៍ប្រតិបត្តិការស្តង់ដា សម្រាប់ត្រួតពិនិត្យ វាយតម្លៃ និងធ្វើបច្ចុប្បន្នភាពមុខងារគ្រប់គ្រងធនធានមនុស្សទាំងអស់នៅក្នុងអង្គភាព។ គោលដៅចម្បងគឺធានាឱ្យបាននូវ **ការអនុលោមតាមច្បាប់ការងារនៃព្រះរាជាណាចក្រកម្ពុជា (MLVT/NSSF)**, កាត់បន្ថយហានិភ័យផ្លូវច្បាប់ និងពិន័យពីស្ថាប័នរដ្ឋ, និងលើកកម្ពស់ផលិតភាពការងាររួម។
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>🛡️ កាត់បន្ថយហានិភ័យផ្លូវច្បាប់ (Risk Mitigation)</div>
                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                  ស្វែងរកចន្លោះប្រហោងទាន់ពេល លើកិច្ចសន្យាការងារ បទបញ្ជាផ្ទៃក្នុង ការបង់ភាគទាន ប.ស.ស. និងប្រាក់ឈ្នួលអប្បបរមា ដើម្បីជៀសវាងបណ្តឹងតវ៉ា ឬការផាកពិន័យ។
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontWeight: 700, color: '#065f46', marginBottom: '6px' }}>⚡ បង្កើនប្រសិទ្ធភាពការងារ (Process Efficiency)</div>
                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                  លុបបំបាត់ភាពស្ទួន និងភាពយឺតយ៉ាវក្នុងដំណើរការជ្រើសរើសបុគ្គលិក ការទូទាត់ប្រាក់ខែ និងការវាយតម្លៃសមិទ្ធកម្មការងារ ៣៦០ ដឺក្រេ។
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '6px' }}>🤝 សមធម៌ និងវប្បធម៌ការងារ (Fair Culture & Retention)</div>
                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                  ធានាឱ្យមានតម្លាភាពក្នុងការលើកទឹកចិត្ត ការដំឡើងតួនាទី និងការទប់ស្កាត់ការរើសអើង និងការបៀតបៀននៅកន្លែងធ្វើការ។
                </div>
              </div>
            </div>
          </div>

          {/* Card: 5-Stage Audit Methodology */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '28px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.6rem' }}>⚙️</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                ២. វិធីសាស្ត្រ និងដំណាក់កាលធ្វើសវនកម្ម ៥ ជំហាន (5-Stage Audit Workflow)
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {[
                {
                  step: 'ជំហាន ១',
                  title: 'កំណត់វិសាលភាព (Scope)',
                  desc: 'កំណត់ផ្នែកដែលត្រូវធ្វើសវនកម្ម (ប្រចាំត្រីមាស ឬប្រចាំឆ្នាំ) និងជ្រើសរើសក្រុមការងារសវនកម្ម។',
                },
                {
                  step: 'ជំហាន ២',
                  title: 'ប្រមូលភស្តុតាង (Data Gathering)',
                  desc: 'ប្រមូលសំណុំឯកសារច្បាប់ កិច្ចសន្យា បញ្ជី payroll កំណត់ត្រា OT និងរបាយការណ៍ប.ស.ស.។',
                },
                {
                  step: 'ជំហាន ៣',
                  title: 'ផ្ទៀងផ្ទាត់ និងដាក់ពិន្ទុ (Evaluate)',
                  desc: 'ប្រើប្រាស់តារាង Checklists ដើម្បីផ្ទៀងផ្ទាត់ និងផ្តល់ពិន្ទុតាម RAG (Compliant, Partial, Non-compliant)។',
                },
                {
                  step: 'ជំហាន ៤',
                  title: 'រៀបចំរបាយការណ៍ (Reporting)',
                  desc: 'ចងក្រងរបាយការណ៍សង្ខេបជូនគណៈគ្រប់គ្រង រំលេចចំណុចហានិភ័យខ្ពស់ និងមូលហេតុឫសគល់។',
                },
                {
                  step: 'ជំហាន ៥',
                  title: 'ផែនការកែលម្អ (CAP Follow-up)',
                  desc: 'រៀបចំផែនការ Corrective Action Plan ដោយកំណត់អ្នកទទួលខុសត្រូវ (PIC) និងកាលបរិច្ឆេទច្បាស់លាស់។',
                },
              ].map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#f8fafc',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span
                    style={{
                      background: '#dbeafe',
                      color: '#1e40af',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                    }}
                  >
                    {s.step}
                  </span>
                  <div style={{ fontWeight: 700, margin: '8px 0 4px', fontSize: '0.88rem' }}>{s.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: 9 Standard Audit Domains */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '28px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.6rem' }}>🗂️</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                ៣. ជំពូកសវនកម្មទាំង ៩ ផ្នែក (The 9 Audit Domains)
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
              {[
                { no: '១', title: 'Compliance Audit', kh: 'អនុលោមភាពច្បាប់ការងារ បទបញ្ជាផ្ទៃក្នុង និង ប.ស.ស.' },
                { no: '២', title: 'Recruitment & Hiring', kh: 'ការជ្រើសរើស សម្ភាសន៍ និងការបញ្ជាក់ប្រវត្តិរូបបេក្ខជន' },
                { no: '៣', title: 'Compensation & Benefits', kh: 'ប្រាក់ឈ្នួលអប្បបរមា ប្រាក់រំលឹកអតីតភាព និងការថែមម៉ោង OT' },
                { no: '៤', title: 'Performance Management', kh: 'ការវាយតម្លៃសមិទ្ធកម្មការងារ ៣៦០ ដឺក្រេ និងផែនការ PIP' },
                { no: '៥', title: 'Employee Relations', kh: 'នីតិវិធីដោះស្រាយបណ្តឹងតវ៉ា និងការសម្ភាសន៍ចាកចេញ (Exit)' },
                { no: '៦', title: 'Training & Development', kh: 'សមាហរណកម្មបុគ្គលិកថ្មី (Onboarding) និងការបណ្តុះបណ្តាល' },
                { no: '៧', title: 'HR Policies & SOPs', kh: 'សៀវភៅបុគ្គលិក និងការការពារទិន្នន័យសម្ងាត់ (Data Privacy)' },
                { no: '៨', title: 'Health & Safety (EHS)', kh: 'ស្តង់ដាសុវត្ថិភាពការងារ គ្លីនិក និងការហាត់សមអគ្គិភ័យ' },
                { no: '៩', title: 'Diversity, Equity & Inclusion', kh: 'សមធម៌ និងការទប់ស្កាត់ការបៀតបៀននៅកន្លែងធ្វើការ' },
              ].map((domain, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <div
                    style={{
                      background: '#1e3a8a',
                      color: '#ffffff',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      flexShrink: 0,
                    }}
                  >
                    {domain.no}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{domain.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{domain.kh}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE CHECKLIST MATRIX */}
      {activeTab === 'checklists' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Controls Bar */}
          <div
            style={{
              background: '#ffffff',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#475569' }}>ចម្រោះតាមផ្នែក៖</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              >
                <option value="ALL">គ្រប់ផ្នែកទាំងអស់ (All 9 Domains)</option>
                <option value="compliance">១. អនុលោមភាពច្បាប់ (Compliance)</option>
                <option value="recruitment">២. ការជ្រើសរើសបុគ្គលិក (Recruitment)</option>
                <option value="comp_benefits">៣. បៀវត្សរ៍ & អត្ថប្រយោជន៍ (Comp & Ben)</option>
                <option value="performance">៤. គ្រប់គ្រងសមិទ្ធកម្ម (Performance)</option>
                <option value="relations">៥. ទំនាក់ទំនងបុគ្គលិក (Employee Relations)</option>
                <option value="training">៦. បណ្តុះបណ្តាល & អភិវឌ្ឍន៍ (L&D)</option>
                <option value="policies">៧. គោលការណ៍ & SOPs (Policies)</option>
                <option value="safety">៨. សុខភាព & សុវត្ថិភាពការងារ (EHS)</option>
                <option value="dei">៩. សមធម៌ & បរិយាបន្ន (DEI)</option>
              </select>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ស្វែងរកតាមពាក្យគន្លឹះ..."
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  minWidth: '220px',
                }}
              />
            </div>

            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              បង្ហាញ <strong>{filteredChecklists.length}</strong> នៃ <strong>{checklists.length}</strong> ចំណុចត្រួតពិនិត្យ
            </div>
          </div>

          {/* Checklist Table */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '14px 16px', width: '25%' }}>សំណួរផ្ទៀងផ្ទាត់ (Audit Item)</th>
                    <th style={{ padding: '14px 16px', width: '25%' }}>ភស្តុតាងដែលត្រូវពិនិត្យ (Evidence)</th>
                    <th style={{ padding: '14px 16px', width: '10%', textAlign: 'center' }}>ហានិភ័យ</th>
                    <th style={{ padding: '14px 16px', width: '18%', textAlign: 'center' }}>ស្ថានភាព (Status)</th>
                    <th style={{ padding: '14px 16px', width: '22%' }}>កំណត់ត្រាការរកឃើញ (Findings)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChecklists.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: item.status === 'NON_COMPLIANT' ? 'rgba(254, 242, 242, 0.4)' : '#ffffff',
                      }}
                    >
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, marginBottom: '2px' }}>
                          {item.categoryKh}
                        </div>
                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>{item.titleKh}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.titleEn}</div>
                      </td>

                      <td style={{ padding: '14px 16px', verticalAlign: 'top', color: '#334155' }}>
                        <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                          📑 {item.evidenceKh}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background:
                              item.risk === 'HIGH' ? '#fee2e2' : item.risk === 'MEDIUM' ? '#fef3c7' : '#dcfce7',
                            color: item.risk === 'HIGH' ? '#991b1b' : item.risk === 'MEDIUM' ? '#92400e' : '#166534',
                          }}
                        >
                          {item.risk}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'center' }}>
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            outline: 'none',
                            border: '1px solid',
                            borderColor:
                              item.status === 'COMPLIANT'
                                ? '#86efac'
                                : item.status === 'PARTIAL'
                                ? '#fde047'
                                : item.status === 'NON_COMPLIANT'
                                ? '#fca5a5'
                                : '#cbd5e1',
                            background:
                              item.status === 'COMPLIANT'
                                ? '#f0fdf4'
                                : item.status === 'PARTIAL'
                                ? '#fefce8'
                                : item.status === 'NON_COMPLIANT'
                                ? '#fef2f2'
                                : '#f8fafc',
                            color:
                              item.status === 'COMPLIANT'
                                ? '#166534'
                                : item.status === 'PARTIAL'
                                ? '#854d0e'
                                : item.status === 'NON_COMPLIANT'
                                ? '#991b1b'
                                : '#475569',
                          }}
                        >
                          <option value="COMPLIANT">🟢 អនុលោម (Compliant)</option>
                          <option value="PARTIAL">🟡 ដោយផ្នែក (Partial)</option>
                          <option value="NON_COMPLIANT">🔴 មិនអនុលោម (Non-Compliant)</option>
                          <option value="NA">⚪ មិនពាក់ព័ន្ធ (N/A)</option>
                        </select>
                      </td>

                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <input
                          type="text"
                          value={item.findings}
                          onChange={(e) => handleFindingsChange(item.id, e.target.value)}
                          placeholder="កត់ត្រាលទ្ធផលជាក់ស្តែង..."
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.8rem',
                            background: '#ffffff',
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CORRECTIVE ACTION PLAN (CAP TRACKER) */}
      {activeTab === 'cap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Action Bar */}
          <div
            style={{
              background: '#ffffff',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>ផែនការសកម្មភាពកែលម្អ (CAP Implementation Log)</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                តាមដាន និងដោះស្រាយចំណុចខ្វះខាតដែលបានរកឃើញពីសវនកម្ម ឱ្យបានទាន់ពេលវេលា
              </p>
            </div>

            <button
              onClick={handleAddNewCap}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '9px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
              }}
            >
              ➕ បន្ថែមសកម្មភាពថ្មី (Add Action Item)
            </button>
          </div>

          {/* CAP Table */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 14px', width: '10%' }}>កូដ (Code)</th>
                    <th style={{ padding: '12px 14px', width: '22%' }}>បញ្ហាដែលបានរកឃើញ (Finding)</th>
                    <th style={{ padding: '12px 14px', width: '8%', textAlign: 'center' }}>ហានិភ័យ</th>
                    <th style={{ padding: '12px 14px', width: '24%' }}>វិធានការកែលម្អ (Action Plan)</th>
                    <th style={{ padding: '12px 14px', width: '14%' }}>អ្នកទទួលខុសត្រូវ (PIC)</th>
                    <th style={{ padding: '12px 14px', width: '10%' }}>កាលបរិច្ឆេទ</th>
                    <th style={{ padding: '12px 14px', width: '12%', textAlign: 'center' }}>ស្ថានភាព</th>
                  </tr>
                </thead>
                <tbody>
                  {caps.map((cap) => (
                    <tr key={cap.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#1e40af' }}>
                        {cap.code}
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'normal' }}>{cap.category}</div>
                      </td>

                      <td style={{ padding: '12px 14px', color: '#0f172a', lineHeight: '1.4' }}>{cap.finding}</td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background:
                              cap.risk === 'HIGH' ? '#fee2e2' : cap.risk === 'MEDIUM' ? '#fef3c7' : '#dcfce7',
                            color: cap.risk === 'HIGH' ? '#991b1b' : cap.risk === 'MEDIUM' ? '#92400e' : '#166534',
                          }}
                        >
                          {cap.risk}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>{cap.action}</td>

                      <td style={{ padding: '12px 14px', color: '#475569', fontSize: '0.8rem' }}>👤 {cap.pic}</td>

                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.8rem' }}>📅 {cap.deadline}</td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <select
                            value={cap.status}
                            onChange={(e) => handleCapStatusChange(cap.id, e.target.value as any)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              outline: 'none',
                              border: '1px solid #cbd5e1',
                              background:
                                cap.status === 'CLOSED'
                                  ? '#dcfce7'
                                  : cap.status === 'IN_PROGRESS'
                                  ? '#dbeafe'
                                  : '#fee2e2',
                              color:
                                cap.status === 'CLOSED'
                                  ? '#166534'
                                  : cap.status === 'IN_PROGRESS'
                                  ? '#1e40af'
                                  : '#991b1b',
                            }}
                          >
                            <option value="OPEN">Open (រង់ចាំ)</option>
                            <option value="IN_PROGRESS">In Progress (កំពុងធ្វើ)</option>
                            <option value="CLOSED">Closed (រួចរាល់)</option>
                          </select>
                          <button
                            onClick={() => handleDeleteCap(cap.id)}
                            title="លុប"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TEMPLATES & RESOURCES */}
      {activeTab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {[
            {
              title: 'ទម្រង់ផែនការកែលម្អ (Corrective Action Plan Form)',
              desc: 'ទម្រង់ស្តង់ដាសម្រាប់ចុះហត្ថលេខាអនុម័តដោយ HR Director និង CEO លើចំណុចដែលត្រូវកែលម្អ។',
              icon: '🎯',
              type: 'PDF / DOCX',
              preview: `កាលបរិច្ឆេទសវនកម្ម៖ [DD/MM/YYYY]\nសវនករទទួលបន្ទុក៖ .............................\nផ្នែក៖ .............................\n• កូដបញ្ហា: CAP-001\n• ហានិភ័យ: High\n• វិធានការដោះស្រាយ: ..........................\n• អ្នកទទួលខុសត្រូវ (PIC): ....................\n• កាលបរិច្ឆេទសម្រេច: .........................`,
            },
            {
              title: 'ទម្រង់សម្ភាសន៍បុគ្គលិកលាលែង (Exit Interview Form)',
              desc: 'កម្រងសំណួរស្វែងយល់ពីមូលហេតុនៃការចាកចេញ និងការវាយតម្លៃបរិយាកាសការងារ និងប្រាក់បៀវត្សរ៍។',
              icon: '📝',
              type: 'Form Template',
              preview: `១. តើអ្វីជាមូលហេតុចម្បងដែលលោក/លោកស្រីសម្រេចចិត្តលាលែង?\n[ ] ឱកាសការងារថ្មី  [ ] បៀវត្សរ៍មិនសមរម្យ  [ ] បញ្ហាគ្រួសារ\n២. តើលោក/លោកស្រីពេញចិត្តនឹងការគ្រប់គ្រងរបស់ប្រធានផ្នែកកម្រិតណា? (១ ដល់ ៥)\n៣. តើក្រុមហ៊ុនគួរកែលម្អអ្វីខ្លះដើម្បីរក្សាបុគ្គលិកឱ្យនៅយូរអង្វែង?`,
            },
            {
              title: 'តារាងត្រួតពិនិត្យសុវត្ថិភាពការងារ (Safety & EHS Checklist)',
              desc: 'តារាងចុះពិនិត្យប្រចាំខែលើបំពង់ពន្លត់អគ្គិភ័យ ច្រកទ្វារអាសន្ន និងឧបករណ៍ការពារសុវត្ថិភាព (PPE)។',
              icon: '🏥',
              type: 'Checklist Template',
              preview: `[ ] បំពង់ពន្លត់អគ្គិភ័យមានកម្រិតសម្ពាធត្រឹមត្រូវ (កុងទ័រនៅកម្រិតបៃតង)\n[ ] ច្រកទ្វារអាសន្នមិនមានទំនិញរាំងស្ទះ និងមានភ្លើងសញ្ញាច្បាស់លាស់\n[ ] គ្លីនិកមានថ្នាំសង្គ្រោះបឋម និងមានគិលានុបដ្ឋាយិកាប្រចាំការ\n[ ] បុគ្គលិកផ្នែកផលិតកម្មពាក់ឧបករណ៍ PPE គ្រប់គ្នា`,
            },
            {
              title: 'ទម្រង់វាយតម្លៃពេលសាកល្បងការងារ (Probation Review Sheet)',
              desc: 'ទម្រង់សម្រាប់ប្រធានផ្នែកវាយតម្លៃបុគ្គលិកថ្មីមុនពេលផ្តល់កិច្ចសន្យាការងារពេញសិទ្ធិ (FDC/UDC)។',
              icon: '⭐',
              type: 'Appraisal Sheet',
              preview: `ឈ្មោះបុគ្គលិក៖ .................... មុខតំណែង៖ ....................\nរយៈពេលសាកល្បង៖ ៣ ខែ\n• ជំនាញការងារបច្ចេកទេស (Tech Skills): [ 1 - 5 ]\n• វិន័យ និងការគោរពម៉ោងការងារ: [ 1 - 5 ]\n• សីលធម៌ និងការសហការក្នុងក្រុម: [ 1 - 5 ]\nការសម្រេច៖ [ ] ជាប់ជាស្ថាពរ  [ ] ពន្យារពេលសាកល្បង  [ ] មិនជាប់`,
            },
            {
              title: 'ទម្រង់របាយការណ៍បណ្តឹងតវ៉ា (Grievance Incident Form)',
              desc: 'ទម្រង់សម្ងាត់សម្រាប់កត់ត្រាបណ្តឹងតវ៉ា ការរើសអើង ឬទំនាស់រវាងបុគ្គលិក និងបុគ្គលិក។',
              icon: '⚖️',
              type: 'Confidential Form',
              preview: `លេខកូដបណ្តឹង៖ GR-2026-XXXX\nកាលបរិច្ឆេទកើតហេតុ៖ ....................\nកម្មវត្ថុបណ្តឹង៖ [ ] ការរើសអើង  [ ] ការបៀតបៀន  [ ] បៀវត្សរ៍/ម៉ោងធ្វើការ\nដំណើររឿងសង្ខេប៖ ................................................\nចំណាត់ការដោះស្រាយរបស់ HR៖ .....................................`,
            },
          ].map((tmpl, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{tmpl.icon}</span>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>{tmpl.title}</div>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 12px', lineHeight: '1.5' }}>
                  {tmpl.desc}
                </p>

                <div
                  style={{
                    background: '#f8fafc',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: '#334155',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '120px',
                    overflowY: 'auto',
                  }}
                >
                  {tmpl.preview}
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {tmpl.type}
                </span>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(tmpl.preview);
                    Swal.fire({
                      icon: 'success',
                      title: 'បានចម្លង (Copied!)',
                      text: 'ខ្លឹមសារគំរូត្រូវបានចម្លងទៅ Clipboard រួចរាល់។',
                      timer: 1400,
                      showConfirmButton: false,
                    });
                  }}
                  style={{
                    background: '#f0fdf4',
                    color: '#16a34a',
                    border: '1px solid #bbf7d0',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  📋 ចម្លងទម្រង់ (Copy Form)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
