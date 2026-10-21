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

export interface DelegationDocxData {
  refNo: string;
  companyName: string;
  delegatorNameKh: string;
  delegatorNameEn: string;
  delegatorEmpId: string;
  delegatorGender: string;
  delegatorDob: string;
  delegatorNationalId: string;
  delegatorPosition: string;
  delegatorDepartment: string;
  delegatorPhone: string;
  reasonType: string;
  reasonDetail: string;
  missionLocation: string;
  startDateStr: string;
  endDateStr: string;
  totalDays: number;
  delegatees: Array<{
    nameKh: string;
    nameEn?: string;
    employeeId: string;
    gender?: string;
    dob?: string;
    nationalId?: string;
    position: string;
    department: string;
    phone: string;
    scopeOfWork: string;
  }>;
  canApproveLeave: boolean;
  canApproveOt: boolean;
  canSignDailyReports: boolean;
  canManageOperations: boolean;
  canApproveExpense: boolean;
  maxExpenseAmount?: number | null;
  restrictions: string;
  handoverItems: string;
  approvedByDeptHead: string;
  approvedByManagement: string;
  createdDay: number;
  createdMonth: number;
  createdYear: number;
  langMode?: 'trilingual' | 'khmer' | 'english' | 'chinese';
}

export async function generateDelegationDocxBlob(data: DelegationDocxData): Promise<Blob> {
  const isKhmerOnly = data.langMode === 'khmer';

  const tableBorderNone = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  const tableBorderCell = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  };

  // 1. National Motto & Header
  const paragraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'ព្រះរាជាណាចក្រកម្ពុជា',
          bold: true,
          size: 24,
          font: 'Kantumruy Pro',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'ជាតិ សាសនា ព្រះមហាក្សត្រ',
          bold: true,
          size: 22,
          font: 'Kantumruy Pro',
        }),
      ],
    }),
  ];

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
      })
    );
  }

  // Divider Line
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

  // 2. Company & Reference Row
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
      spacing: { after: 200 },
    })
  );

  // 3. Document Title
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'លិខិតផ្ទេរសិទ្ធិ',
          bold: true,
          size: 30,
          font: 'Kantumruy Pro',
          color: '0F172A',
        }),
      ],
    })
  );

  if (!isKhmerOnly) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'LETTER OF DELEGATION OF AUTHORITY (DOA) • 授权委托书',
            bold: true,
            size: 18,
            color: '475569',
            font: 'Arial',
          }),
        ],
        spacing: { after: 200 },
      })
    );
  } else {
    paragraphs.push(new Paragraph({ spacing: { after: 150 } }));
  }

  // 4. Delegator Paragraph
  const delegatorGenderText = data.delegatorGender === 'FEMALE' || data.delegatorGender === 'ស្រី' ? 'ស្រី' : 'ប្រុស';
  paragraphs.push(
    new Paragraph({
      spacing: { line: 360, after: 140 },
      children: [
        new TextRun({ text: 'ខ្ញុំបាទ/នាងខ្ញុំ' }),
        new TextRun({ text: !isKhmerOnly ? ' (I / 本人)' : '' }),
        new TextRun({ text: '៖ ' }),
        new TextRun({ text: `${data.delegatorNameKh} ${data.delegatorNameEn ? `(${data.delegatorNameEn})` : ''}`, bold: true, underline: {} }),
        new TextRun({ text: '  ភេទ' }),
        new TextRun({ text: !isKhmerOnly ? ' (Sex/性别)' : '' }),
        new TextRun({ text: '៖ ' }),
        new TextRun({ text: delegatorGenderText, bold: true, underline: {} }),
        new TextRun({ text: '  កើតនៅថ្ងៃទី' }),
        new TextRun({ text: !isKhmerOnly ? ' (DOB)' : '' }),
        new TextRun({ text: '៖ ' }),
        new TextRun({ text: data.delegatorDob || '____/____/________', bold: true, underline: {} }),
        new TextRun({ text: '  កាន់អត្តសញ្ញាណប័ណ្ណ/លិខិតឆ្លងដែនលេខ' }),
        new TextRun({ text: !isKhmerOnly ? ' (ID/Passport No)' : '' }),
        new TextRun({ text: '៖ ' }),
        new TextRun({ text: data.delegatorNationalId || data.delegatorEmpId, bold: true, underline: {} }),
        new TextRun({ text: '  មុខតំណែង/តួនាទី' }),
        new TextRun({ text: !isKhmerOnly ? ' (Position)' : '' }),
        new TextRun({ text: '៖ ' }),
        new TextRun({ text: data.delegatorPosition || '__________', bold: true, underline: {} }),
        new TextRun({ text: '  កាន់តួនាទីនៅផ្នែក/រោងចក្រ' }),
        new TextRun({ text: !isKhmerOnly ? ' (Department)' : '' }),
        new TextRun({ text: '៖ ' }),
        new TextRun({ text: data.delegatorDepartment || '__________', bold: true, underline: {} }),
        new TextRun({ text: data.delegatorPhone ? ` (ទូរស័ព្ទ: ${data.delegatorPhone})` : '' }),
        new TextRun({ text: '។' }),
      ],
    })
  );

  // 5. Reason & Duration Paragraph
  const reasonName =
    data.reasonType === 'MISSION'
      ? 'បេសកកម្មការងារក្រៅ (Business Mission / 商务出差)'
      : data.reasonType === 'LEAVE'
      ? 'ឈប់សម្រាកប្រចាំឆ្នាំ (Annual Leave / 年假)'
      : data.reasonType === 'SICK'
      ? 'សម្រាកព្យាបាលជំងឺ (Medical Leave / 病假)'
      : data.reasonType === 'TRAINING'
      ? 'វគ្គបណ្តុះបណ្តាល (Training / 培训学习)'
      : 'ផ្សេងៗ (Other)';

  paragraphs.push(
    new Paragraph({
      spacing: { line: 360, after: 160 },
      children: [
        new TextRun({ text: 'មូលហេតុ' }),
        new TextRun({ text: !isKhmerOnly ? ' (Reason/事由)' : '' }),
        new TextRun({ text: '៖ ' }),
        new TextRun({ text: `${reasonName} ${data.missionLocation ? `នៅ ${data.missionLocation}` : ''} ${data.reasonDetail ? `(${data.reasonDetail})` : ''}`, bold: true, underline: {} }),
        new TextRun({ text: ' ចំនួន ' }),
        new TextRun({ text: `${data.totalDays}`, bold: true, underline: {} }),
        new TextRun({ text: ' ថ្ងៃ គិតចាប់ពីថ្ងៃទី ' }),
        new TextRun({ text: `${data.startDateStr}`, bold: true, underline: {} }),
        new TextRun({ text: ' ដល់ថ្ងៃទី ' }),
        new TextRun({ text: `${data.endDateStr}`, bold: true, underline: {} }),
        new TextRun({ text: '។' }),
      ],
    })
  );

  // 6. Agreement & Delegatees (1, 2, 3 or more)
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'យល់ព្រម',
          bold: true,
          underline: {},
          size: 20,
        }),
        new TextRun({
          text: !isKhmerOnly ? ' (Agreed to Delegate / 同意授权)៖' : '៖',
          bold: true,
          size: 20,
        }),
      ],
      spacing: { after: 100 },
    })
  );

  data.delegatees.forEach((del, i) => {
    paragraphs.push(
      new Paragraph({
        spacing: { line: 340, after: 100 },
        children: [
          new TextRun({ text: `ប្រគល់សិទ្ធិជូនឈ្មោះ${data.delegatees.length > 1 ? `ទី ${i + 1}` : ''}៖ ` }),
          new TextRun({ text: `${del.nameKh} ${del.nameEn ? `(${del.nameEn})` : ''}`, bold: true, underline: {} }),
          new TextRun({ text: '  ភេទ៖ ' }),
          new TextRun({ text: del.gender || '____', bold: true }),
          new TextRun({ text: '  កើតនៅថ្ងៃទី៖ ' }),
          new TextRun({ text: del.dob || '____/____/________', bold: true }),
          new TextRun({ text: '  កាន់អត្តសញ្ញាណប័ណ្ណលេខ៖ ' }),
          new TextRun({ text: del.nationalId || del.employeeId, bold: true, underline: {} }),
          new TextRun({ text: '  មុខតំណែង៖ ' }),
          new TextRun({ text: del.position, bold: true, underline: {} }),
          new TextRun({ text: '  ផ្នែក៖ ' }),
          new TextRun({ text: del.department, bold: true, underline: {} }),
          new TextRun({ text: '  កាន់តួនាទីជំនួសក្នុងការងារ៖ ' }),
          new TextRun({ text: del.scopeOfWork, bold: true, underline: {}, color: '1E3A8A' }),
          new TextRun({ text: del.phone ? ` (ទូរស័ព្ទ: ${del.phone})` : '' }),
          new TextRun({ text: '។' }),
        ],
      })
    );
  });

  // 7. Responsibilities & Powers
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'ការទទួលខុសត្រូវ',
          bold: true,
          underline: {},
          size: 20,
        }),
        new TextRun({
          text: !isKhmerOnly ? ' (Responsibilities & Authority / 代理权限与职责)៖' : '៖',
          bold: true,
          size: 20,
        }),
      ],
      spacing: { before: 120, after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '១. អនុម័តច្បាប់ឈប់សម្រាក និងការងារថែមម៉ោងរបស់បុគ្គលិក (Approve Leave & Overtime)' }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '២. ពិនិត្យ និងចុះហត្ថលេខាលើរបាយការណ៍ប្រចាំថ្ងៃ និងឯកសាររដ្ឋបាល (Sign Daily Reports & Admin Documents)' }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '៣. គ្រប់គ្រងកិច្ចការប្រតិបត្តិការប្រចាំថ្ងៃក្នុងរោងចក្រ (Manage Daily Factory Operations)' }),
      ],
    })
  );

  if (data.canApproveExpense) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `៤. អនុម័តចំណាយ ឬទិញសម្ភារៈបន្ទាន់មិនលើសពី $${data.maxExpenseAmount || 0} (Approve Urgent Expenses)`,
          }),
        ],
      })
    );
  }

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${data.canApproveExpense ? '៥' : '៤'}. និងរាល់ការសម្រេចផ្សេងៗដែលពាក់ព័ន្ធនឹងការងារខាងលើទាំងអស់ (And all relevant operational decisions)។`,
        }),
      ],
      spacing: { after: 100 },
    })
  );

  if (data.restrictions) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: '⚠️ ការកំណត់ព្រំដែនសិទ្ធិ (Limitations)៖ ', bold: true, color: 'B45309' }),
          new TextRun({ text: data.restrictions, color: 'B45309' }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  // 8. Handover Items
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'សម្ភារៈប្រគល់',
          bold: true,
          underline: {},
          size: 20,
        }),
        new TextRun({
          text: !isKhmerOnly ? ' (Handover Items / 交接物品清单)៖' : '៖',
          bold: true,
          size: 20,
        }),
      ],
      spacing: { before: 100, after: 80 },
    })
  );

  const handoverList = (data.handoverItems || 'ត្រាក្រុមហ៊ុន (Company Stamps), កូនសោរការិយាល័យ (Keys), ឯកសារប្រតិបត្តិការ').split(',');
  handoverList.forEach((item, idx) => {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: `${idx + 1}. ${item.trim()}` })],
      })
    );
  });

  // 9. Closing & Date
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'លិខិតផ្ទេរសិទ្ធិនេះមានសុពលភាពចាប់ពីថ្ងៃចុះហត្ថលេខានេះតទៅ។',
          italics: true,
        }),
      ],
      spacing: { before: 140, after: 100 },
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: `ធ្វើនៅ រាជធានីភ្នំពេញ, ថ្ងៃទី ${data.createdDay} ខែ ${data.createdMonth} ឆ្នាំ ២០${String(data.createdYear).slice(-2)}`,
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // 10. Signatures Table (4 Parties)
  const signatureCells: TableCell[] = [];

  // Delegatees
  data.delegatees.slice(0, 2).forEach((del, i) => {
    signatureCells.push(
      new TableCell({
        borders: tableBorderNone,
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `អ្នកទទួលសិទ្ធិ${data.delegatees.length > 1 ? `ទី ${i + 1}` : ''}`, bold: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Delegatee / 被授权人', size: 14, color: '64748B' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ហត្ថលេខា ឬស្នាមមេដៃ', size: 16, color: '475569' })] }),
          new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 600 } }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '____________________' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `ឈ្មោះ៖ ${del.nameKh || del.nameEn}`, bold: true })] }),
        ],
      })
    );
  });

  // Delegator
  signatureCells.push(
    new TableCell({
      borders: tableBorderNone,
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'អ្នកផ្ទេរសិទ្ធិ', bold: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Delegator / 授权人', size: 14, color: '64748B' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ហត្ថលេខា ឬស្នាមមេដៃ', size: 16, color: '475569' })] }),
        new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 600 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '____________________' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `ឈ្មោះ៖ ${data.delegatorNameKh}`, bold: true })] }),
      ],
    })
  );

  // Dept Head & General Manager row
  const approvalRow = new TableRow({
    children: [
      new TableCell({
        borders: tableBorderNone,
        columnSpan: 1,
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ប្រធានផ្នែកផ្ទាល់', bold: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Dept Head / 部门主管', size: 14, color: '64748B' })] }),
          new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 500 } }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '____________________' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.approvedByDeptHead || 'ប្រធានផ្នែក' })] }),
        ],
      }),
      new TableCell({
        borders: tableBorderNone,
        columnSpan: signatureCells.length - 1 || 1,
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'អគ្គនាយក / នាយកធនធានមនុស្ស', bold: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'General Manager / HR Director / 总经理', size: 14, color: '64748B' })] }),
          new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 500 } }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '____________________' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${data.approvedByManagement || 'នាយកចាត់ការទូទៅ'} (ចុះហត្ថលេខា & វាយត្រា)` })] }),
        ],
      }),
    ],
  });

  const signTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderNone,
    rows: [
      new TableRow({ children: signatureCells }),
      approvalRow,
    ],
  });

  paragraphs.push(new Paragraph({ children: [] }));

  // 11. CC Section
  const ccParagraphs = [
    new Paragraph({
      children: [
        new TextRun({ text: 'ដំណឹងជូន (CC / 抄送)៖', bold: true, size: 18 }),
      ],
      spacing: { before: 200, after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '- លោក/លោកស្រីអគ្គនាយក (General Manager / 总经理)' })],
    }),
    new Paragraph({
      children: [new TextRun({ text: '- ការិយាល័យរដ្ឋបាល & ធនធានមនុស្ស (HR & Admin Office / 人事行政部)' })],
    }),
    new Paragraph({
      children: [new TextRun({ text: '- ឯកសារក្រុមហ៊ុន (Company Archives / 公司档案)' })],
    }),
  ];

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
        children: [...paragraphs, signTable, ...ccParagraphs],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
