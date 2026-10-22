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

export interface JobAnnouncementDocxData {
  templateStyle?: 'GOVERNMENT' | 'CORPORATE' | 'NGO' | 'CREATIVE_POSTER';
  parentOrgKh: string;
  departmentKh: string;
  refNo: string;
  cityDateKh: string;
  jobTitle: string;
  jobCategoryKh: string;
  vacanciesCount: string;
  targetAudienceKh: string;
  workLocationKh: string;
  introParagraphKh: string;
  qualifications: string[];
  benefits: string[];
  requiredDocs: { name: string; copies: string }[];
  submissionParagraphKh: string;
  contactPersons: { name: string; phone: string; note?: string }[];
  signatoryTitleKh: string;
  signatoryNameKh?: string;
}

export interface JobApplicationFormDocxData {
  companyName: string;
  department?: string;
  jobTitle: string;
  refNo?: string;
  dateStr?: string;
}

const tableBorderNone = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

const tableBorderThin = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '94A3B8' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '94A3B8' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '94A3B8' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '94A3B8' },
};

// ==========================================
// 1. GENERATE ANNOUNCEMENT DOCX BLOB
// ==========================================
export async function generateAnnouncementDocxBlob(data: JobAnnouncementDocxData): Promise<Blob> {
  const paragraphs: (Paragraph | Table)[] = [];
  const isGov = data.templateStyle === 'GOVERNMENT' || !data.templateStyle;

  if (isGov) {
    // --- 1. Top Header Table (Ministry/Company on left, Motto on right) ---
    const headerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorderNone,
      rows: [
        new TableRow({
          children: [
            // Left Column: Organization & Ref No
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: tableBorderNone,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: data.parentOrgKh,
                      bold: true,
                      size: 22,
                      font: 'Moul',
                      color: '0F172A',
                    }),
                  ],
                  spacing: { after: 30 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: data.departmentKh,
                      bold: true,
                      size: 20,
                      font: 'Moul',
                      color: '1E3A8A',
                    }),
                  ],
                  spacing: { after: 40 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `លេខ... ${data.refNo || '             '} ...`,
                      size: 19,
                      font: 'Kantumruy Pro',
                      color: '334155',
                    }),
                  ],
                }),
              ],
            }),

            // Right Column: Royal Motto & Date
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: tableBorderNone,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'ព្រះរាជាណាចក្រកម្ពុជា',
                      bold: true,
                      size: 24,
                      font: 'Moul',
                      color: '0F172A',
                    }),
                  ],
                  spacing: { after: 30 },
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'ជាតិ សាសនា ព្រះមហាក្សត្រ',
                      bold: true,
                      size: 20,
                      font: 'Moul',
                      color: '0F172A',
                    }),
                  ],
                  spacing: { after: 20 },
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: '──────── 𝒳 ────────',
                      size: 16,
                      color: '64748B',
                    }),
                  ],
                  spacing: { after: 40 },
                }),
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: data.cityDateKh || 'រាជធានីភ្នំពេញ, ថ្ងៃទី... ខែ... ឆ្នាំ២០២៦',
                      size: 18,
                      font: 'Kantumruy Pro',
                      color: '334155',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    paragraphs.push(headerTable);
    paragraphs.push(new Paragraph({ spacing: { after: 120 } }));
  } else {
    // Corporate Header
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: data.parentOrgKh,
            bold: true,
            size: 26,
            font: 'Moul',
            color: '1E3A8A',
          }),
        ],
        spacing: { after: 40 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: data.departmentKh,
            bold: true,
            size: 20,
            font: 'Kantumruy Pro',
            color: '475569',
          }),
        ],
        spacing: { after: 60 },
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `លេខ / Ref No: ${data.refNo || 'N/A'} | ${data.cityDateKh}`,
            size: 17,
            color: '64748B',
          }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  // --- 2. Main Title ---
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'សេចក្តីជូនដំណឹង',
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
          text: `ស្តីពីការជ្រើសរើស${data.jobCategoryKh || 'បុគ្គលិក'} ចំនួន ${data.vacanciesCount || '១'} នាក់ សម្រាប់បម្រើការងារ`,
          bold: true,
          size: 21,
          font: 'Moul',
          color: '1E3A8A',
        }),
      ],
      spacing: { after: 20 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `មុខតំណែង៖ ${data.jobTitle} ${data.workLocationKh ? `(${data.workLocationKh})` : ''}`,
          bold: true,
          size: 20,
          font: 'Kantumruy Pro',
          color: '0F172A',
        }),
      ],
      spacing: { after: 140 },
    })
  );

  // --- 3. Intro Paragraph ---
  if (data.introParagraphKh) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({
            text: data.introParagraphKh,
            size: 20,
            font: 'Kantumruy Pro',
            color: '1E293B',
          }),
        ],
        spacing: { line: 340, after: 120 },
      })
    );
  }

  // --- 4. Section: Qualifications (លក្ខខណ្ឌនៃការជ្រើសរើស) ---
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'លក្ខខណ្ឌនៃការជ្រើសរើស ៖',
          bold: true,
          size: 21,
          font: 'Moul',
          color: '0F172A',
        }),
      ],
      spacing: { before: 80, after: 60 },
    })
  );

  data.qualifications.forEach((q) => {
    if (q.trim()) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `  -  ${q.replace(/^[-•*]\s*/, '')}`,
              size: 20,
              font: 'Kantumruy Pro',
              color: '1E293B',
            }),
          ],
          spacing: { line: 320, after: 30 },
        })
      );
    }
  });

  // --- 5. Section: Benefits (អត្ថប្រយោជន៍ទទួលបាន) ---
  if (data.benefits && data.benefits.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'អត្ថប្រយោជន៍ទទួលបាន ៖',
            bold: true,
            size: 21,
            font: 'Moul',
            color: '0F172A',
          }),
        ],
        spacing: { before: 100, after: 60 },
      })
    );

    data.benefits.forEach((b) => {
      if (b.trim()) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `  -  ${b.replace(/^[-•*]\s*/, '')}`,
                size: 20,
                font: 'Kantumruy Pro',
                color: '1E293B',
              }),
            ],
            spacing: { line: 320, after: 30 },
          })
        );
      }
    });
  }

  // --- 6. Section: Required Documents (សូមភ្ជាប់មកជាមួយនូវ) ---
  if (data.requiredDocs && data.requiredDocs.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'សូមភ្ជាប់មកជាមួយនូវ ៖',
            bold: true,
            size: 21,
            font: 'Moul',
            color: '0F172A',
          }),
        ],
        spacing: { before: 100, after: 60 },
      })
    );

    data.requiredDocs.forEach((doc) => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `  -  ${doc.name}`,
              size: 20,
              font: 'Kantumruy Pro',
              color: '1E293B',
            }),
            new TextRun({
              text: `\tចំនួន ${doc.copies}`,
              bold: true,
              size: 20,
              font: 'Kantumruy Pro',
              color: '0F172A',
            }),
          ],
          tabStops: [{ type: 'right', position: 9600 }],
          spacing: { line: 320, after: 30 },
        })
      );
    });
  }

  // --- 7. Submission Details Paragraph ---
  if (data.submissionParagraphKh) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({
            text: data.submissionParagraphKh,
            size: 20,
            font: 'Kantumruy Pro',
            color: '1E293B',
          }),
        ],
        spacing: { line: 340, before: 100, after: 120 },
      })
    );
  }

  // --- 8. Bottom Contacts & Signature Table ---
  const contactRuns: TextRun[] = [
    new TextRun({
      text: 'លេខទូរស័ព្ទទំនាក់ទំនងសម្រាប់ការដាក់ពាក្យ ៖\n',
      bold: true,
      size: 20,
      font: 'Moul',
      color: '0F172A',
    }),
  ];

  data.contactPersons.forEach((cp) => {
    contactRuns.push(
      new TextRun({
        text: `\n-  ${cp.name} ៖ ${cp.phone} ${cp.note ? `(${cp.note})` : ''}`,
        size: 19,
        font: 'Kantumruy Pro',
        color: '1E293B',
      })
    );
  });

  const bottomTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderNone,
    rows: [
      new TableRow({
        children: [
          // Left: Contacts
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            children: [
              new Paragraph({
                children: contactRuns,
                spacing: { line: 300 },
              }),
            ],
          }),

          // Right: Signatory & Stamp block
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: data.signatoryTitleKh || data.departmentKh || data.parentOrgKh,
                    bold: true,
                    size: 20,
                    font: 'Moul',
                    color: '0F172A',
                  }),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: '(ហត្ថលេខា និងត្រា)',
                    italics: true,
                    size: 17,
                    font: 'Kantumruy Pro',
                    color: '94A3B8',
                  }),
                ],
                spacing: { after: 200 },
              }),
              ...(data.signatoryNameKh
                ? [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: data.signatoryNameKh,
                          bold: true,
                          size: 20,
                          font: 'Moul',
                          color: '0F172A',
                        }),
                      ],
                    }),
                  ]
                : []),
            ],
          }),
        ],
      }),
    ],
  });

  paragraphs.push(bottomTable);

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
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// ==========================================
// 2. GENERATE APPLICATION FORM DOCX BLOB
// ==========================================
export async function generateApplicationFormDocxBlob(data: JobApplicationFormDocxData): Promise<Blob> {
  const paragraphs: (Paragraph | Table)[] = [];

  // 1. Header with Motto & Photo Box
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderNone,
    rows: [
      new TableRow({
        children: [
          // Left: Company Info
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: data.companyName,
                    bold: true,
                    size: 20,
                    font: 'Moul',
                    color: '1E3A8A',
                  }),
                ],
                spacing: { after: 30 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: data.department || 'នាយកដ្ឋានរដ្ឋបាល និងធនធានមនុស្ស',
                    size: 17,
                    font: 'Kantumruy Pro',
                    color: '475569',
                  }),
                ],
                spacing: { after: 30 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `លេខកូដពាក្យ ៖ ${data.refNo || 'APP-2026-____'}`,
                    size: 16,
                    font: 'Kantumruy Pro',
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),

          // Center: Royal Motto
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'ព្រះរាជាណាចក្រកម្ពុជា',
                    bold: true,
                    size: 22,
                    font: 'Moul',
                    color: '0F172A',
                  }),
                ],
                spacing: { after: 20 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'ជាតិ សាសនា ព្រះមហាក្សត្រ',
                    bold: true,
                    size: 18,
                    font: 'Moul',
                    color: '0F172A',
                  }),
                ],
                spacing: { after: 20 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: '──────── 𝒳 ────────',
                    size: 14,
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),

          // Right: Photo 4x6 Box
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            borders: tableBorderThin,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'រូបថត\n៤ x ៦\n(Photo 4x6)',
                    size: 16,
                    color: '94A3B8',
                  }),
                ],
                spacing: { before: 160, after: 160 },
              }),
            ],
          }),
        ],
      }),
    ],
  });

  paragraphs.push(headerTable);
  paragraphs.push(new Paragraph({ spacing: { after: 120 } }));

  // 2. Title
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'ពាក្យស្នើសុំចូលបម្រើការងារ',
          bold: true,
          size: 26,
          font: 'Moul',
          color: '0F172A',
        }),
      ],
      spacing: { after: 30 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'APPLICATION FOR EMPLOYMENT • 职位申请表',
          bold: true,
          size: 16,
          color: '64748B',
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `មុខតំណែងស្នើសុំ (Position Applied) ៖ `,
          bold: true,
          size: 20,
          font: 'Kantumruy Pro',
          color: '0F172A',
        }),
        new TextRun({
          text: `  ${data.jobTitle}  `,
          bold: true,
          size: 20,
          font: 'Moul',
          color: '1E3A8A',
        }),
      ],
      spacing: { after: 140 },
    })
  );

  // 3. Section I: Personal Information
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'I. ព័ត៌មានផ្ទាល់ខ្លួន (Personal Information)',
          bold: true,
          size: 20,
          font: 'Moul',
          color: '1E3A8A',
        }),
      ],
      spacing: { before: 80, after: 60 },
    })
  );

  const personalInfoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderThin,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: 'នាម និងគោត្តនាម (Khmer): .....................................', size: 18, font: 'Kantumruy Pro' })], spacing: { line: 280 } })],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: 'ឈ្មោះជាអក្សរឡាតាំង (Latin): ...................................', size: 18, font: 'Kantumruy Pro' })], spacing: { line: 280 } })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'ភេទ (Gender): [  ] ប្រុស (M)    [  ] ស្រី (F)', size: 18, font: 'Kantumruy Pro' })], spacing: { line: 280 } })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'ថ្ងៃខែឆ្នាំកំណើត (DOB): ..... / ..... / .........', size: 18, font: 'Kantumruy Pro' })], spacing: { line: 280 } })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'អត្តសញ្ញាណប័ណ្ណ/លិខិតឆ្លងដែន: ................................', size: 18, font: 'Kantumruy Pro' })], spacing: { line: 280 } })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'សញ្ជាតិ (Nationality): ខ្មែរ (Cambodian)', size: 18, font: 'Kantumruy Pro' })], spacing: { line: 280 } })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'លេខទូរស័ព្ទ (Phone): .........................................', size: 18, font: 'Kantumruy Pro' })], spacing: { line: 280 } })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'អ៊ីមែល (Email): .............................................', size: 18, font: 'Kantumruy Pro' })], spacing: { line: 280 } })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            children: [new Paragraph({ children: [new TextRun({ text: 'ទីកន្លែងកំណើត (Place of Birth): ........................................................................................................', size: 18, font: 'Kantumruy Pro' })], spacing: { line: 280 } })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            children: [new Paragraph({ children: [new TextRun({ text: 'អាសយដ្ឋានបច្ចុប្បន្ន (Current Address): ..................................................................................................', size: 18, font: 'Kantumruy Pro' })], spacing: { line: 280 } })],
          }),
        ],
      }),
    ],
  });

  paragraphs.push(personalInfoTable);

  // 4. Section II: Education
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'II. កម្រិតវប្បធម៌ និងការសិក្សាអប់រំ (Education & Qualifications)',
          bold: true,
          size: 20,
          font: 'Moul',
          color: '1E3A8A',
        }),
      ],
      spacing: { before: 100, after: 60 },
    })
  );

  const eduTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderThin,
    rows: [
      new TableRow({
        children: [
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'សញ្ញាបត្រ/កម្រិត (Degree)', bold: true, size: 17 })] })] }),
          new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'គ្រឹះស្ថានសិក្សា (School/Univ)', bold: true, size: 17 })] })] }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'ជំនាញ (Major)', bold: true, size: 17 })] })] }),
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'ឆ្នាំ (Year)', bold: true, size: 17 })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'បរិញ្ញាបត្រ (Bachelor)', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '............................................', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '.....................', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '..........', size: 17 })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'មធ្យមសិក្សា (High School)', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '............................................', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '.....................', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '..........', size: 17 })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ផ្សេងៗ (Other Training)', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '............................................', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '.....................', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '..........', size: 17 })] })] }),
        ],
      }),
    ],
  });

  paragraphs.push(eduTable);

  // 5. Section III: Work Experience
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'III. ប្រវត្តិការងារកន្លងមក (Work Experience)',
          bold: true,
          size: 20,
          font: 'Moul',
          color: '1E3A8A',
        }),
      ],
      spacing: { before: 100, after: 60 },
    })
  );

  const expTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderThin,
    rows: [
      new TableRow({
        children: [
          new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'ស្ថាប័ន/ក្រុមហ៊ុន (Company)', bold: true, size: 17 })] })] }),
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'មុខតំណែង (Position)', bold: true, size: 17 })] })] }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'រយៈពេល (Period)', bold: true, size: 17 })] })] }),
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'ប្រាក់បៀវត្ស', bold: true, size: 17 })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '១. ........................................', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '................................', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '....................', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '..........', size: 17 })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '២. ........................................', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '................................', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '....................', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '..........', size: 17 })] })] }),
        ],
      }),
    ],
  });

  paragraphs.push(expTable);

  // 6. Section IV: Expectations & Pledge
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'IV. ការរំពឹងទុក និងការសន្យា (Expectation & Declaration)',
          bold: true,
          size: 20,
          font: 'Moul',
          color: '1E3A8A',
        }),
      ],
      spacing: { before: 100, after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'ប្រាក់បៀវត្សរំពឹងទុក (Expected Salary) ៖ .................... $   |   ថ្ងៃអាចចូលបម្រើការងារ (Available Date) ៖ ..... / ..... / .........',
          size: 18,
          font: 'Kantumruy Pro',
        }),
      ],
      spacing: { line: 280, after: 60 },
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      children: [
        new TextRun({
          text: 'ខ្ញុំបាទ/នាងខ្ញុំ សូមធានាអះអាងថា រាល់ព័ត៌មានដែលបានបំពេញខាងលើនេះពិតជាត្រឹមត្រូវពិតប្រាកដមែន ប្រសិនបើមានការក្លែងបន្លំណាមួយ ខ្ញុំបាទ/នាងខ្ញុំសូមទទួលខុសត្រូវចំពោះមុខច្បាប់ជាធរមាន។',
          size: 18,
          font: 'Kantumruy Pro',
          color: '334155',
        }),
      ],
      spacing: { line: 300, after: 100 },
    })
  );

  // 7. Signature Line
  paragraphs.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorderNone,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: tableBorderNone,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'ថ្ងៃទី....... ខែ....... ឆ្នាំ២០២៦\nអ្នកទទួលពាក្យ (HR Receiver)\n\n\n\n__________________________',
                      size: 18,
                      font: 'Kantumruy Pro',
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: tableBorderNone,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: 'ថ្ងៃទី....... ខែ....... ឆ្នាំ២០២៦\nហត្ថលេខា និងឈ្មោះបេក្ខជន (Applicant Signature)\n\n\n\n__________________________',
                      size: 18,
                      font: 'Kantumruy Pro',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // 8. Tear-off slip at bottom (បង្កាន់ដៃទទួលពាក្យ)
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '✂️ --------------------------- កាត់ត្រង់នេះ (TEAR OFF HERE) --------------------------- ✂️',
          size: 14,
          color: '94A3B8',
        }),
      ],
      spacing: { before: 140, after: 80 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'បង្កាន់ដៃទទួលពាក្យស្នើសុំចូលបម្រើការងារ (APPLICATION RECEIPT SLIP)',
          bold: true,
          size: 18,
          font: 'Moul',
          color: '1E3A8A',
        }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `ស្ថាប័ន/ក្រុមហ៊ុន ៖ ${data.companyName}   |   មុខតំណែង ៖ ${data.jobTitle}\nឈ្មោះបេក្ខជន ៖ .............................................   |   លេខទូរស័ព្ទ ៖ .............................................\nកាលបរិច្ឆេទទទួលពាក្យ ៖ ..... / ..... / .........   |   ហត្ថលេខាអ្នកទទួល ៖ .............................................`,
          size: 17,
          font: 'Kantumruy Pro',
          color: '334155',
        }),
      ],
      spacing: { line: 300 },
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 800,
              bottom: 800,
              left: 1000,
              right: 1000,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
