'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { runAutomatedDataAudit, AutoAuditReport, AutoAuditIssue } from './actions';

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
];

const LABOR_LAW_ARTICLES = [
  {
    article: 'មាត្រា ៦៧ & ៧៣',
    topic: 'កិច្ចសន្យាកំណត់ថិរវេលា (FDC Contract)',
    lawText: 'កិច្ចសន្យាការងារមានថិរវេលាកំណត់ (FDC) អាចបន្តបានម្តង ឬច្រើនដង ប៉ុន្តែថិរវេលាសរុបមិនត្រូវលើសពី ២ ឆ្នាំ (២៤ ខែ) ឡើយ។ ប្រសិនបើបន្តលើសពី ២ ឆ្នាំ កិច្ចសន្យានេះនឹងក្លាយជាកិច្ចសន្យាមិនកំណត់ថិរវេលា (UDC) ដោយស្វ័យប្រវត្តិ។',
    keyPoint: 'ហានិភ័យ៖ បើបុគ្គលិកធ្វើការលើស ២ ឆ្នាំ និយោជកមិនអាចបញ្ចប់កិច្ចសន្យាដោយមិនទូទាត់សំណងជំងឺចិត្ត និងប្រាក់ដំណាច់តាមច្បាប់ UDC បានឡើយ។',
  },
  {
    article: 'មាត្រា ៨៩ & ប្រកាស ៤៤៣',
    topic: 'ប្រាក់រំលឹកអតីតភាពការងារ (Seniority Indemnity)',
    lawText: 'និយោជកត្រូវទូទាត់ប្រាក់រំលឹកអតីតភាពការងារចំនួន ១៥ ថ្ងៃនៃប្រាក់ឈ្នួល និងអត្ថប្រយោជន៍ផ្សេងៗក្នុងមួយឆ្នាំ សម្រាប់បុគ្គលិកដែលមានកិច្ចសន្យា UDC ដោយបែងចែកជា ២ ដងក្នុងមួយឆ្នាំ (៧.៥ ថ្ងៃក្នុងខែមិថុនា និង ៧.៥ ថ្ងៃក្នុងខែធ្នូ)។',
    keyPoint: 'ហានិភ័យ៖ ការខកខានមិនបានទូទាត់ទាន់ពេលវេលា អាចប្រឈមនឹងការពិន័យអន្តរកាលពីអធិការការងារ។',
  },
  {
    article: 'មាត្រា ១៣៧ & ១៣៩',
    topic: 'ម៉ោងការងារធម្មតា និងការថែមម៉ោង (Working Hours & OT)',
    lawText: 'ម៉ោងធ្វើការធម្មតាមិនត្រូវលើសពី ៨ ម៉ោងក្នុងមួយថ្ងៃ ឬ ៤៨ ម៉ោងក្នុងមួយសប្តាហ៍។ ការថែមម៉ោងបន្ទាន់ត្រូវធ្វើឡើងដោយស្ម័គ្រចិត្ត និងមិនឱ្យលើសពី ២ ម៉ោងក្នុងមួយថ្ងៃ។ ប្រាក់ឈ្នួលថែមម៉ោងត្រូវគណនាអត្រា ១៥០% (ថ្ងៃធម្មតា), ២០០% (ថ្ងៃអាទិត្យ/បុណ្យ), និងបន្ថែមប្រាក់ឧបត្ថម្ភពេលយប់។',
    keyPoint: 'ហានិភ័យ៖ ការបង្ខិតបង្ខំបុគ្គលិកឱ្យថែមម៉ោង ឬធ្វើលើស ២ ម៉ោង/ថ្ងៃ គឺជាអំពើល្មើសច្បាប់ការងារធ្ងន់ធ្ងរ។',
  },
  {
    article: 'មាត្រា ២៦១',
    topic: 'ការប្រើប្រាស់កម្លាំងពលករបរទេស (Foreign Workers)',
    lawText: 'ជនបរទេសណាដែលគ្មានប័ណ្ណការងារ និងសៀវភៅការងារដែលចេញដោយក្រសួងការងារ មិនអាចត្រូវបានជួលឱ្យធ្វើការបានឡើយ។ សហគ្រាសត្រូវស្នើសុំកូតាប្រើប្រាស់ពលករបរទេស (មិនឱ្យលើសពី ១០% នៃកម្លាំងពលកម្មខ្មែរ)។',
    keyPoint: 'ហានិភ័យ៖ ការជួលជនបរទេសគ្មានប័ណ្ណការងារ ប្រឈមនឹងការផាកពិន័យពី ៦១ ទៅ ៩០ ថ្ងៃនៃប្រាក់ចំណូលមូលដ្ឋាន និងការបណ្តេញចេញពីប្រទេស។',
  },
  {
    article: 'ច្បាប់ ប.ស.ស. មាត្រា ៧',
    topic: 'កាតព្វកិច្ចចុះបញ្ជីបុគ្គលិកនៅ ប.ស.ស. (NSSF Obligations)',
    lawText: 'ម្ចាស់សហគ្រាសត្រូវចុះបញ្ជីបុគ្គលិកទាំងអស់ (ទាំងខ្មែរ និងបរទេស ទាំងសាកល្បង និងពេញសិទ្ធិ) នៅ ប.ស.ស. ក្នុងរយៈពេលយ៉ាងយូរ ៣០ ថ្ងៃ គិតចាប់ពីថ្ងៃចូលបម្រើការងារ។ ត្រូវបង់ភាគទានរបបហានិភ័យការងារ ថែទាំសុខភាព និងប្រាក់សោធនទៀងទាត់។',
    keyPoint: 'ហានិភ័យ៖ និយោជកដែលមិនចុះបញ្ជី ប.ស.ស. ត្រូវទទួលខុសត្រូវរាល់ការចំណាយលើការព្យាបាល និងសំណងគ្រោះថ្នាក់ការងារជំនួស ប.ស.ស. ទាំងស្រុង។',
  },
];

export default function HrAuditClient({ userRole }: { userRole: string }) {
  const [activeTab, setActiveTab] = useState<'scan' | 'handbook' | 'checklists' | 'cap' | 'law' | 'templates'>('scan');
  const [checklists, setChecklists] = useState<ChecklistItem[]>(INITIAL_CHECKLISTS);
  const [caps, setCaps] = useState<CapItem[]>(INITIAL_CAPS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lawSearchQuery, setLawSearchQuery] = useState<string>('');

  // Auto Audit State
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [autoReport, setAutoReport] = useState<AutoAuditReport | null>(null);

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

  // Run Real-time Automated Data Audit Scan
  const handleRunAutoAudit = async () => {
    setIsScanning(true);
    try {
      const res = await runAutomatedDataAudit();
      if (res.success && res.report) {
        setAutoReport(res.report);
        Swal.fire({
          icon: 'success',
          title: 'ស្កេនទិន្នន័យជោគជ័យ!',
          text: `បានស្កេនបុគ្គលិក ${res.report.totalEmployeesScanned} នាក់ និងកិច្ចសន្យា ${res.report.totalContractsScanned}។ រកឃើញហានិភ័យខ្ពស់ ${res.report.highRiskCount} ចំណុច។`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'បរាជ័យក្នុងការស្កេន',
          text: res.error || 'មានបញ្ហាក្នុងការទាញយកទិន្នន័យ',
        });
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'កំហុសបច្ចេកទេស', text: err.message });
    } finally {
      setIsScanning(false);
    }
  };

  // Convert an auto-detected issue into a CAP Item
  const handleConvertIssueToCap = (issue: AutoAuditIssue) => {
    const newCap: CapItem = {
      id: 'cap-' + Date.now(),
      code: `CAP-${new Date().getFullYear()}-${String(caps.length + 1).padStart(3, '0')}`,
      category: issue.categoryKh,
      finding: `${issue.titleKh}: ${issue.descriptionKh}`,
      risk: issue.severity,
      action: issue.recommendedActionKh,
      pic: 'HR Officer',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'OPEN',
    };

    saveCaps([newCap, ...caps]);
    Swal.fire({
      icon: 'success',
      title: 'បានបញ្ចូលទៅក្នុង CAP!',
      text: `លេខកូដសកម្មភាពថ្មី៖ ${newCap.code}`,
      timer: 1600,
      showConfirmButton: false,
    });
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

  // Filter Labor Laws
  const filteredLaws = useMemo(() => {
    return LABOR_LAW_ARTICLES.filter((law) => {
      return (
        law.article.toLowerCase().includes(lawSearchQuery.toLowerCase()) ||
        law.topic.toLowerCase().includes(lawSearchQuery.toLowerCase()) ||
        law.lawText.toLowerCase().includes(lawSearchQuery.toLowerCase())
      );
    });
  }, [lawSearchQuery]);

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
              សវនកម្មធនធានមនុស្ស & ច្បាប់ការងារ (HR Audit & Labor Compliance)
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
              Enterprise v2.5
            </span>
          </div>
          <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', maxWidth: '800px' }}>
            ប្រព័ន្ធស្កេនទិន្នន័យស្វ័យប្រវត្ត (Auto-Audit Scan), សៀវភៅណែនាំសវនកម្ម, បណ្ណាល័យច្បាប់ការងារ និងការគ្រប់គ្រងផែនការកែលម្អ (CAP)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleRunAutoAudit}
            disabled={isScanning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              background: isScanning ? '#64748b' : '#38bdf8',
              color: '#0f172a',
              border: 'none',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              fontWeight: 800,
              fontSize: '0.85rem',
              boxShadow: '0 2px 8px rgba(56, 189, 248, 0.3)',
            }}
          >
            {isScanning ? '⏳ កំពុងស្កេន...' : '⚡ ស្កេនទិន្នន័យផ្ទាល់ (Auto-Audit)'}
          </button>
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
            }}
          >
            🖨️ បោះពុម្ព (Print)
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
          <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>ពិន្ទុអនុលោមភាពទូទៅ (Compliance Score)</div>
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
          <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>លទ្ធផល Auto-Audit ស្កេនទិន្នន័យ</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
            <span
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: autoReport ? (autoReport.healthScore >= 80 ? '#16a34a' : '#dc2626') : '#64748b',
              }}
            >
              {autoReport ? `${autoReport.healthScore}%` : 'មិនទាន់ស្កេន'}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              {autoReport ? `រកឃើញ ${autoReport.issues.length} បញ្ហា` : 'ចុចប៊ូតុងស្កេនខាងលើ'}
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
          <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>ហានិភ័យច្បាប់ខ្ពស់ (High Risk Gaps)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
            <span
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color:
                  (autoReport ? autoReport.highRiskCount : stats.highRiskIssues) > 0 ? '#dc2626' : '#16a34a',
              }}
            >
              {autoReport ? autoReport.highRiskCount : stats.highRiskIssues}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>ចំណុចប្រឈមច្បាប់ការងារ</span>
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
            <span style={{ color: '#dc2626', fontWeight: 700 }}>⏳ {stats.openCaps} រង់ចាំ</span>
            <span style={{ color: '#2563eb', fontWeight: 700 }}>🔄 {stats.inProgressCaps} កំពុងធ្វើ</span>
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
          overflowX: 'auto',
        }}
      >
        {[
          { key: 'scan', labelKh: '⚡ ម៉ាស៊ីនស្កេនទិន្នន័យ (Auto-Audit Scan)', count: autoReport ? autoReport.issues.length : null },
          { key: 'handbook', labelKh: '📖 សៀវភៅណែនាំសវនកម្ម (Handbook)', count: null },
          { key: 'checklists', labelKh: '📋 តារាងត្រួតពិនិត្យ ៩ ផ្នែក (Checklists)', count: checklists.length },
          { key: 'cap', labelKh: '🎯 ផែនការកែលម្អ (CAP Tracker)', count: caps.length },
          { key: 'law', labelKh: '📚 បណ្ណាល័យច្បាប់ការងារ (Labor Law Library)', count: LABOR_LAW_ARTICLES.length },
          { key: 'templates', labelKh: '📁 ទម្រង់គំរូទាញយក (Templates)', count: 5 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              fontWeight: activeTab === tab.key ? 800 : 600,
              fontSize: '0.9rem',
              color: activeTab === tab.key ? '#1e40af' : '#64748b',
              borderBottom: activeTab === tab.key ? '3px solid #1e40af' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
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

      {/* TAB: AUTO-AUDIT SCAN */}
      {activeTab === 'scan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>⚡</span>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  ការស្កេនទិន្នន័យជាក់ស្តែងតាមប្រព័ន្ធ (Automated Labor Compliance Scan)
                </h2>
              </div>
              <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                ម៉ាស៊ីនស្កេននេះដំណើរការ Query ផ្ទាល់ទៅកាន់ Database ស្វែងរកកិច្ចសន្យា FDC លើស ២ ឆ្នាំ, បុគ្គលិកខ្វះកាត ប.ស.ស., ប័ណ្ណការងារជនបរទេសផុតកំណត់ និងការថែមម៉ោងខុសច្បាប់។
              </p>
            </div>

            <button
              onClick={handleRunAutoAudit}
              disabled={isScanning}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: isScanning ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
              }}
            >
              {isScanning ? '⏳ កំពុងដំណើរការស្កេន...' : '🚀 ចាប់ផ្តើមស្កេនឥឡូវនេះ (Run Scan)'}
            </button>
          </div>

          {!autoReport ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                border: '1px dashed #cbd5e1',
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748b',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
              <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>មិនទាន់មានលទ្ធផលស្កេនទិន្នន័យនៅឡើយទេ</h3>
              <p style={{ margin: '8px 0 20px', fontSize: '0.9rem' }}>
                សូមចុចប៊ូតុង "ចាប់ផ្តើមស្កេនឥឡូវនេះ" ដើម្បីឱ្យប្រព័ន្ធស្កេនសំណុំឯកសារបុគ្គលិក កិច្ចសន្យា និងកំណត់ត្រា OT ក្នុង Database ជាក់ស្តែង។
              </p>
              <button
                onClick={handleRunAutoAudit}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                ⚡ ដំណើរការស្កេនទិន្នន័យ
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Scan Summary Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  កាលបរិច្ឆេទស្កេនចុងក្រោយ៖ <strong>{new Date(autoReport.scannedAt).toLocaleString()}</strong> | បានស្កេនបុគ្គលិក៖{' '}
                  <strong>{autoReport.totalEmployeesScanned} នាក់</strong> | កិច្ចសន្យា៖{' '}
                  <strong>{autoReport.totalContractsScanned}</strong> | កំណត់ត្រា OT៖{' '}
                  <strong>{autoReport.totalOtScanned}</strong>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
                    🔴 ហានិភ័យខ្ពស់៖ {autoReport.highRiskCount}
                  </span>
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
                    🟡 ហានិភ័យមធ្យម៖ {autoReport.mediumRiskCount}
                  </span>
                </div>
              </div>

              {/* Issues List */}
              {autoReport.issues.length === 0 ? (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '30px',
                    textAlign: 'center',
                    color: '#166534',
                  }}
                >
                  <h3>🎉 អបអរសាទរ! មិនមានរកឃើញបញ្ហាប្រឈមច្បាប់ការងារឡើយ</h3>
                  <p>ទិន្នន័យបុគ្គលិក កិច្ចសន្យា ប.ស.ស. និងម៉ោងធ្វើការអនុលោមតាមច្បាប់ការងារយ៉ាងល្អប្រសើរ។</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {autoReport.issues.map((issue) => (
                    <div
                      key={issue.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderLeft: `5px solid ${issue.severity === 'HIGH' ? '#dc2626' : issue.severity === 'MEDIUM' ? '#f59e0b' : '#3b82f6'}`,
                        borderRadius: '10px',
                        padding: '18px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '16px',
                      }}
                    >
                      <div style={{ flex: '1 1 500px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <span
                            style={{
                              background: issue.severity === 'HIGH' ? '#fee2e2' : '#fef3c7',
                              color: issue.severity === 'HIGH' ? '#991b1b' : '#92400e',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                            }}
                          >
                            {issue.severity} RISK
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: 700 }}>
                            {issue.categoryKh}
                          </span>
                        </div>

                        <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a', marginBottom: '4px' }}>
                          {issue.titleKh}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '10px', lineHeight: '1.5' }}>
                          {issue.descriptionKh}
                        </div>

                        <div
                          style={{
                            background: '#f8fafc',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid #f1f5f9',
                            fontSize: '0.8rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          <div style={{ color: '#166534', fontWeight: 700 }}>
                            💡 ដំណោះស្រាយណែនាំ៖ {issue.recommendedActionKh}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                            ⚖️ យោងច្បាប់៖ {issue.legalReferenceKh}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <button
                          onClick={() => handleConvertIssueToCap(issue)}
                          style={{
                            background: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '8px 14px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ➕ បញ្ចូលទៅ CAP (Fix Gap)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: LABOR LAW & LEGAL LIBRARY */}
      {activeTab === 'law' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                📚 បណ្ណាល័យច្បាប់ការងារ និងប្រកាសផ្លូវការ (Cambodia Labor Law Library)
              </h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                មាត្រាគន្លឹះនៃច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា, ប្រកាសលេខ ៤៤៣, និងច្បាប់ស្តីពីរបបសន្តិសុខសង្គម
              </p>
            </div>

            <input
              type="text"
              value={lawSearchQuery}
              onChange={(e) => setLawSearchQuery(e.target.value)}
              placeholder="ស្វែងរកតាមមាត្រា ឬប្រធានបទ..."
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                minWidth: '260px',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {filteredLaws.map((law, idx) => (
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
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span
                      style={{
                        background: '#dbeafe',
                        color: '#1e40af',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                      }}
                    >
                      {law.article}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>MLVT Labor Code</span>
                  </div>

                  <h3 style={{ margin: '4px 0 10px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    {law.topic}
                  </h3>

                  <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.6', marginBottom: '14px' }}>
                    {law.lawText}
                  </p>
                </div>

                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '0.78rem',
                    color: '#991b1b',
                    lineHeight: '1.4',
                  }}
                >
                  ⚠️ <strong>ការអនុវត្ត និងហានិភ័យ៖</strong> {law.keyPoint}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: HANDBOOK */}
      {activeTab === 'handbook' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
        </div>
      )}

      {/* TAB: CHECKLIST MATRIX */}
      {activeTab === 'checklists' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

      {/* TAB: CAP */}
      {activeTab === 'cap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

      {/* TAB: TEMPLATES */}
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
