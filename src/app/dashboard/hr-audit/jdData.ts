// Standard Factory Job Descriptions (JD Library)
// Standardized across 15 core roles for Cambodian apparel & manufacturing operations
// Compliant with Cambodian Labor Law, BSCI, WRAP, ISO 9001, ISO 45001, C-TPAT

export interface FactoryJd {
  id: string;
  code: string;
  edition: string;
  pageInfo: string;
  initialIssuedDate?: string;
  effectiveDate: string;
  amendDate: string;
  department: string;
  departmentKh: string;
  jobTitleKh: string;
  jobTitleEn: string;
  jobTitleCn?: string;
  gradeLevel: string;
  reportsToKh: string;
  reportsToEn: string;
  supervisesKh: string;
  supervisesEn: string;
  companyName: string;
  preparedBy: string;
  preparedRole: string;
  verifiedBy: string;
  verifiedRole: string;
  approvedBy: string;
  approvedRole: string;
  jobSummaryKh: string;
  jobSummaryEn: string;
  dutiesKh: string;
  dutiesEn: string;
  authoritiesKh: string;
  authoritiesEn: string;
  qualificationsKh: string;
  qualificationsEn: string;
  workingConditionsKh: string;
  workingConditionsEn: string;
  kpisKh: string;
  kpisEn: string;
  revisions: {
    rev: string;
    date: string;
    summary: string;
    authorizedBy: string;
  }[];
}

export const ALL_JDS: FactoryJd[] = [
  {
    "id": "jd-01",
    "code": "JD-MGT-001",
    "edition": "02",
    "pageInfo": "Page 1 of 2",
    "effectiveDate": "11-11-2024",
    "amendDate": "10-10-2025",
    "department": "EXECUTIVE",
    "departmentKh": "គណៈគ្រប់គ្រងទូទៅ (Executive Management)",
    "jobTitleKh": "នាយកគ្រប់គ្រងទូទៅ",
    "jobTitleEn": "General Manager (GM)",
    "jobTitleCn": "总经理",
    "gradeLevel": "Executive / M3",
    "reportsToKh": "ក្រុមប្រឹក្សាភិបាល / ម្ចាស់ភាគហ៊ុន",
    "reportsToEn": "Board of Directors / Shareholders",
    "supervisesKh": "ប្រធានគ្រប់ផ្នែកទាំងអស់ (HR, Production, QA, Compliance, Finance, Maintenance, Warehouse)",
    "supervisesEn": "All Department Heads (HR, Production, QA, Compliance, Finance, Maintenance, Warehouse)",
    "companyName": "G.S.textileGarment(Cambodia) co.,Ltd",
    "preparedBy": "Mr. CHAN PHEARUM",
    "preparedRole": "ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager",
    "verifiedBy": "Mr. LEANG SOPHEA",
    "verifiedRole": "ប្រធានផ្នែកសវនកម្ម Compliance Manager",
    "approvedBy": "Mr. CHEN LANMAO",
    "approvedRole": "នាយកក្រុមហ៊ុន General Manager",
    "jobSummaryKh": "ដឹកនាំ គ្រប់គ្រង និងតម្រង់ទិសយុទ្ធសាស្ត្រប្រតិបត្តិការរោងចក្រទាំងមូល ធានានូវប្រសិទ្ធភាពផលិតកម្ម គុណភាពទំនិញស្របតាមស្តង់ដាអ្នកបញ្ជាទិញ ការអនុលោមតាមច្បាប់ការងារ និងស្តង់ដាសង្គមអន្តរជាតិ (BSCI, WRAP, ISO, C-TPAT) ព្រមទាំងការសម្រេចបាននូវប្រាក់ចំណេញ និងការអភិវឌ្ឍប្រកបដោយចីរភាព។",
    "jobSummaryEn": "Lead, direct, and oversee total factory operations to ensure maximum production efficiency, buyer quality compliance, adherence to Cambodian labor laws and international social standards (BSCI, WRAP, ISO, C-TPAT), while driving profitability, operational excellence, and sustainable enterprise growth.",
    "dutiesKh": "១. ផែនការយុទ្ធសាស្ត្រ និងការគ្រប់គ្រងប្រតិបត្តិការ STRATEGIC LEADERSHIP\n- កំណត់ទិសដៅយុទ្ធសាស្ត្រ ផែនការអាជីវកម្មប្រចាំឆ្នាំ និងត្រួតពិនិត្យការអនុវត្តផែនការថវិការបស់រោងចក្រ។\n- ដឹកនាំកិច្ចប្រជុំប្រចាំសប្តាហ៍ជាមួយប្រធានគ្រប់ផ្នែកដើម្បីដោះស្រាយបញ្ហារាំងស្ទះក្នុងខ្សែសង្វាក់ផលិតកម្ម។\n- ធានាការប្រគល់ទំនិញទាន់ពេលវេលា (On-Time Delivery - OTD) ទៅកាន់អតិថិជនអន្តរជាតិ។\n\n២. ការអនុលោមតាមច្បាប់ និងស្តង់ដាអន្តរជាតិ COMPLIANCE & GOVERNANCE\n- ធានាថាប្រតិបត្តិការរោងចក្រទាំងមូលអនុលោម ១០០% តាមច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា។\n- គាំទ្រ និងជំរុញឱ្យការអនុវត្តស្តង់ដាសវនកម្មសង្គម (BSCI, SMETA, HIGG, C-TPAT) ទទួលបានលទ្ធផលកម្រិតខ្ពស់។\n- មិនអនុញ្ញាតដាច់ខាតនូវការប្រើប្រាស់ពលកម្មកុមារ ពលកម្មបង្ខំ ឬការរំលោភសិទ្ធិមនុស្សក្នុងរោងចក្រ។\n\n៣. ការគ្រប់គ្រងធនធានមនុស្ស និងសុវត្ថិភាព HR & WORKPLACE SAFETY\n- ពិនិត្យ និងអនុម័តគោលនយោបាយរដ្ឋបាល ប្រាក់បៀវត្សរ៍ និងផែនការជ្រើសរើសបុគ្គលិកគន្លឹះ។\n- បង្កើតបរិយាកាសការងារប្រកបដោយសុវត្ថិភាព សុខដុមរមនា និងគ្មានការរើសអើង។\n- លើកកម្ពស់វប្បធម៌សុវត្ថិភាពការងារ និងកិច្ចសហការរវាងនិយោជក និងតំណាងកម្មករនិយោជិត។",
    "dutiesEn": "1. STRATEGIC LEADERSHIP & OPERATIONAL CONTROL\n- Establish strategic business goals, annual operating budgets, and monitor key operational performance metrics.\n- Lead weekly management meetings with department heads to resolve manufacturing bottlenecks and operational hurdles.\n- Ensure 100% On-Time Delivery (OTD) for all export shipments to international buyers.\n\n2. STATUTORY COMPLIANCE & INTERNATIONAL STANDARDS\n- Ensure full factory adherence to Cambodian Labor Law, environmental regulations, and safety mandates.\n- Direct social compliance initiatives to achieve top audit ratings across BSCI, SMETA, HIGG, and C-TPAT.\n- Strictly enforce zero-tolerance policies against child labor, forced labor, and workplace harassment.\n\n3. HUMAN CAPITAL & WORKPLACE SAFETY\n- Review and approve corporate HR policies, compensation packages, and strategic workforce hiring plans.\n- Champion an inclusive, safe, and positive workplace culture free of discrimination and retribution.\n- Foster healthy labor relations through active dialogue with worker representatives and union delegates.",
    "authoritiesKh": "មានសិទ្ធិសម្រេចចិត្តលើការអនុម័តថវិកាប្រតិបត្តិការ ការជ្រើសរើសនិងបញ្ចប់កិច្ចសន្យាការងារថ្នាក់គ្រប់គ្រង និងការចុះហត្ថលេខាលើកិច្ចសន្យាពាណិជ្ជកម្មនានា។",
    "authoritiesEn": "Authority to approve operational budgets, hire/terminate managerial personnel, sign commercial agreements, and represent the factory with government and audit authorities.",
    "qualificationsKh": "បរិញ្ញាបត្រជាន់ខ្ពស់ផ្នែកគ្រប់គ្រងពាណិជ្ជកម្ម វិស្វកម្មឧស្សាហកម្ម ឬជំនាញប្រហាក់ប្រហែល។ បទពិសោធន៍គ្រប់គ្រងរោងចក្រកាត់ដេរយ៉ាងតិច ១០ ឆ្នាំ។ ស្ទាត់ជំនាញភាសាអង់គ្លេស និងភាសាចិន (Mandarin)។",
    "qualificationsEn": "Master's or Bachelor's Degree in Business Administration, Industrial Engineering, or related field. Minimum 10 years experience in garment factory management. Fluent in English and Mandarin Chinese.",
    "workingConditionsKh": "បំពេញការងារក្នុងបរិវេណរោងចក្រ និងការិយាល័យកណ្តាល។ អាចធ្វើដំណើរក្នុងនិងក្រៅប្រទេសតាមការចាំបាច់។",
    "workingConditionsEn": "Factory premises and office environment. Domestic and overseas travel as required.",
    "kpisKh": "អត្រាប្រគល់ទំនិញទាន់ពេល OTD >= 98%, ពិន្ទុសវនកម្មសង្គម BSCI Grade A/B, អត្រាចំណេញសុទ្ធតាមផែនការ, អត្រាគ្មានគ្រោះថ្នាក់ការងារធ្ងន់ធ្ងរ (Zero Fatalities)។",
    "kpisEn": "On-Time Delivery (OTD) >= 98%, BSCI Audit Grade A/B, Profit target achievement, Zero major safety incidents.",
    "revisions": [
      {
        "rev": "01",
        "date": "10-11-2023",
        "summary": "បង្កើតសេចក្តីពិពណ៌នាមុខតំណែងដំបូង",
        "authorizedBy": "Board of Directors"
      },
      {
        "rev": "02",
        "date": "11-11-2024",
        "summary": "ធ្វើបច្ចុប្បន្នភាពតាមស្តង់ដា ISO 9001 & BSCI 2024",
        "authorizedBy": "Board of Directors"
      }
    ]
  },
  {
    "id": "jd-02",
    "code": "JD-HR-002",
    "edition": "02",
    "pageInfo": "Page 1 of 2",
    "effectiveDate": "11-11-2024",
    "amendDate": "10-10-2025",
    "department": "HR_ADMIN",
    "departmentKh": "ផ្នែករដ្ឋបាល និងធនធានមនុស្ស (HR & Admin)",
    "jobTitleKh": "ប្រធានផ្នែករដ្ឋបាល និងធនធានមនុស្ស",
    "jobTitleEn": "HR & Administration Manager",
    "jobTitleCn": "人事行政经理",
    "gradeLevel": "Manager / M2",
    "reportsToKh": "នាយកគ្រប់គ្រងទូទៅ (General Manager)",
    "reportsToEn": "General Manager",
    "supervisesKh": "មន្ត្រី HR, មន្ត្រីជ្រើសរើស, មន្ត្រីបើកប្រាក់ខែ, បុគ្គលិករដ្ឋបាល, គិលានុបដ្ឋាយិកា, ក្រុមសន្តិសុខ",
    "supervisesEn": "HR Officers, Recruitment Officers, Payroll Specialists, Admin Clerks, Factory Clinic Nurses, Security Guards",
    "companyName": "G.S.textileGarment(Cambodia) co.,Ltd",
    "preparedBy": "Mr. CHAN PHEARUM",
    "preparedRole": "ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager",
    "verifiedBy": "Mr. LEANG SOPHEA",
    "verifiedRole": "ប្រធានផ្នែកសវនកម្ម Compliance Manager",
    "approvedBy": "Mr. CHEN LANMAO",
    "approvedRole": "នាយកក្រុមហ៊ុន General Manager",
    "jobSummaryKh": "គ្រប់គ្រងរាល់កិច្ចការធនធានមនុស្ស រដ្ឋបាលទូទៅ ច្បាប់ការងារ ប្រព័ន្ធបើកប្រាក់បៀវត្សរ៍ ទំនាក់ទំនងបុគ្គលិក ការបណ្តុះបណ្តាល និងសុខុមាលភាពកម្មករនិយោជិតក្នុងរោងចក្រ ឱ្យស្របតាមច្បាប់ការងារកម្ពុជា និងបទបញ្ជាផ្ទៃក្នុង។",
    "jobSummaryEn": "Direct and oversee all human resource and administrative operations, ensuring full compliance with Cambodian Labor Laws, company internal regulations, recruitment, payroll management, employee relations, training, and employee welfare.",
    "dutiesKh": "១. ការគ្រប់គ្រងអនុលោមភាពច្បាប់ការងារ LABOR LAW COMPLIANCE\n- ធានាការចុះបញ្ជិកាកម្មករនិយោជិត សៀវភៅការងារ ប័ណ្ណការងារជនបរទេស (FWEMS) និងប.ស.ស. (NSSF) ឱ្យបានទាន់ពេលវេលា។\n- សម្របសម្រួលជាមួយអធិការការងារនៃក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈក្នុងការចុះធ្វើអធិការកិច្ច។\n- ពិនិត្យកិច្ចសន្យាការងារ (FDC/UDC) ឱ្យស្របតាមច្បាប់ និងការពារហានិភ័យវិវាទការងារ។\n\n២. ការគ្រប់គ្រងជ្រើសរើស និងបើកប្រាក់បៀវត្សរ៍ RECRUITMENT & PAYROLL\n- គ្រប់គ្រងផែនការជ្រើសរើសកម្លាំងពលកម្មតាមតម្រូវការខ្សែសង្វាក់ផលិតកម្ម។\n- ត្រួតពិនិត្យទិន្នន័យស្កេនមេដៃ (Fingerprint), ម៉ោងថែម (OT) និងការគណនាប្រាក់បៀវត្សរ៍ឱ្យបានត្រឹមត្រូវ ១០០% មុនបើកប្រាក់។\n- ធានាការអនុវត្តប្រាក់ឈ្នួលអប្បបរមា និងប្រាក់ឧបត្ថម្ភផ្សេងៗស្របតាមប្រកាសផ្លូវការរបស់ក្រសួង។\n\n៣. ទំនាក់ទំនងបុគ្គលិក និងការដោះស្រាយបណ្តឹងតវ៉ា EMPLOYEE RELATIONS & GRIEVANCE\n- ដឹកនាំការដោះស្រាយបណ្តឹងតវ៉ារបស់កម្មករនិយោជិតតាមប្រអប់សំបុត្រ ឬប្រព័ន្ធសម្ងាត់ឱ្យបានលឿន និងយុត្តិធម៌។\n- សម្របសម្រួលកិច្ចប្រជុំទៀងទាត់ជាមួយសហជីពមូលដ្ឋាន និងគណៈកម្មាធិការតំណាងកម្មករ។\n- រៀបចំកម្មវិធីតម្រង់ទិសបុគ្គលិកថ្មី និងការបណ្តុះបណ្តាលស្តីពីសិទ្ធិការងារ និងបទបញ្ជាផ្ទៃក្នុង។",
    "dutiesEn": "1. LABOR LAW & STATUTORY COMPLIANCE\n- Ensure timely processing of employee workbooks, foreign work permits (FWEMS), labor declarations, and NSSF registrations.\n- Coordinate with labor inspectors from the Ministry of Labor and Vocational Training (MoLVT) during official audits.\n- Review and maintain employment contracts (FDC/UDC) ensuring statutory compliance and dispute mitigation.\n\n2. TALENT ACQUISITION & PAYROLL OVERSIGHT\n- Formulate and execute recruitment strategies to fulfill workforce requirements for manufacturing lines.\n- Audit electronic biometric attendance, overtime calculations, and monthly payroll disbursement with 100% precision.\n- Ensure strict compliance with official minimum wage mandates, attendance bonuses, and seniority indemnity payments.\n\n3. EMPLOYEE RELATIONS & GRIEVANCE MANAGEMENT\n- Oversee the confidential worker grievance mechanism and resolve complaints impartially within established SLAs.\n- Facilitate constructive dialogues with labor union delegates and worker shop stewards.\n- Direct new hire orientation sessions and recurring workforce training on company rules and worker rights.",
    "authoritiesKh": "មានសិទ្ធិអនុម័តការឈប់សម្រាកបុគ្គលិក ពិនិត្យនិងបញ្ជាក់បញ្ជីបើកប្រាក់ខែ ដាក់ទណ្ឌកម្មវិន័យតាមបទបញ្ជាផ្ទៃក្នុង និងស្នើសុំជ្រើសរើសឬបញ្ឈប់បុគ្គលិក។",
    "authoritiesEn": "Authority to approve leave requests, certify monthly payroll, execute disciplinary measures per internal regulations, and recommend workforce hiring or terminations.",
    "qualificationsKh": "បរិញ្ញាបត្រផ្នែកគ្រប់គ្រងធនធានមនុស្ស ច្បាប់ ឬរដ្ឋបាលពាណិជ្ជកម្ម។ បទពិសោធន៍គ្រប់គ្រង HR ក្នុងរោងចក្រយ៉ាងតិច ៥ ឆ្នាំ។ យល់ដឹងច្បាស់ពីច្បាប់ការងារកម្ពុជា។ អាចទំនាក់ទំនងភាសាអង់គ្លេសបានល្អ (ភាសាចិនជាអាទិភាព)។",
    "qualificationsEn": "Bachelor's Degree in HR Management, Law, or Business Administration. Minimum 5 years HR management experience in manufacturing. In-depth knowledge of Cambodian Labor Law. Strong English communication (Chinese is an advantage).",
    "workingConditionsKh": "ការិយាល័យរដ្ឋបាល និងចុះត្រួតពិនិត្យផ្ទាល់លើខ្សែសង្វាក់ផលិតកម្ម និងអាហារដ្ឋាន។",
    "workingConditionsEn": "HR Office environment with frequent presence across production floors and worker amenities.",
    "kpisKh": "អត្រាបំពេញកម្លាំងពលកម្ម >= 95%, គ្មានកំហុសលើការបើកប្រាក់ខែ (0 Payroll Errors), ដំណោះស្រាយបណ្តឹងតវ៉ា 100% ក្នុងរយៈពេលកំណត់, គ្មានការពិន័យពីក្រសួងការងារ។",
    "kpisEn": "Recruitment fulfillment rate >= 95%, Zero payroll calculation errors, 100% timely grievance resolution, Zero statutory penalties from MoLVT.",
    "revisions": [
      {
        "rev": "01",
        "date": "10-11-2023",
        "summary": "បង្កើតសេចក្តីពិពណ៌នាមុខតំណែងដំបូង",
        "authorizedBy": "General Manager"
      },
      {
        "rev": "02",
        "date": "11-11-2024",
        "summary": "ធ្វើបច្ចុប្បន្នភាពតាមប្រកាសថ្មីរបស់ក្រសួងការងារ",
        "authorizedBy": "General Manager"
      }
    ]
  },
  {
    "id": "jd-03",
    "code": "JD-CMP-003",
    "edition": "02",
    "pageInfo": "Page 1 of 2",
    "effectiveDate": "11-11-2024",
    "amendDate": "10-10-2025",
    "department": "COMPLIANCE",
    "departmentKh": "ផ្នែកអនុលោមភាពសង្គម និងសវនកម្ម (Social Compliance & CSR)",
    "jobTitleKh": "ប្រធានផ្នែកអនុលោមភាពសង្គម និងសវនកម្ម",
    "jobTitleEn": "Social Compliance & CSR Manager",
    "jobTitleCn": "验厂合规经理",
    "gradeLevel": "Manager / M2",
    "reportsToKh": "នាយកគ្រប់គ្រងទូទៅ (General Manager)",
    "reportsToEn": "General Manager",
    "supervisesKh": "មន្ត្រីអនុលោមភាព (Compliance Officers), មន្ត្រី CSR, ជំនួយការសវនកម្ម",
    "supervisesEn": "Compliance Officers, CSR Officers, Internal Audit Assistants",
    "companyName": "G.S.textileGarment(Cambodia) co.,Ltd",
    "preparedBy": "Mr. CHAN PHEARUM",
    "preparedRole": "ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager",
    "verifiedBy": "Mr. LEANG SOPHEA",
    "verifiedRole": "ប្រធានផ្នែកសវនកម្ម Compliance Manager",
    "approvedBy": "Mr. CHEN LANMAO",
    "approvedRole": "នាយកក្រុមហ៊ុន General Manager",
    "jobSummaryKh": "ទទួលខុសត្រូវធានាថាប្រតិបត្តិការរោងចក្រអនុលោមពេញលេញតាមស្តង់ដាសវនកម្មសង្គមរបស់អ្នកបញ្ជាទិញ (Buyer Codes of Conduct), BSCI, WRAP, SMETA, HIGG Index, C-TPAT និងច្បាប់ជាតិ ព្រមទាំងដឹកនាំការត្រៀមរៀបចំសវនកម្ម និងផែនការកែតម្រូវ CAP។",
    "jobSummaryEn": "Lead and enforce factory-wide social compliance, environmental sustainability, and security practices per international standards (BSCI, WRAP, SMETA, HIGG Index, C-TPAT) and Buyer Codes of Conduct, directing audit readiness and Corrective Action Plans (CAP).",
    "dutiesKh": "១. ការត្រៀមរៀបចំ និងទទួលការធ្វើសវនកម្ម AUDIT READINESS & HOSTING\n- រៀបចំ គ្រប់គ្រង និងដឹកនាំការទទួលសវនកម្មសង្គម សន្តិសុខ និងបរិស្ថានពីស្ថាប័នអន្តរជាតិ (Third-party Audits)។\n- ត្រួតពិនិត្យភាពពេញលេញនៃឯកសារភស្តុតាង និងកំណត់ត្រាចាំបាច់ទាំងអស់មុនពេលសវនករចុះមកដល់។\n- បង្កើត និងតាមដានផែនការកែតម្រូវ (Corrective Action Plan - CAP) ដើម្បីបិទរាល់ចំណុចខ្វះខាតឱ្យបាន ១០០%។\n\n២. សវនកម្មផ្ទៃក្នុង និងការវាយតម្លៃហានិភ័យ INTERNAL AUDIT & RISK\n- ចុះធ្វើសវនកម្មផ្ទៃក្នុង (Internal Social Audit) ប្រចាំខែលើគ្រប់ផ្នែកទាំងអស់ក្នុងរោងចក្រ។\n- វាយតម្លៃហានិភ័យទាក់ទងនឹងការអនុវត្តម៉ោងការងារ ម៉ោងថែម ប្រាក់ឈ្នួល និងលក្ខខណ្ឌការងារ។\n- ត្រួតពិនិត្យរោងចក្រអ្នកម៉ៅការបន្ត (Subcontractors) ឱ្យគោរពតាមបទដ្ឋានសង្គមដូចគ្នានឹងរោងចក្រមេ។\n\n៣. ការបណ្តុះបណ្តាល និងទំនួលខុសត្រូវសង្គម TRAINING & CSR\n- រៀបចំការបណ្តុះបណ្តាលស្តីពីក្រមសីលធម៌ សិទ្ធិមនុស្ស ការប្រឆាំងអំពើពុករលួយ និង C-TPAT ដល់បុគ្គលិកគ្រប់កម្រិត។\n- ដឹកនាំសកម្មភាពទំនួលខុសត្រូវសង្គមរបស់ក្រុមហ៊ុន (CSR) និងការថែរក្សាបរិស្ថានសហគមន៍។",
    "dutiesEn": "1. AUDIT READINESS & EXTERNAL HOSTING\n- Direct preparation and lead on-site execution of buyer social, environmental, and security audits (BSCI, SMETA, WRAP).\n- Maintain comprehensive documentary evidence and compliance archives in continuous readiness.\n- Formulate, track, and close Corrective Action Plans (CAP) within prescribed buyer timelines.\n\n2. INTERNAL AUDITING & SYSTEM EVALUATION\n- Conduct monthly internal social compliance inspections across all manufacturing workshops and warehouses.\n- Monitor payroll, maximum work hours, rest days, and living wage metrics to prevent audit non-conformances.\n- Audit external subcontractors to ensure alignment with international ethical labor benchmarks.\n\n3. CAPACITY BUILDING & CORPORATE RESPONSIBILITY\n- Execute mandatory training on Code of Conduct, anti-harassment, business integrity, and supply chain security.\n- Drive Corporate Social Responsibility (CSR) and community environmental stewardship initiatives.",
    "authoritiesKh": "មានសិទ្ធិផ្អាកសកម្មភាពការងារណាដែលរំលោភលើស្តង់ដាសុវត្ថិភាព ឬច្បាប់សង្គមជាបន្ទាន់ និងស្នើសុំវិធានការកែតម្រូវចំពោះប្រធានគ្រប់ផ្នែក។",
    "authoritiesEn": "Authority to issue immediate stop-work orders for critical safety/labor violations and mandate binding corrective actions across all operational units.",
    "qualificationsKh": "បរិញ្ញាបត្រផ្នែកច្បាប់ បរិស្ថាន ឬគ្រប់គ្រង។ បទពិសោធន៍យ៉ាងតិច ៥ ឆ្នាំក្នុងការងារសវនកម្មរោងចក្រកាត់ដេរ (BSCI, SMETA, WRAP, HIGG)។ មានវិញ្ញាបនបត្រ Lead Auditor ជាអាទិភាព។ ភាសាអង់គ្លេសស្ទាត់ជំនាញ។",
    "qualificationsEn": "Bachelor's Degree in Law, Environmental Science, or Management. Minimum 5 years experience in garment factory social audits. Certified Lead Auditor credential preferred. Fluent English.",
    "workingConditionsKh": "ការិយាល័យ និងចុះត្រួតពិនិត្យជាក់ស្តែងនៅកន្លែងផលិតកម្ម និងឃ្លាំង។",
    "workingConditionsEn": "Compliance Office with frequent factory floor and facility audits.",
    "kpisKh": "លទ្ធផលសវនកម្ម BSCI ជាប់កម្រិត A ឬ B, អត្រាបិទ CAP 100% តាមកាលកំណត់, គ្មានបញ្ហា Critical Non-compliance (Zero Child/Forced Labor)។",
    "kpisEn": "BSCI audit rating Grade A or B, 100% on-time CAP closure rate, Zero Zero-Tolerance issues identified.",
    "revisions": [
      {
        "rev": "01",
        "date": "10-11-2023",
        "summary": "បង្កើតសេចក្តីពិពណ៌នាមុខតំណែងដំបូង",
        "authorizedBy": "General Manager"
      },
      {
        "rev": "02",
        "date": "11-11-2024",
        "summary": "ធ្វើបច្ចុប្បន្នភាពតាមស្តង់ដា BSCI CoC V.2024",
        "authorizedBy": "General Manager"
      }
    ]
  },
  {
    "id": "jd-04",
    "code": "JD-EHS-004",
    "edition": "02",
    "pageInfo": "Page 1 of 2",
    "effectiveDate": "11-11-2024",
    "amendDate": "10-10-2025",
    "department": "EHS",
    "departmentKh": "ផ្នែកសុវត្ថិភាព សុខភាព និងបរិស្ថាន (EHS & Safety)",
    "jobTitleKh": "មន្ត្រីសុវត្ថិភាព សុខភាពការងារ និងបរិស្ថាន",
    "jobTitleEn": "Occupational Health, Safety & Environment (EHS) Officer",
    "jobTitleCn": "环保安全员",
    "gradeLevel": "Officer / L3",
    "reportsToKh": "ប្រធានផ្នែកសវនកម្ម (Compliance Manager) / HR Manager",
    "reportsToEn": "Compliance Manager / HR Manager",
    "supervisesKh": "ជំនួយការសុវត្ថិភាព, ក្រុមពន្លត់អគ្គិភ័យរោងចក្រ, បុគ្គលិកអនាម័យបរិស្ថាន",
    "supervisesEn": "Safety Assistants, Factory Fire Brigade, Waste Management Workers",
    "companyName": "G.S.textileGarment(Cambodia) co.,Ltd",
    "preparedBy": "Mr. CHAN PHEARUM",
    "preparedRole": "ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager",
    "verifiedBy": "Mr. LEANG SOPHEA",
    "verifiedRole": "ប្រធានផ្នែកសវនកម្ម Compliance Manager",
    "approvedBy": "Mr. CHEN LANMAO",
    "approvedRole": "នាយកក្រុមហ៊ុន General Manager",
    "jobSummaryKh": "ទទួលបន្ទុកអនុវត្ត និងត្រួតពិនិត្យប្រព័ន្ធសុវត្ថិភាព សុខភាពការងារ បង្ការអគ្គិភ័យ សារធាតុគីមី និងការការពារបរិស្ថានក្នុងរោងចក្រ ស្របតាមច្បាប់ជាតិ និងស្តង់ដា ISO 45001 / ISO 14001 / ZDHC។",
    "jobSummaryEn": "Responsible for executing workplace safety, occupational health, fire prevention, chemical management, and environmental protection standards in line with national regulations and ISO 45001 / ISO 14001 / ZDHC benchmarks.",
    "dutiesKh": "១. សុវត្ថិភាពការងារ និងការបង្ការអគ្គិភ័យ OCCUPATIONAL SAFETY & FIRE SAFETY\n- ដើរត្រួតពិនិត្យប្រចាំថ្ងៃលើឧបករណ៍ពន្លត់អគ្គិភ័យ ច្រកចេញសង្គ្រោះបន្ទាន់ ភ្លើងសញ្ញា និងប្រព័ន្ធរោទិ៍។\n- ត្រួតពិនិត្យការប្រើប្រាស់ឧបករណ៍ការពារសុវត្ថិភាព (PPE) ដូចជា ស្រោមដៃដែក ម៉ាស់ និងវ៉ែនតាការពារ។\n- រៀបចំការហ្វឹកហាត់ពន្លត់អគ្គិភ័យ និងជម្លៀសខ្លួនចេញ (Fire Drill) យ៉ាងតិច ២ ដងក្នុងមួយឆ្នាំ។\n\n២. ការគ្រប់គ្រងសារធាតុគីមី និងបរិស្ថាន CHEMICAL & ENVIRONMENTAL CONTROL\n- គ្រប់គ្រងបន្ទប់ផ្ទុកសារធាតុគីមី បិទស្លាកសញ្ញា SDS/MSDS និងត្រួតពិនិត្យឧបករណ៍ការពារជាតិគីមី។\n- ត្រួតពិនិត្យប្រព័ន្ធប្រព្រឹត្តិកម្មទឹកកខ្វក់ (Wastewater) និងសំណល់រឹង-រាវឱ្យស្របតាមស្តង់ដា ZDHC។\n- កត់ត្រាកំណត់ត្រាផ្ទុកសម្ភារ និងការសន្សំថាមពល/ទឹកក្នុងរោងចក្រ។\n\n៣. ការស៊ើបអង្កេតគ្រោះថ្នាក់ការងារ INCIDENT INVESTIGATION & REPORTING\n- ស៊ើបអង្កេតភ្លាមៗនៅពេលមានគ្រោះថ្នាក់ការងារ ឬករណីស្ទើរតែកើតហេតុ (Near-Miss)។\n- ធ្វើរបាយការណ៍បញ្ជូនទៅប.ស.ស. (NSSF) និងក្រសួងការងារតាមកាលកំណត់ច្បាប់។\n- ដឹកនាំកិច្ចប្រជុំគណៈកម្មាធិការសុខភាព និងសុវត្ថិភាពការងារ (HS Committee) ប្រចាំខែ។",
    "dutiesEn": "1. WORKPLACE SAFETY & FIRE PROTECTION\n- Conduct daily inspections of fire extinguishers, exit pathways, emergency lighting, and alarm systems.\n- Enforce mandatory PPE usage (mesh gloves, eye shields, dust masks) across high-risk machinery zones.\n- Coordinate bi-annual factory evacuation and fire-fighting drills in partnership with local fire authorities.\n\n2. CHEMICAL SAFETY & ENVIRONMENTAL MANAGEMENT\n- Inspect chemical storehouses, secondary containment, and ensure bilingual Safety Data Sheets (SDS/MSDS) are posted.\n- Monitor wastewater treatment plant discharge quality against ZDHC wastewater guidelines.\n- Maintain accurate records of dangerous material storage, water consumption, and solid waste disposal.\n\n3. ACCIDENT INVESTIGATION & STATUTORY NOTIFICATIONS\n- Investigate all workplace injuries and near-misses immediately, determining root causes and corrective actions.\n- Submit required incident declarations to NSSF and the Department of Occupational Safety & Health.\n- Convene monthly Occupational Safety and Health (OSH) committee meetings with worker representatives.",
    "authoritiesKh": "មានសិទ្ធិបញ្ឈប់ម៉ាស៊ីន ឬផ្អាកការងារដែលប្រឈមនឹងគ្រោះថ្នាក់ធ្ងន់ធ្ងរភ្លាមៗ និងស្នើសុំទណ្ឌកម្មចំពោះការមិនពាក់ PPE។",
    "authoritiesEn": "Authority to immediately halt hazardous machinery or unsafe operations, and enforce disciplinary citations for non-compliance with PPE rules.",
    "qualificationsKh": "បរិញ្ញាបត្រ ឬសញ្ញាបត្របច្ចេកទេសផ្នែកវិស្វកម្មបរិស្ថាន សុវត្ថិភាពការងារ ឬជំនាញពាក់ព័ន្ធ។ បានឆ្លងកាត់វគ្គបណ្តុះបណ្តាល OSH ផ្លូវការ។ បទពិសោធន៍ការងារយ៉ាងតិច ២ ឆ្នាំក្នុងរោងចក្រកាត់ដេរ។",
    "qualificationsEn": "Degree or Technical Diploma in Environmental Engineering, Industrial Safety, or related discipline. Certified OSH training. Minimum 2 years EHS experience in apparel manufacturing.",
    "workingConditionsKh": "ចុះត្រួតពិនិត្យផ្ទាល់លើខ្សែសង្វាក់ផលិតកម្ម បន្ទប់ឡចំហាយ ឃ្លាំងគីមី និងប្រព័ន្ធទឹកសំណល់។",
    "workingConditionsEn": "Dynamic industrial floor presence, utility plants, boiler rooms, and chemical storehouses.",
    "kpisKh": "អត្រាគ្មានគ្រោះថ្នាក់ការងារធ្ងន់ធ្ងរ (Zero Major Incidents), ការត្រួតពិនិត្យសុវត្ថិភាព 100% តាមកាលវិភាគ, គុណភាពទឹកសំណល់ឆ្លងកាត់ ZDHC 100%។",
    "kpisEn": "Zero major lost-time injuries, 100% completion of planned safety inspections, 100% compliance with ZDHC wastewater discharge limits.",
    "revisions": [
      {
        "rev": "01",
        "date": "10-11-2023",
        "summary": "បង្កើតសេចក្តីពិពណ៌នាមុខតំណែងដំបូង",
        "authorizedBy": "General Manager"
      },
      {
        "rev": "02",
        "date": "11-11-2024",
        "summary": "ធ្វើបច្ចុប្បន្នភាពតាមស្តង់ដា ISO 45001 & ZDHC",
        "authorizedBy": "General Manager"
      }
    ]
  },
  {
    "id": "jd-05",
    "code": "JD-PRD-005",
    "edition": "02",
    "pageInfo": "Page 1 of 2",
    "effectiveDate": "11-11-2024",
    "amendDate": "10-10-2025",
    "department": "PRODUCTION",
    "departmentKh": "ផ្នែកផលិតកម្ម (Production Management)",
    "jobTitleKh": "ប្រធានផ្នែកផលិតកម្ម",
    "jobTitleEn": "Production Manager",
    "jobTitleCn": "生产经理",
    "gradeLevel": "Manager / M2",
    "reportsToKh": "នាយកគ្រប់គ្រងទូទៅ (General Manager)",
    "reportsToEn": "General Manager",
    "supervisesKh": "ប្រធានផ្នែកកាត់ដេរ, ប្រធានផ្នែកកាត់, ប្រធានផ្នែកអ៊ុត-វេចខ្ចប់, ប្រធានខ្សែសង្វាក់ (Line Leaders)",
    "supervisesEn": "Sewing Supervisors, Cutting Supervisors, Finishing/Packing Supervisors, Line Leaders",
    "companyName": "G.S.textileGarment(Cambodia) co.,Ltd",
    "preparedBy": "Mr. CHAN PHEARUM",
    "preparedRole": "ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager",
    "verifiedBy": "Mr. LEANG SOPHEA",
    "verifiedRole": "ប្រធានផ្នែកសវនកម្ម Compliance Manager",
    "approvedBy": "Mr. CHEN LANMAO",
    "approvedRole": "នាយកក្រុមហ៊ុន General Manager",
    "jobSummaryKh": "រៀបចំផែនការ ដឹកនាំ និងគ្រប់គ្រងរាល់ដំណើរការផលិតកម្មកាត់ដេរ ចាប់ពីការកាត់ ផ្គុំដេរ រហូតដល់ការអ៊ុតវេចខ្ចប់ ឱ្យសម្រេចបានតាមគោលដៅបរិមាណ គុណភាព ការកំណត់ពេល និងប្រសិទ្ធភាពថ្លៃដើម។",
    "jobSummaryEn": "Plan, direct, and coordinate garment manufacturing workflows from fabric cutting, sewing assembly, through finishing and packaging, meeting daily output targets, quality benchmarks, delivery deadlines, and cost efficiency.",
    "dutiesKh": "១. ការរៀបចំផែនការផលិតកម្ម PRODUCTION PLANNING & TARGETS\n- រៀបចំកាលវិភាគផលិតកម្មប្រចាំថ្ងៃ ប្រចាំសប្តាហ៍ និងប្រចាំខែឱ្យស្របតាមការបញ្ជាទិញរបស់ភ្ញៀវ។\n- បែងចែកទិន្នផល និងតុល្យភាពខ្សែសង្វាក់ផលិតកម្ម (Line Balancing) ដើម្បីបង្កើនប្រសិទ្ធភាពការងារ។\n- តាមដានទិន្នផលជាក់ស្តែងប្រចាំម៉ោង (Hourly Output Tracking) និងដោះស្រាយបញ្ហារាំងស្ទះភ្លាមៗ។\n\n២. ការគ្រប់គ្រងប្រសិទ្ធភាព និងគុណភាព EFFICIENCY & QUALITY CONTROL\n- សហការយ៉ាងជិតស្និទ្ធជាមួយផ្នែក QA/QC ដើម្បីធានាថាទំនិញផលិតមានគុណភាពត្រឹមត្រូវតាមគំរូស្តង់ដា។\n- កាត់បន្ថយអត្រាកែសម្រួលឡើងវិញ (Rework/Defect Rate) ឱ្យនៅក្រោមកម្រិតកំណត់។\n- អនុវត្តវិធីសាស្ត្រ Lean Manufacturing ដើម្បីលុបបំបាត់ការខ្ជះខ្ជាយពេលវេលា និងសម្ភារ។\n\n៣. ការគ្រប់គ្រងកម្លាំងពលកម្ម និងសុវត្ថិភាព WORKFORCE & COMPLIANCE\n- គ្រប់គ្រងវិន័យ និងការបែងចែកកម្លាំងពលកម្មតាមខ្សែសង្វាក់នីមួយៗឱ្យមានប្រសិទ្ធភាពខ្ពស់។\n- ធានាថាកម្មករនិយោជិតទាំងអស់គោរពតាមវិធានការសុវត្ថិភាព និងមិនបង្ខិតបង្ខំការធ្វើការថែមម៉ោង។\n- សហការជាមួយផ្នែក HR ក្នុងការបណ្តុះបណ្តាលពង្រឹងជំនាញកម្មករថ្មី។",
    "dutiesEn": "1. PRODUCTION SCHEDULING & CAPACITY EXECUTION\n- Formulate daily, weekly, and monthly manufacturing schedules aligned with buyer delivery commitments.\n- Balance production lines (Line Balancing) to optimize workstation capacity and minimize idle cycle times.\n- Monitor hourly output metrics on visual dashboard boards, resolving technical bottlenecks swiftly.\n\n2. LEAN PRODUCTIVITY & DEFECT REDUCTION\n- Coordinate closely with Quality teams to guarantee first-time-right garment manufacturing per approved tech packs.\n- Drive continuous improvement to keep production defect and rework rates strictly below KPI thresholds.\n- Champion 5S and Lean Manufacturing principles to eliminate process waste and maximize labor efficiency.\n\n3. WORKFORCE MANAGEMENT & LABOR STANDARD RESPECT\n- Maintain line discipline and balance worker allocations across sewing sections effectively.\n- Strictly adhere to legal working hour limits and ensure all overtime work is strictly voluntary.\n- Partner with HR to implement on-the-job training modules for newly onboarded sewing operators.",
    "authoritiesKh": "មានសិទ្ធិកំណត់ការបែងចែកកម្លាំងពលកម្មតាមខ្សែសង្វាក់ ស្នើសុំម៉ោងធ្វើការថែម (OT) ស្របច្បាប់ និងស្នើសុំការថែទាំជួសជុលម៉ាស៊ីនជាបន្ទាន់។",
    "authoritiesEn": "Authority to allocate manpower across lines, request authorized voluntary overtime, and command priority maintenance support for production machinery.",
    "qualificationsKh": "បរិញ្ញាបត្រផ្នែកគ្រប់គ្រងឧស្សាហកម្ម កាត់ដេរ ឬជំនាញប្រហាក់ប្រហែល។ បទពិសោធន៍គ្រប់គ្រងផលិតកម្មកាត់ដេរយ៉ាងតិច ៧ ឆ្នាំ។ ចំណេះដឹងស៊ីជម្រៅលើ Line Balancing, IE, Lean។ ចេះភាសាអង់គ្លេស ឬចិន។",
    "qualificationsEn": "Bachelor's Degree in Industrial Engineering, Garment Technology, or related discipline. Minimum 7 years apparel manufacturing management experience. Proficient in Line Balancing and Lean. English/Chinese proficiency.",
    "workingConditionsKh": "បំពេញការងារលើរោងជាងផលិតកម្ម (Production Floor)។",
    "workingConditionsEn": "Manufacturing floor environment with frequent line walking and active floor leadership.",
    "kpisKh": "ទិន្នផលសម្រេចបាន >= 95% នៃផែនការ, ប្រសិទ្ធភាពខ្សែសង្វាក់ (Efficiency) >= 75%, អត្រាទំនិញខូច (Defect Rate) <= 2%, ការប្រគល់ទំនិញទាន់ពេល 100%។",
    "kpisEn": "Output fulfillment >= 95%, Line efficiency >= 75%, Production defect rate <= 2%, 100% on-time shipment handover.",
    "revisions": [
      {
        "rev": "01",
        "date": "10-11-2023",
        "summary": "បង្កើតសេចក្តីពិពណ៌នាមុខតំណែងដំបូង",
        "authorizedBy": "General Manager"
      },
      {
        "rev": "02",
        "date": "11-11-2024",
        "summary": "ធ្វើបច្ចុប្បន្នភាពតាមគោលដៅផលិតកម្មថ្មី",
        "authorizedBy": "General Manager"
      }
    ]
  },
  {
    "id": "jd-06",
    "code": "JD-QAC-006",
    "edition": "02",
    "pageInfo": "Page 1 of 2",
    "effectiveDate": "11-11-2024",
    "amendDate": "10-10-2025",
    "department": "QUALITY",
    "departmentKh": "ផ្នែកធានា និងត្រួតពិនិត្យគុណភាព (QA & QC)",
    "jobTitleKh": "ប្រធានផ្នែកធានា និងត្រួតពិនិត្យគុណភាព",
    "jobTitleEn": "Quality Assurance & Quality Control (QA/QC) Manager",
    "jobTitleCn": "品控经理",
    "gradeLevel": "Manager / M2",
    "reportsToKh": "នាយកគ្រប់គ្រងទូទៅ (General Manager)",
    "reportsToEn": "General Manager",
    "supervisesKh": "QA Supervisors, QC Inspectors (Incoming, Inline, Endline, Final/AQL)",
    "supervisesEn": "QA Supervisors, QC Inspectors (Incoming, Inline, Endline, Final/AQL)",
    "companyName": "G.S.textileGarment(Cambodia) co.,Ltd",
    "preparedBy": "Mr. CHAN PHEARUM",
    "preparedRole": "ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager",
    "verifiedBy": "Mr. LEANG SOPHEA",
    "verifiedRole": "ប្រធានផ្នែកសវនកម្ម Compliance Manager",
    "approvedBy": "Mr. CHEN LANMAO",
    "approvedRole": "នាយកក្រុមហ៊ុន General Manager",
    "jobSummaryKh": "បង្កើត អនុវត្ត និងគ្រប់គ្រងប្រព័ន្ធធានាគុណភាព (QA System) និងនីតិវិធីត្រួតពិនិត្យគុណភាព (QC Procedures) លើគ្រប់ដំណាក់កាលផលិតកម្ម ដើម្បីធានាថាទំនិញសម្រេចឆ្លើយតប ១០០% តាមលក្ខណៈបច្ចេកទេស និងស្តង់ដាអតិថិជន (AQL 1.5/2.5/4.0)។",
    "jobSummaryEn": "Establish, implement, and maintain total quality assurance systems and inspection protocols across all manufacturing phases, ensuring final garments strictly fulfill buyer technical specifications and AQL benchmarks (AQL 1.5/2.5).",
    "dutiesKh": "១. ការគ្រប់គ្រងប្រព័ន្ធគុណភាព QUALITY ASSURANCE SYSTEM\n- បង្កើត និងធ្វើបច្ចុប្បន្នភាពសៀវភៅណែនាំគុណភាព (Quality Manual) និង SOP ត្រួតពិនិត្យគុណភាព។\n- ដឹកនាំកិច្ចប្រជុំ Pre-Production Meeting (PPM) មុនពេលចាប់ផ្តើមដំណើរការម៉ូដទំនិញថ្មី។\n- ពិនិត្យបញ្ជាក់ទម្រង់គំរូទំនិញ (Size Set, Golden Sample, Counter Sample) ជាមួយអ្នកបញ្ជាទិញ។\n\n២. ការត្រួតពិនិត្យគ្រប់ដំណាក់កាល INSPECTION ACROSS WORKFLOW\n- ត្រួតពិនិត្យគុណភាពក្រណាត់ និងគ្រឿងបន្លាស់ដែលនាំចូល (Incoming Fabric & Trim Inspection)។\n- ដឹកនាំការត្រួតពិនិត្យ Inline QC, Endline QC និង Final Inspection តាមកម្រិត AQL ស្តង់ដា។\n- ត្រួតពិនិត្យដំណើរការទាញរកម្ជុលបាក់ និងឧបករណ៍ស្កេនលោហធាតុ (Needle Detection System)។\n\n៣. ការវិភាគទិន្នន័យ និងការកែលម្អគុណភាព DATA ANALYSIS & CAP\n- វិភាគរបាយការណ៍គុណភាពប្រចាំថ្ងៃ និងកំណត់ប្រភពនៃបញ្ហា (Root Cause Analysis - RCA)។\n- ចេញរបាយការណ៍មិនអនុលោម (Non-Conformance Report - NCR) និងតាមដានការកែតម្រូវ។\n- ធ្វើការសហការជាមួយសវនករត្រួតពិនិត្យគុណភាពរបស់អ្នកបញ្ជាទិញ (Buyer Third-Party QA/Auditors)។",
    "dutiesEn": "1. QUALITY GOVERNANCE & PRE-PRODUCTION RIGOR\n- Develop and maintain factory Quality SOPs, defect classification manuals, and calibration schedules.\n- Convene mandatory Pre-Production Meetings (PPM) prior to bulk cutting, establishing critical quality checkpoints.\n- Verify production Golden Samples and technical measurement sheets against buyer-approved specifications.\n\n2. MULTI-STAGE INSPECTION OVERSIGHT\n- Direct incoming raw material testing, 4-point fabric inspection, and trim compliance audits.\n- Lead inline roaming QC audits, end-of-line checking, and internal pre-final audits based on AQL 1.5/2.5 criteria.\n- Enforce calibration and daily testing protocols for needle detectors and metal detection equipment.\n\n3. DEFECT ROOT-CAUSE ANALYSIS & BUYER LIAISON\n- Compile daily defect frequency metrics, executing Root Cause Analysis (RCA) and preventive action plans.\n- Issue Non-Conformance Reports (NCR) for defective batches and mandate immediate rework supervision.\n- Interface with external buyer QA auditors to ensure smooth final inspection sign-offs and ship authorization.",
    "authoritiesKh": "មានសិទ្ធិបដិសេធមិនទទួលក្រណាត់ឬគ្រឿងបន្លាស់ដែលគ្មានគុណភាព ផ្អាកខ្សែសង្វាក់ផលិតកម្មដែលមានអត្រាខូចខ្ពស់ និងផ្អាកការវេចខ្ចប់ទំនិញដែលមិនទាន់ឆ្លងកាត់ការត្រួតពិនិត្យ។",
    "authoritiesEn": "Authority to reject non-conforming raw materials, halt production lines exceeding defect limits, and withhold shipment clearance for uninspected or failed lots.",
    "qualificationsKh": "បរិញ្ញាបត្រផ្នែកវិស្វកម្មវាយនភណ្ឌ គ្រប់គ្រងគុណភាព ឬជំនាញប្រហាក់ប្រហែល។ បទពិសោធន៍គ្រប់គ្រង QA/QC ក្នុងរោងចក្រកាត់ដេរយ៉ាងតិច ៦ ឆ្នាំ។ ចំណេះដឹងស៊ីជម្រៅលើ AQL, ISO 9001, Garment Construction។ ភាសាអង់គ្លេសស្ទាត់ជំនាញ។",
    "qualificationsEn": "Degree in Textile Engineering, Quality Management, or related field. Minimum 6 years QA/QC leadership in apparel manufacturing. Deep mastery of AQL sampling, ISO 9001, and garment technical design. Fluent English.",
    "workingConditionsKh": "រោងជាងផលិតកម្ម បន្ទប់ពិសោធន៍គុណភាព (QA Lab) និងបន្ទប់ត្រួតពិនិត្យសម្រេច។",
    "workingConditionsEn": "Manufacturing floors, on-site testing laboratories, and finished goods audit areas.",
    "kpisKh": "អត្រាជាប់ត្រួតពិនិត្យចុងក្រោយ First-Time Pass Rate >= 98%, អត្រាទំនិញត្រឡប់មកវិញ Customer Return = 0%, ការអនុវត្ត 100% លើការស្កេនម្ជុលបាក់។",
    "kpisEn": "First-time final inspection pass rate >= 98%, Customer quality claims/returns = 0%, 100% compliance with broken needle search protocols.",
    "revisions": [
      {
        "rev": "01",
        "date": "10-11-2023",
        "summary": "បង្កើតសេចក្តីពិពណ៌នាមុខតំណែងដំបូង",
        "authorizedBy": "General Manager"
      },
      {
        "rev": "02",
        "date": "11-11-2024",
        "summary": "ធ្វើបច្ចុប្បន្នភាពតាមស្តង់ដា AQL 2024",
        "authorizedBy": "General Manager"
      }
    ]
  },
  {
    "id": "jd-07",
    "code": "JD-REC-007",
    "edition": "02",
    "pageInfo": "Page 1 of 2",
    "effectiveDate": "11-11-2024",
    "amendDate": "10-10-2025",
    "department": "HR_ADMIN",
    "departmentKh": "ផ្នែករដ្ឋបាល និងធនធានមនុស្ស (HR & Admin)",
    "jobTitleKh": "មន្ត្រីជ្រើសរើស និងទំនាក់ទំនងបុគ្គលិក",
    "jobTitleEn": "Recruitment & Employee Relations Officer",
    "jobTitleCn": "招聘与员工关系专员",
    "gradeLevel": "Officer / L3",
    "reportsToKh": "ប្រធានផ្នែករដ្ឋបាល និងធនធានមនុស្ស (HR & Admin Manager)",
    "reportsToEn": "HR & Admin Manager",
    "supervisesKh": "ជំនួយការជ្រើសរើសបុគ្គលិក (Recruitment Assistants)",
    "supervisesEn": "Recruitment Assistants",
    "companyName": "G.S.textileGarment(Cambodia) co.,Ltd",
    "preparedBy": "Mr. CHAN PHEARUM",
    "preparedRole": "ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager",
    "verifiedBy": "Mr. LEANG SOPHEA",
    "verifiedRole": "ប្រធានផ្នែកសវនកម្ម Compliance Manager",
    "approvedBy": "Mr. CHEN LANMAO",
    "approvedRole": "នាយកក្រុមហ៊ុន General Manager",
    "jobSummaryKh": "ទទួលបន្ទុកអនុវត្តដំណើរការជ្រើសរើសបុគ្គលិក ការត្រួតពិនិត្យផ្ទៀងផ្ទាត់អាយុស្របច្បាប់ ការរៀបចំកិច្ចសន្យាការងារ ការតម្រង់ទិសបុគ្គលិកថ្មី និងការសម្របសម្រួលទំនាក់ទំនងល្អរវាងនិយោជកនិងកម្មករនិយោជិត។",
    "jobSummaryEn": "Administer end-to-end recruitment pipelines, strict age verification, employment contract execution, new employee orientation, and facilitate constructive labor-management relations in adherence to factory policies.",
    "dutiesKh": "១. ដំណើរការជ្រើសរើស និងផ្ទៀងផ្ទាត់អាយុ RECRUITMENT & AGE SCREENING\n- ផ្សព្វផ្សាយដំណឹងជ្រើសរើសបុគ្គលិកតាមគ្រប់មធ្យោបាយ និងសម្របសម្រួលការសម្ភាសន៍។\n- ត្រួតពិនិត្យយ៉ាងម៉ឺងម៉ាត់នូវឯកសារបញ្ជាក់អាយុ (អត្តសញ្ញាណប័ណ្ណ សៀវភៅគ្រួសារ សំបុត្រកំណើត) ដើម្បីទប់ស្កាត់ពលកម្មកុមារ ១០០%។\n- ប្រគល់ឯកសារដើមជូនបេក្ខជនវិញភ្លាមៗបន្ទាប់ពីផ្ទៀងផ្ទាត់រួច តាមគោលការណ៍ SP034។\n\n២. កិច្ចសន្យាការងារ និងការតម្រង់ទិស CONTRACTS & ONBOARDING\n- រៀបចំកិច្ចសន្យាការងារ និងពន្យល់លក្ខខណ្ឌការងារ ប្រាក់ឈ្នួល និងអត្ថប្រយោជន៍ដល់បុគ្គលិកថ្មី។\n- ដឹកនាំវគ្គតម្រង់ទិស (Orientation - SP071) ស្តីពីបទបញ្ជាផ្ទៃក្នុង សិទ្ធិការងារ សុវត្ថិភាព និងបណ្តាញបណ្តឹងតវ៉ា។\n- រៀបចំសំណុំឯកសារផ្ទាល់ខ្លួនរបស់បុគ្គលិក (Personnel Files) ឱ្យបានត្រឹមត្រូវ និងមានសុវត្ថិភាព។\n\n៣. ទំនាក់ទំនងបុគ្គលិក និងសុខុមាលភាព EMPLOYEE RELATIONS & WELFARE\n- ទទួល និងកត់ត្រាបណ្តឹងតវ៉ា សំណើ និងមតិយោបល់របស់បុគ្គលិកបញ្ជូនទៅថ្នាក់លើដោះស្រាយ។\n- សម្របសម្រួលសកម្មភាពលើកទឹកចិត្តបុគ្គលិក កម្មវិធីបុណ្យជាតិ និងការផ្តល់អត្ថប្រយោជន៍សុខុមាលភាព។",
    "dutiesEn": "1. RECRUITMENT OPERATIONS & ROBUST AGE VERIFICATION\n- Post vacancies across public channels and conduct preliminary screening interviews.\n- Strictly authenticate original proof-of-age documents (National ID, Family Book, Birth Certificate) ensuring 0% child labor.\n- Return original personal identity documents to applicants immediately post-verification per SP034.\n\n2. EMPLOYMENT CONTRACTING & ONBOARDING ORIENTATION\n- Prepare statutory employment contracts and thoroughly explain wage structures, benefits, and rules to new hires.\n- Conduct mandatory new worker orientation sessions covering factory regulations, labor rights, and grievance channels.\n- Maintain compliant, organized, and confidential employee personnel profiles in physical and digital formats.\n\n3. WORKER ENGAGEMENT & RETENTION ADVOCACY\n- Register worker feedback, suggestions, and grievances, tracking resolutions in close liaison with HR management.\n- Coordinate worker engagement events, welfare initiatives, maternal benefits support, and festive allowances.",
    "authoritiesKh": "មានសិទ្ធិបដិសេធភ្លាមៗចំពោះបេក្ខជនដែលមិនគ្រប់អាយុ ឬមានឯកសារក្លែងបន្លំ និងស្នើសុំបញ្ជីឈ្មោះបុគ្គលិកថ្មីទៅកាន់ប្រធានផ្នែក។",
    "authoritiesEn": "Authority to reject underage or falsified applications immediately, and endorse qualified candidates for departmental interview sign-offs.",
    "qualificationsKh": "បរិញ្ញាបត្រផ្នែកគ្រប់គ្រងធនធានមនុស្ស ច្បាប់ ឬទស្សនវិជ្ជាសង្គម។ បទពិសោធន៍ជ្រើសរើសបុគ្គលិករោងចក្រយ៉ាងតិច ២ ឆ្នាំ។ យល់ដឹងច្បាស់ពីនីតិវិធីផ្ទៀងផ្ទាត់អត្តសញ្ញាណ និងច្បាប់ការងារ។ ភាសាអង់គ្លេសមធ្យម។",
    "qualificationsEn": "Bachelor's Degree in HR, Law, or Social Sciences. Minimum 2 years factory recruitment experience. Proficient in identity verification and labor law guidelines. Working English.",
    "workingConditionsKh": "ការិយាល័យជ្រើសរើសបុគ្គលិក និងរោងជាងផលិតកម្ម។",
    "workingConditionsEn": "Recruitment office and factory onboarding zones.",
    "kpisKh": "គ្មានករណីពលកម្មកុមារដាច់ខាត (Zero Underage Hiring), 100% បុគ្គលិកថ្មីឆ្លងកាត់ការតម្រង់ទិស, សំណុំឯកសារបុគ្គលិកពេញលេញ 100%។",
    "kpisEn": "Zero child labor incidents, 100% new hires complete certified orientation, 100% complete personnel files.",
    "revisions": [
      {
        "rev": "01",
        "date": "10-11-2023",
        "summary": "បង្កើតសេចក្តីពិពណ៌នាមុខតំណែងដំបូង",
        "authorizedBy": "HR Manager"
      }
    ]
  },
  {
    "id": "jd-08",
    "code": "JD-PAY-008",
    "edition": "02",
    "pageInfo": "Page 1 of 2",
    "effectiveDate": "11-11-2024",
    "amendDate": "10-10-2025",
    "department": "HR_ADMIN",
    "departmentKh": "ផ្នែករដ្ឋបាល និងធនធានមនុស្ស (HR & Admin)",
    "jobTitleKh": "មន្ត្រីជំនាញគណនាប្រាក់បៀវត្សរ៍ និងពន្ធ",
    "jobTitleEn": "Payroll & Compensation Specialist",
    "jobTitleCn": "薪酬福利专员",
    "gradeLevel": "Officer / L3",
    "reportsToKh": "ប្រធានផ្នែករដ្ឋបាល និងធនធានមនុស្ស (HR & Admin Manager)",
    "reportsToEn": "HR & Admin Manager",
    "supervisesKh": "ជំនួយការកត់ត្រាវត្តមាន (Attendance Clerks)",
    "supervisesEn": "Attendance Clerks",
    "companyName": "G.S.textileGarment(Cambodia) co.,Ltd",
    "preparedBy": "Mr. CHAN PHEARUM",
    "preparedRole": "ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager",
    "verifiedBy": "Mr. LEANG SOPHEA",
    "verifiedRole": "ប្រធានផ្នែកសវនកម្ម Compliance Manager",
    "approvedBy": "Mr. CHEN LANMAO",
    "approvedRole": "នាយកក្រុមហ៊ុន General Manager",
    "jobSummaryKh": "ទទួលខុសត្រូវលើការទាញយកទិន្នន័យវត្តមាន គណនាប្រាក់បៀវត្សរ៍ ប្រាក់ថែមម៉ោង ប្រាក់អតីតភាពការងារ ប្រាក់រង្វាន់ និងកាត់កងវិភាគទាន ប.ស.ស. ព្រមទាំងពន្ធលើប្រាក់បៀវត្សរ៍ ឱ្យស្របតាមច្បាប់ និងទាន់ពេលវេលា។",
    "jobSummaryEn": "Responsible for managing biometric attendance tracking, accurate calculation of base salaries, voluntary overtime, seniority indemnities, attendance bonuses, NSSF contributions, and salary taxes in strict compliance with Cambodian legal codes.",
    "dutiesKh": "១. ការគ្រប់គ្រងវត្តមាន និងម៉ោងថែម ATTENDANCE & OT COMPUTATION\n- ត្រួតពិនិត្យទិន្នន័យស្កេនមេដៃប្រចាំថ្ងៃ និងផ្ទៀងផ្ទាត់ច្បាប់ឈប់សម្រាកដែលមានការអនុម័តត្រឹមត្រូវ។\n- គណនាប្រាក់ថែមម៉ោង (OT) តាមអត្រាច្បាប់កំណត់ (១.៥ ដងថ្ងៃធម្មតា, ២.០ ដងថ្ងៃអាទិត្យ/បុណ្យ, ប្រាក់បន្ថែមវេនយប់)។\n- ធានាថាម៉ោងថែមមិនលើសពី ២ ម៉ោងក្នុងមួយថ្ងៃ និងមានការព្រមព្រៀងស្ម័គ្រចិត្តពីកម្មករនិយោជិត។\n\n២. ការគណនាប្រាក់បៀវត្សរ៍ និងអត្ថប្រយោជន៍ PAYROLL DISBURSEMENT\n- គណនាប្រាក់បៀវត្សរ៍គោល ប្រាក់រង្វាន់ទៀងទាត់ ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ/ស្នាក់នៅ និងប្រាក់អតីតភាព។\n- គណនា និងកាត់កងវិភាគទាន ប.ស.ស. (ផ្នែកថែទាំសុខភាព ហានិភ័យការងារ និងប្រាក់សោធន)។\n- គណនា និងកាត់ទុកពន្ធលើប្រាក់បៀវត្សរ៍ (Salary Tax) ជូនអគ្គនាយកដ្ឋានពន្ធដារ (GDT)។\n\n៣. ការផ្តល់ប័ណ្ណបើកប្រាក់ និងដោះស្រាយចម្ងល់ PAYSLIPS & TRANSPARENCY\n- ចែកចាយប័ណ្ណបើកប្រាក់បៀវត្សរ៍ (Pay Slip) ជូនកម្មករនិយោជិតម្នាក់ៗយ៉ាងតិច ២ ថ្ងៃមុនថ្ងៃបើកប្រាក់។\n- ទទួល និងដោះស្រាយរាល់ចម្ងល់ ឬការតវ៉ាទាក់ទងនឹងការគណនាប្រាក់បៀវត្សរ៍ឱ្យបានឆាប់រហ័ស។",
    "dutiesEn": "1. TIME RECORDING & ACCURATE OVERTIME AUDIT\n- Extract and audit biometric attendance logs daily, cross-referencing approved leave requests.\n- Compute statutory overtime premiums (1.5x regular, 2.0x Sundays/holidays, night-shift allowances) accurately.\n- Monitor legal overtime thresholds to ensure hours do not exceed 2 hours/day with verified voluntary worker consent.\n\n2. COMPREHENSIVE PAYROLL RUN & DEDUCTIONS\n- Compute gross pay, attendance allowances, transportation/housing bonuses, and bi-annual seniority indemnities.\n- Calculate and remit statutory NSSF contributions (Health Care, Occupational Risk, Pension Scheme).\n- Deduct and file applicable monthly Withholding Tax on Salaries with the General Department of Taxation (GDT).\n\n3. PAY SLIP DISTRIBUTION & INQUIRY RESOLUTION\n- Issue individualized transparent pay slips to every worker at least 2 days prior to bank disbursement.\n- Clarify pay slip line items and address wage inquiries transparently and promptly.",
    "authoritiesKh": "មានសិទ្ធិកែតម្រូវទិន្នន័យវត្តមានដែលមានលិខិតអនុញ្ញាតត្រឹមត្រូវ និងស្នើសុំការទូទាត់ប្រាក់បៀវត្សរ៍ប្រចាំខែទៅកាន់គណៈគ្រប់គ្រង។",
    "authoritiesEn": "Authority to reconcile approved attendance anomalies and submit finalized payroll registers for executive disbursement clearance.",
    "qualificationsKh": "បរិញ្ញាបត្រផ្នែកគណនេយ្យ ហិរញ្ញវត្ថុ ឬធនធានមនុស្ស។ បទពិសោធន៍គណនាប្រាក់បៀវត្សរ៍រោងចក្រយ៉ាងតិច ៣ ឆ្នាំ។ ស្ទាត់ជំនាញ Microsoft Excel កម្រិតខ្ពស់ និងប្រព័ន្ធ HRM Payroll Software។",
    "qualificationsEn": "Bachelor's Degree in Accounting, Finance, or HR. Minimum 3 years manufacturing payroll experience. Advanced Excel modeling and proficiency with enterprise HRIS/Payroll systems.",
    "workingConditionsKh": "ការិយាល័យរដ្ឋបាល និងហិរញ្ញវត្ថុ។",
    "workingConditionsEn": "Finance and HR office setting.",
    "kpisKh": "បើកប្រាក់បៀវត្សរ៍ទាន់ពេលវេលា ១០០%, អត្រាកំហុសគណនា 0%, គ្មានការពិន័យពន្ធ ឬ ប.ស.ស.។",
    "kpisEn": "100% on-time payroll delivery, Zero payroll calculation variances, Zero late penalties from Tax/NSSF agencies.",
    "revisions": [
      {
        "rev": "01",
        "date": "10-11-2023",
        "summary": "បង្កើតសេចក្តីពិពណ៌នាមុខតំណែងដំបូង",
        "authorizedBy": "HR Manager"
      }
    ]
  },
  {
    "id": "jd-09",
    "code": "JD-LIN-009",
    "edition": "02",
    "pageInfo": "Page 1 of 2",
    "effectiveDate": "11-11-2024",
    "amendDate": "10-10-2025",
    "department": "PRODUCTION",
    "departmentKh": "ផ្នែកផលិតកម្ម (Production Management)",
    "jobTitleKh": "ប្រធានខ្សែសង្វាក់ផលិតកម្ម/កាត់ដេរ",
    "jobTitleEn": "Production Sewing Line Leader",
    "jobTitleCn": "缝纫产线组长",
    "gradeLevel": "Supervisor / S1",
    "reportsToKh": "ប្រធានផ្នែកកាត់ដេរ (Sewing Supervisor) / Production Manager",
    "reportsToEn": "Sewing Supervisor / Production Manager",
    "supervisesKh": "កម្មករ/កម្មការិនីដេរក្នុងខ្សែសង្វាក់ (Sewing Operators, Ironers, Line Helpers)",
    "supervisesEn": "Sewing Operators, In-line Ironers, Line Helpers",
    "companyName": "G.S.textileGarment(Cambodia) co.,Ltd",
    "preparedBy": "Mr. CHAN PHEARUM",
    "preparedRole": "ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager",
    "verifiedBy": "Mr. LEANG SOPHEA",
    "verifiedRole": "ប្រធានផ្នែកសវនកម្ម Compliance Manager",
    "approvedBy": "Mr. CHEN LANMAO",
    "approvedRole": "នាយកក្រុមហ៊ុន General Manager",
    "jobSummaryKh": "ដឹកនាំ និងគ្រប់គ្រងប្រតិបត្តិការដេរជាក់ស្តែងក្នុងខ្សែសង្វាក់ផលិតកម្ម បែងចែកការងារតាមជំនាញ រៀបចំតុល្យភាពការងារ ធានាទិន្នផលប្រចាំម៉ោង គុណភាពទំនិញ និងសុវត្ថិភាពការងាររបស់កម្មករ។",
    "jobSummaryEn": "Lead shop-floor sewing line operations, assign tasks by worker skill proficiency, balance line flow, achieve hourly output targets, enforce garment quality standards, and ensure operator workplace safety.",
    "dutiesKh": "១. ការគ្រប់គ្រងទិន្នផល និងតុល្យភាពសង្វាក់ HOURLY OUTPUT & LINE BALANCING\n- បែងចែកមុខការងារដេរដល់កម្មករតាមកម្រិតជំនាញ និងសម្រួលការហូរនៃផលិតផលលើខ្សែសង្វាក់។\n- តាមដាន និងកត់ត្រាទិន្នផលសម្រេចបានប្រចាំម៉ោងលើក្តារព័ត៌មាន (Hourly Target Board)។\n- ដោះស្រាយបញ្ហារាំងស្ទះនៃការដេរ (Bottle-necks) ឱ្យបានទាន់ពេលវេលាដើម្បីកុំឱ្យខាតម៉ោង។\n\n២. ការធានាគុណភាពកាត់ដេរ SEWING QUALITY ENFORCEMENT\n- ណែនាំកម្មករឱ្យយល់ច្បាស់ពីស្តង់ដាដេរ និងចំណុចសំខាន់ៗនៃម៉ូដថ្មី (Technical Specifications)។\n- សហការជាមួយ Inline QC ក្នុងការត្រួតពិនិត្យ និងកែតម្រូវទំនិញខូចភ្លាមៗនៅនឹងកន្លែងដេរ។\n- ធានាថាកម្មករដេរមិនកាត់ចោល ឬលុបបំបាត់ស្លាកសញ្ញាស្តង់ដាឡើយ។\n\n៣. សុវត្ថិភាព និងការថែទាំម៉ាស៊ីន SAFETY & MACHINE CARE\n- ត្រួតពិនិត្យឱ្យកម្មករពាក់ស្រោមដៃដែក និងម៉ាស់ការពារពេលបំពេញការងារតាមវិធានការសុវត្ថិភាព។\n- អនុវត្តនីតិវិធីស្វែងរកម្ជុលបាក់ និងប្តូរម្ជុលថ្មីស្របតាមនីតិវិធីរោងចក្រយ៉ាងតឹងរ៉ឹង។\n- រាយការណ៍ជូនជាងជួសជុលម៉ាស៊ីន (Mechanics) ភ្លាមៗនៅពេលម៉ាស៊ីនដេរមានបញ្ហាបច្ចេកទេស។",
    "dutiesEn": "1. SHOP-FLOOR PRODUCTIVITY & WORKFLOW BALANCING\n- Assign stitching operations based on individual operator skill matrices to maintain balanced workflow.\n- Record hourly output performance on visual tracking boards, flagging production variances immediately.\n- Eliminate sewing bottlenecks rapidly through on-the-spot adjustments and floating operator support.\n\n2. IN-LINE QUALITY CONTROL ADHERENCE\n- Brief line operators on construction specs, stitch density (SPI), and critical quality points of new styles.\n- Collaborate with In-line QC to identify, isolate, and repair stitching flaws immediately at the source.\n- Ensure strict adherence to garment care labels, sizing specs, and trim attachments.\n\n3. WORKER SAFETY & BROKEN NEEDLE DISCIPLINE\n- Mandate operator compliance with safety gear (steel-mesh gloves for cutting, hairnets, dust masks).\n- Strictly enforce the Broken Needle Replacement Procedure, ensuring all broken fragments are accounted for.\n- Alert factory mechanics promptly upon detecting mechanical vibrations, oil leaks, or needle issues.",
    "authoritiesKh": "មានសិទ្ធិកែសម្រួលទីតាំងអង្គុយរបស់កម្មករក្នុងខ្សែសង្វាក់ និងបញ្ឈប់ការដេរជាបណ្តោះអាសន្នប្រសិនបើរកឃើញកំហុសគុណភាពជាបន្តបន្ទាប់។",
    "authoritiesEn": "Authority to reassign operator workstations within the line and pause stitching temporarily upon identifying recurring systemic quality defects.",
    "qualificationsKh": "សញ្ញាបត្រមធ្យមសិក្សា ឬវិញ្ញាបនបត្របច្ចេកទេសកាត់ដេរ។ បទពិសោធន៍ជា Line Leader ឬជាងដេរជាន់ខ្ពស់យ៉ាងតិច ៣ ឆ្នាំ។ ចេះអានប្លង់ដេរ (Tech Pack) និងដោះស្រាយបញ្ហាបច្ចេកទេសដេរ។",
    "qualificationsEn": "High School Diploma or Garment Technical Certificate. Minimum 3 years experience as a Line Leader or Senior Sample Sewer. Skilled in reading technical specification packs.",
    "workingConditionsKh": "រោងជាងផលិតកម្មកាត់ដេរ (Sewing Floor)។",
    "workingConditionsEn": "Manufacturing sewing lines, active on-floor standing and walking.",
    "kpisKh": "សម្រេចទិន្នផលប្រចាំថ្ងៃ >= 95%, អត្រាដេរខូចក្នុងខ្សែសង្វាក់ <= 2%, អនុវត្តនីតិវិធីម្ជុលបាក់បាន 100%។",
    "kpisEn": "Daily target achievement >= 95%, In-line defect rate <= 2%, 100% compliance with broken needle control logs.",
    "revisions": [
      {
        "rev": "01",
        "date": "10-11-2023",
        "summary": "បង្កើតសេចក្តីពិពណ៌នាមុខតំណែងដំបូង",
        "authorizedBy": "Production Manager"
      }
    ]
  },
  {
    "id": "jd-10",
    "code": "JD-QCI-010",
    "edition": "02",
    "pageInfo": "Page 1 of 2",
    "effectiveDate": "11-11-2024",
    "amendDate": "10-10-2025",
    "department": "QUALITY",
    "departmentKh": "ផ្នែកធានា និងត្រួតពិនិត្យគុណភាព (QA & QC)",
    "jobTitleKh": "អ្នកត្រួតពិនិត្យគុណភាពផលិតផល",
    "jobTitleEn": "Quality Control Inspector (Inline / Endline QC)",
    "jobTitleCn": "质检员",
    "gradeLevel": "Staff / L2",
    "reportsToKh": "ប្រធានត្រួតពិនិត្យគុណភាព (QC Supervisor) / QA Manager",
    "reportsToEn": "QC Supervisor / QA Manager",
    "supervisesKh": "គ្មាន (Individual Contributor)",
    "supervisesEn": "None (Individual Contributor)",
    "companyName": "G.S.textileGarment(Cambodia) co.,Ltd",
    "preparedBy": "Mr. CHAN PHEARUM",
    "preparedRole": "ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager",
    "verifiedBy": "Mr. LEANG SOPHEA",
    "verifiedRole": "ប្រធានផ្នែកសវនកម្ម Compliance Manager",
    "approvedBy": "Mr. CHEN LANMAO",
    "approvedRole": "នាយកក្រុមហ៊ុន General Manager",
    "jobSummaryKh": "ទទួលបន្ទុកត្រួតពិនិត្យគុណភាពកាត់ដេរជាក់ស្តែងលើខ្សែសង្វាក់ផលិតកម្ម (Inline) ឬនៅចុងខ្សែសង្វាក់ (Endline) ផ្ទៀងផ្ទាត់ទំហំរង្វាស់រង្វាល់ ស្នាមដេរ និងកំណត់ចំណាំកំហុស ដើម្បីធានាថាទំនិញគ្មានពិការភាព។",
    "jobSummaryEn": "Conduct rigorous physical quality inspections of semi-finished and finished garments along sewing lines (Inline/Endline), verifying measurements, stitch aesthetics, and defect isolation per buyer tech packs.",
    "dutiesKh": "១. ការត្រួតពិនិត្យបច្ចេកទេសដេរ PHYSICAL INSPECTION OF STITCHING\n- ត្រួតពិនិត្យស្នាមដេរ ចំនួនថ្នេរក្នុងមួយអុីញ (SPI), ភាពស្មើគ្នានៃគែមសងខាង និងភាពស្អាតនៃផលិតផល។\n- វាស់វែងទំហំសម្លៀកបំពាក់ (Measurement Check) ធៀបនឹងតារាងទំហំដែលបានអនុម័ត (Spec Sheet)។\n- បិទស្លាកសញ្ញាកំណត់ចំណុចខូច (Defect Sticker) លើផលិតផលដែលមានបញ្ហាដើម្បីឱ្យជាងដេរកែសម្រួល។\n\n២. ការកត់ត្រាទិន្នន័យគុណភាព DEFECT RECORDING & REPORTING\n- កត់ត្រាចំនួនទំនិញដែលបានត្រួតពិនិត្យ ចំនួនទំនិញខូច និងប្រភេទនៃកំហុសលើតារាង QC Check Sheet។\n- គណនាអត្រាខូច (Defect Rate %) រៀងរាល់ ២ ម៉ោងម្តង និងជូនដំណឹងទៅប្រធានខ្សែសង្វាក់។\n- ផ្ទៀងផ្ទាត់ឡើងវិញនូវទំនិញដែលបានកែសម្រួលរួច (Re-inspected Reworks) មុនអនុញ្ញាតឱ្យបញ្ជូនទៅមុខ។\n\n៣. ការថែរក្សាឧបករណ៍ និងស្តង់ដា CALIBRATION & WORKPLACE STANDARDS\n- ថែរក្សាឧបករណ៍វាស់វែង (ម៉ែត្រខ្សែ) ឱ្យមានភាពត្រឹមត្រូវ និងស្អាតជានិច្ច។\n- ធានាថាកន្លែងត្រួតពិនិត្យមានពន្លឺគ្រប់គ្រាន់ (Lighting Lux Standard >= 1000 Lux)។",
    "dutiesEn": "1. STITCH & MEASUREMENT AUDITING\n- Inspect stitching uniformity, tension, SPI (stitches-per-inch), seam puckering, and visual appearance.\n- Conduct precision measurement checks against approved buyer grading and measurement spec sheets.\n- Affix high-visibility defect arrow stickers to flawed garments, sending them for immediate line rework.\n\n2. QC DATA LOGGING & TREND NOTIFICATION\n- Record inspected piece quantities, defect counts, and error classifications on physical/digital QC sheets.\n- Calculate and update defect percentages every 2 hours, alerting the line leader of spikes in errors.\n- Thoroughly re-inspect all rectified rework pieces before clearing them for downstream packing.\n\n3. INSPECTION TOOLS & ILLUMINATION CALIBRATION\n- Verify inspection measuring tapes daily against master metal rulers for tape-stretch calibration.\n- Maintain clean, clutter-free inspection tables under certified high-intensity lighting conditions (>1000 Lux).",
    "authoritiesKh": "មានសិទ្ធិបដិសេធមិនឱ្យទំនិញខូចឆ្លងកាត់ទៅដំណាក់កាលបន្ទាប់ និងតម្រូវឱ្យខ្សែសង្វាក់កែសម្រួលភ្លាមៗ។",
    "authoritiesEn": "Authority to reject substandard garments, withhold approval tags, and order immediate corrective action by sewing operators.",
    "qualificationsKh": "សញ្ញាបត្រមធ្យមសិក្សាទុតិយភូមិ ឬប្រហាក់ប្រហែល។ បទពិសោធន៍ជា QC កាត់ដេរយ៉ាងតិច ២ ឆ្នាំ។ ភ្នែកមើលច្បាស់ មិនខ្វាក់ពណ៌ យល់ដឹងពីប្រភេទកំហុសកាត់ដេរ (Major/Minor Defects)។",
    "qualificationsEn": "High School Diploma or equivalent. Minimum 2 years QC inspection experience in apparel factories. Excellent visual acuity, normal color vision, and firm knowledge of garment defects.",
    "workingConditionsKh": "រោងជាងកាត់ដេរ នៅតុត្រួតពិនិត្យគុណភាពចុងខ្សែសង្វាក់។",
    "workingConditionsEn": "Sewing workshop floor at designated well-lit QC inspection workstations.",
    "kpisKh": "អត្រាទំនិញខូចធ្លាក់ចេញដល់ដំណាក់កាលវេចខ្ចប់ < 0.5%, ភាពត្រឹមត្រូវនៃការកត់ត្រា 100%, គ្មានកំហុសទំហំរង្វាស់។",
    "kpisEn": "Defect leakage rate to finishing < 0.5%, 100% inspection report accuracy, Zero critical measurement variances.",
    "revisions": [
      {
        "rev": "01",
        "date": "10-11-2023",
        "summary": "បង្កើតសេចក្តីពិពណ៌នាមុខតំណែងដំបូង",
        "authorizedBy": "QA Manager"
      }
    ]
  },
  {
    "id": "jd-11",
    "code": "JD-MCH-011",
    "edition": "02",
    "pageInfo": "Page 1 of 2",
    "effectiveDate": "11-11-2024",
    "amendDate": "10-10-2025",
    "department": "MAINTENANCE",
    "departmentKh": "ផ្នែកថែទាំ និងវិស្វកម្មម៉ាស៊ីន (Maintenance & Engineering)",
    "jobTitleKh": "ជាងជួសជុល និងថែទាំម៉ាស៊ីនឧស្សាហកម្ម",
    "jobTitleEn": "Industrial Maintenance Mechanic / Technician",
    "jobTitleCn": "机修工",
    "gradeLevel": "Technical Staff / L2",
    "reportsToKh": "ប្រធានផ្នែកថែទាំ (Maintenance Supervisor) / Production Manager",
    "reportsToEn": "Maintenance Supervisor / Production Manager",
    "supervisesKh": "ជំនួយការជាង (Mechanic Helpers)",
    "supervisesEn": "Mechanic Helpers",
    "companyName": "G.S.textileGarment(Cambodia) co.,Ltd",
    "preparedBy": "Mr. CHAN PHEARUM",
    "preparedRole": "ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager",
    "verifiedBy": "Mr. LEANG SOPHEA",
    "verifiedRole": "ប្រធានផ្នែកសវនកម្ម Compliance Manager",
    "approvedBy": "Mr. CHEN LANMAO",
    "approvedRole": "នាយកក្រុមហ៊ុន General Manager",
    "jobSummaryKh": "ទទួលខុសត្រូវលើការដំឡើង កែតម្រូវ ជួសជុល និងថែទាំបង្ការ (Preventive Maintenance) ចំពោះម៉ាស៊ីនដេរ ម៉ាស៊ីនកាត់ ម៉ាស៊ីនអ៊ុត និងប្រព័ន្ធឧបករណ៍ផលិតកម្មទាំងអស់ក្នុងរោងចក្រឱ្យដំណើរការប្រកបដោយសុវត្ថិភាព។",
    "jobSummaryEn": "Responsible for installing, adjusting, repairing, and executing preventive maintenance schedules across all industrial sewing machines, cutting machinery, boilers, and utility systems, ensuring operational safety and zero downtime.",
    "dutiesKh": "១. ការជួសជុល និងដោះស្រាយបញ្ហាបន្ទាន់ EMERGENCY REPAIRS & TROUBLESHOOTING\n- ឆ្លើយតប និងចុះទៅជួសជុលម៉ាស៊ីនដែលមានបញ្ហាក្នុងខ្សែសង្វាក់ផលិតកម្មភ្លាមៗ (Response Time < 10 នាទី)។\n- កែតម្រូវបច្ចេកទេសម៉ាស៊ីន (Machine Setting) ឱ្យត្រូវតាមលក្ខណៈក្រណាត់ និងម៉ូដផលិតផល។\n- ជំនួសគ្រឿងបន្លាស់ដែលខូច និងធ្វើតេស្តម៉ាស៊ីនឱ្យមានស្ថេរភាពមុនប្រគល់ឱ្យកម្មករដេរវិញ។\n\n២. ការថែទាំបង្ការទុកជាមុន PREVENTIVE MAINTENANCE (PM)\n- អនុវត្តផែនការថែទាំបង្ការប្រចាំសប្តាហ៍ និងប្រចាំខែ (ចាក់ប្រេង សម្អាតធូលី ត្រួតពិនិត្យខ្សែពាន)។\n- ត្រួតពិនិត្យប្រព័ន្ធសុវត្ថិភាពម៉ាស៊ីន ដូចជា ដែកការពារភ្នែក (Eye Guard), ដែកការពារម្រាមដៃ (Finger Guard), និងកុងតាក់ដាច់ភ្លើង។\n- កត់ត្រាក្នុងសៀវភៅតាមដានម៉ាស៊ីន (Machine Maintenance Log Sheet)។\n\n៣. សុវត្ថិភាពការងារ និងការគ្រប់គ្រងប្រេងម៉ាស៊ីន LOTO & OIL MANAGEMENT\n- អនុវត្តនីតិវិធីចាក់សោរបិទស្លាកសញ្ញា (Lock-Out Tag-Out - LOTO) រាល់ពេលធ្វើការជួសជុលប្រព័ន្ធអគ្គិសនី ឬមេកានិចធំៗ។\n- គ្រប់គ្រង និងផ្ទុកប្រេងរំអិល និងប្រេងម៉ាស៊ីនឱ្យបានត្រឹមត្រូវ ជៀសវាងការកំពប់ ឬហូរចូលប្រព័ន្ធលូ។",
    "dutiesEn": "1. EMERGENCY REPAIR & FAST DOWNTIME RECOVERY\n- Respond to line machinery failure calls immediately (Target response time < 10 minutes).\n- Calibrate machine timing, thread tensions, and needle positioning tailored to fabric weight and construction.\n- Replace worn gears, loopers, and feed dogs, conducting thorough test stitches before handing back to operators.\n\n2. SCHEDULED PREVENTIVE MAINTENANCE (PM)\n- Execute weekly and monthly preventive maintenance tasks (cleaning lint, lubrication, belt tension checks).\n- Inspect and certify machine safety guards (pulley guards, needle/finger guards, eye shields).\n- Maintain comprehensive machine history records and spare parts consumption registers.\n\n3. WORKPLACE SAFETY, LOTO & CHEMICAL DISCIPLINE\n- Strictly observe Lockout/Tagout (LOTO) protocols during electrical and complex mechanical interventions.\n- Safely handle machine oils and lubricants, ensuring secondary containment and zero floor contamination.",
    "authoritiesKh": "មានសិទ្ធិផ្អាកការដំណើរការម៉ាស៊ីនដែលគ្មានសុវត្ថិភាព ឬគ្មាន Finger Guard និងស្នើសុំទិញគ្រឿងបន្លាស់ចាំបាច់។",
    "authoritiesEn": "Authority to decommission unsafe machines lacking safety guards and submit requisition requests for replacement components.",
    "qualificationsKh": "សញ្ញាបត្របច្ចេកទេស ឬសញ្ញាបត្រវិស្វកម្មមេកានិច/អគ្គិសនី។ បទពិសោធន៍ជាងម៉ាស៊ីនរោងចក្រកាត់ដេរយ៉ាងតិច ៣ ឆ្នាំ។ ចេះច្បាស់ពីម៉ាស៊ីនដេរទំនើប (Single Needle, Overlock, Interlock, Pattern Tacker, Auto Sewing)។",
    "qualificationsEn": "Technical Diploma or Vocational Certification in Mechanical/Electrical Engineering. Minimum 3 years experience as a garment factory mechanic. Proficient with Juki/Brother sewing machinery.",
    "workingConditionsKh": "រោងជាងផលិតកម្ម និងបន្ទប់ជាងជួសជុលម៉ាស៊ីន (Mechanic Workshop)។",
    "workingConditionsEn": "Factory manufacturing floor and mechanic workshop environments.",
    "kpisKh": "អត្រាម៉ាស៊ីនខូចរាំងស្ទះការងារ (Machine Downtime) < 2%, សម្រេចផែនការ PM 100%, គ្មានគ្រោះថ្នាក់ការងារលើជាង។",
    "kpisEn": "Unplanned machine downtime < 2%, 100% completion of monthly PM schedules, Zero mechanic injuries.",
    "revisions": [
      {
        "rev": "01",
        "date": "10-11-2023",
        "summary": "បង្កើតសេចក្តីពិពណ៌នាមុខតំណែងដំបូង",
        "authorizedBy": "General Manager"
      }
    ]
  },
  {
    "id": "jd-12",
    "code": "JD-WHS-012",
    "edition": "02",
    "pageInfo": "Page 1 of 2",
    "effectiveDate": "11-11-2024",
    "amendDate": "10-10-2025",
    "department": "WAREHOUSE",
    "departmentKh": "ផ្នែកឃ្លាំង និងភស្តុភារ (Warehouse & Logistics)",
    "jobTitleKh": "ប្រធានឃ្លាំងទំនិញ និងវត្ថុធាតុដើម",
    "jobTitleEn": "Warehouse & Inventory Supervisor",
    "jobTitleCn": "仓库主管",
    "gradeLevel": "Supervisor / S1",
    "reportsToKh": "ប្រធានផ្នែកភស្តុភារ (Logistics Manager) / Production Manager",
    "reportsToEn": "Logistics Manager / Production Manager",
    "supervisesKh": "បុគ្គលិកឃ្លាំងក្រណាត់, បុគ្គលិកឃ្លាំងគ្រឿងបន្លាស់ (Trims), បុគ្គលិកឃ្លាំងទំនិញសម្រេច, កម្មករបញ្ចូល-ទម្លាក់ទំនិញ",
    "supervisesEn": "Fabric Warehouse Clerks, Trim Warehouse Clerks, Finished Goods Clerks, Material Handlers/Forklift Drivers",
    "companyName": "G.S.textileGarment(Cambodia) co.,Ltd",
    "preparedBy": "Mr. CHAN PHEARUM",
    "preparedRole": "ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager",
    "verifiedBy": "Mr. LEANG SOPHEA",
    "verifiedRole": "ប្រធានផ្នែកសវនកម្ម Compliance Manager",
    "approvedBy": "Mr. CHEN LANMAO",
    "approvedRole": "នាយកក្រុមហ៊ុន General Manager",
    "jobSummaryKh": "គ្រប់គ្រងរាល់សកម្មភាពទទួល ត្រួតពិនិត្យ រៀបចំទុកដាក់ ថែរក្សា និងបើកផ្តល់ក្រណាត់ គ្រឿងបន្លាស់ និងទំនិញសម្រេច ព្រមទាំងគ្រប់គ្រងទិន្នន័យស្តុក (Inventory ERP) ឱ្យមានភាពត្រឹមត្រូវ និងមានសុវត្ថិភាពតាមស្តង់ដា C-TPAT។",
    "jobSummaryEn": "Supervise the receipt, inspection, systematic storage, preservation, and issuing of fabrics, trims, and finished apparel, ensuring 100% inventory accuracy in ERP systems and strict adherence to C-TPAT supply chain security rules.",
    "dutiesKh": "១. ការទទួល និងត្រួតពិនិត្យសម្ភារ RECEIVING & MATERIAL VERIFICATION\n- ទទួលក្រណាត់ និងគ្រឿងបន្លាស់ពីអ្នកផ្គត់ផ្គង់ ផ្ទៀងផ្ទាត់បរិមាណ និងឯកសារដឹកជញ្ជូន (Delivery Orders/Packing Lists)។\n- សហការជាមួយ QA ក្នុងការដាក់សម្ភារនៅតំបន់រង់ចាំត្រួតពិនិត្យ (Quarantine Area) មុនអនុញ្ញាតឱ្យចូលស្តុក។\n- កត់ត្រាទិន្នន័យសម្ភារចូលស្តុកក្នុងប្រព័ន្ធកុំព្យូទ័រ ERP ភ្លាមៗក្នុងថ្ងៃដដែល។\n\n២. ការរៀបចំទុកដាក់ និងបើកផ្តល់ INVENTORY MANAGEMENT & ISSUANCE\n- រៀបចំទុកដាក់ទំនិញលើធ្នើរ និងជើងទ្រ (Pallets) ឱ្យមានសណ្តាប់ធ្នាប់ ដាក់ស្លាក Bin Card និងអនុវត្តគោលការណ៍ FIFO (First In, First Out)។\n- រៀបចំបើកផ្តល់ក្រណាត់ និងគ្រឿងបន្លាស់ជូនផ្នែកកាត់ និងផ្នែកដេរតាមប័ណ្ណស្នើសុំសម្ភារ (Material Requisition Form)។\n- ធ្វើជំរឿនស្តុក (Stock Count / Physical Inventory) ប្រចាំខែដើម្បីផ្ទៀងផ្ទាត់ចំនួនជាក់ស្តែងធៀបនឹងប្រព័ន្ធ។\n\n៣. សុវត្ថិភាពឃ្លាំង និងស្តង់ដា C-TPAT WAREHOUSE SAFETY & C-TPAT\n- ធានាសុវត្ថិភាពឃ្លាំងទំនិញសម្រេច (Finished Goods Store) ត្រូវចាក់សោ និងគ្រប់គ្រងអ្នកចេញ-ចូលយ៉ាងតឹងរ៉ឹងតាម C-TPAT។\n- ត្រួតពិនិត្យឧបករណ៍ពន្លត់អគ្គិភ័យក្នុងឃ្លាំង និងមិនឱ្យមានការគរទំនិញបាំងច្រកចេញ ឬបាំងឧបករណ៍សង្គ្រោះឡើយ។\n- ធានាថាកម្មករលើកដាក់ទំនិញពាក់ស្បែកជើងសុវត្ថិភាព និងអនុវត្តក្បួនលើកទំនិញត្រឹមត្រូវ (Safe Lifting)។",
    "dutiesEn": "1. RECEIPT AUDIT & MATERIAL REGISTRATION\n- Receive inbound shipments of fabrics and trims, auditing counts against Packing Lists and Purchase Orders.\n- Segregate newly arrived materials in Quarantine Holding Bays until approved by QA inspection.\n- Input goods-received notes into enterprise ERP software within same-day turnaround SLAs.\n\n2. SYSTEMATIC STORAGE, FIFO & ISSUANCE\n- Organize inventory onto pallets and racking with bilingual Bin Cards, strictly applying FIFO (First-In, First-Out).\n- Issue production materials to cutting and sewing sections against authorized Material Requisition Vouchers.\n- Perform monthly cycle counts and quarterly physical stock-taking reconciliations.\n\n3. SECURITY GOVERNANCE & C-TPAT PROTOCOLS\n- Enforce strict C-TPAT restricted-access rules for finished goods packing and container staging zones.\n- Maintain unimpeded fire exits, emergency paths, and a minimum 18-inch clearance below sprinkler heads.\n- Enforce manual handling safety standards and require steel-toed boots for forklift operators and handlers.",
    "authoritiesKh": "មានសិទ្ធិបដិសេធមិនទទួលទំនិញដែលខូចខាតពីការដឹកជញ្ជូន និងហាមឃាត់បុគ្គលគ្មានភារកិច្ចមិនឱ្យចូលក្នុងឃ្លាំងទំនិញសម្រេច។",
    "authoritiesEn": "Authority to reject damaged shipments upon delivery and restrict unauthorized personnel access into high-security finished goods stores.",
    "qualificationsKh": "បរិញ្ញាបត្រ ឬសញ្ញាបត្រជាន់ខ្ពស់ផ្នែកគ្រប់គ្រងភស្តុភារ គណនេយ្យ ឬពាណិជ្ជកម្ម។ បទពិសោធន៍គ្រប់គ្រងឃ្លាំងរោងចក្រយ៉ាងតិច ៣ ឆ្នាំ។ ចេះប្រើប្រព័ន្ធ ERP Warehouse Management System និង Microsoft Excel។ យល់ដឹងពីស្តង់ដា C-TPAT។",
    "qualificationsEn": "Degree in Logistics, Supply Chain, Accounting, or Business. Minimum 3 years warehouse leadership in manufacturing. Proficient in ERP/WMS systems and Excel. Firm grasp of C-TPAT security standards.",
    "workingConditionsKh": "ឃ្លាំងក្រណាត់ ឃ្លាំងគ្រឿងបន្លាស់ និងឃ្លាំងទំនិញសម្រេច។",
    "workingConditionsEn": "Warehouse loading bays, palletized storage racks, and shipping docks.",
    "kpisKh": "ភាពត្រឹមត្រូវនៃទិន្នន័យស្តុក (Stock Accuracy) >= 99%, សម្រេចផែនការបើកផ្តល់ទាន់ពេល 100%, សវនកម្ម C-TPAT ជាប់ 100% គ្មានចំណុចខ្វះខាត។",
    "kpisEn": "Inventory record accuracy >= 99%, 100% on-time material issuance to production lines, 100% C-TPAT security compliance.",
    "revisions": [
      {
        "rev": "01",
        "date": "10-11-2023",
        "summary": "បង្កើតសេចក្តីពិពណ៌នាមុខតំណែងដំបូង",
        "authorizedBy": "General Manager"
      }
    ]
  },
  {
    "id": "jd-13",
    "code": "JD-MED-013",
    "edition": "02",
    "pageInfo": "Page 1 of 2",
    "effectiveDate": "11-11-2024",
    "amendDate": "10-10-2025",
    "department": "MEDICAL",
    "departmentKh": "បន្ទប់សុខភាពរោងចក្រ និងសង្គ្រោះបឋម (Clinic & First Aid)",
    "jobTitleKh": "គិលានុបដ្ឋាយិកា/បុគ្គលិកបន្ទប់សុខភាពរោងចក្រ",
    "jobTitleEn": "Factory Nurse / Clinic Officer",
    "jobTitleCn": "厂医护士",
    "gradeLevel": "Staff / L2",
    "reportsToKh": "ប្រធានផ្នែករដ្ឋបាល/HR Manager & វេជ្ជបណ្ឌិតរោងចក្រប្រចាំការ",
    "reportsToEn": "HR/Admin Manager & Factory Retainer Doctor",
    "supervisesKh": "ក្រុមសង្គ្រោះបឋមរោងចក្រ (First Aiders)",
    "supervisesEn": "First Aid Volunteers",
    "companyName": "G.S.textileGarment(Cambodia) co.,Ltd",
    "preparedBy": "Mr. CHAN PHEARUM",
    "preparedRole": "ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager",
    "verifiedBy": "Mr. LEANG SOPHEA",
    "verifiedRole": "ប្រធានផ្នែកសវនកម្ម Compliance Manager",
    "approvedBy": "Mr. CHEN LANMAO",
    "approvedRole": "នាយកក្រុមហ៊ុន General Manager",
    "jobSummaryKh": "ទទួលបន្ទុកព្យាបាលជំងឺទូទៅ និងសង្គ្រោះបឋម (First Aid) ដល់កម្មករនិយោជិត គ្រប់គ្រងឱសថនិងបរិក្ខារពេទ្យ តាមដានសុខភាពស្ត្រីមានផ្ទៃពោះ និងសម្របសម្រួលបញ្ជូនអ្នកជំងឺធ្ងន់ធ្ងរទៅមន្ទីរពេទ្យស្របតាមច្បាប់ការងារ និងស្តង់ដាអនាម័យ។",
    "jobSummaryEn": "Deliver primary healthcare and emergency first aid to factory workers, manage medication and medical supply inventories, monitor pregnant and nursing workers, and coordinate emergency hospital transfers per labor regulations.",
    "dutiesKh": "១. ការព្យាបាលបឋម និងការសង្គ្រោះបន្ទាន់ PRIMARY CARE & FIRST AID\n- ទទួលពិនិត្យ និងព្យាបាលជំងឺស្រាលៗ (ឈឺក្បាល ក្តៅខ្លួន ឈឺពោះ វិលមុខ) និងផ្តល់ថ្នាំព្យាបាលតាមវេជ្ជបញ្ជា។\n- ផ្តល់ការសង្គ្រោះបឋមជាបន្ទាន់នៅពេលមានគ្រោះថ្នាក់ការងារ (របួសដាច់រលាត់ មុតដៃ ភ្លាត់ ឬដួលសន្លប់)។\n- សម្របសម្រួលការបញ្ជូនអ្នកជំងឺធ្ងន់ធ្ងរទៅកាន់មន្ទីរពេទ្យដៃគូ ឬមន្ទីរពេទ្យបង្អែកដោយរថយន្តសង្គ្រោះបន្ទាន់។\n\n២. ការគ្រប់គ្រងឱសថ និងកំណត់ត្រាវេជ្ជសាស្ត្រ PHARMACY & CLINIC LOGS\n- គ្រប់គ្រងស្តុកឱសថ បរិក្ខារពេទ្យ និងប្រអប់ថ្នាំសង្គ្រោះបឋម (First Aid Boxes) តាមរោងជាងឱ្យមានថ្នាំគ្រប់គ្រាន់ និងមិនផុតកំណត់។\n- កត់ត្រាព័ត៌មានអ្នកមកទទួលការព្យាបាលប្រចាំថ្ងៃក្នុងសៀវភៅតាមដាន (Clinic Daily Patient Logbook)។\n- ធ្វើរបាយការណ៍ស្ថិតិជំងឺ និងគ្រោះថ្នាក់ការងារប្រចាំខែជូនផ្នែក HR និងក្រសួងការងារ។\n\n៣. ការថែទាំស្ត្រីមានផ្ទៃពោះ និងការលើកកម្ពស់សុខភាព MATERNAL & HEALTH ADVOCACY\n- ពិនិត្យ និងតាមដានសុខភាពស្ត្រីមានផ្ទៃពោះ រៀបចំឱ្យពួកគាត់ទទួលបានការសម្រាកមុនម៉ោង ១៥ នាទីតាមច្បាប់។\n- គ្រប់គ្រងបន្ទប់បំបៅដោះកូន (Lactation Room) និងផ្សព្វផ្សាយចំណេះដឹងស្តីពីអនាម័យ អាហារូបត្ថម្ភ និងការបង្ការជំងឺឆ្លង។",
    "dutiesEn": "1. PRIMARY CONSULTATION & EMERGENCY FIRST AID\n- Examine and provide treatment for minor ailments (headaches, fever, abdominal distress, dizziness) with approved OTC medications.\n- Deliver immediate first aid during workplace incidents (minor cuts, puncture wounds, sprains, fainting).\n- Organize prompt emergency referrals and ambulance transfers to tertiary partner hospitals for acute medical cases.\n\n2. MEDICAL LOGISTICS & PATIENT ARCHIVING\n- Maintain factory clinic medication stocks and regularly replenish departmental First Aid Boxes before expiry dates.\n- Record every patient consultation, symptom, and treatment in the official Clinic Daily Register.\n- Generate monthly statistical summaries on injury and illness trends for HR leadership and Labor Ministry reporting.\n\n3. MATERNAL CARE & HEALTH PROMOTION\n- Track registered pregnant workers, ensuring legal entitlement to 15-minute early shifts departure and medical checkup leaves.\n- Oversee hygienic maintenance of the on-site Lactation Room and conduct worker education on hygiene and nutrition.",
    "authoritiesKh": "មានសិទ្ធិអនុញ្ញាតឱ្យកម្មករសម្រាកក្នុងបន្ទប់សុខភាព (រយៈពេលអតិបរមា ២ ម៉ោង) ឬបញ្ជូនទៅមន្ទីរពេទ្យ និងស្នើសុំទិញឱសថបំពេញបន្ថែម។",
    "authoritiesEn": "Authority to grant medical rest in the clinic (up to 2 hours), order emergency hospital transfers, and requisition necessary pharmaceutical supplies.",
    "qualificationsKh": "សញ្ញាបត្រគិលានុបដ្ឋាក ឬឆ្មបមធ្យម ទទួលស្គាល់ដោយក្រសួងសុខាភិបាល។ មានអាជ្ញាបណ្ណប្រកបវិជ្ជាជីវៈវេជ្ជសាស្ត្រត្រឹមត្រូវ។ បទពិសោធន៍យ៉ាងតិច ២ ឆ្នាំក្នុងគ្លីនិក ឬរោងចក្រ។ ចេះភាសាអង់គ្លេសខ្លះៗ។",
    "qualificationsEn": "Diploma in Nursing or Midwifery recognized by the Ministry of Health. Valid nursing practitioner license. Minimum 2 years clinical or occupational healthcare experience.",
    "workingConditionsKh": "បន្ទប់សុខភាពរោងចក្រ (Factory Infirmary/Clinic)។",
    "workingConditionsEn": "Factory medical clinic and first aid response settings.",
    "kpisKh": "ឆ្លើយតបការសង្គ្រោះបឋមទាន់ពេល 100%, គ្មានថ្នាំផុតកំណត់ក្នុងស្តុក, 100% នៃស្ត្រីមានផ្ទៃពោះទទួលបានការតាមដានត្រឹមត្រូវ។",
    "kpisEn": "100% immediate first aid response, Zero expired drugs in clinic stocks, 100% compliance with maternal protection monitoring.",
    "revisions": [
      {
        "rev": "01",
        "date": "10-11-2023",
        "summary": "បង្កើតសេចក្តីពិពណ៌នាមុខតំណែងដំបូង",
        "authorizedBy": "HR Manager"
      }
    ]
  },
  {
    "id": "jd-14",
    "code": "JD-SEC-014",
    "edition": "02",
    "pageInfo": "Page 1 of 2",
    "effectiveDate": "11-11-2024",
    "amendDate": "10-10-2025",
    "department": "SECURITY",
    "departmentKh": "ផ្នែកសន្តិសុខ និងសុវត្ថិភាពរោងចក្រ (Security & C-TPAT)",
    "jobTitleKh": "ប្រធានក្រុមសន្តិសុខរោងចក្រ",
    "jobTitleEn": "Security Team Leader",
    "jobTitleCn": "保安队长",
    "gradeLevel": "Supervisor / S1",
    "reportsToKh": "ប្រធានផ្នែករដ្ឋបាល/HR Manager & Compliance Manager",
    "reportsToEn": "HR/Admin Manager & Compliance Manager",
    "supervisesKh": "បុគ្គលិកសន្តិសុខវេនថ្ងៃ និងវេនយប់ (Security Guards - Day & Night Shifts)",
    "supervisesEn": "Security Guards (Day & Night Shifts)",
    "companyName": "G.S.textileGarment(Cambodia) co.,Ltd",
    "preparedBy": "Mr. CHAN PHEARUM",
    "preparedRole": "ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager",
    "verifiedBy": "Mr. LEANG SOPHEA",
    "verifiedRole": "ប្រធានផ្នែកសវនកម្ម Compliance Manager",
    "approvedBy": "Mr. CHEN LANMAO",
    "approvedRole": "នាយកក្រុមហ៊ុន General Manager",
    "jobSummaryKh": "ដឹកនាំ និងគ្រប់គ្រងកម្លាំងសន្តិសុខរោងចក្រ ២៤ ម៉ោង/៧ ថ្ងៃ ត្រួតពិនិត្យការចេញ-ចូលរបស់មនុស្ស យានយន្ត និងទំនិញ ទប់ស្កាត់មិនឱ្យកុមារចូលក្នុងរោងចក្រ និងធានាសុវត្ថិភាពទ្រព្យសម្បត្តិស្របតាមស្តង់ដា C-TPAT។",
    "jobSummaryEn": "Command round-the-clock factory security operations, strictly controlling gate ingress and egress of personnel, visitors, vehicles, and cargo, preventing unauthorized/child entry, and safeguarding assets per C-TPAT mandates.",
    "dutiesKh": "១. ការគ្រប់គ្រងខ្លោងទ្វារ និងទប់ស្កាត់កុមារ GATE SECURITY & CHILD ENTRY PREVENTION\n- អនុវត្តគោលការណ៍ SP069 (SOP-SEC-001) យ៉ាងម៉ឺងម៉ាត់ មិនអនុញ្ញាតឱ្យបុគ្គលក្រោមអាយុ ១៨ ឆ្នាំចូលបរិវេណរោងចក្រជាដាច់ខាត។\n- ត្រួតពិនិត្យប័ណ្ណសម្គាល់ខ្លួនបុគ្គលិក (Employee ID Badge) ពេលចូលបំពេញការងារជារៀងរាល់ថ្ងៃ។\n- កត់ត្រាព័ត៌មានភ្ញៀវ ផ្តល់ប័ណ្ណភ្ញៀវ និងទាក់ទងផ្នែកពាក់ព័ន្ធមុនអនុញ្ញាតឱ្យចូល។\n\n២. សន្តិសុខយានយន្ត និងកុងតឺន័រ C-TPAT VEHICLE & CARGO SECURITY\n- ត្រួតពិនិត្យយានយន្ត និងរថយន្តកុងតឺន័រតាមនីតិវិធី C-TPAT 7-Point Container Inspection មុនផ្ទុកទំនិញ។\n- ត្រួតពិនិត្យត្រាការពារ (High-Security Bolt Seal - ISO 17712) ពេលបិទទ្វារកុងតឺន័រដឹកទំនិញចេញ។\n- កត់ត្រាពេលវេលា ផ្លាកលេខរថយន្ត និងឈ្មោះអ្នកបើកបរក្នុងសៀវភៅតាមដានរថយន្ត។\n\n៣. ការយាមល្បាត និងប្រព័ន្ធកាមេរ៉ាសុវត្ថិភាព PATROLLING & CCTV MONITORING\n- រៀបចំកាលវិភាគល្បាតជុំវិញបរិវេណរោងចក្រ របង ឃ្លាំង និងចំណតរថយន្តរៀងរាល់ ២ ម៉ោងម្តង។\n- ត្រួតពិនិត្យប្រព័ន្ធកាមេរ៉ាសុវត្ថិភាព (CCTV) ធានាថាកាមេរ៉ាដំណើរការ និងថតបានច្បាស់គ្រប់ជ្រុង ២៤ ម៉ោង។\n- រាយការណ៍ និងចាត់វិធានការភ្លាមៗពេលមានភាពមិនប្រក្រតី ការលួច ឬការបំពានសន្តិសុខ។",
    "dutiesEn": "1. ACCESS CONTROL & STRICT PREVENTION OF CHILD ENTRY\n- Strictly enforce SP069 (SOP-SEC-001), barring anyone under 18 years from factory premises without exception.\n- Inspect employee ID badges at main gates during shift changes to ensure badge compliance.\n- Register all incoming visitors, issue visitor passes, and notify host departments before granting entry.\n\n2. C-TPAT VEHICLE & CONTAINER SECURITY INSPECTION\n- Conduct mandatory 7-point container physical inspections prior to loading export freight.\n- Verify and lock high-security ISO 17712 bolt seals, documenting seal numbers accurately on shipping manifests.\n- Maintain meticulous entry/exit gate records of trucks, drivers, and material movements.\n\n3. ROUND-THE-CLOCK PATROLS & SURVEILLANCE\n- Organize rotating perimeter patrols covering fences, warehouse perimeters, and parking yards every 2 hours.\n- Monitor CCTV feeds 24/7, ensuring continuous operation, proper camera angles, and footage retention.\n- Report security breaches, property theft, or suspicious activities immediately to HR leadership.",
    "authoritiesKh": "មានសិទ្ធិឆែកឆេរកាតាប ឬយានយន្តដែលចេញ-ចូលបរិវេណរោងចក្រ បដិសេធមិនឱ្យបុគ្គលដែលគ្មានប័ណ្ណសម្គាល់ខ្លួនចូល និងឃាត់ខ្លួនជនសង្ស័យដែលលួចទ្រព្យសម្បត្តិ។",
    "authoritiesEn": "Authority to inspect baggage/vehicles entering or exiting, deny entry to unauthorized or unverified individuals, and detain suspects of theft.",
    "qualificationsKh": "សញ្ញាបត្រមធ្យមសិក្សា ឬវិញ្ញាបនបត្រយោធា/នគរបាល។ បទពិសោធន៍ជាប្រធានសន្តិសុខរោងចក្រយ៉ាងតិច ៣ ឆ្នាំ។ បានឆ្លងកាត់ការបណ្តុះបណ្តាល C-TPAT និងវិធានការពន្លត់អគ្គិភ័យ។ រូបរាងរឹងមាំ និងមានវិន័យខ្ពស់។",
    "qualificationsEn": "High School Diploma or Military/Police service background. Minimum 3 years security supervisory experience in factories. Trained in C-TPAT and fire safety protocols.",
    "workingConditionsKh": "ខ្លោងទ្វាររោងចក្រ បន្ទប់បញ្ជា CCTV និងដើរល្បាតជុំវិញបរិវេណរោងចក្រ។",
    "workingConditionsEn": "Main security gates, guardhouses, CCTV surveillance rooms, and factory grounds.",
    "kpisKh": "គ្មានករណីកុមារចូលបរិវេណរោងចក្រ (Zero Child Entry), អនុវត្ត 7-point C-TPAT បាន 100%, គ្មានករណីបាត់បង់ទ្រព្យសម្បត្តិ។",
    "kpisEn": "Zero unauthorized/underage entries, 100% C-TPAT container inspection completion, Zero theft/security incidents.",
    "revisions": [
      {
        "rev": "01",
        "date": "10-11-2023",
        "summary": "បង្កើតសេចក្តីពិពណ៌នាមុខតំណែងដំបូង",
        "authorizedBy": "HR Manager"
      }
    ]
  },
  {
    "id": "jd-15",
    "code": "JD-OPR-015",
    "edition": "02",
    "pageInfo": "Page 1 of 2",
    "effectiveDate": "11-11-2024",
    "amendDate": "10-10-2025",
    "department": "PRODUCTION",
    "departmentKh": "ផ្នែកផលិតកម្ម (Production - Sewing Worker)",
    "jobTitleKh": "កម្មករ/កម្មការិនីប្រតិបត្តិការម៉ាស៊ីនដេរ",
    "jobTitleEn": "Sewing Machine Operator",
    "jobTitleCn": "缝纫工",
    "gradeLevel": "Operator / W1",
    "reportsToKh": "ប្រធានខ្សែសង្វាក់ផលិតកម្ម (Line Leader) / Sewing Supervisor",
    "reportsToEn": "Production Sewing Line Leader / Sewing Supervisor",
    "supervisesKh": "គ្មាន (Individual Operator)",
    "supervisesEn": "None (Individual Operator)",
    "companyName": "G.S.textileGarment(Cambodia) co.,Ltd",
    "preparedBy": "Mr. CHAN PHEARUM",
    "preparedRole": "ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager",
    "verifiedBy": "Mr. LEANG SOPHEA",
    "verifiedRole": "ប្រធានផ្នែកសវនកម្ម Compliance Manager",
    "approvedBy": "Mr. CHEN LANMAO",
    "approvedRole": "នាយកក្រុមហ៊ុន General Manager",
    "jobSummaryKh": "ទទួលបន្ទុកប្រតិបត្តិការម៉ាស៊ីនដេរឧស្សាហកម្មដើម្បីផ្គុំដេរផ្នែកផ្សេងៗនៃសម្លៀកបំពាក់ឱ្យបានត្រឹមត្រូវតាមបច្ចេកទេស និងគំរូស្តង់ដា ធានាទិន្នផលសម្រេចប្រចាំថ្ងៃ គុណភាពល្អគ្មានកំហុស និងគោរពបទបញ្ជាសុវត្ថិភាពការងារ។",
    "jobSummaryEn": "Operate industrial sewing machinery to assemble garment components accurately according to technical specifications and sample standards, achieving daily production targets while upholding quality and workplace safety.",
    "dutiesKh": "១. ប្រតិបត្តិការដេរតាមបច្ចេកទេស SEWING OPERATIONS & OUTPUT TARGETS\n- ដេរផ្គុំផ្នែកនៃសម្លៀកបំពាក់ (ដូចជា ដេរតួ ដេរដៃ ដេរក ដេរហោប៉ៅ ឬដេរបត់ជើង) តាមការចាត់តាំងរបស់ប្រធានសង្វាក់។\n- ធានាការដេរឱ្យបានតាមចំនួនកំណត់ក្នុងមួយម៉ោង (Hourly Target) ប្រកបដោយភាពផ្ចិតផ្ចង់។\n- រក្សាភាពស្អាតនៃសម្លៀកបំពាក់ ជៀសវាងការប្រឡាក់ប្រេងម៉ាស៊ីន ឬស្នាមប្រឡាក់ផ្សេងៗ។\n\n២. ការធានាគុណភាព និងការកែសម្រួល QUALITY SELF-CHECK & REWORK\n- ពិនិត្យមើលគុណភាពថ្នេរដេរដោយខ្លួនឯងមុនពេលបញ្ជូនទៅដំណាក់កាលបន្ទាប់ (Self-Inspection)។\n- កែសម្រួលទំនិញខូចភ្លាមៗនៅពេល QC រកឃើញកំហុស។\n- មិនត្រូវកែប្រែ ឬដោះដូរស្លាកសញ្ញាបញ្ជាក់ទំហំដោយគ្មានការអនុញ្ញាតឡើយ។\n\n៣. សុវត្ថិភាពការងារ និងនីតិវិធីម្ជុលបាក់ WORKPLACE SAFETY & NEEDLE DISCIPLINE\n- ពាក់ម៉ាស់ការពារធូលីក្រណាត់ និងបំពាក់របាំងការពារម្រាមដៃ (Finger Guard) ជានិច្ចពេលកំពុងដេរ។\n- នៅពេលម្ជុលបាក់ ត្រូវប្រមូលបំណែកម្ជុលបាក់ទាំងអស់ (គ្រប់កង់) យកទៅប្តូរនៅតុគ្រប់គ្រងម្ជុលតាមនីតិវិធីរោងចក្រ។\n- បិទកុងតាក់ម៉ាស៊ីនដេរភ្លាមៗនៅពេលក្រោកចេញពីកន្លែងធ្វើការ ឬពេលចប់ម៉ោងការងារ។",
    "dutiesEn": "1. SEWING ASSEMBLY & DAILY PIECEWORK\n- Stitch designated garment components (collars, sleeves, side-seams, hemming, pockets) per assigned operations.\n- Meet designated hourly production output targets steadily while preserving stitch craftsmanship.\n- Handle fabrics carefully to prevent machine oil staining or cosmetic soiling.\n\n2. OPERATOR SELF-CHECK & SPEEDY REPAIR\n- Perform self-inspection of seams, tension, and stitch symmetry before passing parts down the line.\n- Rectify any flagged defect pieces promptly returned by in-line QC auditors.\n- Never alter sizing labels, barcode tags, or trim positions arbitrarily.\n\n3. SAFETY COMPLIANCE & BROKEN NEEDLE PROTOCOL\n- Wear mandatory personal protective items (dust masks, hairnets) and keep machine finger guards in place.\n- Upon needle breakage, collect all broken fragments and present them to the designated station for replacement.\n- Turn off machine power switches whenever leaving the workstation and at the end of shifts.",
    "authoritiesKh": "មានសិទ្ធិស្នើសុំជាងជួសជុលម៉ាស៊ីនមកកែតម្រូវនៅពេលម៉ាស៊ីនមានបញ្ហាបច្ចេកទេស និងស្នើសុំការពិនិត្យសុខភាពនៅបន្ទប់សុខភាពរោងចក្រពេលមានជំងឺ។",
    "authoritiesEn": "Authority to request immediate mechanic assistance for malfunctioning machinery and request medical consultation at the factory clinic when feeling unwell.",
    "qualificationsKh": "អាយុចាប់ពី ១៨ ឆ្នាំឡើងទៅស្របតាមច្បាប់ការងារ។ មានជំនាញ ឬបទពិសោធន៍ដេរម៉ាស៊ីនកាត់ដេរឧស្សាហកម្មយ៉ាងតិច ៦ ខែ (បេក្ខជនគ្មានបទពិសោធន៍អាចចូលហ្វឹកហ្វឺនបាន)។ មានភាពស្មោះត្រង់ អត់ធ្មត់ និងគោរពវិន័យ។",
    "qualificationsEn": "Minimum 18 years of age per Cambodian Labor Law. Minimum 6 months industrial sewing experience (or willingness to complete factory training). Patient, dependable, and disciplined.",
    "workingConditionsKh": "រោងជាងកាត់ដេរ (Sewing Workshop) អង្គុយបំពេញការងារលើកៅអីដេរប្រកបដោយផាសុកភាព និងមានកង្ហារ/ខ្យល់ត្រជាក់គ្រប់គ្រាន់។",
    "workingConditionsEn": "Manufacturing sewing hall at designated ergonomic sewing workstations with proper ventilation.",
    "kpisKh": "ទិន្នផលសម្រេចបាន >= 90% នៃគោលដៅ, អត្រាដេរខូច < 1.5%, អវត្តមានដោយគ្មានច្បាប់ 0%, គោរពវិធានការសុវត្ថិភាព 100%។",
    "kpisEn": "Output fulfillment >= 90% of target, Defect rate < 1.5%, Zero unexcused absenteeism, 100% adherence to safety guards.",
    "revisions": [
      {
        "rev": "01",
        "date": "10-11-2023",
        "summary": "បង្កើតសេចក្តីពិពណ៌នាមុខតំណែងដំបូង",
        "authorizedBy": "Production Manager"
      }
    ]
  }
];
