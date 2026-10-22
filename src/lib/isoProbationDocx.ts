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

export interface IsoProbationDocxData {
  companyNameKh: string;
  companyNameEn: string;
  companyNameZh: string;
  companyAddress: string;
  docCode: string;
  revision: string;
  effectiveDate: string;
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
  probationDurationMonths: number | string;
  startDate: string;
  endDate: string;
  basicSalaryUsd: number | string;
  attendanceBonusUsd: number | string;
  transportAllowanceUsd: number | string;
  mealAllowanceRiel: number | string;
  signedDate: string;
  langMode?: 'trilingual' | 'bilingual_zh' | 'khmer';
}

const FONT_KHMER = 'Khmer OS Battambang';
const FONT_MOUL = 'Khmer OS Muol Light';
const FONT_ZH = 'SimSun';
const FONT_EN = 'Calibri';

const borderNone = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

const borderThin = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '334155' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '334155' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '334155' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '334155' },
};

export async function generateIsoProbationContractDocxBlob(data: IsoProbationDocxData): Promise<Blob> {
  const paragraphs: (Paragraph | Table)[] = [];
  const isTrilingual = data.langMode === 'trilingual' || !data.langMode;

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
                    new TextRun({ text: `Doc Code: ${data.docCode || 'LT-HR-SOP-002-F01'} | Rev: ${data.revision || '02'}\n`, size: 15, font: FONT_EN }),
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
  const addArticleTitle = (numKh: string, numZh: string, titleKh: string, titleZh: string, titleEn?: string) => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${numKh}- ${titleKh}`, bold: true, size: 20, font: FONT_MOUL, color: '0F172A' }),
        ],
        spacing: { before: 100, after: 20 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `${numZh}、${titleZh}`, bold: true, size: 18, font: FONT_ZH, color: '1E3A8A' }),
          ...(isTrilingual && titleEn ? [new TextRun({ text: ` (${titleEn})`, italics: true, size: 16, color: '64748B', font: FONT_EN })] : []),
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
  paragraphs.push(new Paragraph({ spacing: { after: 80 } }));

  // Main Contract Title
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'កិច្ចសន្យាការងារសាកល្បង',
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
          text: '试用工合同',
          bold: true,
          size: 22,
          font: FONT_ZH,
          color: '1E3A8A',
        }),
        ...(isTrilingual
          ? [
              new TextRun({
                text: ' • PROBATIONARY EMPLOYMENT CONTRACT',
                bold: true,
                size: 17,
                color: '475569',
                font: FONT_EN,
              }),
            ]
          : []),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'រវាង (之间 / BETWEEN)', size: 16, font: FONT_KHMER, color: '64748B' }),
      ],
      spacing: { after: 40 },
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
      spacing: { line: 280, after: 80 },
    })
  );

  // Employee Information Table (Bilingual Table matching user's Image 1)
  const employeeTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderThin,
    rows: [
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
      }),
    ],
  });
  paragraphs.push(employeeTable);

  // ISO Quality Objectives Preamble
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: '\nភាគីទាំងពីរបានព្រមព្រៀងគ្នាក្នុងកិច្ចសន្យាការងារដូចខាងក្រោម ៖\n', bold: true, size: 18, font: FONT_MOUL }),
        new TextRun({ text: '双方同意聘用合同如下：\n', bold: true, size: 17, font: FONT_ZH, color: '1E3A8A' }),
        new TextRun({
          text: 'កិច្ចសន្យាការងារសាកល្បងនេះ ផ្តល់ជូនបុគ្គលិកនូវស្មារតីទទួលខុសត្រូវ និងទំនុកចិត្តលើភារកិច្ចរបស់ខ្លួន ព្រមទាំងកិច្ចសហការល្អរវាងនិយោជិត និងនិយោជក យកចិត្តទុកដាក់ខ្ពស់ដើម្បីរួមគ្នាសម្រេចគោលដៅបរិមាណ និងគុណភាពផលិតកម្មរបស់រោងចក្រ ស្របតាមស្តង់ដារ ISO 9001:2015។',
          size: 17,
          font: FONT_KHMER,
        }),
      ],
      spacing: { line: 260, after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '这份试用合同为员工提供了责任感和对自己职责的信心，以及与员工之间的良好合作，高度重视，共同实现工厂生产的数量和质量目标，符合 ISO 9001:2015 质量管理体系标准。',
          size: 16,
          font: FONT_ZH,
          color: '334155',
        }),
      ],
      spacing: { line: 260, after: 80 },
    })
  );

  // ARTICLE 1: Probation Duration
  addArticleTitle(
    '១',
    '1',
    'រយៈពេលនៃកិច្ចសន្យាសាកល្បង',
    '试用期合同期限',
    'PROBATION DURATION'
  );
  addClauseText(
    `ថិរវេលានៃកិច្ចសន្យាសាកល្បងមានរយៈពេល ${data.probationDurationMonths || 2} ខែ ចាប់ពីថ្ងៃទី ${data.startDate} ដល់ថ្ងៃទី ${data.endDate}។ រយៈពេលសាកល្បងនេះត្រូវអនុលោមតាមមាត្រា ៦៨ នៃច្បាប់ស្តីពីការងារ (១ខែសម្រាប់កម្មករមិនជំនាញ, ២ខែសម្រាប់កម្មករជំនាញ, ៣ខែសម្រាប់បុគ្គលិកការិយាល័យ/អ្នកគ្រប់គ្រង)។ អនុលោមតាមមាត្រា ៨២ នៃច្បាប់ស្តីពីការងារ ក្នុងអំឡុងពេលសាកល្បង ភាគីទាំងពីរអាចបញ្ចប់កិច្ចសន្យាបានគ្រប់ពេលវេលាដោយមិនចាំបាច់ជូនដំណឹងជាមុន និងគ្មានសំណងឡើយ។`,
    `试用期合同期限为 ${data.probationDurationMonths || 2} 个月，自 ${data.startDate} 起至 ${data.endDate} 止。试用期严格依照柬埔寨《劳动法》第68条规定执行（非技术工1个月，技术工2个月，管理人员3个月）。依照第82条规定，在试用期间，任何一方均可随时终止合同，无需事先书面通知且不作任何赔偿。`,
    `Probation Period: ${data.probationDurationMonths || 2} months, effective from ${data.startDate} to ${data.endDate}, pursuant to Article 68 of the Labour Law. Pursuant to Article 82, either party may terminate this contract during probation without advance notice or indemnity.`
  );

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
  paragraphs.push(new Paragraph({ spacing: { after: 80 } }));

  addClauseText(
    `គ/- គណៈគ្រប់គ្រងមានសិទ្ធិកែប្រែម៉ោងធ្វើការ ឬម៉ោងទទួលទានអាហារ ដរាបណាម៉ោងធ្វើការធម្មតាមិនលើសពី ៨ ម៉ោងក្នុងមួយថ្ងៃ (ឬ ៤៨ ម៉ោងក្នុងមួយសប្តាហ៍) អនុលោមតាមមាត្រា ១៣៧ នៃច្បាប់ស្តីពីការងារ។\nឃ/- ក្រុមហ៊ុនផ្តល់ជូនកម្មករនិយោជិតនូវថ្ងៃឈប់សម្រាកបុណ្យជាតិដែលមានប្រាក់ឈ្នួល ៖\n• ថ្ងៃឈប់បុណ្យជាតិ ៖ គោរពតាមសេចក្តីប្រកាសប្រចាំឆ្នាំរបស់ក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ។\n• ច្បាប់ឈឺ ៖ អនុវត្តតាមច្បាប់ការងារ និងបទបញ្ជាផ្ទៃក្នុង (ត្រូវភ្ជាប់វិញ្ញាបនបត្រពេទ្យស្របច្បាប់)។\n• គ្រោះថ្នាក់ការងារ ៖ ធានារ៉ាប់រងដោយរបបសន្តិសុខសង្គម ប.ស.ស. (NSSF)។\n• ច្បាប់ពិសេសក្នុងគ្រួសារ ៖ យោងមាត្រា ១៦៩ នៃច្បាប់ការងារ (អាពាហ៍ពិពាហ៍, បុណ្យសព, សម្រាលកូន)។`,
    `C/- 管理层有权更改工作时间或用餐时间，只要正常工作时间为每日不超过八小时（每周不超过48小时），依照《劳动法》第137条。\nD/- 公司为所有员工提供带薪公共假期：\n• 假期：遵循劳工部年度法定假日通告。\n• 病假：遵循劳工部及厂规（须提供合法医院诊断证明）。\n• 工伤事故：遵循劳工部并依法享受国家社保局（NSSF）工伤待遇。\n• 特假：遵守劳工部第169条规定（婚丧礼节假、产假等）。`,
    `C/- Management may adjust working/meal schedules within statutory limits of 8h/day (48h/week) pursuant to Article 137.\nD/- Paid holidays adhere to MLVT annual Prakas, paid sick leave with certified medical note, NSSF work injury coverage, and special family leave pursuant to Article 169.`
  );

  // ARTICLE 3: Wages & Overtime
  addArticleTitle(
    '៣',
    '3',
    'ប្រាក់ឈ្នួល ប្រាក់រង្វាន់ និងអត្ថប្រយោជន៍ផ្សេងៗ',
    '工资、奖金和其他福利',
    'WAGES, BONUSES & BENEFITS'
  );
  addClauseText(
    `• ប្រាក់ឈ្នួលត្រូវបានគណនាផ្អែកលើចំនួនថ្ងៃធ្វើការជាក់ស្តែងរបស់កម្មករនិយោជិត។\n• ក្រុមហ៊ុនផ្តល់ប្រាក់ឈ្នួលគោលក្នុងកិច្ចសន្យាសាកល្បងប្រចាំខែចំនួន $${data.basicSalaryUsd || 208} ដុល្លារអាមេរិក (មិនទាបជាងកម្រិតប្រាក់ឈ្នួលអប្បបរមាប្រចាំឆ្នាំដែលប្រកាសដោយក្រសួងការងារឡើយ)។\n• ក្នុងករណីក្រុមហ៊ុនមានការងារបន្ទាន់ ក្រុមហ៊ុនអាចស្នើសុំកម្មករនិយោជិតធ្វើការបន្ថែមម៉ោង (ដោយស្ម័គ្រចិត្ត) ៖\n- ការងារបន្ថែមម៉ោងធម្មតា ត្រូវបានគិតប្រាក់ស្មើ ១.៥ ដង (១៥០%) នៃប្រាក់ឈ្នួលម៉ោងធម្មតា អនុលោមតាមមាត្រា ១៣៩ នៃច្បាប់ស្តីពីការងារ។\n- ការងារបន្ថែមម៉ោងនៅថ្ងៃឈប់បុណ្យជាតិ ឬថ្ងៃអាទិត្យ ត្រូវបានគិតស្មើ ២.០ ដង (២០០%) នៃប្រាក់ឈ្នួលធម្មតា។`,
    `• 工资是根据员工实际出勤天数计算的。\n• 公司给试用合同每月的法定基本工资为 $${data.basicSalaryUsd || 208} 美元（本公司以劳工部公布的年度最低工资为准，绝不低于法定底线）。\n• 如果公司有紧急生产任务，公司会要求工人加班（自愿原则）：\n- 平时定期加班等于每小时工资的 1.5 倍（150%），或根据《劳动法》第139条。\n- 节假日/周日加班：遵循劳工部规定发放（100%+100% = 200%）。`,
    `• Wages calculated based on actual working days.\n• Monthly basic probation wage: USD $${data.basicSalaryUsd || 208} (never below statutory MLVT minimum wage).\n• Voluntary Overtime: Regular OT at 1.5x (150%) pursuant to Article 139; Sunday/Public Holiday OT at 2.0x (200%).`
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
  paragraphs.push(new Paragraph({ spacing: { after: 80 } }));

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
  paragraphs.push(new Paragraph({ spacing: { after: 80 } }));

  // ARTICLE 12: Termination
  addArticleTitle(
    '១២',
    '12',
    'ការរំលាយ និងការបញ្ចប់កិច្ចសន្យាការងារ',
    '合同解除和终止',
    'CONTRACT TERMINATION'
  );
  addClauseText(
    `ក្រុមហ៊ុនមានសិទ្ធិបញ្ចប់កិច្ចសន្យាការងារភ្លាមៗដោយគ្មានសំណង និងគ្មានការជូនដំណឹងជាមុន ក្នុងករណី ៖\n• ភាគី ខ ប្រមូលផ្តុំបង្កចលាចល ដឹកនាំ ឬញុះញង់កម្មករឱ្យធ្វើកូដកម្មខុសច្បាប់ដោយគ្មានការអនុញ្ញាតតាមនីតិវិធីច្បាប់។\n• ភាគី ខ មានការធ្វេសប្រហែសធ្ងន់ធ្ងរលើការងារ កេងបន្លំ ក្លែងបន្លំ ឬលួចទ្រព្យសម្បត្តិក្រុមហ៊ុន ឬបំផ្លាញគុណភាពទំនិញដោយចេតនា។\n• ភាគី ខ បំពានយ៉ាងធ្ងន់ធ្ងរលើបទបញ្ជាផ្ទៃក្នុង និងវិធានសុវត្ថិភាពការងាររបស់រោងចក្រ។\n• កិច្ចសន្យាសាកល្បងនេះនឹងត្រូវបញ្ចប់នៅពេលផុតកំណត់ ឬនៅពេលភាគីណាមួយសម្រេចបញ្ចប់ក្នុងអំឡុងពេលសាកល្បង ស្របតាមមាត្រា ៨២ នៃច្បាប់ការងារ។`,
    `在下列情形下，公司有权立即解除劳动合同并不支付任何经济补偿：\n• 乙方聚众闹事，带头或鼓动工人进行无合法理由、未依法提前书面申请的非法罢工。\n• 乙方严重失职、营私舞弊、盗窃公司财物或故意破坏生产质量与机器设备。\n• 乙方严重违反甲方规章制度及劳动安全操作规程。\n• 本合同期满或在试用期间任何一方提出终止，依《劳动法》第82条本合同即行终止。`,
    `Employer may terminate immediately without notice or severance in cases of: Leading illegal strikes/riots, gross negligence, fraud, theft of company property, or severe breaches of internal factory rules. Contract ends upon expiry or per Article 82.`
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
