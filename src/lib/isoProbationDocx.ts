import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  PageBreak,
} from 'docx';

export type IsoContractType = 'PROBATION' | 'FDC' | 'UDC' | 'FOREIGN_FDC';

export interface IsoContractDocxData {
  contractType?: IsoContractType;
  companyNameKh: string;
  companyNameEn: string;
  companyNameZh: string;
  companyAddress: string;
  docCode: string;
  revision: string;
  effectiveDate: string;
  
  // Custom Overrides
  customTitleKh?: string;
  customTitleZh?: string;
  customTitleEn?: string;
  customLawRefKh?: string;
  customLawRefZh?: string;
  customLawRefEn?: string;

  // Employee Information
  employeeNameKh: string;
  employeeNameEn: string;
  genderKh: string;
  genderZh: string;
  age: string | number;
  dob: string;
  education: string;
  position: string;
  nationalId: string;
  nssfNo: string;
  joinDate: string;
  employeeId: string;
  address: string;
  nationality?: string;
  nationalityZh?: string;

  // Foreigner Specific Fields
  isForeigner?: boolean;
  passportNo?: string;
  passportExpiry?: string;
  visaNo?: string;
  visaExpiry?: string;
  workPermitNo?: string;
  workPermitExpiry?: string;
  countryOfOrigin?: string;

  // Contract Terms
  probationDurationMonths?: number | string;
  startDate: string;
  endDate: string;
  durationText?: string;
  basicSalaryUsd: number | string;
  attendanceBonusUsd: number | string;
  transportAllowanceUsd: number | string;
  mealAllowanceRiel: number | string;
  signedDate: string;
  langMode?: 'trilingual' | 'bilingual_zh' | 'khmer';
}

// Backward compatibility alias
export type IsoProbationDocxData = IsoContractDocxData;

const FONT_KHMER = 'Khmer OS Battambang';
const FONT_MOUL = 'Khmer OS Muol Light';
const FONT_ZH = 'SimSun';
const FONT_EN = 'Calibri';

const borderThin = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '334155' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '334155' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '334155' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '334155' },
};

export const ISO_TYPE_DEFAULTS: Record<IsoContractType, {
  titleKh: string;
  titleZh: string;
  titleEn: string;
  docCode: string;
  lawRefKh: string;
  lawRefZh: string;
  lawRefEn: string;
  preambleKh: string;
  preambleZh: string;
  art1TitleKh: string;
  art1TitleZh: string;
  art1TitleEn: string;
}> = {
  PROBATION: {
    titleKh: 'កិច្ចសន្យាការងារសាកល្បង',
    titleZh: '试用工合同',
    titleEn: 'PROBATIONARY EMPLOYMENT CONTRACT',
    docCode: 'LT-HR-SOP-002-F01',
    lawRefKh: 'អនុលោមតាមមាត្រា ៦៨ & ៨២ នៃច្បាប់ស្តីពីការងារ • ស្តង់ដារគ្រប់គ្រងគុណភាព ISO 9001:2015 Clause 7.5',
    lawRefZh: '依据柬埔寨《劳动法》第68条及第82条 • ISO 9001:2015 质量管理体系条款 7.5',
    lawRefEn: 'Pursuant to Articles 68 & 82 of the Labour Law • ISO 9001:2015 Clause 7.5',
    preambleKh: 'កិច្ចសន្យាការងារសាកល្បងនេះ ផ្តល់ជូនបុគ្គលិកនូវស្មារតីទទួលខុសត្រូវ និងទំនុកចិត្តលើភារកិច្ចរបស់ខ្លួន ព្រមទាំងកិច្ចសហការល្អរវាងនិយោជិត និងនិយោជក យកចិត្តទុកដាក់ខ្ពស់ដើម្បីរួមគ្នាសម្រេចគោលដៅបរិមាណ និងគុណភាពផលិតកម្មរបស់រោងចក្រ ស្របតាមស្តង់ដារ ISO 9001:2015។',
    preambleZh: '这份试用合同为员工提供了责任感和对自己职责的信心，以及与员工之间的良好合作，高度重视，共同实现工厂生产的数量和质量目标，符合 ISO 9001:2015 质量管理体系标准。',
    art1TitleKh: 'រយៈពេលនៃកិច្ចសន្យាសាកល្បង',
    art1TitleZh: '试用期合同期限',
    art1TitleEn: 'PROBATION DURATION',
  },
  FDC: {
    titleKh: 'កិច្ចសន្យាការងារមានថិរវេលាកំណត់ (FDC)',
    titleZh: '固定期限劳动合同 (FDC)',
    titleEn: 'FIXED DURATION EMPLOYMENT CONTRACT (FDC)',
    docCode: 'LT-HR-SOP-002-F02',
    lawRefKh: 'អនុលោមតាមមាត្រា ៦៧ & ៧៣ នៃច្បាប់ស្តីពីការងារ និងសេចក្តីណែនាំលេខ ០៥០/១៩ របស់ក្រសួងការងារ • ស្តង់ដារ ISO 9001:2015',
    lawRefZh: '依据柬埔寨《劳动法》第67条、第73条及劳工部第050/19号通告 • ISO 9001:2015 体系标准',
    lawRefEn: 'Pursuant to Articles 67 & 73 of the Labour Law & MLVT Instruction No. 050/19 • ISO 9001:2015 Clause 7.5',
    preambleKh: 'កិច្ចសន្យាការងារមានថិរវេលាកំណត់នេះ ត្រូវបានបង្កើតឡើងក្នុងស្មារតីសហការស្មោះត្រង់ រវាងនិយោជក និងនិយោជិត ដើម្បីរួមគ្នាសម្រេចនូវប្រសិទ្ធភាពការងារ គោលដៅផលិតកម្ម និងគុណភាពខ្ពស់ ស្របតាមប្រព័ន្ធគ្រប់គ្រងគុណភាព ISO 9001:2015 របស់រោងចក្រ។',
    preambleZh: '本固定期限劳动合同本着诚信合作精神订立，旨在共同达成高效的生产力与卓越品质，贯彻执行工厂 ISO 9001:2015 质量管理标准。',
    art1TitleKh: 'ថិរវេលានៃកិច្ចសន្យាការងារមានកាលកំណត់ (FDC)',
    art1TitleZh: '固定期限合同期限与续签规定',
    art1TitleEn: 'FDC CONTRACT DURATION & RENEWAL',
  },
  UDC: {
    titleKh: 'កិច្ចសន្យាការងារមានថិរវេលាមិនកំណត់ (UDC)',
    titleZh: '无固定期限劳动合同 (UDC)',
    titleEn: 'UNDETERMINED DURATION EMPLOYMENT CONTRACT (UDC)',
    docCode: 'LT-HR-SOP-002-F03',
    lawRefKh: 'អនុលោមតាមមាត្រា ៦៧, ៧៤, ៧៥ & មាត្រា ៨៩ ថ្មី នៃច្បាប់ស្តីពីការងារ និងប្រកាសលេខ ៤៤២/១៨ • ស្តង់ដារ ISO 9001:2015',
    lawRefZh: '依据柬埔寨《劳动法》第67条、第74条、第75条、新第89条及第442/18号令 • ISO 9001:2015 标准',
    lawRefEn: 'Pursuant to Articles 67, 74, 75 & New Article 89 of Labour Law & Prakas No. 442/18 • ISO 9001:2015',
    preambleKh: 'កិច្ចសន្យាការងារមានថិរវេលាមិនកំណត់ (UDC) នេះ បញ្ជាក់ពីទំនាក់ទំនងការងារយូរអង្វែង និងស្ថិរភាពការងាររវាងនិយោជក និងនិយោជិត ដើម្បីរួមគ្នាអភិវឌ្ឍន៍រោងចក្រ និងរក្សាគុណភាពកម្រិតស្តង់ដារអន្តរជាតិ ISO 9001:2015។',
    preambleZh: '本无固定期限劳动合同（UDC）明确了双方长期的劳动关系与岗位稳定性，携手提升企业核心竞争力，严格遵行 ISO 9001:2015 国际质量认证标准。',
    art1TitleKh: 'ថិរវេលានៃកិច្ចសន្យាការងារមិនកំណត់ (UDC)',
    art1TitleZh: '无固定期限合同生效与存续',
    art1TitleEn: 'UDC CONTRACT EFFECTIVENESS & DURATION',
  },
  FOREIGN_FDC: {
    titleKh: 'កិច្ចសន្យាការងារបុគ្គលិកជនបរទេស (មានថិរវេលាកំណត់)',
    titleZh: '外籍员工劳动合同（固定期限）',
    titleEn: 'EMPLOYMENT CONTRACT FOR FOREIGN EMPLOYEE (FIXED DURATION)',
    docCode: 'LT-HR-SOP-002-F04',
    lawRefKh: 'អនុលោមតាមច្បាប់ការងារ ច្បាប់អន្តោប្រវេសន៍ និងបទប្បញ្ញត្តិប័ណ្ណការងារជនបរទេស (Work Permit/FWCMS) • ស្តង់ដារ ISO 9001:2015',
    lawRefZh: '依据柬埔寨《劳动法》、移民法规及外籍劳工证（Work Permit / FWCMS）相关规定 • ISO 9001:2015 标准',
    lawRefEn: 'Pursuant to Cambodian Labour Law, Immigration Law & MLVT Foreign Work Permit Regulations • ISO 9001:2015',
    preambleKh: 'កិច្ចសន្យាការងារបុគ្គលិកជនបរទេសនេះ ត្រូវបានចុះហត្ថលេខាឡើងដោយអនុលោមយ៉ាងម៉ឺងម៉ាត់តាមច្បាប់នៃព្រះរាជាណាចក្រកម្ពុជា ដើម្បីធានាបាននូវភាពស្របច្បាប់នៃកម្លាំងពលកម្មបរទេស ការគ្រប់គ្រងជំនាញបច្ចេកទេស និងស្តង់ដារគុណភាព ISO 9001:2015 របស់ក្រុមហ៊ុន។',
    preambleZh: '本外籍员工劳动合同严格遵循柬埔寨王国相关涉外法律法规订立，确保外籍专业技术人员合法合规就业，贯彻工厂 ISO 9001:2015 国际质量管理规范。',
    art1TitleKh: 'ថិរវេលាកិច្ចសន្យា និងលក្ខខណ្ឌស្នាក់នៅធ្វើការស្របច្បាប់',
    art1TitleZh: '外籍员工合同期限与合法用工条件',
    art1TitleEn: 'FOREIGN EMPLOYMENT TERM & LEGAL REQUIREMENTS',
  },
};

export async function generateIsoProbationContractDocxBlob(data: IsoContractDocxData): Promise<Blob> {
  return generateIsoContractDocxBlob(data);
}

export async function generateIsoContractDocxBlob(data: IsoContractDocxData): Promise<Blob> {
  const paragraphs: (Paragraph | Table)[] = [];
  const isTrilingual = data.langMode === 'trilingual' || !data.langMode;
  const contractType: IsoContractType = data.contractType || 'PROBATION';
  const typeConfig = ISO_TYPE_DEFAULTS[contractType] || ISO_TYPE_DEFAULTS.PROBATION;

  const titleKh = data.customTitleKh || typeConfig.titleKh;
  const titleZh = data.customTitleZh || typeConfig.titleZh;
  const titleEn = data.customTitleEn || typeConfig.titleEn;
  const docCode = data.docCode || typeConfig.docCode;
  const isForeigner = data.isForeigner || contractType === 'FOREIGN_FDC';

  // Helper function to build ISO 9001:2015 Header Table
  const createIsoHeaderTable = (pageNum: number) => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borderThin,
      rows: [
        new TableRow({
          children: [
            // Col 1: Company Logo & Name
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: borderThin,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: data.companyNameKh || 'ឡាងថៃ ប៊ែក (ខេមបូឌា) ឯក',
                      bold: true,
                      size: 19,
                      font: FONT_MOUL,
                      color: 'B91C1C',
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: data.companyNameEn || 'LANGTAI BAGS (CAMBODIA) CO., LTD',
                      bold: true,
                      size: 16,
                      font: FONT_EN,
                      color: '0F172A',
                    }),
                  ],
                  spacing: { after: 20 },
                }),
              ],
            }),

            // Col 2: ISO Control Meta
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: borderThin,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: 'ISO 9001:2015 CONTROLLED FORM\n', bold: true, size: 15, color: '0369A1', font: FONT_EN }),
                    new TextRun({ text: `Doc Code: ${docCode} | Rev: ${data.revision || '02'}\n`, size: 15, font: FONT_EN }),
                    new TextRun({ text: `Eff Date: ${data.effectiveDate || '01/01/2026'} | Page ${pageNum} of 4`, size: 15, font: FONT_EN }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  };

  // Helper for Section Titles (Bilingual/Trilingual)
  const addArticleTitle = (numKh: string, numZh: string, tKh: string, tZh: string, tEn?: string) => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${numKh}- ${tKh}`, bold: true, size: 20, font: FONT_MOUL, color: '0F172A' }),
        ],
        spacing: { before: 100, after: 20 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `${numZh}、${tZh}`, bold: true, size: 18, font: FONT_ZH, color: '1E3A8A' }),
          ...(isTrilingual && tEn ? [new TextRun({ text: ` (${tEn})`, italics: true, size: 16, color: '64748B', font: FONT_EN })] : []),
        ],
        spacing: { after: 60 },
      })
    );
  };

  // Helper for Clause Content
  const addClauseText = (kh: string, zh: string, en?: string) => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: kh, size: 18, font: FONT_KHMER, color: '1E293B' }),
        ],
        spacing: { line: 280, after: 20 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: zh, size: 17, font: FONT_ZH, color: '334155' }),
          ...(isTrilingual && en ? [new TextRun({ text: `\n${en}`, italics: true, size: 15, color: '64748B', font: FONT_EN })] : []),
        ],
        spacing: { line: 260, after: 70 },
      })
    );
  };

  // ==========================================
  // PAGE 1: HEADER, PARTIES, EMPLOYEE TABLE, ARTICLE 1 & 2
  // ==========================================
  paragraphs.push(createIsoHeaderTable(1));
  paragraphs.push(new Paragraph({ spacing: { after: 60 } }));

  // Main Contract Title
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: titleKh,
          bold: true,
          size: 26,
          font: FONT_MOUL,
          color: '0F172A',
        }),
      ],
      spacing: { after: 20 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: titleZh,
          bold: true,
          size: 22,
          font: FONT_ZH,
          color: '1E3A8A',
        }),
        ...(isTrilingual
          ? [
              new TextRun({
                text: ` • ${titleEn}`,
                bold: true,
                size: 17,
                color: '475569',
                font: FONT_EN,
              }),
            ]
          : []),
      ],
      spacing: { after: 30 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'រវាង (之间 / BETWEEN)', size: 16, font: FONT_KHMER, color: '64748B' }),
      ],
      spacing: { after: 30 },
    })
  );

  // Contracting Parties Box
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `ក្រុមហ៊ុន ${data.companyNameKh} (ហៅកាត់ថា ភាគី ក) / ${data.companyNameEn} 叫方 (A)\n`,
          bold: true,
          size: 18,
          font: FONT_MOUL,
          color: '0F172A',
        }),
        new TextRun({
          text: `អាសយដ្ឋាន/地址 ៖ ${data.companyAddress || 'រាជធានីភ្នំពេញ ព្រះរាជាណាចក្រកម្ពុជា / Phnom Penh, Cambodia'}\n`,
          size: 17,
          font: FONT_KHMER,
          color: '334155',
        }),
        new TextRun({
          text: 'និង (和 / AND)\n',
          size: 16,
          font: FONT_KHMER,
          color: '64748B',
        }),
        new TextRun({
          text: `កម្មករនិយោជិតឈ្មោះ ${data.employeeNameKh || data.employeeNameEn} (ហៅកាត់ថា ភាគី ខ) / 员工 叫方 (B)`,
          bold: true,
          size: 18,
          font: FONT_MOUL,
          color: '0F172A',
        }),
      ],
      spacing: { line: 280, after: 60 },
    })
  );

  // Employee Information Table: Dynamic based on Cambodian vs Foreigner
  const employeeRows: TableRow[] = [
    // Row 1: Name, Sex, Age
    new TableRow({
      children: [
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'ឈ្មោះ / 名字: ', bold: true, size: 17, font: FONT_KHMER }),
                new TextRun({ text: `${data.employeeNameKh} (${data.employeeNameEn})`, bold: true, size: 17, font: FONT_KHMER, color: '1E3A8A' }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'ភេទ / 性别: ', bold: true, size: 17, font: FONT_KHMER }),
                new TextRun({ text: `${data.genderKh} (${data.genderZh})`, size: 17, font: FONT_KHMER }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'អាយុ / 年龄: ', bold: true, size: 17, font: FONT_KHMER }),
                new TextRun({ text: `${data.age} ឆ្នាំ/岁`, size: 17, font: FONT_KHMER }),
              ],
            }),
          ],
        }),
      ],
    }),

    // Row 2: DOB, Education, Position
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'ថ្ងៃខែឆ្នាំកំណើត / 出生日期:\n', bold: true, size: 17, font: FONT_KHMER }),
                new TextRun({ text: data.dob, size: 17, font: FONT_KHMER }),
              ],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'កម្រិតវប្បធម៌ / 教育程度:\n', bold: true, size: 17, font: FONT_KHMER }),
                new TextRun({ text: data.education || 'មធ្យមសិក្សា / 中学', size: 17, font: FONT_KHMER }),
              ],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'មុខតំណែង / 职位:\n', bold: true, size: 17, font: FONT_KHMER }),
                new TextRun({ text: data.position, bold: true, size: 17, color: '0284C7', font: FONT_KHMER }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  if (isForeigner) {
    // Foreigner specific rows: Passport, Visa, Work Permit
    employeeRows.push(
      // Row 3: Nationality & Passport
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'សញ្ជាតិ / 國籍 / Nationality:\n', bold: true, size: 17, font: FONT_KHMER }),
                  new TextRun({ text: data.nationality || 'Chinese / 中国', size: 17, font: FONT_KHMER }),
                ],
              }),
            ],
          }),
          new TableCell({
            columnSpan: 2,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'លេខលិខិតឆ្លងដែន / 护照号码 / Passport No: ', bold: true, size: 17, font: FONT_KHMER }),
                  new TextRun({ text: `${data.passportNo || 'E12345678'} (Exp: ${data.passportExpiry || '2028'})`, size: 17, font: FONT_KHMER }),
                ],
              }),
            ],
          }),
        ],
      }),
      // Row 4: Visa & Work Permit
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'ទិដ្ឋាការការងារ / 商务签证 / Visa E:\n', bold: true, size: 17, font: FONT_KHMER }),
                  new TextRun({ text: `${data.visaNo || 'CB-2026-99'} (Exp: ${data.visaExpiry || '2027'})`, size: 17, font: FONT_KHMER }),
                ],
              }),
            ],
          }),
          new TableCell({
            columnSpan: 2,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'ប័ណ្ណការងារ / 劳工证 / Work Permit: ', bold: true, size: 17, font: FONT_KHMER }),
                  new TextRun({ text: `${data.workPermitNo || 'WP-MLVT-2026-088'} (Exp: ${data.workPermitExpiry || '2027'})`, size: 17, font: FONT_KHMER }),
                ],
              }),
            ],
          }),
        ],
      }),
      // Row 5: Join Date & Employee ID
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'ថ្ងៃចូលធ្វើការ / 进厂日期: ', bold: true, size: 17, font: FONT_KHMER }),
                  new TextRun({ text: data.joinDate, size: 17, font: FONT_KHMER }),
                ],
              }),
            ],
          }),
          new TableCell({
            columnSpan: 2,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'អត្តលេខ / 工号: ', bold: true, size: 17, font: FONT_KHMER }),
                  new TextRun({ text: data.employeeId, bold: true, size: 17, color: '1E3A8A', font: FONT_KHMER }),
                ],
              }),
            ],
          }),
        ],
      }),
      // Row 6: Address
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'អាសយដ្ឋានបច្ចុប្បន្ន / 现住地址: ', bold: true, size: 17, font: FONT_KHMER }),
                  new TextRun({ text: data.address, size: 17, font: FONT_KHMER }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    // Cambodian Citizen rows: National ID, NSSF
    employeeRows.push(
      // Row 3: National ID, NSSF No
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'អត្តសញ្ញាណប័ណ្ណ / 身份证号码:\n', bold: true, size: 17, font: FONT_KHMER }),
                  new TextRun({ text: data.nationalId, size: 17, font: FONT_KHMER }),
                ],
              }),
            ],
          }),
          new TableCell({
            columnSpan: 2,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'លេខកាត ប.ស.ស / NSSF 号码: ', bold: true, size: 17, font: FONT_KHMER }),
                  new TextRun({ text: data.nssfNo || 'N/A', size: 17, font: FONT_KHMER }),
                ],
              }),
            ],
          }),
        ],
      }),
      // Row 4: Join Date, Employee ID
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'ថ្ងៃចូលធ្វើការ / 进厂日期: ', bold: true, size: 17, font: FONT_KHMER }),
                  new TextRun({ text: data.joinDate, size: 17, font: FONT_KHMER }),
                ],
              }),
            ],
          }),
          new TableCell({
            columnSpan: 2,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'អត្តលេខ / 工号: ', bold: true, size: 17, font: FONT_KHMER }),
                  new TextRun({ text: data.employeeId, bold: true, size: 17, color: '1E3A8A', font: FONT_KHMER }),
                ],
              }),
            ],
          }),
        ],
      }),
      // Row 5: Address
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'អាសយដ្ឋានបច្ចុប្បន្ន / 现住地址: ', bold: true, size: 17, font: FONT_KHMER }),
                  new TextRun({ text: data.address, size: 17, font: FONT_KHMER }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  }

  const employeeTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderThin,
    rows: employeeRows,
  });
  paragraphs.push(employeeTable);

  // ISO Quality Preamble
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: '\nភាគីទាំងពីរបានព្រមព្រៀងគ្នាក្នុងកិច្ចសន្យាការងារដូចខាងក្រោម ៖\n', bold: true, size: 18, font: FONT_MOUL }),
        new TextRun({ text: '双方同意聘用合同如下：\n', bold: true, size: 17, font: FONT_ZH, color: '1E3A8A' }),
        new TextRun({
          text: typeConfig.preambleKh,
          size: 17,
          font: FONT_KHMER,
        }),
      ],
      spacing: { line: 260, after: 30 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: typeConfig.preambleZh,
          size: 16,
          font: FONT_ZH,
          color: '334155',
        }),
      ],
      spacing: { line: 260, after: 60 },
    })
  );

  // ARTICLE 1: Dynamic based on Type
  let art1Kh = '';
  let art1Zh = '';
  let art1En = '';

  if (contractType === 'PROBATION') {
    art1Kh = `ថិរវេលានៃកិច្ចសន្យាសាកល្បងមានរយៈពេល ${data.probationDurationMonths || 2} ខែ ចាប់ពីថ្ងៃទី ${data.startDate} ដល់ថ្ងៃទី ${data.endDate}។ រយៈពេលសាកល្បងនេះត្រូវអនុលោមតាមមាត្រា ៦៨ នៃច្បាប់ស្តីពីការងារ (១ខែសម្រាប់កម្មករមិនជំនាញ, ២ខែសម្រាប់កម្មករជំនាញ, ៣ខែសម្រាប់បុគ្គលិកការិយាល័យ/អ្នកគ្រប់គ្រង)។ អនុលោមតាមមាត្រា ៨២ នៃច្បាប់ស្តីពីការងារ ក្នុងអំឡុងពេលសាកល្បង ភាគីទាំងពីរអាចបញ្ចប់កិច្ចសន្យាបានគ្រប់ពេលវេលាដោយមិនចាំបាច់ជូនដំណឹងជាមុន និងគ្មានសំណងឡើយ។`;
    art1Zh = `试用期合同期限为 ${data.probationDurationMonths || 2} 个月，自 ${data.startDate} 起至 ${data.endDate} 止。试用期严格依照柬埔寨《劳动法》第68条规定执行（非技术工1个月，技术工2个月，管理人员3个月）。依照第82条规定，在试用期间，任何一方均可随时终止合同，无需事先书面通知且不作任何赔偿。`;
    art1En = `Probation Period: ${data.probationDurationMonths || 2} months, effective from ${data.startDate} to ${data.endDate}, pursuant to Article 68 of the Labour Law. Pursuant to Article 82, either party may terminate this contract during probation without advance notice or indemnity.`;
  } else if (contractType === 'FDC') {
    art1Kh = `កិច្ចសន្យាការងារនេះមានថិរវេលាកំណត់ច្បាស់លាស់ (FDC) ចាប់ពីថ្ងៃទី ${data.startDate} ដល់ថ្ងៃទី ${data.endDate} (សរុប ${data.durationText || '១ ឆ្នាំ'})។ កិច្ចសន្យានេះត្រូវអនុលោមតាមមាត្រា ៦៧ និង ៧៣ នៃច្បាប់ស្តីពីការងារ និងសេចក្តីណែនាំលេខ ០៥០/១៩ របស់ក្រសួងការងារ។ ក្នុងករណីភាគីណាមួយមិនមានបំណងបន្តកិច្ចសន្យាថ្មី ត្រូវជូនដំណឹងជាលាយលក្ខណ៍អក្សរជាមុនស្របតាមមាត្រា ៧៣ (៥ថ្ងៃ សម្រាប់កិច្ចសន្យា ≤ ៦ខែ, ១០ថ្ងៃ សម្រាប់កិច្ចសន្យា > ៦ខែ ដល់ ១ឆ្នាំ, និង ១៥ថ្ងៃ សម្រាប់កិច្ចសន្យា > ១ឆ្នាំ ដល់ ២ឆ្នាំ)។`;
    art1Zh = `本合同为固定期限劳动合同（FDC），自 ${data.startDate} 起至 ${data.endDate} 止（共计 ${data.durationText || '1年'}）。严格依照柬埔寨《劳动法》第67条、第73条及劳工部第050/19号指导通告执行。任何一方若不拟续签新合同，须依照第73条提前书面通知（合同≤6个月提前5天；合同>6个月至1年提前10天；合同>1年至2年提前15天）。`;
    art1En = `Fixed Duration Contract (FDC) effective from ${data.startDate} to ${data.endDate} (duration: ${data.durationText || '1 Year'}), pursuant to Articles 67 & 73 of the Labour Law and MLVT Instruction No. 050/19. Prior notice of non-renewal requires: 5 days for <= 6 months, 10 days for > 6 mo to 1 yr, and 15 days for > 1 yr to 2 yr.`;
  } else if (contractType === 'UDC') {
    art1Kh = `កិច្ចសន្យាការងារនេះជាប្រភេទកិច្ចសន្យាមានថិរវេលាមិនកំណត់ (UDC) ចាប់ផ្តើមអនុវត្តពីថ្ងៃទី ${data.startDate} ដោយគ្មានកាលបរិច្ឆេទបញ្ចប់ឡើយ។ កិច្ចសន្យានេះបន្តមានសុពលភាពជាប់ជាប្រចាំ រហូតដល់ត្រូវបានបញ្ចប់ស្របតាមនីតិវិធីច្បាប់ការងារនៃព្រះរាជាណាចក្រកម្ពុជា មាត្រា ៦៧, ៧៤, ៧៥ និងមាត្រា ៨៩ ថ្មី។`;
    art1Zh = `本合同为无固定期限劳动合同（UDC），自 ${data.startDate} 起正式生效，无明确终止日期。除非双方依法予以解除或终止，本合同长期持续有效，严格依照柬埔寨《劳动法》第67条、第74条、第75条及新第89条规定执行。`;
    art1En = `Undetermined Duration Contract (UDC) effective from ${data.startDate} without fixed end date. The contract remains continuously valid until lawfully terminated pursuant to Articles 67, 74, 75, and New Article 89 of the Labour Law.`;
  } else {
    // FOREIGN_FDC
    art1Kh = `កិច្ចសន្យាការងារសម្រាប់បុគ្គលិកជនបរទេសនេះ មានថិរវេលាកំណត់ចាប់ពីថ្ងៃទី ${data.startDate} ដល់ថ្ងៃទី ${data.endDate} ស្របតាមសុពលភាពនៃប័ណ្ណការងារជនបរទេស (Work Permit) និងទិដ្ឋាការការងារ (Visa E) របស់ព្រះរាជាណាចក្រកម្ពុជា។ កិច្ចសន្យានេះអាចបន្តបានលុះត្រាតែមានការព្រមព្រៀងជាលាយលក្ខណ៍អក្សរពីភាគីទាំងពីរ និងការអនុម័តបន្តប័ណ្ណការងារស្របច្បាប់ពីក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ (MLVT/FWCMS)។`;
    art1Zh = `本外籍员工劳动合同为固定期限合同，自 ${data.startDate} 起至 ${data.endDate} 止，与乙方的柬埔寨王国合法商务签证（Visa E）及外籍劳工证（Work Permit）有效期相匹配。双方经协商一致并依法向柬埔寨劳工部（FWCMS）成功续办外籍劳工证后，方可签署续签协议。`;
    art1En = `Fixed Duration Contract for Foreign Employee effective from ${data.startDate} to ${data.endDate}, aligned with the validity of the foreign employee's Cambodian Business Visa (E-Visa) and MLVT Foreign Work Permit. Contract renewal requires mutual written agreement and approval of Work Permit renewal via FWCMS.`;
  }

  addArticleTitle('១', '1', typeConfig.art1TitleKh, typeConfig.art1TitleZh, typeConfig.art1TitleEn);
  addClauseText(art1Kh, art1Zh, art1En);

  // ARTICLE 2: Working Hours & Leave
  addArticleTitle(
    '២',
    '2',
    'ម៉ោងធ្វើការ និងការឈប់សម្រាកប្រចាំឆ្នាំ',
    '工作时间和带薪休假',
    'WORKING HOURS & LEAVE'
  );
  addClauseText(
    `ក/- ម៉ោងធ្វើការត្រូវអនុវត្តតាមបទបញ្ជាផ្ទៃក្នុងរបស់រោងចក្រ/ក្រុមហ៊ុន។\nខ/- គណៈគ្រប់គ្រងមានសិទ្ធិចាត់ចែង និងគ្រប់គ្រងម៉ោងធ្វើការស្របតាមមុខងារ និងវេនការងារជាក់ស្តែង។`,
    `A/- 工作时间遵循公司内部规章制度。\nB/- 管理层有权根据职能和工作班次来管理工作时间。`,
    `A/- Working hours comply with factory internal regulations.\nB/- Management reserves the right to manage working hours based on operational functions and shifts.`
  );

  // ==========================================
  // PAGE 2: WORKING HOURS CONT., WAGES, RULES, LEAVE REGULATIONS
  // ==========================================
  paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
  paragraphs.push(createIsoHeaderTable(2));
  paragraphs.push(new Paragraph({ spacing: { after: 60 } }));

  addClauseText(
    `គ/- គណៈគ្រប់គ្រងមានសិទ្ធិកែប្រែម៉ោងធ្វើការ ឬម៉ោងទទួលទានអាហារ ដរាបណាម៉ោងធ្វើការធម្មតាមិនលើសពី ៨ ម៉ោងក្នុងមួយថ្ងៃ (ឬ ៤៨ ម៉ោងក្នុងមួយសប្តាហ៍) អនុលោមតាមមាត្រា ១៣៧ នៃច្បាប់ស្តីពីការងារ។\nឃ/- ក្រុមហ៊ុនផ្តល់ជូនកម្មករនិយោជិតនូវថ្ងៃឈប់សម្រាកបុណ្យជាតិដែលមានប្រាក់ឈ្នួល ៖\n• ថ្ងៃឈប់បុណ្យជាតិ ៖ គោរពតាមសេចក្តីប្រកាសប្រចាំឆ្នាំរបស់ក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ។\n• ច្បាប់ឈឺ ៖ អនុវត្តតាមច្បាប់ការងារ និងបទបញ្ជាផ្ទៃក្នុង (ត្រូវភ្ជាប់វិញ្ញាបនបត្រពេទ្យស្របច្បាប់)។\n• គ្រោះថ្នាក់ការងារ ៖ ធានារ៉ាប់រងដោយរបបសន្តិសុខសង្គម ប.ស.ស. (NSSF)។\n• ច្បាប់ពិសេសក្នុងគ្រួសារ ៖ យោងមាត្រា ១៦៩ នៃច្បាប់ការងារ (អាពាហ៍ពិពាហ៍, បុណ្យសព, សម្រាលកូន)។`,
    `C/- 管理层有权更改工作时间或用餐时间，只要正常工作时间为每日不超过八小时（每周不超过48小时），依照《劳动法》第137条。\nD/- 公司为所有员工提供带薪公共假期：\n• 假期：遵循劳工部年度法定假日通告。\n• 病假：遵循劳工部及厂规（须提供合法医院诊断证明）。\n• 工伤事故：遵循劳工部并依法享受国家社保局（NSSF）工伤待遇。\n• 特假：遵守劳工部第169条规定（婚丧礼节假、产假等）。`,
    `C/- Management may adjust working/meal schedules within statutory limits of 8h/day (48h/week) pursuant to Article 137.\nD/- Paid holidays adhere to MLVT annual Prakas, paid sick leave with certified medical note, NSSF work injury coverage, and special family leave pursuant to Article 169.`
  );

  // ARTICLE 3: Wages & Severance / Seniority / Tax
  addArticleTitle(
    '៣',
    '3',
    'ប្រាក់ឈ្នួល ប្រាក់រង្វាន់ និងអត្ថប្រយោជន៍ផ្សេងៗ',
    '工资、奖金和其他福利',
    'WAGES, BONUSES & BENEFITS'
  );

  let art3ExtraKh = '';
  let art3ExtraZh = '';
  let art3ExtraEn = '';
  if (contractType === 'FDC') {
    art3ExtraKh = `\n• ប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យា ៥% (Severance Indemnity 5%) ៖ នៅពេលកិច្ចសន្យា FDC នេះផុតកំណត់ដោយបរិបូណ៌ កម្មករនិយោជិតមានសិទ្ធិទទួលបានប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យាចំនួន ៥% នៃប្រាក់ឈ្នួលសរុបដែលបានបើកជូនក្នុងអំឡុងពេលនៃកិច្ចសន្យា ស្របតាមមាត្រា ៧៣ នៃច្បាប់ស្តីពីការងារ។`;
    art3ExtraZh = `\n• 5% 期满遣散补偿金（Severance 5%）：固定期限合同期满正常终止时，乙方依法享有相当于合同期内已发全部工资总额 5% 的遣散补偿金，依照《劳动法》第73条。`;
    art3ExtraEn = `\n• 5% Severance Indemnity: Upon normal expiry of this FDC, Employee is entitled to 5% of all wages paid throughout the contract duration per Article 73.`;
  } else if (contractType === 'UDC') {
    art3ExtraKh = `\n• ប្រាក់បំណាច់អតីតភាពការងារ (Seniority Indemnity) ៖ កម្មករនិយោជិតមានសិទ្ធិទទួលបានប្រាក់បំណាច់អតីតភាពការងារចំនួន ១៥ ថ្ងៃក្នុងមួយឆ្នាំ ដោយត្រូវចែកបើកជា ២ លើក (៧.៥ ថ្ងៃក្នុងខែមិថុនា និង ៧.៥ ថ្ងៃក្នុងខែធ្នូ) ស្របតាមមាត្រា ៨៩ ថ្មី នៃច្បាប់ការងារ និងប្រកាសលេខ ៤៤២/១៨។`;
    art3ExtraZh = `\n• 工龄年资补偿金（Seniority Indemnity）：乙方每年享有15天工资的工龄年资补偿，分两次全额发放（6月份7.5天，12月份7.5天），严格依照《劳动法》新第89条及劳工部第442/18号令。`;
    art3ExtraEn = `\n• Seniority Indemnity: Employee is entitled to 15 days/year of seniority indemnity, paid semi-annually (7.5 days in June, 7.5 days in Dec) pursuant to New Article 89 & Prakas 442/18.`;
  } else if (contractType === 'FOREIGN_FDC') {
    art3ExtraKh = `\n• ពន្ធលើប្រាក់បៀវត្ស ៖ ប្រាក់ឈ្នួលត្រូវបានគណនាជា USD។ និយោជិតត្រូវស្ថិតនៅក្រោមកាតព្វកិច្ចពន្ធកាត់ទុកលើប្រាក់បៀវត្ស (Tax on Salary) ស្របតាមច្បាប់សារពើពន្ធកម្ពុជា។ ក្រុមហ៊ុនទទួលបន្ទុកកាត់ពន្ធ និងបង់ជូនអគ្គនាយកដ្ឋានពន្ធដារ។`;
    art3ExtraZh = `\n• 薪酬个税代扣：薪资以美元（USD）核算。乙方须依法承担柬埔寨王国个人薪酬所得税（Tax on Salary），由甲方依法代扣代缴。`;
    art3ExtraEn = `\n• Salary Tax: Salary is in USD and subject to withholding tax on salary under Cambodian tax law, deducted and remitted by Employer.`;
  }

  addClauseText(
    `• ប្រាក់ឈ្នួលត្រូវបានគណនាផ្អែកលើចំនួនថ្ងៃធ្វើការជាក់ស្តែងរបស់កម្មករនិយោជិត។\n• ក្រុមហ៊ុនផ្តល់ប្រាក់ឈ្នួលគោលប្រចាំខែចំនួន $${data.basicSalaryUsd || 208} ដុល្លារអាមេរិក (មិនទាបជាងកម្រិតប្រាក់ឈ្នួលអប្បបរមាប្រចាំឆ្នាំដែលប្រកាសដោយក្រសួងការងារឡើយ)។\n• ក្នុងករណីក្រុមហ៊ុនមានការងារបន្ទាន់ ក្រុមហ៊ុនអាចស្នើសុំកម្មករនិយោជិតធ្វើការបន្ថែមម៉ោង (ដោយស្ម័គ្រចិត្ត) ៖\n- ការងារបន្ថែមម៉ោងធម្មតា ត្រូវបានគិតប្រាក់ស្មើ ១.៥ ដង (១៥០%) នៃប្រាក់ឈ្នួលម៉ោងធម្មតា អនុលោមតាមមាត្រា ១៣៩ នៃច្បាប់ស្តីពីការងារ។\n- ការងារបន្ថែមម៉ោងនៅថ្ងៃឈប់បុណ្យជាតិ ឬថ្ងៃអាទិត្យ ត្រូវបានគិតស្មើ ២.០ ដង (២០០%) នៃប្រាក់ឈ្នួលធម្មតា។${art3ExtraKh}`,
    `• 工资是根据员工实际出勤天数计算的。\n• 公司给每月的法定基本工资为 $${data.basicSalaryUsd || 208} 美元（本公司以劳工部公布的年度最低工资为准，绝不低于法定底线）。\n• 如果公司有紧急生产任务，公司会要求工人加班（自愿原则）：\n- 平时定期加班等于每小时工资的 1.5 倍（150%），或根据《劳动法》第139条。\n- 节假日/周日加班：遵循劳工部规定发放（100%+100% = 200%）。${art3ExtraZh}`,
    `• Wages calculated based on actual working days.\n• Monthly basic wage: USD $${data.basicSalaryUsd || 208} (never below statutory MLVT minimum wage).\n• Voluntary Overtime: Regular OT at 1.5x (150%) pursuant to Article 139; Sunday/Public Holiday OT at 2.0x (200%).${art3ExtraEn}`
  );

  // ARTICLE 4: Quality & Work Rules (ISO 9001:2015 Focus)
  addArticleTitle(
    '៤',
    '4',
    'វិន័យការងារ គុណភាព និងសុវត្ថិភាពការងារ (ISO 9001:2015)',
    '遵守工厂规章、质量保证与作业安全',
    'FACTORY WORK RULES & ISO QUALITY'
  );
  addClauseText(
    `កម្មករនិយោជិតត្រូវគោរពបទបញ្ជាផ្ទៃក្នុងរបស់រោងចក្រ គោរពការគ្រប់គ្រងរបស់ប្រធានផ្នែក គោរពការចាត់តាំងការងារ និងការផ្លាស់ប្តូរផ្នែក ក្រុម ឬមុខតំណែង ស្តាប់តាមការណែនាំរបស់អ្នកគ្រប់គ្រង និងធានាគុណភាព បរិមាណការងារប្រកបដោយសុវត្ថិភាព ទាន់ពេលវេលា និងកាត់បន្ថយការខូចខាត (Zero Defect) ស្របតាមគោលនយោបាយគុណភាព ISO 9001:2015 របស់រោងចក្រ។`,
    `员工必须严格遵守工厂的规章制度，尊重主管的管理，服从调动部门、班组或岗位的安排，听从主管的正当指示，严格执行作业指导书（SOP），及时、安全地保证产品质量和产量，追求零缺陷，贯彻执行 ISO 9001:2015 质量方针。`,
    `Employees must strictly observe internal factory rules, obey managerial supervision, job rotations, follow SOPs, and uphold ISO 9001:2015 quality objectives (Zero Defect), ensuring safe and punctual output.`
  );

  // ARTICLE 5: Leave Regulations
  addArticleTitle(
    '៥',
    '5',
    'ការសុំច្បាប់អនុញ្ញាត និងការឈប់គ្មានច្បាប់',
    '授权/未经授权请假',
    'LEAVE APPLICATION REGULATIONS'
  );
  addClauseText(
    `កម្មករនិយោជិតដែលមានធុរៈផ្ទាល់ខ្លួនមិនអាចមកបំពេញការងារបាន ត្រូវបំពេញពាក្យសុំច្បាប់ជាលាយលក្ខណ៍អក្សរយ៉ាងហោចណាស់ ១ ថ្ងៃមុន ទៅកាន់ថ្នាក់គ្រប់គ្រង។ ក្នុងករណីមានជំងឺធ្ងន់ធ្ងរ ឬការសង្គ្រោះបន្ទាន់ និយោជិតអាចជូនដំណឹងតាមរយៈតំណាង ឬតាមទូរស័ព្ទ ប៉ុន្តែត្រូវបញ្ជូនលិខិតសុំច្បាប់មកក្រុមហ៊ុនក្នុងរយៈពេលយ៉ាងយូរ ២ ថ្ងៃបន្ទាប់ពីថ្ងៃចាប់ផ្តើមឈប់។ ប្រសិនបើឈឺ និយោជិតត្រូវមានវិញ្ញាបនបត្រត្រឹមត្រូវពីគ្រូពេទ្យ។ ការឈប់សម្រាកដោយគ្មានការអនុញ្ញាត និងគ្មានលិខិតបញ្ជាក់ច្បាស់លាស់ ត្រូវចាត់ទុកជាអវត្តមានឥតច្បាប់។`,
    `员工如果有个人事务而无法到岗，必须至少提前一天向管理层填写书面请假申请表。如遇重病/紧急需要，员工可透过代表申请休假或电话通知主管，但必须在请假后两天内提交书面请假单。如果生病，员工必须向公司提交正规医院开具的有效病假证明。未事先告知且无法提供有效证明的，一律按旷工处理。`,
    `Personal leave requires written advance application at least 1 day prior. In case of acute illness or emergency, notice via phone/representative is accepted, provided formal application is submitted within 2 days. Doctor's certificate is required for sick leave; otherwise treated as unauthorized absence.`
  );

  // ==========================================
  // PAGE 3: ABSENTEEISM, DISCIPLINE, BONUSES, STRICT PROHIBITIONS
  // ==========================================
  paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
  paragraphs.push(createIsoHeaderTable(3));
  paragraphs.push(new Paragraph({ spacing: { after: 60 } }));

  // ARTICLE 6: Absenteeism
  addArticleTitle(
    '៦',
    '6',
    'ការចាត់វិធានការចំពោះអវត្តមានឥតច្បាប់',
    '旷工处理',
    'ABSENTEEISM PENALTIES'
  );
  addClauseText(
    `• អវត្តមានឥតច្បាប់តិចជាង ២ ថ្ងៃ ៖ ត្រូវចាត់ទុកជាកំហុសស្រាល (អប់រំណែនាំ និងកត់ត្រា)។\n• អវត្តមានឥតច្បាប់ពី ២ ថ្ងៃ ដល់ ៥ ថ្ងៃ ៖ ត្រូវចាត់ទុកជាកំហុសមធ្យម (ទទួលលិខិតព្រមាន)។\n• អវត្តមានឥតច្បាប់ចាប់ពី ៦ ថ្ងៃក្នុងមួយខែឡើងទៅ ៖ ត្រូវចាត់ទុកជាការបោះបង់ការងារ ដែលជាកំហុសធ្ងន់ធ្ងរ និងនាំឱ្យមានការបញ្ចប់កិច្ចសន្យាការងារភ្លាមៗដោយគ្មានសំណង ស្របតាមមាត្រា ៨៣ និង ៨៤ នៃច្បាប់ស្តីពីការងារ។`,
    `• 旷工不到 2 天，将被视为轻微过失（口头批评教育并记入档案）。\n• 旷工从 2 天到 5 天，视为中度违纪（给予正式书面警告）。\n• 旷工从每月 6 天起，直接被视为自动放弃工作，构成严重违纪违法行为，公司将予以立即开除并不作任何补偿，依照《劳动法》第83条及84条。`,
    `• Absenteeism < 2 days: Minor fault (oral reprimand & documented).\n• Absenteeism 2-5 days: Moderate fault (formal written warning).\n• Absenteeism >= 6 days/month: Deemed job abandonment / gross misconduct, resulting in summary dismissal without indemnity pursuant to Articles 83 & 84.`
  );

  // ARTICLE 7: Disciplinary Procedure
  addArticleTitle(
    '៧',
    '7',
    'នីតិវិធីនៃវិធានការវិន័យ',
    '纪律处分程序',
    'DISCIPLINARY PROCEDURES'
  );
  addClauseText(
    `• កំហុសស្រាល ៖ លើកទី១ អប់រំណែនាំផ្ទាល់មាត់ និងកត់ត្រាក្នុងសំណុំរឿងបុគ្គលិក។ ប្រសិនបើប្រព្រឹត្តកំហុសដដែលលើកទី២ នឹងទទួលការព្រមានជាលាយលក្ខណ៍អក្សរលើកទី១។ ប្រសិនបើនៅតែបន្តប្រព្រឹត្តទៀត នឹងទទួលការព្រមានជាលាយលក្ខណ៍អក្សរលើកទី២។ ប្រសិនបើមិនកែប្រែទេ នឹងឈានដល់ការបញ្ចប់កិច្ចសន្យាការងារ។\n• កំហុសមធ្យម ៖ លើកទី១ ទទួលលិខិតព្រមានជាលាយលក្ខណ៍អក្សរលើកទី១។ ប្រសិនបើប្រព្រឹត្តកំហុសលើកទី២ នឹងទទួលលិខិតព្រមានលើកទី២។ ប្រសិនបើមិនកែប្រែទេ នឹងត្រូវបញ្ឈប់ពីការងារ។\n• កំហុសធ្ងន់ធ្ងរ ៖ អនុវត្តតាមមាត្រា ៨៣ នៃច្បាប់ស្តីពីការងារ ក្រុមហ៊ុនមានសិទ្ធិបញ្ឈប់ពីការងារជាបន្ទាន់ដោយគ្មានសំណងអ្វីទាំងអស់។\n• សុពលភាពលិខិតព្រមាន ៖ រាល់លិខិតព្រមានទាំងអស់មានសុពលភាពត្រឹម ១២ ខែ។ ក្រោយរយៈពេល ១២ ខែ លិខិតព្រមានចាស់នឹងត្រូវបានលុបចោល មិនយកមកគិតក្នុងវដ្តការងារបន្ទាប់ឡើយ។`,
    `• 轻微错误：首次犯规口头教育并记入个人档案；若第二次犯同样错误，发出第一次书面警告；再次犯错发出第二次书面警告；拒不改正者将导致终止雇佣关系。\n• 中度违纪：第一时间发出第一封书面警告信并载入档案；若犯第二次同类违纪，发出第二次书面警告；不悔改者终止劳动合同。\n• 严重违纪：依照《劳动法》第83条规定，公司将依法直接开除并终止劳动关系，不予支付任何解雇补偿金。\n• 警告信有效期限：满12个月后，之前的违纪警告记录归零，本公司不会将过往警告带入下一个服务年度。`,
    `• Minor Misconduct: 1st oral reprimand; 2nd written warning 1; 3rd written warning 2; further non-compliance leads to termination.\n• Moderate Misconduct: 1st written warning; 2nd written warning; followed by dismissal.\n• Gross Misconduct: Immediate termination without indemnity per Article 83.\n• Warning Validity: Disciplinary warnings expire after 12 months.`
  );

  // ARTICLE 8, 9, 10: Allowances & Bonuses
  addArticleTitle(
    '៨-៩-១០',
    '8-9-10',
    'ប្រាក់រង្វាន់ឧស្សាហ៍ព្យាយាម ប្រាក់ថ្លៃធ្វើដំណើរ និងថ្លៃបាយ',
    '全勤奖、交通住宿与午餐津贴',
    'ALLOWANCES & BONUSES'
  );
  addClauseText(
    `៨- ប្រាក់រង្វាន់ឧស្សាហ៍ព្យាយាម (Attendance Bonus) ៖ បុគ្គលិកដែលមកបំពេញការងារទៀងទាត់ពេញមួយខែ មិនដែលអវត្តមាន និងមិនយឺតយ៉ាវលើសពី ៣០ នាទី នឹងទទួលបានប្រាក់រង្វាន់ចំនួន $${data.attendanceBonusUsd || 15} ដុល្លារ/ខែ។\n៩- ប្រាក់ថ្លៃធ្វើដំណើរ និងស្នាក់នៅ (Transport & Housing) ៖ ក្រុមហ៊ុនផ្តល់ជូនចំនួន $${data.transportAllowanceUsd || 9.5} ដុល្លារ/ខែ ស្របតាមប្រកាសរបស់ក្រសួងការងារ។\n១០- ប្រាក់ថ្លៃបាយ/អាហារថ្ងៃត្រង់ (Meal Allowance) ៖ សម្រាប់ការងារលើសពី ៥ ម៉ោង ឬការងារបន្ថែមម៉ោង ផ្តល់ជូន ${data.mealAllowanceRiel || 2000} រៀល/ថ្ងៃ។`,
    `8- 全勤奖：每月全勤出勤、无矿工且迟到/早退累计少于30分钟者，每月全额发放 $${data.attendanceBonusUsd || 15} 美元全勤奖。\n9- 交通与住宿津贴：依照劳工部规定，公司每月发放 $${data.transportAllowanceUsd || 9.5} 美元交通住宿补贴。\n10- 膳食补助：正常工作时间满5小时或安排加班时，公司提供每日 ${data.mealAllowanceRiel || 2000} 瑞尔午餐补贴。`,
    `8- Attendance Bonus: USD $${data.attendanceBonusUsd || 15}/month for full monthly attendance with tardiness < 30 mins.\n9- Transport/Housing Allowance: USD $${data.transportAllowanceUsd || 9.5}/month pursuant to MLVT standards.\n10- Meal Allowance: KHR ${data.mealAllowanceRiel || 2000}/day for shifts > 5h or scheduled overtime.`
  );

  // ARTICLE 11: Strict Prohibitions
  addArticleTitle(
    '១១',
    '11',
    'ការហាមឃាត់ដាច់ខាតក្នុងរោងចក្រ',
    '严禁赌博、饮酒、吸毒及违禁品',
    'STRICT FACTORY PROHIBITIONS'
  );
  addClauseText(
    `ហាមឃាត់ដាច់ខាតនូវការលេងល្បែងស៊ីសង សេពគ្រឿងស្រវឹង គ្រឿងញៀន ឬការយកអាវុធ វត្ថុងាយឆេះ និងជាតិផ្ទុះចូលក្នុងបរិវេណរោងចក្រ។ ក្រុមហ៊ុនមានសិទ្ធិបញ្ឈប់ពីការងារជាបន្ទាន់ដោយគ្មានសំណងអ្វីទាំងអស់ ហើយចំពោះករណីធ្ងន់ធ្ងរ នឹងត្រូវបញ្ជូនទៅអាជ្ញាធរមានសមត្ថកិច្ចចាត់ការតាមផ្លូវច្បាប់។`,
    `厂区内绝对严禁参与任何赌博游戏、饮酒、吸毒、斗殴或携带武器、易燃易爆危险物品进入厂区。一经发现，公司有权立即开除并不作任何经济赔偿；情节严重触犯法律者，依法移送司法机关处理。`,
    `Strictly prohibited: Gambling, drinking alcohol, narcotics, bringing weapons, flammable or explosive items into factory premises. Immediate dismissal without compensation and referral to law enforcement.`
  );

  // ==========================================
  // PAGE 4: TERMINATION, EXECUTION, SIGNATURES & ISO APPROVAL
  // ==========================================
  paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
  paragraphs.push(createIsoHeaderTable(4));
  paragraphs.push(new Paragraph({ spacing: { after: 60 } }));

  // ARTICLE 12: Termination - Dynamic based on Type
  let art12SpecificKh = '';
  let art12SpecificZh = '';
  let art12SpecificEn = '';

  if (contractType === 'PROBATION') {
    art12SpecificKh = `• កិច្ចសន្យាសាកល្បងនេះនឹងត្រូវបញ្ចប់នៅពេលផុតកំណត់ ឬនៅពេលភាគីណាមួយសម្រេចបញ្ចប់ក្នុងអំឡុងពេលសាកល្បង ស្របតាមមាត្រា ៨២ នៃច្បាប់ការងារ ដោយមិនបាច់ជូនដំណឹងជាមុន និងគ្មានសំណងឡើយ។`;
    art12SpecificZh = `• 本试用合同期满或在试用期间任何一方提出终止，依《劳动法》第82条本合同即行终止，无需事先通知且无经济赔偿。`;
    art12SpecificEn = `• Contract ends upon expiry or termination by either party during probation per Article 82 without prior notice or indemnity.`;
  } else if (contractType === 'FDC') {
    art12SpecificKh = `• ការបញ្ចប់កិច្ចសន្យា FDC មុនកាលកំណត់ដោយគ្មានមូលហេតុត្រឹមត្រូវ ភាគីដែលបញ្ចប់ត្រូវសងការខូចខាតស្មើនឹងប្រាក់ឈ្នួលដែលនៅសល់រហូតដល់កាលបរិច្ឆេទផុតកំណត់នៃកិច្ចសន្យា (មាត្រា ៧៣)។ លើកលែងតែកំហុសធ្ងន់ធ្ងរ (មាត្រា ៨៣) ឬប្រធានសក្តិ។`;
    art12SpecificZh = `• 无正当理由单方提前解除本固定期限合同，须向对方赔偿截至期满应付剩余工资之经济损失（第73条），严重违纪（第83条）或不可抗力除外。`;
    art12SpecificEn = `• Early termination without cause requires paying damages equal to remaining wages until expiry per Article 73, except gross misconduct (Art. 83) or force majeure.`;
  } else if (contractType === 'UDC') {
    art12SpecificKh = `• ការបញ្ចប់កិច្ចសន្យា UDC ត្រូវជូនដំណឹងជាមុនជាលាយលក្ខណ៍អក្សរស្របតាមមាត្រា ៧៥ (៧ថ្ងៃ សម្រាប់ <៦ខែ; ១៥ថ្ងៃ សម្រាប់ ៦ខែ-១ឆ្នាំ; ១ខែ សម្រាប់ ១-២ឆ្នាំ; ២ខែ សម្រាប់ ២-៥ឆ្នាំ; ៣ខែ សម្រាប់លើសពី ៥ឆ្នាំ)។ ការបញ្ឈប់ដោយនិយោជកត្រូវទូទាត់សំណងជូនដំណឹង និងប្រាក់បំណាច់អតីតភាពដែលនៅសល់ លើកលែងតែកំហុសធ្ងន់ធ្ងរ (មាត្រា ៨៣)។`;
    art12SpecificZh = `• 解除无固定期限合同须按《劳动法》第75条提前书面通知（工龄<6个月提前7天；6个月至1年提前15天；1至2年提前1个月；2至5年提前2个月；5年以上提前3个月）。甲方解雇须结清代通知金及年资补偿，严重违纪除外。`;
    art12SpecificEn = `• Termination of UDC requires written notice per Article 75 (7d for <6m; 15d for 6m-1y; 1mo for 1-2y; 2mo for 2-5y; 3mo for >5y), plus notice indemnity and remaining seniority.`;
  } else {
    // FOREIGN_FDC
    art12SpecificKh = `• កិច្ចសន្យាបុគ្គលិកបរទេសនេះនឹងត្រូវបញ្ចប់ជាបន្ទាន់ក្នុងករណី ៖ (១) ភាគី ខ ត្រូវបានអាជ្ញាធរកម្ពុជាលុបចោល ឬបដិសេធមិនបន្តទិដ្ឋាការ ឬប័ណ្ណការងារ ឬត្រូវបានបញ្ជាឱ្យចាកចេញពីកម្ពុជា; (២) ប្រព្រឹត្តកំហុសវិជ្ជាជីវៈធ្ងន់ធ្ងរតាមមាត្រា ៨៣។ ក្រុមហ៊ុននឹងធ្វើការលុបឈ្មោះប័ណ្ណការងារក្នុងប្រព័ន្ធ FWCMS។`;
    art12SpecificZh = `• 外籍员工合同在下列情形下即行解除：(1) 工作签证或外籍劳工证被主管部门吊销、拒绝延期或被限期离境；(2) 严重违纪（第83条）。合同终止后，甲方在劳工部 FWCMS 系统注销劳工证。`;
    art12SpecificEn = `• Foreign contract terminates immediately if: (1) Work permit or visa is revoked, not renewed, or deported by authorities; (2) Gross misconduct per Article 83. Work permit canceled in FWCMS.`;
  }

  addArticleTitle(
    '១២',
    '12',
    'ការរំលាយ និងការបញ្ចប់កិច្ចសន្យាការងារ',
    '合同解除和终止',
    'CONTRACT TERMINATION'
  );
  addClauseText(
    `ក្រុមហ៊ុនមានសិទ្ធិបញ្ចប់កិច្ចសន្យាការងារភ្លាមៗដោយគ្មានសំណង និងគ្មានការជូនដំណឹងជាមុន ក្នុងករណី ៖\n• ភាគី ខ ប្រមូលផ្តុំបង្កចលាចល ដឹកនាំ ឬញុះញង់កម្មករឱ្យធ្វើកូដកម្មខុសច្បាប់ដោយគ្មានការអនុញ្ញាតតាមនីតិវិធីច្បាប់។\n• ភាគី ខ មានការធ្វេសប្រហែសធ្ងន់ធ្ងរលើការងារ កេងបន្លំ ក្លែងបន្លំ ឬលួចទ្រព្យសម្បត្តិក្រុមហ៊ុន ឬបំផ្លាញគុណភាពទំនិញដោយចេតនា។\n• ភាគី ខ បំពានយ៉ាងធ្ងន់ធ្ងរលើបទបញ្ជាផ្ទៃក្នុង និងវិធានសុវត្ថិភាពការងាររបស់រោងចក្រ។\n${art12SpecificKh}`,
    `在下列情形下，公司有权立即解除劳动合同并不支付任何经济补偿：\n• 乙方聚众闹事，带头或鼓动工人进行无合法理由、未依法提前书面申请的非法罢工。\n• 乙方严重失职、营私舞弊、盗窃公司财物或故意破坏生产质量与机器设备。\n• 乙方严重违反甲方规章制度及劳动安全操作规程。\n${art12SpecificZh}`,
    `Employer may terminate immediately without notice or severance in cases of: Leading illegal strikes/riots, gross negligence, fraud, theft of company property, or severe breaches of internal factory rules.\n${art12SpecificEn}`
  );

  // ARTICLE 13: Custody & Governing Law
  addArticleTitle(
    '១៣',
    '13',
    'ការអនុវត្ត និងការរក្សាទុកកិច្ចសន្យា',
    '合同一式两份与法律适用',
    'EXECUTION & GOVERNING LAW'
  );
  addClauseText(
    `កិច្ចសន្យានេះត្រូវបានធ្វើឡើងជា ២ ច្បាប់ដែលមានតម្លៃគតិយុត្តស្មើគ្នា ១ ច្បាប់រក្សាទុកនៅរោងចក្រ (ភាគី ក) និង ១ ច្បាប់ប្រគល់ជូនកម្មករនិយោជិត (ភាគី ខ)។ ក្រៅពីកិច្ចព្រមព្រៀងនេះ ក្រុមហ៊ុន និងនិយោជិតត្រូវគោរព និងអនុវត្តយ៉ាងម៉ឺងម៉ាត់តាមច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា និងបទបញ្ជាផ្ទៃក្នុងរបស់រោងចក្រ។`,
    `本合同一式两份，具有同等法律效力，一份由工厂（甲方）保管，一份由工人（乙方）妥善保管。除本协议约定外，公司和员工均应严格遵守柬埔寨王国《劳动法》及工厂内部各项法规。`,
    `Executed in 2 original copies with equal legal validity: 1 copy for Employer (Party A) and 1 copy for Employee (Party B). Both parties shall strictly abide by Cambodian Labour Law and internal factory rules.`
  );

  // Date and Signatures Box (甲方签字与盖章, 乙方签字与手印)
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: `ធ្វើនៅរាជធានីភ្នំពេញ, ថ្ងៃទី ${data.signedDate || '...................'} ខែ ............ ឆ្នាំ២០២៦\n于金边市签订，日期：${data.signedDate || '......年...月...日'}`,
          size: 17,
          font: FONT_KHMER,
          color: '334155',
        }),
      ],
      spacing: { before: 80, after: 100 },
    })
  );

  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderThin,
    rows: [
      new TableRow({
        children: [
          // Party A: Employer
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: borderThin,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'តំណាងភាគី និយោជក (ភាគី ក)\n', bold: true, size: 18, font: FONT_MOUL, color: '0F172A' }),
                  new TextRun({ text: '甲方（签字与盖章）\nEmployer / Party A (Signature & Stamp)', bold: true, size: 16, font: FONT_ZH, color: '1E3A8A' }),
                ],
                spacing: { after: 160 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '(ហត្ថលេខា និងត្រាក្រុមហ៊ុន / Stamp & Signature)\n\n\n\n\n', italics: true, size: 15, color: '94A3B8' }),
                  new TextRun({ text: 'ឈ្មោះ / 姓名: __________________________', size: 16, font: FONT_KHMER }),
                ],
              }),
            ],
          }),

          // Party B: Employee
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: borderThin,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'កម្មករនិយោជិត (ភាគី ខ)\n', bold: true, size: 18, font: FONT_MOUL, color: '0F172A' }),
                  new TextRun({ text: '乙方（签字与手印）\nEmployee / Party B (Signature & Thumbprint)', bold: true, size: 16, font: FONT_ZH, color: '1E3A8A' }),
                ],
                spacing: { after: 160 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '(ស្នាមមេដៃស្តាំ / 右手大拇指印 / Right Thumbprint)\n\n\n\n\n', italics: true, size: 15, color: '94A3B8' }),
                  new TextRun({ text: `ឈ្មោះ / 姓名: ${data.employeeNameKh || data.employeeNameEn}`, bold: true, size: 16, font: FONT_KHMER, color: '0F172A' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  paragraphs.push(signatureTable);

  // ISO 9001:2015 Document Approval Matrix Footer
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: '\nការត្រួតពិនិត្យ និងអនុម័តឯកសារប្រព័ន្ធ ISO 9001:2015 (Document Control Approval Matrix) ៖', bold: true, size: 16, font: FONT_MOUL, color: '0369A1' }),
      ],
      spacing: { before: 80, after: 40 },
    })
  );

  const isoApprovalTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderThin,
    rows: [
      new TableRow({
        children: [
          new TableCell({ width: { size: 33.3, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Prepared By / រៀបចំដោយ\n(HR Officer)', bold: true, size: 15, font: FONT_EN })] })] }),
          new TableCell({ width: { size: 33.3, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Reviewed By / ពិនិត្យដោយ\n(HR Manager / QMR)', bold: true, size: 15, font: FONT_EN })] })] }),
          new TableCell({ width: { size: 33.4, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Approved By / អនុម័តដោយ\n(General Manager / Director)', bold: true, size: 15, font: FONT_EN })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '\n\nSign: ______________\nDate: 01/01/2026', size: 14 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '\n\nSign: ______________\nDate: 01/01/2026', size: 14 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '\n\nSign: ______________\nDate: 01/01/2026', size: 14 })] })] }),
        ],
      }),
    ],
  });
  paragraphs.push(isoApprovalTable);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 900,
              right: 900,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
