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
} from 'docx';

export interface AppointmentDocxData {
  refNo: string;
  companyName: string;
  employeeNameKh: string;
  employeeNameEn: string;
  employeeId: string;
  employeeGender: string;
  employeeDob?: string;
  employeeNationalId?: string;
  oldPosition?: string;
  oldDepartment?: string;
  newPosition: string;
  newDepartment: string;
  reportsTo?: string;
  effectiveDateStr: string;
  probationMonths?: number;
  newSalary?: number | null;
  positionAllowance?: number | null;
  benefits?: string;
  duties: string[];
  preambleLaw?: string;
  preambleInternalRule?: string;
  preamblePerformance?: string;
  preambleNeeds?: string;
  signLocation?: string;
  signatoryTitle?: string;
  signatoryName?: string;
  createdDay: number;
  createdMonth: number;
  createdYear: number;
  langMode?: 'trilingual' | 'khmer' | 'english' | 'chinese';
}

export async function generateAppointmentDocxBlob(data: AppointmentDocxData): Promise<Blob> {
  const isKhmerOnly = data.langMode === 'khmer';

  const tableBorderNone = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  const paragraphs: Paragraph[] = [];

  // 1. Kingdom Motto (បឋមកថាជាតិ)
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'ព្រះរាជាណាចក្រកម្ពុជា',
          bold: true,
          size: 26,
          font: 'Moul',
          color: '0F172A',
        }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'ជាតិ សាសនា ព្រះមហាក្សត្រ',
          bold: true,
          size: 22,
          font: 'Kantumruy Pro',
          color: '0F172A',
        }),
      ],
      spacing: { after: isKhmerOnly ? 80 : 40 },
    })
  );

  if (!isKhmerOnly) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'KINGDOM OF CAMBODIA • NATION RELIGION KING • 柬埔寨王国 民族 宗教 国王',
            size: 16,
            color: '64748B',
            font: 'Arial',
          }),
        ],
        spacing: { after: 60 },
      })
    );
  }

  // Flourish divider line
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '───────────────',
          size: 18,
          color: '334155',
        }),
      ],
      spacing: { after: 120 },
    })
  );

  // 2. Company Row & Ref No
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.companyName,
          bold: true,
          size: 20,
          font: 'Kantumruy Pro',
          color: '1E3A8A',
        }),
        new TextRun({
          text: `\tលេខ / Ref No: ${data.refNo}`,
          bold: true,
          size: 18,
          color: '0F172A',
        }),
      ],
      tabStops: [{ type: 'right', position: 9600 }],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'រោងចក្រកាត់ដេរ និងវាយនភណ្ឌ / Garment & Textile Manufacturing',
          size: 16,
          color: '475569',
        }),
        new TextRun({
          text: `\tកាលបរិច្ឆេទ: ${data.createdDay}/${data.createdMonth}/${data.createdYear}`,
          size: 16,
          color: '475569',
        }),
      ],
      tabStops: [{ type: 'right', position: 9600 }],
      spacing: { after: 180 },
    })
  );

  // 3. Document Title
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'លិខិតតែងតាំង',
          bold: true,
          size: 32,
          font: 'Moul',
          color: '0F172A',
        }),
      ],
      spacing: { after: isKhmerOnly ? 160 : 40 },
    })
  );

  if (!isKhmerOnly) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'LETTER OF APPOINTMENT / PROMOTION • 委任书 / 晋升任命书',
            bold: true,
            size: 18,
            color: '475569',
            font: 'Arial',
          }),
        ],
        spacing: { after: 160 },
      })
    );
  }

  // 4. Preambles (យោង...)
  const lawText = data.preambleLaw || 'យោងតាមក្រមច្បាប់ស្តីពីការងារ នៃព្រះរាជាណាចក្រកម្ពុជា';
  const internalRuleText = data.preambleInternalRule || 'យោងតាមលក្ខន្តិកៈ និងបទបញ្ជាផ្ទៃក្នុងរបស់រោងចក្រ/ក្រុមហ៊ុន';
  const performanceText = data.preamblePerformance || 'យោងតាមសមត្ថភាព ចំណេះដឹង បទពិសោធន៍ ស្នាដៃការងារ និងភាពស្មោះត្រង់របស់បុគ្គលិក';
  const needsText = data.preambleNeeds || 'យោងតាមតម្រូវការការងារជាក់ស្តែង និងការសម្រេចរបស់គណៈគ្រប់គ្រងរោងចក្រ/ក្រុមហ៊ុន';

  const preambles = [
    { kh: `- ${lawText}`, en: 'Referring to the Labor Law of the Kingdom of Cambodia' },
    { kh: `- ${internalRuleText}`, en: 'Referring to Factory / Company Internal Regulations & Statute' },
    { kh: `- ${performanceText}`, en: 'Based on competency, performance, dedication and loyalty of the employee' },
    { kh: `- ${needsText}`, en: 'Based on actual business operational requirements and Management Board decision' }
  ];

  preambles.forEach((p) => {
    paragraphs.push(
      new Paragraph({
        spacing: { line: 320, after: 60 },
        children: [
          new TextRun({ text: p.kh, bold: false, size: 20, font: 'Kantumruy Pro' }),
          ...(!isKhmerOnly
            ? [
                new TextRun({
                  text: ` (${p.en})`,
                  italics: true,
                  size: 16,
                  color: '64748B',
                }),
              ]
            : []),
        ],
      })
    );
  });

  // 5. Decision Word: សម្រេច (DECIDES)
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'សម្រេច',
          bold: true,
          size: 26,
          font: 'Moul',
          color: '0F172A',
        }),
      ],
      spacing: { before: 120, after: isKhmerOnly ? 160 : 40 },
    })
  );

  if (!isKhmerOnly) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'HEREBY DECIDES • 决定如下',
            bold: true,
            size: 17,
            color: '475569',
            font: 'Arial',
          }),
        ],
        spacing: { after: 160 },
      })
    );
  }

  // 6. Article 1: Appointment Details
  const genderText = data.employeeGender === 'FEMALE' || data.employeeGender === 'ស្រី' ? 'ស្រី' : 'ប្រុស';
  paragraphs.push(
    new Paragraph({
      spacing: { line: 360, after: 140 },
      children: [
        new TextRun({ text: 'ប្រការ ១', bold: true, size: 22, font: 'Moul', color: '1E3A8A' }),
        new TextRun({ text: !isKhmerOnly ? ' (Article 1 / 第一条)៖ ' : '៖ ' }),
        new TextRun({ text: 'ត្រូវបានតែងតាំងលោក/លោកស្រី/កញ្ញា ' }),
        new TextRun({
          text: `${data.employeeNameKh} ${data.employeeNameEn ? `(${data.employeeNameEn})` : ''}`,
          bold: true,
          underline: {},
        }),
        new TextRun({ text: ' ភេទ ' }),
        new TextRun({ text: genderText, bold: true, underline: {} }),
        ...(data.employeeDob ? [new TextRun({ text: ' កើតថ្ងៃទី ' }), new TextRun({ text: data.employeeDob, bold: true, underline: {} })] : []),
        ...(data.employeeNationalId
          ? [new TextRun({ text: ' កាន់អត្តសញ្ញាណប័ណ្ណលេខ ' }), new TextRun({ text: data.employeeNationalId, bold: true, underline: {} })]
          : []),
        new TextRun({ text: ' អត្តលេខ ' }),
        new TextRun({ text: data.employeeId, bold: true, underline: {} }),
        ...(data.oldPosition ? [new TextRun({ text: ` ពីតួនាទីចាស់ជា ` }), new TextRun({ text: `${data.oldPosition} (${data.oldDepartment || ''})`, bold: true })] : []),
        new TextRun({ text: ' ឱ្យកាន់មុខតំណែងថ្មីជា ' }),
        new TextRun({ text: data.newPosition, bold: true, color: '1E40AF', underline: {} }),
        new TextRun({ text: ' នៃផ្នែក ' }),
        new TextRun({ text: data.newDepartment, bold: true, underline: {} }),
        new TextRun({ text: ` ចាប់ពីថ្ងៃទី ${data.effectiveDateStr} នេះតទៅ។` }),
      ],
    })
  );

  // 7. Article 2: Duties & Responsibilities
  const dutiesList = data.duties && data.duties.length > 0
    ? data.duties
    : [
        'ដឹកនាំ គ្រប់គ្រង និងត្រួតពិនិត្យការងារប្រតិបត្តិការប្រចាំថ្ងៃក្នុងផ្នែកឱ្យទទួលបានទិន្នផលខ្ពស់',
        'រៀបចំផែនការការងារ បែងចែកភារកិច្ច និងតាមដានវឌ្ឍនភាពការងាររបស់បុគ្គលិកក្រោមឱវាទ',
        'ធានានូវគុណភាព សុវត្ថិភាពការងារ និងការគោរពវិន័យតាមស្តង់ដាររបស់រោងចក្រ',
        'សម្របសម្រួលដោះស្រាយបញ្ហាប្រឈមបន្ទាន់ និងរាយការណ៍ជូនថ្នាក់ដឹកនាំជាប្រចាំ'
      ];

  paragraphs.push(
    new Paragraph({
      spacing: { line: 360, after: 80 },
      children: [
        new TextRun({ text: 'ប្រការ ២', bold: true, size: 22, font: 'Moul', color: '1E3A8A' }),
        new TextRun({ text: !isKhmerOnly ? ' (Article 2 / 第二条)៖ ' : '៖ ' }),
        new TextRun({
          text: 'សាមីខ្លួនមានតួនាទី ភារកិច្ច និងការទទួលខុសត្រូវដូចខាងក្រោម៖',
          bold: true,
        }),
      ],
    })
  );

  dutiesList.forEach((duty, idx) => {
    paragraphs.push(
      new Paragraph({
        spacing: { line: 320, after: 50 },
        indent: { left: 400 },
        children: [
          new TextRun({ text: `${idx + 1}. `, bold: true }),
          new TextRun({ text: duty }),
        ],
      })
    );
  });

  if (data.reportsTo) {
    paragraphs.push(
      new Paragraph({
        spacing: { line: 320, after: 100 },
        indent: { left: 400 },
        children: [
          new TextRun({ text: `* រាយការណ៍ផ្ទាល់ជូន៖ `, bold: true }),
          new TextRun({ text: data.reportsTo, bold: true, underline: {} }),
        ],
      })
    );
  }

  // 8. Article 3: Remuneration & Benefits (if specified)
  if (data.newSalary || data.positionAllowance || data.benefits || data.probationMonths) {
    paragraphs.push(
      new Paragraph({
        spacing: { line: 360, after: 120 },
        children: [
          new TextRun({ text: 'ប្រការ ៣', bold: true, size: 22, font: 'Moul', color: '1E3A8A' }),
          new TextRun({ text: !isKhmerOnly ? ' (Article 3 / 第三条)៖ ' : '៖ ' }),
          new TextRun({
            text: 'សាមីខ្លួនទទួលបានប្រាក់បៀវត្ស និងអត្ថប្រយោជន៍ស្របតាមគោលការណ៍របស់ក្រុមហ៊ុន៖ ',
          }),
          ...(data.newSalary ? [new TextRun({ text: `ប្រាក់បៀវត្សមូលដ្ឋានថ្មី $${data.newSalary.toLocaleString()} /ខែ; ` })] : []),
          ...(data.positionAllowance ? [new TextRun({ text: `ប្រាក់ឧបត្ថម្ភតួនាទី $${data.positionAllowance.toLocaleString()} /ខែ; ` })] : []),
          ...(data.benefits ? [new TextRun({ text: `អត្ថប្រយោជន៍បន្ថែម៖ ${data.benefits}; ` })] : []),
          ...(data.probationMonths ? [new TextRun({ text: `(រយៈពេលសាកល្បងតួនាទីថ្មីចំនួន ${data.probationMonths} ខែ)។` })] : [new TextRun({ text: '។' })]),
        ],
      })
    );
  }

  // 9. Article 4: Execution & Enforcement
  const artNum = data.newSalary || data.positionAllowance || data.benefits || data.probationMonths ? 'ប្រការ ៤' : 'ប្រការ ៣';
  paragraphs.push(
    new Paragraph({
      spacing: { line: 360, after: 200 },
      children: [
        new TextRun({ text: artNum, bold: true, size: 22, font: 'Moul', color: '1E3A8A' }),
        new TextRun({ text: !isKhmerOnly ? ' (Article / 条款)៖ ' : '៖ ' }),
        new TextRun({
          text: 'នាយកដ្ឋានធនធានមនុស្ស និងរដ្ឋបាល, នាយកដ្ឋានគណនេយ្យ និងហិរញ្ញវត្ថុ, ប្រធានផ្នែកពាក់ព័ន្ធ និងសាមីខ្លួន ត្រូវទទួលបន្ទុកអនុវត្តសេចក្តីសម្រេចនេះឱ្យមានប្រសិទ្ធភាពចាប់ពីថ្ងៃចុះហត្ថលេខានេះតទៅ។',
        }),
      ],
    })
  );

  // 10. Date, Signatures & CC Block (Matching User Sample Image)
  const signLoc = data.signLocation || 'រាជធានីភ្នំពេញ';
  const signatoryTitle = data.signatoryTitle || 'អគ្គនាយកក្រុមហ៊ុន (General Manager / CEO)';

  const bottomTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderNone,
    rows: [
      new TableRow({
        children: [
          // Left: CC List (ដូចគំរូរូបភាព)
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'ចម្លងជូន (CC / 抄送)៖', bold: true, size: 19, font: 'Kantumruy Pro' }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({ children: [new TextRun({ text: '- ក្រុមប្រឹក្សាភិបាល (Board of Directors)', size: 17 })] }),
              new Paragraph({ children: [new TextRun({ text: '- នាយកដ្ឋានធនធានមនុស្ស និងរដ្ឋបាល (HR & Admin)', size: 17 })] }),
              new Paragraph({ children: [new TextRun({ text: '- នាយកដ្ឋានគណនេយ្យ និងហិរញ្ញវត្ថុ (Accounting & Finance)', size: 17 })] }),
              new Paragraph({ children: [new TextRun({ text: '- សាមីខ្លួន "ដើម្បីអនុវត្ត" (Appointee)', size: 17 })] }),
              new Paragraph({ children: [new TextRun({ text: '- ឯកសារ - កាលប្បវត្តិ (Company Archives)', size: 17 })] }),
            ],
          }),

          // Right: Date & Signer Title (ដូចគំរូរូបភាព)
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${signLoc}, ថ្ងៃទី ${data.createdDay} ខែ ${data.createdMonth} ឆ្នាំ ២០${String(data.createdYear).slice(-2)}`,
                    bold: true,
                    size: 19,
                    font: 'Kantumruy Pro',
                  }),
                ],
                spacing: { after: 40 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: signatoryTitle,
                    bold: true,
                    size: 20,
                    font: 'Kantumruy Pro',
                    color: '1E3A8A',
                  }),
                ],
                spacing: { after: 600 }, // space for stamp & signature
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: data.signatoryName || '....................................................',
                    bold: true,
                    size: 20,
                    font: 'Moul',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1200,
              right: 1200,
            },
          },
        },
        children: [...paragraphs, bottomTable],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
