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

export interface LeaveFormDocxData {
  companyName: string;
  employeeName: string;
  gender: string;
  position: string;
  department: string;
  employeeId?: string;
  leaveType: string;
  reasonText?: string;
  duration: number | string;
  startDateStr: string;
  endDateStr: string;
  requestDateStr: string;
  managerDecision?: string;
  supervisorDecision?: string;
  hrDecision?: string;
  managerName?: string;
  supervisorName?: string;
  hrName?: string;
  notes?: string;
}

const tableBorderNone = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

const tableBorderThin = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '334155' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '334155' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '334155' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '334155' },
};

export async function generateLeaveFormDocxBlob(data: LeaveFormDocxData): Promise<Blob> {
  const paragraphs: (Paragraph | Table)[] = [];

  // Top header with Company name line
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.companyName || 'វិទ្យាស្ថាន / ក្រុមហ៊ុន (Company Name)',
          bold: true,
          size: 22,
          font: 'Moul',
          color: '0F172A',
        }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '_________________________________________________________________________________',
          size: 16,
          color: '334155',
        }),
      ],
      spacing: { after: 100 },
    })
  );

  // Royal Motto
  paragraphs.push(
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
      spacing: { after: 120 },
    })
  );

  // Title Banner Table
  const titleTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderThin,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: '0284C7' },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'លិខិតសុំច្បាប់',
                    bold: true,
                    size: 24,
                    font: 'Moul',
                    color: 'FFFFFF',
                  }),
                ],
                spacing: { before: 80, after: 80 },
              }),
            ],
          }),
        ],
      }),
    ],
  });
  paragraphs.push(titleTable);

  // Employee details rows
  const empTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderThin,
    rows: [
      // Row 1: Name & Gender
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: tableBorderThin,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'បុគ្គលិកឈ្មោះ ៖ ', bold: true, size: 19, font: 'Kantumruy Pro' }),
                  new TextRun({ text: data.employeeName || '...........................................', size: 19, font: 'Kantumruy Pro' }),
                  ...(data.employeeId ? [new TextRun({ text: ` (ID: ${data.employeeId})`, size: 17, color: '64748B' })] : []),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: tableBorderThin,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'ភេទ ៖ ', bold: true, size: 19, font: 'Kantumruy Pro' }),
                  new TextRun({ text: data.gender || '.....................', size: 19, font: 'Kantumruy Pro' }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
        ],
      }),

      // Row 2: Position & Department
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: tableBorderThin,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'តួនាទី ៖ ', bold: true, size: 19, font: 'Kantumruy Pro' }),
                  new TextRun({ text: data.position || '...........................................', size: 19, font: 'Kantumruy Pro' }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: tableBorderThin,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'ផ្នែក ៖ ', bold: true, size: 19, font: 'Kantumruy Pro' }),
                  new TextRun({ text: data.department || '.....................', size: 19, font: 'Kantumruy Pro' }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
        ],
      }),

      // Row 3: Leave Reasons (with Checkboxes complying with MLVT Labor Law)
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            borders: tableBorderThin,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'មូលហេតុនៃការស្នើសុំច្បាប់ ៖', bold: true, size: 19, font: 'Moul', color: '0F172A' }),
                ],
                spacing: { before: 80, after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `[ ${data.leaveType === 'SICK' ? '✓' : '  '} ] ឈឺ (Sick Leave - ច្បាប់ឈឺ / មានវិញ្ញាបនបត្រពេទ្យ)`, size: 18, font: 'Kantumruy Pro' }),
                ],
                spacing: { after: 40 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `[ ${data.leaveType === 'MARRIAGE' ? '✓' : '  '} ] អាពាហ៍ពិពាហ៍ (Marriage Leave - អាពាហ៍ពិពាហ៍ផ្ទាល់ខ្លួន/កូន - មាត្រា ១៦៩)`, size: 18, font: 'Kantumruy Pro' }),
                ],
                spacing: { after: 40 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `[ ${data.leaveType === 'FUNERAL' ? '✓' : '  '} ] ពិធីបុណ្យសព (Funeral / Bereavement - ឪពុកម្តាយ ប្តីប្រពន្ធ កូន - មាត្រា ១៦៩)`, size: 18, font: 'Kantumruy Pro' }),
                ],
                spacing: { after: 40 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `[ ${data.leaveType === 'MATERNITY' ? '✓' : '  '} ] សម្រាលកូន (Maternity / Paternity Leave - សម្រាលកូន ៩០ថ្ងៃ)`, size: 18, font: 'Kantumruy Pro' }),
                ],
                spacing: { after: 40 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `[ ${data.leaveType === 'ANNUAL' ? '✓' : '  '} ] សម្រាកលំហែកាយ (Annual Leave - សម្រាកប្រចាំឆ្នាំ ១៨ថ្ងៃ - មាត្រា ១៦៦)`, size: 18, font: 'Kantumruy Pro' }),
                ],
                spacing: { after: 40 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `[ ${data.leaveType === 'OTHER' || data.leaveType === 'UNPAID' ? '✓' : '  '} ] ផ្សេងៗ (Other) ៖ ${data.reasonText || '......................................................................................................'}`, size: 18, font: 'Kantumruy Pro' }),
                ],
                spacing: { after: 80 },
              }),
            ],
          }),
        ],
      }),

      // Row 4: Total Days
      new TableRow({
        children: [
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'ចំនួនថ្ងៃឈប់', bold: true, size: 18, font: 'Kantumruy Pro' })], spacing: { before: 50, after: 50 } })] }),
          new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: `${data.duration} ថ្ងៃ`, bold: true, size: 18, font: 'Kantumruy Pro' })], spacing: { before: 50, after: 50 } })] }),
        ],
      }),

      // Row 5: Start Date
      new TableRow({
        children: [
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'ចាប់ពីថ្ងៃទី', bold: true, size: 18, font: 'Kantumruy Pro' })], spacing: { before: 50, after: 50 } })] }),
          new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: data.startDateStr || '................................................', size: 18, font: 'Kantumruy Pro' })], spacing: { before: 50, after: 50 } })] }),
        ],
      }),

      // Row 6: End Date
      new TableRow({
        children: [
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'ដល់ថ្ងៃទី', bold: true, size: 18, font: 'Kantumruy Pro' })], spacing: { before: 50, after: 50 } })] }),
          new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: data.endDateStr || '................................................', size: 18, font: 'Kantumruy Pro' })], spacing: { before: 50, after: 50 } })] }),
        ],
      }),

      // Row 7: Request Date
      new TableRow({
        children: [
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'ថ្ងៃស្នើសុំច្បាប់', bold: true, size: 18, font: 'Kantumruy Pro' })], spacing: { before: 50, after: 50 } })] }),
          new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: data.requestDateStr || '................................................', size: 18, font: 'Kantumruy Pro' })], spacing: { before: 50, after: 50 } })] }),
        ],
      }),

      // Row 8: Employee Signature
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            borders: tableBorderThin,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'ហត្ថលេខាបុគ្គលិក (Employee Signature) ៖\n\n\n\n____________________________________', size: 18, font: 'Kantumruy Pro' }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
        ],
      }),
    ],
  });
  paragraphs.push(empTable);

  // 3-Column Approval Workflow Table (Manager / Supervisor / HR)
  const approvalTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderThin,
    rows: [
      // Header: 3 roles
      new TableRow({
        children: [
          new TableCell({ width: { size: 33.3, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Manager\n(អ្នកគ្រប់គ្រង)', bold: true, size: 18, font: 'Kantumruy Pro' })], spacing: { before: 60, after: 60 } })] }),
          new TableCell({ width: { size: 33.3, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Supervisor\n(ប្រធានផ្នែក/មេការ)', bold: true, size: 18, font: 'Kantumruy Pro' })], spacing: { before: 60, after: 60 } })] }),
          new TableCell({ width: { size: 33.4, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'HR\n(ធនធានមនុស្ស)', bold: true, size: 18, font: 'Kantumruy Pro' })], spacing: { before: 60, after: 60 } })] }),
        ],
      }),

      // Checkbox approval row
      new TableRow({
        children: [
          new TableCell({
            borders: tableBorderThin,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `[ ${data.managerDecision === 'APPROVED' ? '✓' : '  '} ] អនុញ្ញាត\n[ ${data.managerDecision === 'REJECTED' ? '✓' : '  '} ] មិនអនុញ្ញាត\n\n\nហត្ថលេខា ៖ ______________\nឈ្មោះ ៖ ${data.managerName || '....................'}`, size: 17, font: 'Kantumruy Pro' }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
          new TableCell({
            borders: tableBorderThin,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `[ ${data.supervisorDecision === 'APPROVED' ? '✓' : '  '} ] អនុញ្ញាត\n[ ${data.supervisorDecision === 'REJECTED' ? '✓' : '  '} ] មិនអនុញ្ញាត\n\n\nហត្ថលេខា ៖ ______________\nឈ្មោះ ៖ ${data.supervisorName || '....................'}`, size: 17, font: 'Kantumruy Pro' }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
          new TableCell({
            borders: tableBorderThin,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `[ ${data.hrDecision === 'APPROVED' ? '✓' : '  '} ] អនុញ្ញាត\n[ ${data.hrDecision === 'REJECTED' ? '✓' : '  '} ] មិនអនុញ្ញាត\n\n\nហត្ថលេខា ៖ ______________\nឈ្មោះ ៖ ${data.hrName || '....................'}`, size: 17, font: 'Kantumruy Pro' }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
        ],
      }),

      // Notes / MLVT Compliance Remarks row
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            borders: tableBorderThin,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'បញ្ជាក់ / Remarks (អនុលោមតាមច្បាប់ស្តីពីការងារ នៃព្រះរាជាណាចក្រកម្ពុជា) ៖\n', bold: true, size: 18, font: 'Kantumruy Pro', color: '0F172A' }),
                  new TextRun({ text: data.notes || '១. យោងតាមមាត្រា ១៦៦-១៧០ នៃច្បាប់ស្តីពីការងារ ៖ កម្មករនិយោជិតមានសិទ្ធិឈប់សម្រាកលំហែកាយប្រចាំឆ្នាំ ១៨ថ្ងៃ (ក្នុងមួយឆ្នាំបំពេញការងារពេញលេញ) ដោយទទួលបានប្រាក់ឈ្នួលធម្មតា។\n២. យោងតាមមាត្រា ១៦៩ ៖ ច្បាប់ឈប់សម្រាកពិសេសក្នុងគ្រួសារ (អាពាហ៍ពិពាហ៍, បុណ្យសព, សម្រាលកូន) អាចកាត់កងលើច្បាប់ប្រចាំឆ្នាំ ឬអនុវត្តតាមបទបញ្ជាផ្ទៃក្នុង។\n៣. ក្នុងករណីសុំច្បាប់ឈឺចាប់ពី ០៣ ថ្ងៃឡើងទៅ ត្រូវភ្ជាប់មកជាមួយនូវវិញ្ញាបនបត្រពេទ្យស្របច្បាប់ទទួលស្គាល់ដោយក្រសួងសុខាភិបាល ឬ ប.ស.ស។', size: 16, font: 'Kantumruy Pro', color: '475569' }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
        ],
      }),
    ],
  });
  paragraphs.push(approvalTable);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
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
