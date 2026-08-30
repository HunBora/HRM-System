import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    const masterKpis = await prisma.masterKpi.findMany({
      orderBy: [
        { department: 'asc' },
        { kpiType: 'asc' }
      ]
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Master KPI List', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.2, right: 0.2,
          top: 0.4, bottom: 0.4,
          header: 0.2, footer: 0.2
        }
      }
    });

    // 1. Company Titles (Rows 1 to 3)
    sheet.mergeCells('A1:C1');
    const title1 = sheet.getCell('A1');
    title1.value = 'ក្រុមហ៊ុន អេវើហ្គ្រីន ស្ពតធីង ហ្គូដ (ខេមបូឌា) ឯ.ក';
    title1.font = { name: 'Khmer OS Muol Light', size: 14, bold: true };
    title1.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A2:C2');
    const title2 = sheet.getCell('A2');
    title2.value = '长青户外用品（柬埔寨）有限公司';
    title2.font = { name: 'SimSun', size: 12, bold: true };
    title2.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A3:C3');
    const title3 = sheet.getCell('A3');
    title3.value = 'EVERGREEN SPORTING GOODS (CAMBODIA) CO., LTD';
    title3.font = { name: 'Times New Roman', size: 12, bold: true };
    title3.alignment = { horizontal: 'center', vertical: 'middle' };

    // 2. Report Title (Row 4)
    sheet.mergeCells('A4:C4');
    const reportTitle = sheet.getCell('A4');
    reportTitle.value = 'បញ្ជីគោលដៅ និងស្តង់ដារវាស់វែង MASTER KPI LIST';
    reportTitle.font = { name: 'Khmer OS Muol Light', size: 12, bold: true, underline: true, color: { argb: 'FF1E3A8A' } };
    reportTitle.alignment = { horizontal: 'left', vertical: 'middle' };

    // 3. Note (Row 5)
    sheet.mergeCells('A5:C5');
    const noteCell = sheet.getCell('A5');
    noteCell.value = 'ចំណាំ៖ អ្នកអាចកែសម្រួល ឬបន្ថែមជួរថ្មី រួច Import ហ្វាលនេះចូលក្នុងប្រព័ន្ធវិញដើម្បីអាប់ដេត Master KPI (Keep as original format same export file)';
    noteCell.font = { name: 'Khmer OS Siemreap', size: 9, italic: true, color: { argb: 'FFDC2626' } };
    noteCell.alignment = { horizontal: 'left', vertical: 'middle' };

    // 4. Headers (Row 6)
    const headers = [
      { header: 'Department', width: 28 },
      { header: 'KPI Type', width: 35 },
      { header: 'Description', width: 50 }
    ];

    sheet.getRow(6).height = 28;
    headers.forEach((col, idx) => {
      sheet.getColumn(idx + 1).width = col.width;
      const cell = sheet.getCell(6, idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' } // Emerald Green
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'medium' }
      };
    });

    // 5. Data Rows (Row 7 onwards)
    let currentRow = 7;
    for (const kpi of masterKpis) {
      const rowData = [
        kpi.department || '',
        kpi.kpiType || '',
        kpi.description || ''
      ];

      sheet.getRow(currentRow).height = 24;
      rowData.forEach((val, idx) => {
        const cell = sheet.getCell(currentRow, idx + 1);
        cell.value = val;
        cell.font = { name: 'Khmer OS Siemreap', size: 9 };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });

      currentRow++;
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Master_KPI_List_${new Date().getTime()}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Failed to generate Master KPI Excel:', error);
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 });
  }
}
