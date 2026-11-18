'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';

export interface FactorySop {
  id: string;
  code: string; // Document No: e.g. 'EGS/SCP-054'
  edition: string; // Edition: e.g. '02'
  pageInfo: string; // Page count e.g. 'Page 1 of 10'
  initialIssuedDate: string; // Initial Issued Date: e.g. '10-11-2023'
  amendDate: string; // Amend Date: e.g. '10-10-2025'
  effectiveDate: string; // Effective Date: e.g. '11-11-2024'
  category: string;
  categoryKh: string;
  titleKh: string;
  titleEn: string;
  titleCn?: string; // Chinese title e.g. '风险评估政策'
  companyName: string;
  productType: string;
  preparedBy: string;
  preparedRole: string;
  preparedDate: string;
  approvedBy: string;
  approvedRole: string;
  approvedDate: string;
  contentKh: string;
  contentEn: string;
  revisions: {
    rev: string;
    date: string;
    paragraph: string;
    summary: string;
    authorizedBy: string;
  }[];
}

const DEFAULT_SOPS: FactorySop[] = [
  {
    id: 'sop-01',
    edition: '02',
    pageInfo: 'Page 1 of 10',
    initialIssuedDate: '10-11-2023',
    amendDate: '10-10-2025',
    effectiveDate: '11-11-2024',
    titleCn: '预防儿童进入厂区政策',
    code: 'SOP-SEC-001',
    category: 'CHILD_PROTECTION',
    categoryKh: 'ការពារកុមារ & សន្តិសុខ',
    titleKh: 'គោលនយោបាយ និងនីតិវិធីការបង្ការការពារកុមារ ឬកូនក្មេងចូលក្នុងបរិវេណរោងចក្រ',
    titleEn: 'Prevention of Young/Child Entry Factory Premise Policy and Procedure',
    companyName: 'G.S.textileGarment(Cambodia) co.,Ltd',
    productType: 'Garment & Textile Products',
    preparedBy: 'Mr. CHAN PHEARUM',
    preparedRole: 'ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager',
    preparedDate: '01-11-2024',
    approvedBy: 'Mr. CHEN LANMAO',
    approvedRole: 'នាយកក្រុមហ៊ុន General Manager',
    approvedDate: '11-11-2024',
    contentKh: `១. គោលនយោបាយ: POLICY
ក្រុមហ៊ុន មានការប្តេជ្ញាចិត្តនូវការផ្តល់ជូន នូវបរិស្ថានការងារមួយដែលមានសុវត្ថិភាពទៅដល់បុគ្គលិកកម្មករកម្មការិនីនិងអ្នករាល់គ្នាដែលពាក់ព័ន្ធនិងក្រុមហ៊ុនយើង។ ទោះជាយ៉ាងណាក៏ដោយ មានក្តីព្រួយបារម្ភជាច្រើន ទៅលើ គោលនយោបាយ នៃបរិស្ថាន សុខភាពនិងសុវត្ថិភាព ដែលបានចែងឡើងដោយច្បាប់ ដែលត្រូវធ្វើការកែតម្រូវ នៅពេលដែលនិយាយដល់ កុមារឬកូនក្មេងដែលស្ថិតនៅក្នុងបរិវេណរោងចក្រ។ មានគ្រោះថ្នាក់ជាច្រើនដែលអាចនឹងកើតមានឡើង ទៅលើ កុមារឬកូនក្មេង ហើយសក្តានុពលហានិភ័យដ៏ធំដែលអាចបណ្តាលឱ្យកុមារឬកូនក្មេង ធ្វើឱ្យកើតជាគ្រោះថ្នាក់លើខ្លួនពួកគាត់ ឬធ្វើឱ្យកើតលើអ្នកដទៃទៀតផង។ មានតែកុមារត្រូវជាកូនរបស់និយោជិតដែលបានចុះឈ្មោះនៅមណ្ឌលថែទាំកុមារប៉ុណ្ណោះ ដែលត្រូវបានអនុញ្ញាតឱ្យចូលក្នុងបរិវេណរោងចក្រ ជាមួយម្តាយពួកគេ ដើម្បីចូលទៅកាន់មណ្ឌលថែទាំកុមារ។

២. ដែនកំណត់: SCOPE
គោលនយោបាយនេះ ត្រូវដាក់ឱ្យ និយោជក និយោជិត អ្នកម៉ៅការ និងភ្ញៀវ ត្រូវអនុវត្តតាម។

៣. អត្ថន័យ DEFINITIONS
កុមារ៖ បុគ្គលទាំងឡាយណាដែលមានអាយុតិចជាង ១៥ ឆ្នាំ។
ក្មេង៖ បុគ្គលទាំងឡាយណាដែលមានអាយុច្រើនជាង ១៥ ឆ្នាំ និងតិចជាង ១៨ ឆ្នាំ។
ការឆ្លុះពិនិត្យ៖ គឺជាដំណើរការបឋម ដើម្បីកំណត់អត្តសញ្ញាណ អាយុនៃបុគ្គលណាមួយដែលមានបំណងចូលមកក្នុងបរិវេណរោងចក្រ។

៤. នីតិវិធី PROCEDURE
- សន្តិសុខ នៅខ្លោងទ្វារធំ ត្រូវតែឆែកឆេរយ៉ាងតឹងរ៉ឹង ដើម្បីឱ្យប្រាកដថា គ្មានមនុស្សណាម្នាក់ដែលមានអាយុក្រោម ១៨ ឆ្នាំ ទទួលបានការអនុញ្ញាតឱ្យចូលក្នុងបរិវេណរោងចក្រឡើយ។
- សន្តិសុខ ត្រូវឆ្លុះពិនិត្យអ្នករាល់គ្នាដែលមានបំណងចូលរោងចក្រ ដោយស្នើសុំ ឯកសារបញ្ជាក់ពីអាយុ ដូចជា អត្តសញ្ញាណប័ណ្ណ ឬលិខិតឆ្លងដែន។
- ក្នុងករណី មានបុគ្គលណាដែលមានអាយុតិចជាង ១៨ ឆ្នាំ ស្នើសុំជួបនិយោជិត សន្តិសុខត្រូវស្នើឱ្យគាត់ឈរនៅក្រៅបរិវេណរោងចក្រសិន រួចទាក់ទងមកផ្នែកធនធានមនុស្ស។
- និយោជិតដែលមានបំណងយកកូនអាយុពី ១៨ ខែដល់ ៣៦ ខែមកមើលថែនៅមណ្ឌលថែទាំកុមារ ត្រូវចុះឈ្មោះជាមួយផ្នែកធនធានមនុស្សជាមុន។

៥. សិទ្ធិអំណាច និងការទទួលខុសត្រូវ AUTHORITY & RESPONSIBILITY
បុគ្គលិកចាត់តាំងជាន់ខ្ពស់ ពីផ្នែកធនធានមនុស្សនិងផ្នែកប្រតិបត្តិច្បាប់ ត្រូវបានរៀបចំឱ្យធ្វើការទំនាក់ទំនង រៀបចំ និងត្រួតពិនិត្យលើការអនុវត្តគោលនយោបាយនេះ។`,
    contentEn: `1. POLICY
Company is committed to providing a safe work environment for employees and all relevant people. However, there are healthy, safety, environmental, and regulatory concerns that must be addressed when considering the presence of young/child in the workplace. There are many imminent dangers for young/children and a great potential for accidents and incidents in which young/child either harm themselves or inadvertently create a hazard for others. Only employee's children, who are registered in day care center, are allowed entry the factory with his or her mother and go straight to day care center.

2. SCOPE
This policy applies to all employers, employees, contractors & visitors.

3. DEFINITIONS
Child: Any person is less than 15 years of age.
Young: Any person over the age of 15 years and less than the age of 18 years.
Screening: A preliminary process for identifying age of person who intend access in Factory Premise.

4. PROCEDURE
- Security guards at the main gate must check strictly to make sure persons below the age of 18 years are not allowed entry into the factory premise.
- Security guards at the main gate must do screening by requesting age verification documents such as: ID card or Passport before allowing entry.
- In case a person below the age of 18 years requests to meet an employee, security guards must ask him/her to wait outside the factory and contact HR dept.
- Employees who want to place an 18 to 36 months child in the factory's day care center must register with HR dept in advance.

5. AUTHORITY & RESPONSIBILITY
Designated senior staff from HR & Compliance Dept are assigned to communicate, deploy and monitor the practice of Prevention of Young/Child Entry Policy.`,
    revisions: [
      { rev: '01', date: '01-11-2024', paragraph: 'All', summary: 'បង្កើតនីតិវិធីស្តង់ដាដំបូង (Initial Release)', authorizedBy: 'General Manager' },
    ],
  },
  {
    id: 'sop-02',
    edition: '02',
    pageInfo: 'Page 1 of 8',
    initialIssuedDate: '10-11-2023',
    amendDate: '10-10-2025',
    effectiveDate: '11-11-2024',
    titleCn: '禁止使用童工政策',
    code: 'SOP-HR-002',
    category: 'CHILD_LABOR',
    categoryKh: 'ពលកម្មកុមារ & ជួញដូរ',
    titleKh: 'នីតិវិធីស្តីពីការចៀសវាងធ្វើអាជីវកម្មលើពលកម្មកុមារ និងការប្រឆាំងការជួញដូរមនុស្ស',
    titleEn: 'Child Labor Exploitation Avoidance & Anti-Human Trafficking Procedure',
    companyName: 'G.S.textileGarment(Cambodia) co.,Ltd',
    productType: 'Garment & Apparel Manufacturing',
    preparedBy: 'Mr. CHAN PHEARUM',
    preparedRole: 'ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager',
    preparedDate: '01-11-2024',
    approvedBy: 'Mr. CHEN LANMAO',
    approvedRole: 'នាយកក្រុមហ៊ុន General Manager',
    approvedDate: '11-11-2024',
    contentKh: `១. គោលបំណង Purpose
ក្រុមហ៊ុនបានបង្កើតនីតិវិធីនេះឡើងគឺដើម្បី អនុលោមទៅតាម បទបញ្ញត្តិ ច្បាប់ជាតិ និងអន្តរជាតិស្តីពី ការចៀសវាងធ្វើអាជីវកម្មលើពលកម្មកុមារ។

២. ការធ្វើអាជីវកម្មលើពលកម្មកុមារ និងទាសភាព
ក. ការធ្វើអាជីវកម្មលើពលកម្មកុមារ៖ ការប្រើកម្លាំងពលកម្មដោយបង្ខំ រាល់ទម្រង់នៃការងារឬសេវាកម្មដែលដកចេញពីអ្នកណាម្នាក់ដោយការគំរាមកំហែង។ ការកាត់ទុកឬមិនទូទាត់ប្រាក់ឈ្នួល ការយកទៅរក្សាទុកនូវប័ណ្ណសម្គាល់ខ្លួន ឬលិខិតឆ្លងដែន ដើម្បីរឹតបន្តឹងការធ្វើដំណើរ។
ខ. ការគំរាមកំហែងចំពោះការដាក់ពិន័យ៖ តាមរយៈស្មារតី រាងកាយ ការបង្ខាំង និងការពិន័យហិរញ្ញវត្ថុ។
គ. ជាប់បំណុល (Indebtedness): ស្ថានភាពដែលបង្ខំឱ្យធ្វើការងារដើម្បីសងបំណុលមិនសមហេតុផល។

៣. ការទទួលខុសត្រូវ
- ថ្នាក់ដឹកនាំ និងបុគ្គលិកធនធានមនុស្ស ត្រូវឃ្លាំមើលការជ្រើសរើសបុគ្គលិកថ្មី និងធ្វើការស៊ើបអង្កេត ត្រួតពិនិត្យយ៉ាងយកចិត្តទុកដាក់ដើម្បីបញ្ចៀសការធ្វើអាជីវកម្មលើពលកម្មកុមារ។
- ផ្នែកធនធានមនុស្សត្រូវសម្ភាសន៍ និងពិនិត្យឯកសារអាយុឱ្យបានហ្មត់ចត់បំផុត។

៤. ឆានែលរាយការណ៍ (Reporting Channels)
ប្រសិនបើមានការសង្ស័យ អាចរាយការណ៍មកកាន់៖
- ផ្នែកធនធានមនុស្សរបស់ក្រុមហ៊ុន
- អង្គការពលកម្មអន្តរជាតិ (ILO / Better Factories Cambodia)
- អង្គការសិទ្ធិមនុស្ស និងស្ថាប័នមានសមត្ថកិច្ច។`,
    contentEn: `1. PURPOSE
Company has established this policy in accordance with national and international labor provisions to strictly avoid child exploitation and human trafficking.

2. SUPPOSED CHILD EXPLOITATION & SLAVERY
A. Child Exploitation: Forced labor, involuntary servitude, withholding wages or retention of identity documents/passports to restrict movement.
B. Threatening through Punishment: Physical, mental, financial confinement or duress.
C. Indebtedness: Debt bondage or forced labor to repay inflated debt obligations.

3. RESPONSIBILITY
Management and HR team must thoroughly verify age during recruitment and conduct regular floor monitoring to ensure zero tolerance for underage labor.

4. REPORTING CHANNELS
In case of suspicion, report directly to:
- Company HR Department
- International Labor Organization (ILO / BFC)
- Human Rights Organizations & Labor Inspectorate.`,
    revisions: [
      { rev: '01', date: '01-11-2024', paragraph: 'All', summary: 'គោលនយោបាយប្រឆាំងពលកម្មកុមារពេញលេញ', authorizedBy: 'General Manager' },
    ],
  },
  {
    id: 'sop-03',
    edition: '02',
    pageInfo: 'Page 1 of 6',
    initialIssuedDate: '10-11-2023',
    amendDate: '10-10-2025',
    effectiveDate: '11-11-2024',
    titleCn: '员工入职培训政策',
    code: 'SOP-LND-003',
    category: 'TRAINING',
    categoryKh: 'បណ្តុះបណ្តាល & ហ្វឹកហ្វឺន',
    titleKh: 'គោលការណ៍ស្តីពីការហ្វឹកហ្វឺន និងបណ្តុះបណ្តាលវិជ្ជាជីវៈកម្មករនិយោជិត',
    titleEn: 'Vocational Training and Professional Skill Development Policy',
    companyName: 'G.S.textileGarment(Cambodia) co.,Ltd',
    productType: 'Garment & Textile',
    preparedBy: 'Mr. CHAN PHEARUM',
    preparedRole: 'ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager',
    preparedDate: '01-11-2024',
    approvedBy: 'Mr. CHEN LANMAO',
    approvedRole: 'នាយកក្រុមហ៊ុន General Manager',
    approvedDate: '11-11-2024',
    contentKh: `១. គោលបំណង Purpose
បង្កើនទេពកោសល្យ ភាពប៉ិនប្រសប់ ជំនាញ បច្ចេកទេស និងបញ្ចៀសពីគ្រោះថ្នាក់ការងារ ព្រមទាំងបង្កើនប្រសិទ្ធភាពការងារស្របតាមតម្រូវការទីផ្សារ និងទិសដៅអនាគត។

២. ដែនកំណត់ Scope of Work
អនុវត្តចំពោះកម្មករនិយោជិតទាំងអស់ដែលកំពុងបម្រើការងារនៅក្នុងក្រុមហ៊ុន។

៣. នីតិវិធីនៃការអនុវត្ត Procedure of Implementation
- បែងចែកការបណ្តុះបណ្តាលជា ២ ប្រភេទ៖ ផ្ទៃក្នុង (Internal) និងខាងក្រៅ (External)។
- រៀបចំផែនការបណ្តុះបណ្តាលប្រចាំឆ្នាំ ដោយកំណត់កញ្ចប់ថវិកាច្បាស់លាស់។
- ក្រុមហ៊ុនជាអ្នកចេញថ្លៃចំណាយសម្រាប់ការសិក្សា ឯកសារ និងការធ្វើដំណើរទាំងអស់។
- រាល់ការបញ្ជូនទៅរៀន ក្រុមហ៊ុននៅតែបើកប្រាក់ឈ្នួលធម្មតា។
- ធានាថាបុគ្គលិកថ្មីទាំងអស់យល់ដឹងពីបទបញ្ជាផ្ទៃក្នុង សុវត្ថិភាពការងារ និងការប្រើប្រាស់ឧបករណ៍ការពារ PPE។`,
    contentEn: `1. PURPOSE
To develop talent, technical skillfulness, and avoid occupational health hazards, thereby boosting productivity and compliance.

2. SCOPE
Applies to all employees working within the company facilities.

3. PROCEDURE OF IMPLEMENTATION
- Training is categorized into internal and external courses.
- Annual vocational training plan with dedicated budget allocation.
- Company covers all tuition, transportation, and training material fees.
- Employees attending training continue to receive their standard daily wages.
- Ensure all staff are oriented on internal rules, OSH, and proper PPE usage.`,
    revisions: [
      { rev: '01', date: '01-11-2024', paragraph: 'All', summary: 'ផែនការបណ្តុះបណ្តាល និងអភិវឌ្ឍន៍ជំនាញ', authorizedBy: 'General Manager' },
    ],
  },
  {
    id: 'sop-04',
    edition: '02',
    pageInfo: 'Page 1 of 8',
    initialIssuedDate: '10-11-2023',
    amendDate: '10-10-2025',
    effectiveDate: '11-11-2024',
    titleCn: '教育与培训政策',
    code: 'SOP-OSH-004',
    category: 'SAFETY',
    categoryKh: 'សុវត្ថិភាពការងារ & C-TPAT',
    titleKh: 'គោលការណ៍លើកកម្ពស់សិទ្ធិការងារ សុវត្ថិភាព សុខភាព និង C-TPAT',
    titleEn: 'Labor Rights, Occupational Safety, Health & C-TPAT Training Policy',
    companyName: 'G.S.textileGarment(Cambodia) co.,Ltd',
    productType: 'Garment & Bags Manufacturing',
    preparedBy: 'Mr. CHAN PHEARUM',
    preparedRole: 'ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager',
    preparedDate: '01-11-2024',
    approvedBy: 'Mr. CHEN LANMAO',
    approvedRole: 'នាយកក្រុមហ៊ុន General Manager',
    approvedDate: '11-11-2024',
    contentKh: `១. គោលបំណង PURPOSE
លើកកម្ពស់ចំណេះដឹងដល់កម្មករនិយោជិតអំពីសិទ្ធិការងារ សុវត្ថិភាព សុខភាពការងារ គុណភាពផលិតផល និងសុវត្ថិភាពសន្តិសុខខ្សែសង្វាក់ផ្គត់ផ្គង់ (C-TPAT) ក្នុងបរិវេណរោងចក្រ។

២. វិសាលភាព SCOPE
អនុវត្តចំពោះកម្មករនិយោជិតទាំងអស់នៅក្នុងរោងចក្រ។

៣. ការប្រតិបត្តិ APPLICATION
វគ្គបណ្តុះបណ្តាលរួមមាន៖
- ច្បាប់ស្តីពីការងារ និងគោលការណ៍សុវត្ថិភាពការងារ
- ការទប់ស្កាត់ការរើសអើង និងការបៀតបៀនគ្រប់ទម្រង់
- សុវត្ថិភាពសារធាតុគីមី សុវត្ថិភាពអគ្គិភ័យ និងការសង្គ្រោះបឋម
- ស្តង់ដាសន្តិសុខ C-TPAT និងសុវត្ថិភាពផលិតផលសម្រាប់អ្នកបញ្ជាទិញ។`,
    contentEn: `1. PURPOSE
To enhance employees' awareness regarding labor rights, occupational safety, health, product quality, and C-TPAT supply chain security.

2. SCOPE
Applies to all factory staff and production lines.

3. APPLICATION
Key training curriculum covers:
- Labor Code & OSH fundamental standards
- Anti-discrimination & anti-harassment policies
- Chemical safety, fire safety drills, and first aid response
- C-TPAT security criteria and product safety for international brands.`,
    revisions: [
      { rev: '01', date: '01-11-2024', paragraph: 'All', summary: 'ស្តង់ដាសុវត្ថិភាព និង C-TPAT', authorizedBy: 'General Manager' },
    ],
  },
  {
    id: 'sop-05',
    edition: '02',
    pageInfo: 'Page 1 of 6',
    initialIssuedDate: '10-11-2023',
    amendDate: '10-10-2025',
    effectiveDate: '11-11-2024',
    titleCn: '工伤与事故调查程序',
    code: 'SOP-EHS-005',
    category: 'SAFETY',
    categoryKh: 'គ្រោះថ្នាក់ការងារ & EHS',
    titleKh: 'នីតិវិធីស៊ើបអង្កេតគ្រោះថ្នាក់ការងារ និងឧប្បត្តិហេតុ',
    titleEn: 'Workplace Accident and Incident Investigation Procedure',
    companyName: 'G.S.textileGarment(Cambodia) co.,Ltd',
    productType: 'Sporting Goods & Garments',
    preparedBy: 'Mr. CHAN PHEARUM',
    preparedRole: 'ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager',
    preparedDate: '01-11-2024',
    approvedBy: 'Mr. CHEN LANMAO',
    approvedRole: 'នាយកក្រុមហ៊ុន General Manager',
    approvedDate: '11-11-2024',
    contentKh: `១. គោលបំណង OBJECTIVE
បង្កើតដំណើរការស៊ើបអង្កេតគ្រោះថ្នាក់ការងារប្រកបដោយរៀបរយ ដើម្បី៖
១. កំណត់មូលហេតុឫសគល់ (Root Causes) និងការពារកុំឱ្យកើតឡើងម្តងទៀត។
២. ពិនិត្យឡើងវិញនូវការវាយតម្លៃហានិភ័យ (Risk Assessment)។
៣. ពង្រឹងប្រសិទ្ធភាពរបស់គណៈកម្មការសុខភាព និងសុវត្ថិភាពការងារ (OSH Committee)។

២. ការទទួលខុសត្រូវ
- ប្រធានផ្នែក/Supervisors ត្រូវរាយការណ៍ និងស៊ើបអង្កេតដំបូងក្នុងរយៈពេល ២៤ ម៉ោង។
- មន្ត្រីសុវត្ថិភាព EHS ចងក្រងរបាយការណ៍ និងស្នើវិធានការកែតម្រូវជូន General Manager។
- កម្មករនិយោជិតត្រូវជូនដំណឹងភ្លាមៗនៅពេលមានឧប្បត្តិហេតុ ឬលក្ខខណ្ឌការងារគ្មានសុវត្ថិភាព។

៣. សំណួរស៊ើបអង្កេតគន្លឹះ
- តើកើតឡើងនៅកន្លែងណា និងពេលណា? នរណាខ្លះរងគ្រោះ?
- តើកើតឡើងដោយរបៀបណា? ឧបករណ៍អ្វីខ្លះពាក់ព័ន្ធ?
- តើអ្វីជាមូលហេតុផ្ទាល់ និងមូលហេតុឫសគល់?
- តើត្រូវចាត់វិធានការការពារអ្វីខ្លះទាំងរយៈពេលខ្លី និងវែង?`,
    contentEn: `1. OBJECTIVE
To establish a structured investigation approach in order to:
1. Prevent recurrence of accidents and incidents.
2. Review and update workplace risk assessments.
3. Enhance the performance of the OSH Committee.

2. ROLES & RESPONSIBILITIES
- Supervisors must report and conduct initial investigation within 24 hours.
- Safety Officers compile findings and recommend CAPs to General Management.
- Employees must immediately report unsafe conditions or hazards.

3. KEY INVESTIGATION QUESTIONS
- Where, when, and who was involved?
- How did the event occur and what machinery/equipment was involved?
- What are the immediate and root causes?
- What corrective control measures are required immediately and long-term?`,
    revisions: [
      { rev: '01', date: '01-11-2024', paragraph: 'All', summary: 'នីតិវិធីស៊ើបអង្កេតគ្រោះថ្នាក់ការងារ EHS', authorizedBy: 'General Manager' },
    ],
  },
  {
    id: 'sop-06',
    edition: '02',
    pageInfo: 'Page 1 of 8',
    initialIssuedDate: '10-11-2023',
    amendDate: '10-10-2025',
    effectiveDate: '11-11-2024',
    titleCn: '员工请假制度',
    code: 'SOP-HR-006',
    category: 'LEAVE',
    categoryKh: 'ច្បាប់ឈប់សម្រាក',
    titleKh: 'គោលការណ៍ និងនីតិវិធីនៃការស្នើសុំច្បាប់ឈប់សម្រាកគ្រប់ប្រភេទ',
    titleEn: 'Employee Leave Policy and Approval Procedure',
    companyName: 'G.S.textileGarment(Cambodia) co.,Ltd',
    productType: 'Garment & Apparel',
    preparedBy: 'Mr. CHAN PHEARUM',
    preparedRole: 'ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager',
    preparedDate: '01-11-2024',
    approvedBy: 'Mr. CHEN LANMAO',
    approvedRole: 'នាយកក្រុមហ៊ុន General Manager',
    approvedDate: '11-11-2024',
    contentKh: `១. គោលបំណង Purpose
ផ្តល់ភាពងាយស្រួល និងកំណត់នីតិវិធីច្បាស់លាស់ក្នុងការស្នើសុំការអនុញ្ញាតច្បាប់ឈប់សម្រាក។

២. ប្រភេទនៃការឈប់សម្រាក Type of Leave
១. ការឈប់សម្រាកផ្ទាល់ខ្លួន (Personal Leave): ត្រូវសុំការអនុញ្ញាតពីប្រធានក្រុម/Supervisor យ៉ាងតិច ១ ថ្ងៃមុន។
២. ការឈប់សម្រាកឈឺ (Sick Leave): មានវេជ្ជបញ្ជាពេទ្យត្រឹមត្រូវ។ ក្រោម ៨ ថ្ងៃបើកដោយរោងចក្រ លើស ៨ ថ្ងៃបើកដោយ ប.ស.ស.។
៣. ការឈប់សម្រាកលំហែមាតុភាព (Maternity Leave): ឈប់សម្រាក ៩០ ថ្ងៃ ដោយទទួលបានប្រាក់ឈ្នួល ៥០% សម្រាប់អ្នកធ្វើការចាប់ពី ១ ឆ្នាំឡើង។
៤. ការឈប់សម្រាកពិសេស (Special Leave): ទទួលបាន ៧ ថ្ងៃក្នុងមួយឆ្នាំសម្រាប់អាពាហ៍ពិពាហ៍ ឬមរណភាពសមាជិកគ្រួសារ។
៥. ការឈប់សម្រាកប្រចាំឆ្នាំ (Annual Leave): បម្រើការងារ ១ ឆ្នាំ ទទួលបាន ១៨ ថ្ងៃក្នុងមួយឆ្នាំ។`,
    contentEn: `1. PURPOSE
To provide structured guidelines for requesting and approving employee leaves.

2. TYPES OF LEAVE
1. Personal Leave: Request supervisor permission at least 1 day in advance.
2. Sick Leave: Supported by medical certificate. Under 8 days paid by factory; exceeding 8 days covered by NSSF.
3. Maternity Leave: 90 days total leave with 50% wages for staff with 1+ years seniority.
4. Special Leave: 7 days per year for wedding or bereavement of immediate family.
5. Annual Leave: 18 working days per year for employees completing 1 year service.`,
    revisions: [
      { rev: '01', date: '01-11-2024', paragraph: 'All', summary: 'គោលការណ៍ច្បាប់ឈប់សម្រាកស្របច្បាប់ការងារ', authorizedBy: 'General Manager' },
    ],
  },
  {
    id: 'sop-07',
    edition: '02',
    pageInfo: 'Page 1 of 10',
    initialIssuedDate: '10-11-2023',
    amendDate: '10-10-2025',
    effectiveDate: '11-11-2024',
    titleCn: '客户合规基本政策',
    code: 'SOP-QA-007',
    category: 'INTEGRITY',
    categoryKh: 'គុណភាព & អតិថិជន',
    titleKh: 'គោលការណ៍បង្កើនទំនុកចិត្តអតិថិជន និងការអនុលោមតាមបទដ្ឋាន',
    titleEn: 'Buyer Confidence, Quality Assurance & Social Compliance Policy',
    companyName: 'G.S.textileGarment(Cambodia) co.,Ltd',
    productType: 'Garment & Bags',
    preparedBy: 'Mr. CHAN PHEARUM',
    preparedRole: 'ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager',
    preparedDate: '01-11-2024',
    approvedBy: 'Mr. CHEN LANMAO',
    approvedRole: 'នាយកក្រុមហ៊ុន General Manager',
    approvedDate: '11-11-2024',
    contentKh: `១. គោលបំណង Purpose
បង្កើនការទុកចិត្តដល់អតិថិជន និងអនុវត្តឱ្យស្របតាមបទដ្ឋានសង្គម ច្បាប់ការងារ និងតម្រូវការរបស់អ្នកបញ្ជាទិញ។

២. នីតិវិធី និងការអនុវត្ត
- ធ្វើការវាយតម្លៃផ្នែកកម្លាំងពលកម្ម និងសុវត្ថិភាពការងារ ២ ដងក្នុងមួយឆ្នាំ។
- វិភាគលទ្ធផលសវនកម្ម និងរៀបចំផែនការកែតម្រូវ (CAP) ភ្លាមៗ។
- តាមដានការអនុវត្តជាប្រចាំ ដើម្បីធានាបានការបំពេញកាតព្វកិច្ចច្បាប់ជាតិ និងអន្តរជាតិ។
- ចូលរួមការពារបរិស្ថាន និងសីលធម៌សង្គមនៅកន្លែងធ្វើការ។`,
    contentEn: `1. PURPOSE
To maintain client confidence and ensure adherence to international social compliance and brand codes of conduct.

2. IMPLEMENTATION
- Bi-annual comprehensive labor standards and safety audits.
- Analysis of audit findings and timely execution of Corrective Action Plans (CAP).
- Continuous monitoring to comply with national laws and buyer requirements.`,
    revisions: [
      { rev: '01', date: '01-11-2024', paragraph: 'All', summary: 'ស្តង់ដាអនុលោមភាពអតិថិជន', authorizedBy: 'General Manager' },
    ],
  },
  {
    id: 'sop-08',
    edition: '02',
    pageInfo: 'Page 1 of 6',
    initialIssuedDate: '10-11-2023',
    amendDate: '10-10-2025',
    effectiveDate: '11-11-2024',
    titleCn: '外籍员工管理政策',
    code: 'SOP-MIG-008',
    category: 'FOREIGN_WORKER',
    categoryKh: 'ពលករបរទេស',
    titleKh: 'គោលនយោបាយគ្រប់គ្រង និងប្រើប្រាស់ហត្ថពលកម្មបរទេស',
    titleEn: 'Foreign and Expatriate Worker Management Policy',
    companyName: 'G.S.textileGarment(Cambodia) co.,Ltd',
    productType: 'Manufacturing Facility',
    preparedBy: 'Mr. CHAN PHEARUM',
    preparedRole: 'ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager',
    preparedDate: '01-11-2024',
    approvedBy: 'Mr. CHEN LANMAO',
    approvedRole: 'នាយកក្រុមហ៊ុន General Manager',
    approvedDate: '11-11-2024',
    contentKh: `១. គោលបំណង Purpose
គ្រប់គ្រងការងាររបស់ជនបរទេសឱ្យមានតម្លាភាព យុត្តិធម៌ និងស្របតាមច្បាប់ការងារនៃព្រះរាជាណាចក្រកម្ពុជា។

២. លក្ខខណ្ឌ និងនីតិវិធី
- ជនបរទេសត្រូវចូលមកកម្ពុជាដោយស្របច្បាប់ និងមានលិខិតឆ្លងដែនមានសុពលភាព។
- ក្រុមហ៊ុនចុះកិច្ចសន្យាការងារជាលាយលក្ខណ៍អក្សរ។
- បុគ្គលិកបរទេសមានសិទ្ធិកាន់កាប់ឯកសារច្បាប់ដើមផ្ទាល់ខ្លួន (ក្រុមហ៊ុនរក្សាទុកតែច្បាប់ចម្លង)។
- ក្រុមហ៊ុនដំណើរការ និងរ៉ាប់រងថ្លៃប័ណ្ណការងារ (Work Permit) តាមប្រព័ន្ធ FWEMS របស់ក្រសួងការងារ។
- រៀបចំឱ្យមានអ្នកបកប្រែភាសា និងធានាសិទ្ធិស្មើគ្នានឹងបុគ្គលិកក្នុងស្រុក។`,
    contentEn: `1. PURPOSE
To govern foreign worker employment with transparency, fairness, and strict compliance with Cambodian immigration and labor laws.

2. PROCEDURES
- Valid passport and legal entry visa required.
- Written employment contract provided in an understandable language.
- Foreign workers retain their original passports and documents at all times.
- Company processes and pays for all official Foreign Work Permits via FWEMS.
- Translation support provided for daily communications and safety trainings.`,
    revisions: [
      { rev: '01', date: '01-11-2024', paragraph: 'All', summary: 'គោលនយោបាយគ្រប់គ្រងពលករបរទេស', authorizedBy: 'General Manager' },
    ],
  },
  {
    id: 'sop-09',
    edition: '02',
    pageInfo: 'Page 1 of 6',
    initialIssuedDate: '10-11-2023',
    amendDate: '10-10-2025',
    effectiveDate: '11-11-2024',
    titleCn: '廉洁与诚信政策',
    code: 'SOP-ETH-009',
    category: 'INTEGRITY',
    categoryKh: 'សុចរិតភាព & ប្រឆាំងពុករលួយ',
    titleKh: 'គោលនយោបាយសុចរិតភាព និងការប្រឆាំងអំពើពុករលួយ',
    titleEn: 'Business Integrity, Anti-Bribery & Anti-Corruption Policy',
    companyName: 'G.S.textileGarment(Cambodia) co.,Ltd',
    productType: 'Factory Operations',
    preparedBy: 'Mr. CHAN PHEARUM',
    preparedRole: 'ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager',
    preparedDate: '01-11-2024',
    approvedBy: 'Mr. CHEN LANMAO',
    approvedRole: 'នាយកក្រុមហ៊ុន General Manager',
    approvedDate: '11-11-2024',
    contentKh: `១. គោលបំណង Purpose
លើកតម្កើងសុចរិតភាព ការពារ និងលុបបំបាត់អំពើពុករលួយ ការសូកប៉ាន់ និងបង្កើនទំនុកចិត្តក្នុងអាជីវកម្ម។

២. នីតិវិធីនៃការអនុវត្ត
- អនុវត្តការងារដោយស្មោះត្រង់ និងរាយការណ៍ព័ត៌មានពិតប្រាកដ។
- ជៀសវាងរាល់ជម្លោះផលប្រយោជន៍ផ្ទាល់ខ្លួន (Conflict of Interest)។
- ហាមឃាត់ដាច់ខាតនូវការផ្តល់ ឬទទួលអំណោយ សំណូក ឬការកម្សាន្តដែលមានឥទ្ធិពលលើការសម្រេចចិត្ត។
- រាល់អំណោយជូនមន្ត្រីរាជការត្រូវមានការអនុញ្ញាតជាមុនពីនាយកក្រុមហ៊ុន។`,
    contentEn: `1. PURPOSE
To promote corporate integrity, prevent all forms of bribery and corruption, and maintain transparent business relationships.

2. PROCEDURES
- Perform tasks with honesty and accurate reporting.
- Strict avoidance of personal conflicts of interest.
- Zero tolerance for offering or receiving bribes, kickbacks, or illicit gifts.
- Any official courtesy entertainment requires prior approval by General Management.`,
    revisions: [
      { rev: '01', date: '01-11-2024', paragraph: 'All', summary: 'គោលនយោបាយប្រឆាំងអំពើពុករលួយ', authorizedBy: 'General Manager' },
    ],
  },
  {
    id: 'sop-10',
    edition: '02',
    pageInfo: 'Page 1 of 8',
    initialIssuedDate: '10-11-2023',
    amendDate: '10-10-2025',
    effectiveDate: '11-11-2024',
    titleCn: '机械设备控制与维护政策',
    code: 'SOP-MCH-010',
    category: 'MACHINERY',
    categoryKh: 'គ្រឿងចក្រ & ផលិតកម្ម',
    titleKh: 'គោលការណ៍គ្រប់គ្រង ការថែទាំ និងសុវត្ថិភាពម៉ាស៊ីនផលិតកម្ម',
    titleEn: 'Factory Machinery Maintenance, Operation & Safety Policy',
    companyName: 'G.S.textileGarment(Cambodia) co.,Ltd',
    productType: 'Garment Machinery & Equipment',
    preparedBy: 'Mr. CHAN PHEARUM',
    preparedRole: 'ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager',
    preparedDate: '01-11-2024',
    approvedBy: 'Mr. CHEN LANMAO',
    approvedRole: 'នាយកក្រុមហ៊ុន General Manager',
    approvedDate: '11-11-2024',
    contentKh: `១. គោលបំណង PURPOSE
ធានាថាម៉ាស៊ីនទាំងអស់ក្នុងរោងចក្រដំណើរការល្អ សុវត្ថិភាព និងផលិតបានទំនិញស្របតាមគុណភាព និងបរិមាណដែលបានកំណត់។

២. នីតិវិធី PROCEDURES
- គ្រប់ម៉ាស៊ីនត្រូវឆ្លងកាត់ការអនុម័តពីប្រធានផលិតកម្មមុននឹងដាក់ឱ្យប្រើប្រាស់។
- ក្រុមជាងម៉ាស៊ីនត្រូវត្រួតពិនិត្យឧបករណ៍ការពារសុវត្ថិភាព (Machine Guards) ឱ្យបានពេញលេញ។
- ត្រួតពិនិត្យថែទាំម៉ាស៊ីនជារៀងរាល់ ២ សប្តាហ៍ម្តង និងកត់ត្រាលើប័ណ្ណថែទាំ។
- រក្សាទុកគ្រឿងបន្លាស់ចាំបាច់ក្នុងស្តុកជានិច្ច ដើម្បីជួសជុលទាន់ពេលវេលា។`,
    contentEn: `1. PURPOSE
To ensure factory machinery functions safely, accurately, and reliably to meet production output and product specifications.

2. PROCEDURES
- Production Manager approval required before installing new machinery.
- Mechanics ensure all machine safety guards and emergency stops are intact.
- Routine bi-weekly preventive maintenance with logs kept on maintenance cards.
- Adequate stock of critical spare parts maintained to minimize downtime.`,
    revisions: [
      { rev: '01', date: '01-11-2024', paragraph: 'All', summary: 'នីតិវិធីថែទាំម៉ាស៊ីនផលិតកម្ម', authorizedBy: 'General Manager' },
    ],
  },
  {
    id: 'sop-11',
    edition: '02',
    pageInfo: 'Page 1 of 7',
    initialIssuedDate: '10-11-2023',
    amendDate: '10-10-2025',
    effectiveDate: '11-11-2024',
    titleCn: '分包商与外包管理程序',
    code: 'SOP-OUT-011',
    category: 'OUTSOURCE',
    categoryKh: 'អ្នកម៉ៅការ & Subcontractor',
    titleKh: 'គោលនយោបាយគ្រប់គ្រងកម្លាំងធនធានពលកម្មខាងក្រៅ (Subcontractor)',
    titleEn: 'Outsource & Subcontractor Facility Management Policy',
    companyName: 'G.S.textileGarment(Cambodia) co.,Ltd',
    productType: 'Textile Subcontracting',
    preparedBy: 'Mr. CHAN PHEARUM',
    preparedRole: 'ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager',
    preparedDate: '01-11-2024',
    approvedBy: 'Mr. CHEN LANMAO',
    approvedRole: 'នាយកក្រុមហ៊ុន General Manager',
    approvedDate: '11-11-2024',
    contentKh: `១. គោលនយោបាយ Policy
ធានាថាសកម្មភាពការងារនៃកម្លាំងធនធានពលកម្មខាងក្រៅ (Subcontractor) ត្រូវបានអនុវត្តស្របតាមច្បាប់ និងបទបញ្ញត្តិក្រុមហ៊ុន។

២. នីតិវិធី Routine & Procedure
- ហាមប្រើប្រាស់កម្លាំងពលកម្មខាងក្រៅដោយគ្មានការអនុញ្ញាតពីថ្នាក់ដឹកនាំ និងអតិថិជនជាមុនឡើយ។
- ផ្នែកអនុលោមតាមច្បាប់ត្រូវចុះត្រួតពិនិត្យទីតាំងខាងក្រៅ (ដូចជា ផ្នែកបោះពុម្ព ប៉ាក់ បោកគក់ កាត់ ដេរ) លើទិដ្ឋភាពសុខភាព សុវត្ថិភាព និងច្បាប់ការងារ។
- វាយតម្លៃសមត្ថភាព និងគុណភាពការងារជារៀងរាល់ឆ្នាំ។`,
    contentEn: `1. POLICY
To ensure all outsourced and subcontracted operations adhere strictly to company standards, customer codes of conduct, and statutory labor laws.

2. PROCEDURES
- No unauthorized subcontracting without explicit client and management consent.
- Compliance team audits subcontractor premises (printing, embroidery, washing, cutting, sewing) for OSH and labor standards.
- Annual evaluation of all business partners and subcontractors.`,
    revisions: [
      { rev: '01', date: '01-11-2024', paragraph: 'All', summary: 'គោលការណ៍គ្រប់គ្រងអ្នកម៉ៅការបន្ត', authorizedBy: 'General Manager' },
    ],
  },
  {
    id: 'sop-12',
    edition: '02',
    pageInfo: 'Page 1 of 6',
    initialIssuedDate: '10-11-2023',
    amendDate: '10-10-2025',
    effectiveDate: '11-11-2024',
    titleCn: '罢工与劳资纠纷解决政策',
    code: 'SOP-GRV-012',
    category: 'GRIEVANCE',
    categoryKh: 'វិវាទការងារ & កូដកម្ម',
    titleKh: 'គោលនយោបាយទប់ស្កាត់ ដោះស្រាយវិវាទការងារ បណ្តឹងសារទុក្ខ និងកូដកម្ម',
    titleEn: 'Grievance Handling, Dispute Resolution and Strike Prevention Policy',
    companyName: 'G.S.textileGarment(Cambodia) co.,Ltd',
    productType: 'Garment & Industrial Manufacturing',
    preparedBy: 'Mr. CHAN PHEARUM',
    preparedRole: 'ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager',
    preparedDate: '01-11-2024',
    approvedBy: 'Mr. CHEN LANMAO',
    approvedRole: 'នាយកក្រុមហ៊ុន General Manager',
    approvedDate: '11-11-2024',
    contentKh: `១. គោលបំណង
ទប់ស្កាត់ការកើតមានជម្លោះវិវាទ និងដោះស្រាយបណ្តឹងតវ៉ាឱ្យស្របតាមច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា។

២. ដំណាក់កាលដោះស្រាយបណ្តឹងសារទុក្ខ ៥ ជំហាន (5-Step Grievance Solution)
ជំហានទី១៖ សុំជួបប្រធានផ្នែក/ប្រធានក្រុម ដើម្បីដោះស្រាយក្នុងរយៈពេល ១ ថ្ងៃ។
ជំហានទី២៖ ប្តឹងទៅអ្នកគ្រប់គ្រងផ្នែករដ្ឋបាល/ធនធានមនុស្ស ឆ្លើយតបជាលាយលក្ខណ៍អក្សរក្នុងរយៈពេល ៣ ថ្ងៃយ៉ាងយូរ។
ជំហានទី៣៖ ប្តឹងទៅនាយកក្រុមហ៊ុន ឆ្លើយតបជាលាយលក្ខណ៍អក្សរក្នុងរយៈពេល ៣ ថ្ងៃ។
ជំហានទី៤៖ ប្តឹងទៅក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ (ការផ្សះផ្សាវិវាទ)។
ជំហានទី៥៖ បញ្ជូនសំណុំរឿងទៅក្រុមប្រឹក្សាអាជ្ញាកណ្តាល (Arbitration Council)។

៣. លក្ខខណ្ឌនៃការធ្វើកូដកម្មស្របច្បាប់
- ត្រូវមានការបោះឆ្នោតជាសម្ងាត់ដោយសមាជិកសហជីព។
- ត្រូវជូនដំណឹងជាមុនយ៉ាងតិច ៧ ថ្ងៃទៅនិយោជក និងក្រសួងការងារ។
- កូដកម្មដោយប្រើអំពើហិង្សា ឬផ្ទុយពីច្បាប់ចាត់ទុកជាកំហុសធ្ងន់។`,
    contentEn: `1. PURPOSE
To maintain industrial harmony, resolve employee grievances peacefully, and adhere to Cambodian Labor Dispute laws.

2. 5-STEP GRIEVANCE HANDLING WORKFLOW
Step 1: Direct discussion with Supervisor/Line Leader within 1 day.
Step 2: Escalation to Admin/HR Manager with written reply within 3 days.
Step 3: Appeal to General Manager with written response within 3 days.
Step 4: Conciliation at the Ministry of Labor and Vocational Training (MLVT).
Step 5: Submission to the Arbitration Council for binding/non-binding award.

3. LEGAL STRIKE PREREQUISITES
- Secret ballot approval by union membership.
- Mandatory 7-day prior written notice to employer and MLVT.
- Zero tolerance for unlawful strikes, blockades, or violent misconduct.`,
    revisions: [
      { rev: '01', date: '01-11-2024', paragraph: 'All', summary: 'នីតិវិធីដោះស្រាយវិវាទ និងបណ្តឹងសារទុក្ខ', authorizedBy: 'General Manager' },
    ],
  },
  {
    id: 'sop-13',
    edition: '02',
    pageInfo: 'Page 1 of 8',
    initialIssuedDate: '10-11-2023',
    amendDate: '10-10-2025',
    effectiveDate: '11-11-2024',
    titleCn: '工业废水与化学品处理政策',
    code: 'SOP-ENV-013',
    category: 'ENVIRONMENT',
    categoryKh: 'បរិស្ថាន & កាកសំណល់ទឹក',
    titleKh: 'នីតិវិធីនៃការគ្រប់គ្រងកាកសំណល់ទឹក និងបរិស្ថានស្របតាម ZDHC',
    titleEn: 'Wastewater and Environmental Management Standard (ZDHC Aligned)',
    companyName: 'G.S.textileGarment(Cambodia) co.,Ltd',
    productType: 'Garment Wet Processing & Laundry',
    preparedBy: 'Mr. CHAN PHEARUM',
    preparedRole: 'ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager',
    preparedDate: '01-11-2024',
    approvedBy: 'Mr. CHEN LANMAO',
    approvedRole: 'នាយកក្រុមហ៊ុន General Manager',
    approvedDate: '11-11-2024',
    contentKh: `១. គោលបំណង PURPOSE
ការពារសុខភាពមនុស្ស និងបរិស្ថាន ដោយគ្រប់គ្រងកាកសំណល់ទឹកដែលបញ្ចេញពីរោងចក្រឱ្យបានត្រឹមត្រូវ។

២. នីតិវិធី PROCEDURE
- វាយតម្លៃឧបករណ៍បំពុល និងកាកសំណល់ទឹកមុនពេលបំពាក់។
- ធ្វើការវិភាគសំណាកទឹកស្របតាមគោលការណ៍គ្មានសារធាតុគីមី ZDHC Wastewater Guideline។
- ធ្វើតេស្តសំណល់ទឹកដោយមន្ទីរពិសោធន៍ទទួលស្គាល់យ៉ាងតិច ១ ឆ្នាំម្តង។
- កន្លែងបង្ហូរទឹកចុងក្រោយត្រូវមានចម្ងាយយ៉ាងតិច ១០០ ម៉ែត្រពីអគារស្នាក់នៅ។
- រក្សាទុកឯកសារវិភាគទឹក និងកាកសំណល់ភក់ (Sludge) យ៉ាងតិច ៥ ឆ្នាំ។`,
    contentEn: `1. PURPOSE
To protect human health and natural ecosystems through systematic wastewater treatment and discharge controls.

2. PROCEDURES
- Proper technical assessment before installation of treatment equipment.
- Wastewater testing aligned with ZDHC (Zero Discharge of Hazardous Chemicals) guidelines.
- Certified laboratory effluent analysis conducted at least annually.
- Effluent discharge points located a minimum of 100 meters from dormitories.
- Sludge disposal and laboratory test records retained for at least 5 years.`,
    revisions: [
      { rev: '01', date: '01-11-2024', paragraph: 'All', summary: 'ស្តង់ដាគ្រប់គ្រងកាកសំណល់ទឹក ZDHC', authorizedBy: 'General Manager' },
    ],
  },
  {
    id: 'sop-14',
    edition: '02',
    pageInfo: 'Page 1 of 6',
    initialIssuedDate: '10-11-2023',
    amendDate: '10-10-2025',
    effectiveDate: '11-11-2024',
    titleCn: '流动工人与劳工权益政策',
    code: 'SOP-MIG-014',
    category: 'FOREIGN_WORKER',
    categoryKh: 'ពលករចំណាកស្រុក',
    titleKh: 'គោលនយោបាយគ្រប់គ្រង និងការពារពលករចំណាកស្រុក (Migrant Workers)',
    titleEn: 'Migrant Employee Management and Fair Recruitment Policy',
    companyName: 'G.S.textileGarment(Cambodia) co.,Ltd',
    productType: 'Garment & Footwear',
    preparedBy: 'Mr. CHAN PHEARUM',
    preparedRole: 'ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager',
    preparedDate: '01-11-2024',
    approvedBy: 'Mr. CHEN LANMAO',
    approvedRole: 'នាយកក្រុមហ៊ុន General Manager',
    approvedDate: '11-11-2024',
    contentKh: `១. គោលបំណង PURPOSE
ពង្រឹងការគ្រប់គ្រង និងផ្តល់នូវលក្ខខណ្ឌការងារប្រកបដោយសមធម៌ និងសុវត្ថិភាពដល់បុគ្គលិកចំណាកស្រុក។

២. នីតិវិធី PROCEDURE
- ផ្តល់នូវលក្ខខណ្ឌការងារ ប្រាក់បៀវត្ស និងការឈប់សម្រាកស្មើភាពគ្នានឹងបុគ្គលិកជាតិ។
- ពន្យល់កិច្ចសន្យាការងារជាភាសាដែលបុគ្គលិកយល់បាន មុនពេលចាកចេញពីប្រទេសដើម។
- ក្រុមហ៊ុនជាអ្នកទទួលខុសត្រូវលើថ្លៃសំបុត្រយន្តហោះ និងការធ្វើដំណើរចូលមកបំពេញការងារ និងវិលត្រឡប់ (Repatriation Costs)។
- ហាមឃាត់ដាច់ខាតការរឹបអូសលិខិតឆ្លងដែន ឬប័ណ្ណសម្គាល់ខ្លួន។`,
    contentEn: `1. PURPOSE
To safeguard migrant employees' rights, ensure fair recruitment, and provide equal employment opportunities.

2. PROCEDURES
- Equal terms of employment, compensation, and leave conditions as national workers.
- Full contract explanation provided in employee's native language before departure.
- Factory covers inbound travel and repatriation transport tickets upon contract completion.
- Prohibition of passport confiscation or retention of legal documentation.`,
    revisions: [
      { rev: '01', date: '01-11-2024', paragraph: 'All', summary: 'គោលការណ៍ពលករចំណាកស្រុក', authorizedBy: 'General Manager' },
    ],
  },
  {
    id: 'sop-15',
    edition: '02',
    pageInfo: 'Page 1 of 10',
    initialIssuedDate: '10-11-2023',
    amendDate: '10-10-2025',
    effectiveDate: '11-11-2024',
    titleCn: '国际人权政策',
    code: 'SOP-HRT-015',
    category: 'HUMAN_RIGHTS',
    categoryKh: 'សិទ្ធិមនុស្សអន្តរជាតិ',
    titleKh: 'គោលនយោបាយសិទ្ធិមនុស្សអន្តរជាតិ (UDHR, ICCPR, CEDAW, CRC)',
    titleEn: 'International Human Rights and Workplace Dignity Policy',
    companyName: 'G.S.textileGarment(Cambodia) co.,Ltd',
    productType: 'Garment & Apparel Facility',
    preparedBy: 'Mr. CHAN PHEARUM',
    preparedRole: 'ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager',
    preparedDate: '01-11-2024',
    approvedBy: 'Mr. CHEN LANMAO',
    approvedRole: 'នាយកក្រុមហ៊ុន General Manager',
    approvedDate: '11-11-2024',
    contentKh: `១. គោលបំណង Purpose
ធានាការពារសេចក្តីថ្លៃថ្នូរ សមភាព និងសិទ្ធិជាមូលដ្ឋានរបស់មនុស្សគ្រប់រូប ដោយមិនរើសអើងពូជសាសន៍ ពណ៌សម្បុរ ភេទ សាសនា ឬឋានៈសង្គមឡើយ។

២. ក្របខ័ណ្ឌអនុវត្តអន្តរជាតិ
- សេចក្តីប្រកាសជាសកលស្តីពីសិទ្ធិមនុស្ស (UDHR 1948)
- កតិកាសញ្ញាអន្តរជាតិស្តីពីសិទ្ធិពលរដ្ឋ និងសិទ្ធិនយោបាយ (ICCPR 1966)
- កតិកាសញ្ញាស្តីពីសិទ្ធិសេដ្ឋកិច្ច សង្គម និងវប្បធម៌ (ICESCR 1966)
- អនុសញ្ញាលុបបំបាត់ការរើសអើងលើស្ត្រី (CEDAW 1979) និងការពារសិទ្ធិកុមារ (CRC 1989)។

៣. គោលការណ៍ស្នូលនៅកន្លែងធ្វើការ
- សិទ្ធិស្មើគ្នានៅចំពោះមុខច្បាប់ និងការមិនរើសអើង
- សេរីភាពពីការធ្វើទុក្ខបុកម្នេញ ការគំរាមកំហែង និងការបៀតបៀនគ្រប់ទម្រង់
- លក្ខខណ្ឌការងារសមរម្យ ថ្លៃថ្នូរ និងការការពារសុខភាព។`,
    contentEn: `1. PURPOSE
To uphold human dignity, equality, and fundamental workplace human rights without discrimination of race, gender, religion, or nationality.

2. INTERNATIONAL FRAMEWORKS
- Universal Declaration of Human Rights (UDHR 1948)
- International Covenants on Civil/Political and Economic/Social Rights (ICCPR & ICESCR 1966)
- Elimination of Discrimination Against Women (CEDAW 1979) and Rights of the Child (CRC 1989).

3. WORKPLACE CORE PRINCIPLES
- Equal opportunity and non-discrimination.
- Freedom from harassment, coercion, and corporal punishment.
- Fair living wages, occupational health, and safe working environments.`,
    revisions: [
      { rev: '01', date: '01-11-2024', paragraph: 'All', summary: 'គោលនយោបាយសិទ្ធិមនុស្សអន្តរជាតិ', authorizedBy: 'General Manager' },
    ],
  },
  {
    id: 'sop-16',
    code: 'EGS/SCP-054',
    edition: '02',
    pageInfo: 'Page 1 of 10',
    initialIssuedDate: '10-11-2023',
    amendDate: '10-10-2025',
    effectiveDate: '11-11-2024',
    category: 'SAFETY',
    categoryKh: 'សុវត្ថិភាពការងារ & EHS',
    titleKh: 'គោលការណ៍វាយតម្លៃហានិភ័យ',
    titleEn: 'RISK ASSESSMENT POLICY',
    titleCn: '风险评估政策',
    companyName: 'EVERGREEN SPORTING GOODS (CAMBODIA) CO., LTD',
    productType: 'Sporting Goods & Outdoor Equipment',
    preparedBy: 'Mr. CHAN PHEARUM',
    preparedRole: 'ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager',
    preparedDate: '01-11-2024',
    approvedBy: 'Mr. CHEN LANMAO',
    approvedRole: 'នាយកក្រុមហ៊ុន General Manager',
    approvedDate: '11-11-2024',
    contentKh: `១. គោលបំណង PURPOSE
ដើម្បីកំណត់ វិភាគ និងវាយតម្លៃហានិភ័យដែលអាចកើតមានចំពោះសុខភាព សុវត្ថិភាពបុគ្គលិក បរិស្ថាន និងប្រតិបត្តិការក្នុងរោងចក្រ ព្រមទាំងដាក់ចេញនូវវិធានការបង្ការ និងកាត់បន្ថយហានិភ័យឱ្យនៅកម្រិតទាបបំផុតដែលអាចទទួលយកបាន (ALARP)។

២. ដែនកំណត់ SCOPE
គោលនយោបាយនេះអនុវត្តចំពោះគ្រប់ផ្នែកផលិតកម្ម ឃ្លាំងទំនិញ បន្ទប់គីមី បន្ទប់ម៉ាស៊ីន និងអ្នកម៉ៅការបន្ត ព្រមទាំងភ្ញៀវទាំងអស់ដែលចូលក្នុងបរិវេណរោងចក្រ។

៣. និយមន័យ DEFINITIONS
- គ្រោះថ្នាក់ (Hazard): ប្រភព ឬស្ថានភាពដែលអាចបណ្តាលឱ្យមានរបួស ជំងឺ ការខូចខាតទ្រព្យសម្បត្តិ ឬប៉ះពាល់បរិស្ថាន។
- ហានិភ័យ (Risk): បន្សំរវាងលទ្ធភាពដែលអាចកើតឡើង (Likelihood) និងកម្រិតធ្ងន់ធ្ងរនៃផលវិបាក (Severity)។
- ការវាយតម្លៃហានិភ័យ (Risk Assessment): ដំណើរការនៃការវាយតម្លៃហានិភ័យដើម្បីកំណត់កម្រិតអាទិភាពនៃវិធានការគ្រប់គ្រង។

៤. នីតិវិធីនៃការវាយតម្លៃ PROCEDURE
- ជំហានទី១: កំណត់អត្តសញ្ញាណគ្រោះថ្នាក់ (Hazard Identification) តាមរយៈការដើរត្រួតពិនិត្យប្រចាំថ្ងៃ និងរបាយការណ៍ស្ទើរតែកើតហេតុ (Near-Miss)។
- ជំហានទី២: វាយតម្លៃអ្នកដែលអាចរងផលប៉ះពាល់ (Who might be harmed) រួមមានកម្មករ ប្រតិបត្តិករម៉ាស៊ីន បុគ្គលិកអនាម័យ និងភ្ញៀវ។
- ជំហានទី៣: វាយតម្លៃកម្រិតហានិភ័យដោយប្រើតារាង 5x5 Matrix (Likelihood x Severity)។
- ជំហានទី៤: អនុវត្តតាមឋានានុក្រមគ្រប់គ្រងហានិភ័យ (Hierarchy of Controls): Elimination -> Substitution -> Engineering Controls -> Administrative Controls -> PPE។
- ជំហានទី៥: កត់ត្រាលទ្ធផល និងត្រួតពិនិត្យឡើងវិញជារៀងរាល់ឆ្នាំ ឬនៅពេលមានការផ្លាស់ប្តូរម៉ាស៊ីន ដំណើរការ ឬសារធាតុគីមីថ្មី។

៥. សិទ្ធិអំណាច និងការទទួលខុសត្រូវ AUTHORITY & RESPONSIBILITY
- គណៈកម្មាធិការសុខភាព និងសុវត្ថិភាពការងារ (HS Committee) និង EHS Supervisor ទទួលបន្ទុកធ្វើបច្ចុប្បន្នភាពតារាងវាយតម្លៃហានិភ័យ (Risk Register) រៀងរាល់ត្រីមាស។
- ប្រធានគ្រប់ផ្នែកទាំងអស់ត្រូវទទួលខុសត្រូវធានាថាបុគ្គលិកក្រោមឱវាទអនុវត្តតាមវិធានការសុវត្ថិភាព និងពាក់ PPE គ្រប់ពេលវេលា។`,
    contentEn: `1. PURPOSE
To systematically identify, analyze, and evaluate occupational health, safety, environmental, and operational risks across factory premises, implementing preventive controls to achieve ALARP (As Low As Reasonably Practicable) risk levels.

2. SCOPE
Applies to all manufacturing production floors, warehouses, chemical stores, utility rooms, subcontractors, and visitors within factory premises.

3. DEFINITIONS
- Hazard: Source, situation, or act with potential for harm in terms of human injury, ill health, or environmental damage.
- Risk: Combination of the likelihood of an occurrence of a hazardous event and the severity of injury or damage.
- Risk Assessment: Overall process of estimating the magnitude of risk and deciding whether the risk is acceptable.

4. ASSESSMENT PROCEDURE
- Step 1: Hazard Identification via regular workplace inspections, job safety analysis (JSA), and near-miss reports.
- Step 2: Determine who might be harmed and how (operators, maintenance, cleaners, visitors).
- Step 3: Evaluate risk score using 5x5 Matrix (Likelihood x Severity).
- Step 4: Implement Hierarchy of Controls: Elimination, Substitution, Engineering controls, Administrative controls, and PPE.
- Step 5: Record findings, monitor action plan implementation, and review annually or whenever new machinery/chemicals are introduced.

5. AUTHORITY & RESPONSIBILITY
- Health & Safety Committee and EHS Supervisor are responsible for updating the Factory Risk Assessment Register quarterly.
- All Department Heads must ensure workers strictly comply with risk control measures and wear mandatory PPE at all times.`,
    revisions: [
      { rev: '01', date: '10-11-2023', paragraph: 'All', summary: 'បង្កើតគោលការណ៍វាយតម្លៃហានិភ័យដំបូង', authorizedBy: 'General Manager' },
      { rev: '02', date: '11-11-2024', paragraph: 'Hierarchy of Controls', summary: 'ធ្វើបច្ចុប្បន្នភាពតាមស្តង់ដា ISO 45001 & Buyer Compliance', authorizedBy: 'General Manager' },
    ],
  },
];

interface SopLibraryTabProps {
  handlePrintTemplate: (elementId: string) => void;
  handleExportPdf: (elementId: string, filename: string) => void;
}

interface BilingualClause {
  khmerTitle: string;
  khmerBody: string;
  englishTitle: string;
  englishBody: string;
}

function parseBilingualClauses(contentKh: string, contentEn: string): BilingualClause[] {
  const splitSections = (text: string) => {
    const lines = text.trim().split('\n');
    const sections: { title: string; body: string }[] = [];
    let currentTitle = '';
    let currentBody: string[] = [];
    // Match line starting with number (Khmer or Latin digits: ១-៩ or 1-9) followed by . ) : -
    const secRegex = /^[១-៩1-9]\s*[\.\、\)\:\-]\s*(.*)$/;

    for (const raw of lines) {
      const line = raw.trim();
      const match = line.match(secRegex);
      if (match) {
        if (currentTitle || currentBody.length > 0) {
          sections.push({
            title: currentTitle,
            body: currentBody.join('\n').trim(),
          });
          currentBody = [];
        }
        currentTitle = line;
      } else {
        currentBody.push(raw);
      }
    }
    if (currentTitle || currentBody.length > 0) {
      sections.push({
        title: currentTitle,
        body: currentBody.join('\n').trim(),
      });
    }
    return sections;
  };

  const khSections = splitSections(contentKh);
  const enSections = splitSections(contentEn);

  if (khSections.length === 0 && enSections.length === 0) {
    return [{
      khmerTitle: '',
      khmerBody: contentKh,
      englishTitle: '',
      englishBody: contentEn,
    }];
  }

  const maxLen = Math.max(khSections.length, enSections.length);
  const clauses: BilingualClause[] = [];

  for (let i = 0; i < maxLen; i++) {
    const kh = khSections[i] || { title: '', body: '' };
    const en = enSections[i] || { title: '', body: '' };
    clauses.push({
      khmerTitle: kh.title,
      khmerBody: kh.body,
      englishTitle: en.title,
      englishBody: en.body,
    });
  }

  return clauses;
}

export default function SopLibraryTab({ handlePrintTemplate, handleExportPdf }: SopLibraryTabProps) {
  const [sops, setSops] = useState<FactorySop[]>(DEFAULT_SOPS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [editingSop, setEditingSop] = useState<FactorySop | null>(null);
  const [previewSop, setPreviewSop] = useState<FactorySop | null>(null);
  const [previewLayoutMode, setPreviewLayoutMode] = useState<'1row' | 'paragraph'>('1row');

  // Sync with LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hrm_factory_sops_data');
      if (saved) {
        const parsed: FactorySop[] = JSON.parse(saved);
        // Merge with default values in case cached objects lack newly added header fields
        const merged = parsed.map((item) => {
          const def = DEFAULT_SOPS.find((d) => d.id === item.id);
          return {
            ...def,
            ...item,
            edition: item.edition || def?.edition || '02',
            pageInfo: item.pageInfo || def?.pageInfo || 'Page 1 of 10',
            initialIssuedDate: item.initialIssuedDate || def?.initialIssuedDate || '10-11-2023',
            amendDate: item.amendDate || def?.amendDate || '10-10-2025',
            effectiveDate: item.effectiveDate || def?.effectiveDate || '11-11-2024',
            titleCn: item.titleCn || def?.titleCn || '',
          };
        });
        const existingIds = new Set(parsed.map((p) => p.id));
        const missing = DEFAULT_SOPS.filter((d) => !existingIds.has(d.id));
        setSops([...merged, ...missing]);
      } else {
        setSops(DEFAULT_SOPS);
      }
    } catch (e) {
      console.error(e);
      setSops(DEFAULT_SOPS);
    }
  }, []);

  const saveSops = (data: FactorySop[]) => {
    setSops(data);
    localStorage.setItem('hrm_factory_sops_data', JSON.stringify(data));
  };

  const handleResetToDefault = () => {
    Swal.fire({
      title: 'តើអ្នកប្រាកដទេ?',
      text: 'ទិន្នន័យ SOP ទាំងអស់នឹងត្រូវកំណត់ឡើងវិញទៅទម្រង់ដើម!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'យល់ព្រម (Reset)',
      cancelButtonText: 'បោះបង់',
      confirmButtonColor: '#dc2626',
    }).then((res) => {
      if (res.isConfirmed) {
        saveSops(DEFAULT_SOPS);
        Swal.fire('ជោគជ័យ!', 'ទិន្នន័យ SOP ត្រូវបានកំណត់ឡើងវិញ។', 'success');
      }
    });
  };

  const handleSaveEditSop = () => {
    if (!editingSop) return;
    const updated = sops.map((s) => (s.id === editingSop.id ? editingSop : s));
    saveSops(updated);
    setEditingSop(null);
    Swal.fire({
      icon: 'success',
      title: 'បានរក្សាទុកជោគជ័យ!',
      text: `នីតិវិធី ${editingSop.code} ត្រូវបានធ្វើបច្ចុប្បន្នភាព។`,
      timer: 1600,
      showConfirmButton: false,
    });
  };

  // Replace company name across all text of this SOP
  const handleBatchReplaceCompany = (oldName: string, newName: string) => {
    if (!editingSop || !newName) return;
    const updatedKh = editingSop.contentKh.replaceAll(oldName, newName);
    const updatedEn = editingSop.contentEn.replaceAll(oldName, newName);
    setEditingSop({
      ...editingSop,
      companyName: newName,
      contentKh: updatedKh,
      contentEn: updatedEn,
    });
    Swal.fire({
      icon: 'success',
      title: 'បានផ្លាស់ប្តូរឈ្មោះក្រុមហ៊ុន!',
      text: `ឈ្មោះក្រុមហ៊ុនត្រូវបានជំនួសក្នុងខ្លឹមសារទាំងអស់រួចរាល់។`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const filteredSops = useMemo(() => {
    return sops.filter((sop) => {
      const matchCat = selectedCategory === 'ALL' || sop.category === selectedCategory;
      const matchSearch =
        sop.titleKh.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sop.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sop.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sop.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sop.productType.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [sops, selectedCategory, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Top Controls Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '8px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>ផ្នែក SOP៖</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              outline: 'none',
            }}
          >
            <option value="ALL">គ្រប់នីតិវិធីទាំងអស់ ({sops.length} SOPs)</option>
            <option value="CHILD_LABOR">ពលកម្មកុមារ & ជួញដូរ</option>
            <option value="SAFETY">សុវត្ថិភាពការងារ & EHS</option>
            <option value="TRAINING">បណ្តុះបណ្តាល & ហ្វឹកហ្វឺន</option>
            <option value="LEAVE">ច្បាប់ឈប់សម្រាក</option>
            <option value="FOREIGN_WORKER">ពលករបរទេស & ចំណាកស្រុក</option>
            <option value="MACHINERY">គ្រឿងចក្រ & ផលិតកម្ម</option>
            <option value="OUTSOURCE">អ្នកម៉ៅការបន្ត (Subcontractor)</option>
            <option value="GRIEVANCE">វិវាទការងារ & កូដកម្ម</option>
            <option value="ENVIRONMENT">បរិស្ថាន & កាកសំណល់ទឹក (ZDHC)</option>
            <option value="HUMAN_RIGHTS">សិទ្ធិមនុស្សអន្តរជាតិ</option>
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកតាមកូដ ឈ្មោះ ឬផលិតផល..."
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              minWidth: '220px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={handleResetToDefault}
            title="កំណត់ឡើងវិញទម្រង់ដើម"
            style={{
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔄 ទម្រង់ដើម (Reset)
          </button>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            ({filteredSops.length} / {sops.length} ឯកសារ)
          </span>
        </div>
      </div>

      {/* SOPs Grid View (Compact & Fit Content) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '10px' }}>
        {filteredSops.map((sop) => (
          <div
            key={sop.id}
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease',
            }}
          >
            <div>
              {/* Header Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span
                    style={{
                      background: '#dbeafe',
                      color: '#1e40af',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                    }}
                  >
                    {sop.code}
                  </span>
                  <span
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #e2e8f0',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                    }}
                  >
                    Rev: {sop.edition || '02'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                    📄 {sop.pageInfo || 'Page 1 of 10'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    🏭 {sop.productType}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a', marginBottom: '2px', lineHeight: '1.3' }}>
                {sop.titleKh}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '8px', fontStyle: 'italic' }}>
                {sop.titleEn} {sop.titleCn ? `• ${sop.titleCn}` : ''}
              </div>

              {/* Meta Info Box (Detailed Header Attributes) */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '0.72rem',
                  color: '#334155',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  marginBottom: '10px',
                }}
              >
                <div>🏢 <strong>ក្រុមហ៊ុន៖</strong> {sop.companyName}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', color: '#475569', fontSize: '0.68rem', background: '#ffffff', padding: '4px 6px', borderRadius: '4px', border: '1px solid #f1f5f9' }}>
                  <div>📅 <strong>ចេញដំបូង (Issued):</strong> {sop.initialIssuedDate || '10-11-2023'}</div>
                  <div>⚡ <strong>ប្រសិទ្ធភាព (Effective):</strong> {sop.effectiveDate || '11-11-2024'}</div>
                  <div>🔄 <strong>ពិនិត្យឡើងវិញ (Amend):</strong> {sop.amendDate || '10-10-2025'}</div>
                  <div>✍️ <strong>រៀបចំ/អនុម័ត:</strong> {sop.preparedBy} / {sop.approvedBy}</div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
              <button
                onClick={() => setPreviewSop(sop)}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '5px 11px',
                  borderRadius: '5px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                👁️ មើល & បោះពុម្ព
              </button>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setEditingSop({ ...sop })}
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                    padding: '5px 9px',
                    borderRadius: '5px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ✏️ កែប្រែ (Edit)
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${sop.titleKh}\n${sop.titleEn}\n\n${sop.contentKh}\n\n${sop.contentEn}`);
                    Swal.fire({
                      icon: 'success',
                      title: 'បានចម្លង!',
                      text: `ខ្លឹមសារ SOP ${sop.code} ត្រូវបានចម្លងទៅ Clipboard។`,
                      timer: 1400,
                      showConfirmButton: false,
                    });
                  }}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '5px 8px',
                    borderRadius: '5px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  📋 ចម្លង
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: EDIT SOP CUSTOMIZER */}
      {editingSop && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
            }}
          >
            {/* Edit Modal Header */}
            <div
              style={{
                padding: '12px 20px',
                background: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.96rem' }}>
                  ✏️ កែប្រែទម្រង់នីតិវិធី៖ {editingSop.code} - {editingSop.titleKh}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  អ្នកអាចប្តូរឈ្មោះក្រុមហ៊ុន ផលិតផល រៀបចំដោយ និងអនុម័តដោយ តាមតម្រូវការជាក់ស្តែង
                </div>
              </div>
              <button
                onClick={() => setEditingSop(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 800,
                }}
              >
                ✕
              </button>
            </div>

            {/* Edit Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Quick Batch Replacer Tool */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700 }}>
                  ⚡ ប្តូរឈ្មោះក្រុមហ៊ុនគ្រប់កន្លែងក្នុង SOP នេះ៖
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    id="newCompanyInput"
                    defaultValue={editingSop.companyName}
                    placeholder="វាយបញ្ចូលឈ្មោះក្រុមហ៊ុន/រោងចក្រថ្មី..."
                    style={{
                      padding: '5px 10px',
                      borderRadius: '5px',
                      border: '1px solid #86efac',
                      fontSize: '0.8rem',
                      minWidth: '240px',
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('newCompanyInput') as HTMLInputElement;
                      if (input) handleBatchReplaceCompany(editingSop.companyName, input.value);
                    }}
                    style={{
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '5px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ប្តូរឈ្មោះ (Replace)
                  </button>
                </div>
              </div>

              {/* Form Metadata Fields - Section 1: Official Header Attributes */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1e3a8a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📋 ព័ត៌មានក្បាលទម្រង់ផ្លូវការ (Official Document Header Attributes):</span>
                </div>
                
                {/* Row A: Doc No, Edition, Page Info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>លេខកូដឯកសារ (Document No):</label>
                    <input
                      type="text"
                      value={editingSop.code}
                      onChange={(e) => setEditingSop({ ...editingSop, code: e.target.value })}
                      placeholder="e.g. EGS/SCP-054"
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>បោះពុម្ពលើកទី (Edition / Rev):</label>
                    <input
                      type="text"
                      value={editingSop.edition || '02'}
                      onChange={(e) => setEditingSop({ ...editingSop, edition: e.target.value })}
                      placeholder="e.g. 02"
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>ចំនួនទំព័រ (Page Info):</label>
                    <input
                      type="text"
                      value={editingSop.pageInfo || 'Page 1 of 10'}
                      onChange={(e) => setEditingSop({ ...editingSop, pageInfo: e.target.value })}
                      placeholder="e.g. Page 1 of 10"
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                </div>

                {/* Row B: Initial Issued Date, Amend Date, Effective Date */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>កាលបរិច្ឆេទចេញដំបូង (Initial Issued Date):</label>
                    <input
                      type="text"
                      value={editingSop.initialIssuedDate || '10-11-2023'}
                      onChange={(e) => setEditingSop({ ...editingSop, initialIssuedDate: e.target.value })}
                      placeholder="e.g. 10-11-2023"
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>កាលបរិច្ឆេទត្រូវពិនិត្យឡើងវិញ (Amend Date):</label>
                    <input
                      type="text"
                      value={editingSop.amendDate || '10-10-2025'}
                      onChange={(e) => setEditingSop({ ...editingSop, amendDate: e.target.value })}
                      placeholder="e.g. 10-10-2025"
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>កាលបរិច្ឆេទមានប្រសិទ្ធភាព (Effective Date):</label>
                    <input
                      type="text"
                      value={editingSop.effectiveDate || '11-11-2024'}
                      onChange={(e) => setEditingSop({ ...editingSop, effectiveDate: e.target.value })}
                      placeholder="e.g. 11-11-2024"
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Metadata Fields - Section 2: Company & Titles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>ឈ្មោះក្រុមហ៊ុន / រោងចក្រ (Company):</label>
                  <input
                    type="text"
                    value={editingSop.companyName}
                    onChange={(e) => setEditingSop({ ...editingSop, companyName: e.target.value })}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>ប្រភេទផលិតផលផលិត (Product Manufactured):</label>
                  <input
                    type="text"
                    value={editingSop.productType}
                    onChange={(e) => setEditingSop({ ...editingSop, productType: e.target.value })}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#dc2626' }}>ចំណងជើងខ្មែរ (Title Khmer):</label>
                  <input
                    type="text"
                    value={editingSop.titleKh}
                    onChange={(e) => setEditingSop({ ...editingSop, titleKh: e.target.value })}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a' }}>ចំណងជើងអង់គ្លេស (Title English):</label>
                  <input
                    type="text"
                    value={editingSop.titleEn}
                    onChange={(e) => setEditingSop({ ...editingSop, titleEn: e.target.value })}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>ចំណងជើងចិន (Title Chinese - Optional):</label>
                  <input
                    type="text"
                    value={editingSop.titleCn || ''}
                    onChange={(e) => setEditingSop({ ...editingSop, titleCn: e.target.value })}
                    placeholder="e.g. 风险评估政策"
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                  />
                </div>
              </div>

              {/* Form Metadata Fields - Section 3: Approvals */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>រៀបចំដោយ (Prepared By):</label>
                  <input
                    type="text"
                    value={editingSop.preparedBy}
                    onChange={(e) => setEditingSop({ ...editingSop, preparedBy: e.target.value })}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>កាលបរិច្ឆេទរៀបចំ (Date):</label>
                  <input
                    type="text"
                    value={editingSop.preparedDate}
                    onChange={(e) => setEditingSop({ ...editingSop, preparedDate: e.target.value })}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>អនុម័តដោយ (Approved By):</label>
                  <input
                    type="text"
                    value={editingSop.approvedBy}
                    onChange={(e) => setEditingSop({ ...editingSop, approvedBy: e.target.value })}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>កាលបរិច្ឆេទអនុម័ត (Date):</label>
                  <input
                    type="text"
                    value={editingSop.approvedDate}
                    onChange={(e) => setEditingSop({ ...editingSop, approvedDate: e.target.value })}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                  />
                </div>
              </div>

              {/* Bilingual Content Textareas */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e40af' }}>ខ្លឹមសារភាសាខ្មែរ (Khmer Policy Content):</label>
                <textarea
                  value={editingSop.contentKh}
                  onChange={(e) => setEditingSop({ ...editingSop, contentKh: e.target.value })}
                  style={{ width: '100%', height: '140px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', marginTop: '2px', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#047857' }}>ខ្លឹមសារភាសាអង់គ្លេស (English Policy Content):</label>
                <textarea
                  value={editingSop.contentEn}
                  onChange={(e) => setEditingSop({ ...editingSop, contentEn: e.target.value })}
                  style={{ width: '100%', height: '140px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', marginTop: '2px', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {/* Edit Modal Footer */}
            <div style={{ padding: '10px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setEditingSop(null)}
                style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '7px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                បោះបង់ (Cancel)
              </button>
              <button
                onClick={handleSaveEditSop}
                style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '7px 18px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                💾 រក្សាទុកការកែប្រែ (Save SOP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: A4 FULL PREVIEW & PRINT (RETAINING EXACT ORIGINAL FORMAT) */}
      {previewSop && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '920px',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
            }}
          >
            {/* Preview Toolbar */}
            <div
              style={{
                padding: '12px 20px',
                background: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                  📄 ទម្រង់ដើមស្តង់ដា៖ {previewSop.code} - {previewSop.titleKh}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  {previewSop.companyName} • ផលិតផល៖ {previewSop.productType}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {/* 1-Row Bilingual Toggle Button */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: '6px', padding: '2px', marginRight: '4px' }}>
                  <button
                    onClick={() => setPreviewLayoutMode('1row')}
                    style={{
                      background: previewLayoutMode === '1row' ? '#ffffff' : 'transparent',
                      color: previewLayoutMode === '1row' ? '#0f172a' : '#cbd5e1',
                      border: 'none',
                      padding: '4px 9px',
                      borderRadius: '4px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="ទម្រង់តារាង 1-Row ២ភាសា (ខ្មែរលើគេ)"
                  >
                    📑 1-Row ២ភាសា (ខ្មែរលើគេ)
                  </button>
                  <button
                    onClick={() => setPreviewLayoutMode('paragraph')}
                    style={{
                      background: previewLayoutMode === 'paragraph' ? '#ffffff' : 'transparent',
                      color: previewLayoutMode === 'paragraph' ? '#0f172a' : '#cbd5e1',
                      border: 'none',
                      padding: '4px 9px',
                      borderRadius: '4px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="ទម្រង់កថាខណ្ឌបន្តបន្ទាប់"
                  >
                    📄 កថាខណ្ឌធម្មតា
                  </button>
                </div>

                <button
                  onClick={() => handlePrintTemplate('sopOriginalPrintArea')}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '5px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  🖨️ បោះពុម្ព A4
                </button>
                <button
                  onClick={() => handleExportPdf('sopOriginalPrintArea', `${previewSop.code}_${previewSop.titleEn.replaceAll(' ', '_')}`)}
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '5px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  📥 ទាញយកជា PDF
                </button>
                <button
                  onClick={() => setPreviewSop(null)}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                  }}
                >
                  ✕ បិទ
                </button>
              </div>
            </div>

            {/* Document Content (Exact Factory A4 Form) */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 32px',
                background: '#f1f5f9',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                id="sopOriginalPrintArea"
                style={{
                  background: '#ffffff',
                  width: '100%',
                  maxWidth: '820px',
                  minHeight: '1100px',
                  padding: '36px',
                  borderRadius: '3px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                  color: '#0f172a',
                  fontFamily: "'Kantumruy Pro', 'Inter', sans-serif",
                  lineHeight: 1.6,
                  fontSize: '0.86rem',
                }}
              >
                {/* 1. OFFICIAL FACTORY HEADER TABLE (Exact Match to Factory Image Standard) */}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1.5px solid #1e293b',
                    fontSize: '0.8rem',
                    marginBottom: '16px',
                  }}
                >
                  <tbody>
                    {/* ROW 1: LOGO/SMALL NAME | COMPANY NAME CENTER | PAGE INFO */}
                    <tr>
                      {/* Col 1: Logo & Small name */}
                      <td
                        style={{
                          border: '1px solid #1e293b',
                          padding: '6px 8px',
                          width: '28%',
                          verticalAlign: 'middle',
                          background: '#ffffff',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '6px',
                              background: '#e6f4ea',
                              border: '1px solid #81c784',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#2e7d32">
                              <path d="M12 2L6 10h3v4H6l6 8 6-8h-3v-4h3L12 2z" />
                            </svg>
                          </div>
                          <div style={{ fontSize: '0.64rem', lineHeight: '1.25', color: '#1e293b' }}>
                            <div style={{ fontWeight: 700, color: '#15803d' }}>{previewSop.companyName}</div>
                            {previewSop.titleCn && (
                              <div style={{ color: '#64748b', fontSize: '0.6rem' }}>长青户外用品(柬埔寨)有限公司</div>
                            )}
                            <div style={{ fontSize: '0.56rem', color: '#475569', fontWeight: 600 }}>
                              {previewSop.companyName.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Col 2: Center Big Company Title */}
                      <td
                        style={{
                          border: '1px solid #1e293b',
                          padding: '8px 10px',
                          width: '52%',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          background: '#ffffff',
                        }}
                      >
                        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.3 }}>
                          {previewSop.companyName}
                        </div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', letterSpacing: '0.5px' }}>
                          {previewSop.companyName.toUpperCase()}
                        </div>
                      </td>

                      {/* Col 3: Page Number */}
                      <td
                        style={{
                          border: '1px solid #1e293b',
                          padding: '8px 10px',
                          width: '20%',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          fontWeight: 700,
                          color: '#1e293b',
                          fontSize: '0.84rem',
                          background: '#ffffff',
                        }}
                      >
                        {previewSop.pageInfo || 'Page 1 of 10'}
                      </td>
                    </tr>

                    {/* ROW 2: INITIAL ISSUED DATE | POLICY TITLE | EDITION */}
                    <tr>
                      {/* Col 1: Initial Issued Date */}
                      <td
                        style={{
                          border: '1px solid #1e293b',
                          padding: '6px 8px',
                          verticalAlign: 'top',
                          background: '#ffffff',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.76rem' }}>កាលបរិច្ឆេទចេញដំបូង៖</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Initial Issued Date</div>
                        <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '2px', fontSize: '0.8rem' }}>
                          {previewSop.initialIssuedDate || '10-11-2023'}
                        </div>
                      </td>

                      {/* Col 2: Policy Titles (Red Khmer, Bold English, Optional Chinese) */}
                      <td
                        style={{
                          border: '1px solid #1e293b',
                          padding: '8px 12px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          background: '#ffffff',
                        }}
                      >
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#dc2626', lineHeight: 1.3 }}>
                          {previewSop.titleKh}
                        </div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#0f172a', marginTop: '2px', letterSpacing: '0.4px' }}>
                          {previewSop.titleEn.toUpperCase()}
                        </div>
                        {previewSop.titleCn && (
                          <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginTop: '2px' }}>
                            {previewSop.titleCn}
                          </div>
                        )}
                      </td>

                      {/* Col 3: Edition / Rev */}
                      <td
                        style={{
                          border: '1px solid #1e293b',
                          padding: '6px 8px',
                          verticalAlign: 'top',
                          background: '#ffffff',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.76rem' }}>
                          បោះពុម្ពលើកទី៖ {previewSop.edition || '02'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Edition:</div>
                      </td>
                    </tr>

                    {/* ROW 3: AMEND DATE | EFFECTIVE DATE | DOCUMENT NO */}
                    <tr>
                      {/* Col 1: Amend Date */}
                      <td
                        style={{
                          border: '1px solid #1e293b',
                          padding: '6px 8px',
                          verticalAlign: 'top',
                          background: '#ffffff',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.76rem' }}>កាលបរិច្ឆេទត្រូវពិនិត្យឡើងវិញ៖</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Amend Date</div>
                        <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '2px', fontSize: '0.8rem' }}>
                          {previewSop.amendDate || '10-10-2025'}
                        </div>
                      </td>

                      {/* Col 2: Effective Date */}
                      <td
                        style={{
                          border: '1px solid #1e293b',
                          padding: '6px 10px',
                          textAlign: 'left',
                          verticalAlign: 'top',
                          background: '#ffffff',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.76rem' }}>
                          កាលបរិច្ឆេទមានប្រសិទ្ធភាព៖
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Effective Date:
                        </div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem', marginTop: '2px' }}>
                          {previewSop.effectiveDate || '11-11-2024'}
                        </div>
                      </td>

                      {/* Col 3: Document No */}
                      <td
                        style={{
                          border: '1px solid #1e293b',
                          padding: '6px 8px',
                          verticalAlign: 'middle',
                          background: '#ffffff',
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.76rem' }}>
                          Document No: <strong style={{ color: '#0f172a', fontSize: '0.84rem' }}>{previewSop.code}</strong>
                        </div>
                      </td>
                    </tr>

                    {/* ROW 4: PREPARED BY | STAMP/SIGNATURE | APPROVED BY (Exact from Factory Image) */}
                    <tr>
                      {/* Col 1: Prepared By */}
                      <td
                        style={{
                          border: '1px solid #1e293b',
                          padding: '8px 10px',
                          verticalAlign: 'top',
                          background: '#ffffff',
                        }}
                      >
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>
                          រៀបចំដោយ៖ Prepared By
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px', lineHeight: 1.3 }}>
                          {previewSop.preparedRole}
                        </div>
                        <div style={{ minHeight: '34px' }}></div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>
                          {previewSop.preparedBy}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
                          កាលបរិច្ឆេទ៖ {previewSop.preparedDate} Date:
                        </div>
                      </td>

                      {/* Col 2: Stamp / Signature Box */}
                      <td
                        style={{
                          border: '1px solid #1e293b',
                          padding: '8px 10px',
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          background: '#ffffff',
                        }}
                      >
                        <div
                          style={{
                            border: '1px dashed #cbd5e1',
                            borderRadius: '6px',
                            padding: '12px 8px',
                            color: '#94a3b8',
                            fontSize: '0.7rem',
                          }}
                        >
                          <div>កន្លែងបោះត្រាក្រុមហ៊ុន</div>
                          <div style={{ fontSize: '0.62rem', marginTop: '2px' }}>Company Official Stamp</div>
                        </div>
                      </td>

                      {/* Col 3: Approved By */}
                      <td
                        style={{
                          border: '1px solid #1e293b',
                          padding: '8px 10px',
                          verticalAlign: 'top',
                          background: '#ffffff',
                        }}
                      >
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>
                          អនុម័តដោយ៖ Approved By
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px', lineHeight: 1.3 }}>
                          {previewSop.approvedRole}
                        </div>
                        <div style={{ minHeight: '34px' }}></div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>
                          {previewSop.approvedBy}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
                          កាលបរិច្ឆេទ៖ {previewSop.approvedDate} Date:
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 2. OFFICIAL FACTORY CONTENT: 1 ROW PER CLAUSE, 2 LANGUAGES, KHMER ON TOP */}
                {previewLayoutMode === '1row' ? (
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      border: '1.5px solid #1e293b',
                      marginBottom: '18px',
                      fontSize: '0.84rem',
                    }}
                  >
                    <tbody>
                      {parseBilingualClauses(previewSop.contentKh, previewSop.contentEn).map((clause, idx) => (
                        <tr key={idx} style={{ pageBreakInside: 'avoid' }}>
                          <td
                            style={{
                              border: '1px solid #1e293b',
                              padding: '10px 14px',
                              verticalAlign: 'top',
                              background: '#ffffff',
                            }}
                          >
                            {/* Khmer on Top (ភាសាខ្មែរលើគេ) */}
                            {clause.khmerTitle && (
                              <div
                                style={{
                                  fontWeight: 800,
                                  color: '#1e3a8a',
                                  fontSize: '0.92rem',
                                  marginBottom: '4px',
                                  lineHeight: 1.4,
                                }}
                              >
                                {clause.khmerTitle}
                              </div>
                            )}
                            <div
                              style={{
                                color: '#0f172a',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-line',
                                marginBottom: '8px',
                                fontSize: '0.85rem',
                                textAlign: 'justify',
                              }}
                            >
                              {clause.khmerBody}
                            </div>

                            {/* English directly underneath (ភាសាអង់គ្លេសខាងក្រោម) */}
                            <div
                              style={{
                                borderTop: '1px dashed #cbd5e1',
                                paddingTop: '6px',
                                marginTop: '4px',
                              }}
                            >
                              {clause.englishTitle && (
                                <div
                                  style={{
                                    fontWeight: 800,
                                    color: '#475569',
                                    fontSize: '0.82rem',
                                    marginBottom: '2px',
                                    fontStyle: 'italic',
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {clause.englishTitle}
                                </div>
                              )}
                              <div
                                style={{
                                  color: '#475569',
                                  fontStyle: 'italic',
                                  lineHeight: 1.5,
                                  whiteSpace: 'pre-line',
                                  fontSize: '0.81rem',
                                  textAlign: 'justify',
                                }}
                              >
                                {clause.englishBody}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <>
                    {/* Paragraph View: Body Content Khmer */}
                    <div style={{ whiteSpace: 'pre-line', marginBottom: '20px', color: '#0f172a', textAlign: 'justify' }}>
                      {previewSop.contentKh}
                    </div>

                    {/* Paragraph View: Body Content English */}
                    <div
                      style={{
                        whiteSpace: 'pre-line',
                        marginBottom: '24px',
                        color: '#334155',
                        textAlign: 'justify',
                        fontStyle: 'italic',
                        background: '#fafafa',
                        padding: '12px 16px',
                        borderRadius: '6px',
                        borderLeft: '3px solid #3b82f6',
                      }}
                    >
                      {previewSop.contentEn}
                    </div>
                  </>
                )}

                {/* 2. Official Revision History Table (Exact Format from Image 3) */}
                <div style={{ fontWeight: 800, fontSize: '0.84rem', margin: '20px 0 6px', color: '#0f172a' }}>
                  ប្រវត្តិនៃការត្រួតពិនិត្យឡើងវិញ (Document Revision History):
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', border: '1.5px solid #1e293b' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textAlign: 'center' }}>
                      <th style={{ border: '1px solid #1e293b', padding: '6px 8px', width: '15%' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>ការពិនិត្យឡើងវិញ</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>REVISION</div>
                      </th>
                      <th style={{ border: '1px solid #1e293b', padding: '6px 8px', width: '16%' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>កាលបរិច្ឆេទ</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>DATE</div>
                      </th>
                      <th style={{ border: '1px solid #1e293b', padding: '6px 8px', width: '15%' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>ឃ្លា</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>PARAGRAPH</div>
                      </th>
                      <th style={{ border: '1px solid #1e293b', padding: '6px 8px', width: '36%' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>សង្ខេបនៃការកែសម្រួល</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>SUMMARY OF CHANGE</div>
                      </th>
                      <th style={{ border: '1px solid #1e293b', padding: '6px 8px', width: '18%' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>អនុម័តដោយ</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>AUTHORIZED BY</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewSop.revisions.map((rev, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #1e293b', padding: '6px', textAlign: 'center', fontWeight: 800 }}>{rev.rev}</td>
                        <td style={{ border: '1px solid #1e293b', padding: '6px', textAlign: 'center' }}>{rev.date}</td>
                        <td style={{ border: '1px solid #1e293b', padding: '6px', textAlign: 'center' }}>{rev.paragraph}</td>
                        <td style={{ border: '1px solid #1e293b', padding: '6px 8px' }}>{rev.summary}</td>
                        <td style={{ border: '1px solid #1e293b', padding: '6px', textAlign: 'center' }}>{rev.authorizedBy}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ border: '1px solid #1e293b', padding: '6px', textAlign: 'center', fontWeight: 800 }}>02</td>
                      <td style={{ border: '1px solid #1e293b', padding: '6px', textAlign: 'center' }}>—</td>
                      <td style={{ border: '1px solid #1e293b', padding: '6px', textAlign: 'center' }}>—</td>
                      <td style={{ border: '1px solid #1e293b', padding: '6px 8px', color: '#64748b' }}>
                        ការកែសម្រួលតាមតម្រូវការអតិថិជន និងផលិតផលថ្មី
                      </td>
                      <td style={{ border: '1px solid #1e293b', padding: '6px', textAlign: 'center' }}>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
