'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

// Helper to safely parse dates (DD/MM/YYYY, YYYY-MM-DD, or Excel numeric serial dates)
function parseExcelDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (typeof val === 'number' && val > 20000 && val < 65000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + val * 86400000);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(val).trim();
  if (!str || str === '-' || str === '0' || str.toLowerCase() === 'null') return null;

  // Try YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(str)) {
    const parts = str.split(/[-/.]/);
    const d = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
    if (!isNaN(d.getTime())) return d;
  }
  // Try DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}/.test(str)) {
    const parts = str.split(/[-/.]/);
    const d = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
    if (!isNaN(d.getTime())) return d;
  }
  const num = Number(str);
  if (!isNaN(num) && num > 20000 && num < 65000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + num * 86400000);
    if (!isNaN(d.getTime())) return d;
  }
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function parseNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const str = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? fallback : parsed;
}

function parseNullableNumber(val: any): number | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (!str || str === '-' || str === '0') return null;
  const num = parseNumber(val, NaN);
  return isNaN(num) ? null : num;
}

function parseMaritalStatus(val: any): string {
  if (!val) return 'SINGLE';
  const str = String(val).trim().toUpperCase();
  if (str.includes('MARRIED') || str.includes('រៀបការ') || str.includes('已婚') || str === 'M') {
    return 'MARRIED';
  }
  return 'SINGLE';
}

function getCellVal(cell: ExcelJS.Cell | undefined): any {
  if (!cell) return null;
  const val = cell.value;
  if (val === null || val === undefined) return null;
  if (typeof val === 'object') {
    if (val instanceof Date) return val;
    if ('result' in val) return (val as any).result;
    if ('richText' in val) {
      return (val as any).richText.map((t: any) => t.text).join('');
    }
    if ('text' in val) return (val as any).text;
  }
  return val;
}

function getCellText(cell: ExcelJS.Cell | undefined): string {
  if (!cell) return '';
  const val = getCellVal(cell);
  if (val === null || val === undefined) return '';
  if (val instanceof Date) {
    return val.toLocaleDateString('en-GB');
  }
  return String(val).trim();
}

export async function importEmployeeExcel(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file || file.size === 0) {
    return { success: false, error: 'សូមជ្រើសរើសឯកសារ Excel ឬ CSV (Please select an Excel or CSV file).' };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const rowsData: any[] = [];

    // Try parsing with ExcelJS first
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      let targetSheet = workbook.worksheets[0];
      let formatDetected: 'system38' | 'factory36' | 'dynamic' = 'dynamic';
      let dataStartRow = 6;
      let headersMap: Record<string, number> = {};

      // Search all worksheets to identify Employee format
      for (const ws of workbook.worksheets) {
        for (let r = 1; r <= 10; r++) {
          const rowVals = ws.getRow(r).values as any[];
          if (!rowVals || rowVals.length === 0) continue;
          const rowText = rowVals.join(' ').toLowerCase();

          const nextRowVals = ws.getRow(r + 1).values as any[];
          const nextRowText = nextRowVals ? nextRowVals.join(' ').toLowerCase() : '';
          const combinedHeader = `${rowText} ${nextRowText}`;

          const hasId = combinedHeader.includes('អត្តលេខ') || combinedHeader.includes('id no') || combinedHeader.includes('编号') || combinedHeader.includes('工號');
          const hasName = combinedHeader.includes('ឈ្មោះខ្មែរ') || combinedHeader.includes('ឈ្មោះ') || combinedHeader.includes('name');

          if (hasId && hasName) {
            targetSheet = ws;
            const subHeaderRow = (nextRowText.includes('ចាប់ផ្តើម') || nextRowText.includes('start') || nextRowText.includes('ទី១') || nextRowText.includes('sex') || nextRowText.includes('ភេទ')) ? r + 1 : r;
            dataStartRow = subHeaderRow + 1;

            const col6Text = getCellText(ws.getRow(subHeaderRow).getCell(6)).toLowerCase();
            const col7Text = getCellText(ws.getRow(subHeaderRow).getCell(7)).toLowerCase();

            // Detect System Format: Col 6 is DOB, Col 7 is POB
            if (col6Text.includes('កំណើត') || col6Text.includes('birth') || col6Text.includes('dob')) {
              formatDetected = 'system38';
            }
            // Detect Factory 36 Format: Col 6 is Hire/Join Date, Col 7 is ID Card
            else if (col6Text.includes('ចូលធ្វើការ') || col6Text.includes('hire') || col6Text.includes('join')) {
              formatDetected = 'factory36';
            }
            // Dynamic scan
            else {
              formatDetected = 'dynamic';
              const headerRow = ws.getRow(subHeaderRow);
              const prevHeaderRow = subHeaderRow > 1 ? ws.getRow(subHeaderRow - 1) : null;
              const nextHeaderRow = ws.getRow(subHeaderRow + 1);

              headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const t1 = cell.text?.trim()?.toLowerCase() || '';
                const t2 = prevHeaderRow ? prevHeaderRow.getCell(colNumber).text?.trim()?.toLowerCase() || '' : '';
                const t3 = nextHeaderRow ? nextHeaderRow.getCell(colNumber).text?.trim()?.toLowerCase() || '' : '';
                const text = `${t2} ${t1} ${t3}`;

                if (text.includes('id no') || text.includes('អត្តលេខ') || text === 'id' || text.includes('employee id') || text.includes('工號') || text.includes('编号')) headersMap['employeeId'] = colNumber;
                else if (text.includes('khmer') || text.includes('ឈ្មោះខ្មែរ') || text.includes('柬文名字')) headersMap['nameKh'] = colNumber;
                else if (text.includes('english') || text.includes('ឈ្មោះឡាតាំង') || text.includes('英文名字')) headersMap['nameEn'] = colNumber;
                else if (text.includes('sex') || text.includes('gender') || text.includes('ភេទ') || text.includes('性别')) headersMap['gender'] = colNumber;
                else if (text.includes('hire') || text.includes('join') || text.includes('ចូលធ្វើការ') || text.includes('入职日期')) headersMap['hireDate'] = colNumber;
                else if (text.includes('bank') || text.includes('ធនាគារ') || text.includes('银行')) headersMap['bankCardNo'] = colNumber;
                else if (text.includes('dept') || text.includes('department') || text.includes('ផ្នែក') || text.includes('部门')) headersMap['department'] = colNumber;
                else if (text.includes('position') || text.includes('job') || text.includes('មុខងារ') || text.includes('តួនាទី') || text.includes('职务')) headersMap['position'] = colNumber;
                else if (text.includes('probation start') || text.includes('សាកល្បងចាប់ផ្តើម') || (text.includes('សាកល្បង') && text.includes('ចាប់ផ្តើម')) || text.includes('试用开始')) headersMap['probationStart'] = colNumber;
                else if (text.includes('probation end') || text.includes('សាកល្បងបញ្ចប់') || (text.includes('សាកល្បង') && text.includes('បញ្ចប់')) || text.includes('试用结束')) headersMap['probationEnd'] = colNumber;
                else if (text.includes('regular 1') || (text.includes('កិច្ចសន្យា') && text.includes('១')) || (text.includes('正式合同') && text.includes('1'))) headersMap['regularContract1'] = colNumber;
                else if (text.includes('regular 2') || (text.includes('កិច្ចសន្យា') && text.includes('២')) || (text.includes('正式合同') && text.includes('2'))) headersMap['regularContract2'] = colNumber;
                else if (text.includes('regular 3') || (text.includes('កិច្ចសន្យា') && text.includes('៣')) || (text.includes('正式合同') && text.includes('3'))) headersMap['regularContract3'] = colNumber;
                else if (text.includes('salary 1') || (text.includes('បៀវត្សរ៍') && text.includes('១')) || (text.includes('底薪') && text.includes('1'))) headersMap['basicSalary1'] = colNumber;
                else if (text.includes('salary 2') || (text.includes('បៀវត្សរ៍') && text.includes('២')) || (text.includes('底薪') && text.includes('2'))) headersMap['basicSalary2'] = colNumber;
                else if (text.includes('salary 3') || (text.includes('បៀវត្សរ៍') && text.includes('៣')) || (text.includes('底薪') && text.includes('3'))) headersMap['basicSalary3'] = colNumber;
                else if (text.includes('salary') || text.includes('បៀវត្សរ៍') || text.includes('ប្រាក់ខែ') || text.includes('底薪')) {
                  if (!headersMap['basicSalary1']) headersMap['basicSalary1'] = colNumber;
                }
                else if (text.includes('skill 1') || (text.includes('ជំនាញ') && text.includes('១')) || (text.includes('技能') && text.includes('1'))) headersMap['skillAllowance1'] = colNumber;
                else if (text.includes('skill 2') || (text.includes('ជំនាញ') && text.includes('២')) || (text.includes('技能') && text.includes('2'))) headersMap['skillAllowance2'] = colNumber;
                else if (text.includes('skill 3') || (text.includes('ជំនាញ') && text.includes('៣')) || (text.includes('技能') && text.includes('3'))) headersMap['skillAllowance3'] = colNumber;
                else if (text.includes('skill') || text.includes('ជំនាញ') || text.includes('技能')) {
                  if (!headersMap['skillAllowance1']) headersMap['skillAllowance1'] = colNumber;
                }
                else if (text.includes('position 1') || (text.includes('ប្រាក់មុខងារ') && text.includes('១')) || (text.includes('岗位补贴') && text.includes('1'))) headersMap['positionAllowance1'] = colNumber;
                else if (text.includes('position 2') || (text.includes('ប្រាក់មុខងារ') && text.includes('២')) || (text.includes('岗位补贴') && text.includes('2'))) headersMap['positionAllowance2'] = colNumber;
                else if (text.includes('position 3') || (text.includes('ប្រាក់មុខងារ') && text.includes('៣')) || (text.includes('岗位补贴') && text.includes('3'))) headersMap['positionAllowance3'] = colNumber;
                else if (text.includes('position allowance') || text.includes('ប្រាក់មុខងារ') || text.includes('岗位补贴')) {
                  if (!headersMap['positionAllowance1']) headersMap['positionAllowance1'] = colNumber;
                }
                else if (text.includes('dob') || text.includes('birth') || text.includes('កំណើត') || text.includes('出生日期') || text.includes('出生')) {
                  if (text.includes('place') || text.includes('ទីកន្លែង') || text.includes('出生地')) {
                    headersMap['placeOfBirth'] = colNumber;
                  } else {
                    headersMap['dob'] = colNumber;
                  }
                }
                else if (text.includes('national id') || text.includes('លេខអត្តសញ្ញាណប័ណ្ណ') || text.includes('身份证号')) headersMap['nationalId'] = colNumber;
                else if (text.includes('card no') || text.includes('កាតសម្គាល់') || text.includes('卡号')) headersMap['cardNo'] = colNumber;
                else if (text.includes('place of birth') || text.includes('ទីកន្លែងកំណើត') || text.includes('出生地')) headersMap['placeOfBirth'] = colNumber;
                else if (text.includes('address') || text.includes('អាស័យដ្ឋាន') || text.includes('地址')) headersMap['address'] = colNumber;
                else if (text.includes('education') || text.includes('កម្រិតវប្បធម៌') || text.includes('学历')) headersMap['education'] = colNumber;
                else if (text.includes('child') || text.includes('កូន') || text.includes('子女')) headersMap['numberOfChildren'] = colNumber;
                else if (text.includes('marital') || text.includes('ស្ថានភាពគ្រួសារ') || text.includes('婚姻状况')) headersMap['maritalStatus'] = colNumber;
                else if (text.includes('health book') || text.includes('work book') || text.includes('សៀវភៅសុខភាព') || text.includes('健康证')) headersMap['healthBook'] = colNumber;
                else if (text.includes('health cert') || text.includes('សំបុត្រពេទ្យ') || text.includes('体检单')) headersMap['healthCertificate'] = colNumber;
                else if (text.includes('remark') || text.includes('ផ្សេងៗ') || text.includes('备注')) headersMap['remark'] = colNumber;
                else if (text.includes('nssf') || text.includes('ប.ស.ស') || text.includes('社保')) headersMap['nssfNo'] = colNumber;
                else if (text.includes('spouse') || text.includes('ប្តី') || text.includes('ប្រពន្ធ') || text.includes('配偶')) headersMap['spouseName'] = colNumber;
                else if (text.includes('phone') || text.includes('ទូរស័ព្ទ') || text.includes('电话')) headersMap['phone'] = colNumber;
                else if (text.includes('telegram') || text.includes('chat id') || text.includes('តេឡេក្រាម') || text.includes('飞机')) headersMap['telegramChatId'] = colNumber;
              });
            }
            break;
          }
        }
        if (formatDetected !== 'dynamic' || Object.keys(headersMap).length >= 3) break;
      }

      // Read each data row
      targetSheet.eachRow((row, rowNumber) => {
        if (rowNumber < dataStartRow) return;

        let employeeId = '';
        let nameKh = '';
        let nameEn = '';
        let genderStr = '';
        let hireDateVal: any = null;
        let cardNo = '';
        let bankCardNo = '';
        let department = 'General';
        let position = 'Staff';
        let probationStartVal: any = null;
        let probationEndVal: any = null;
        let regularContract1Val: any = null;
        let regularContract2Val: any = null;
        let regularContract3Val: any = null;
        let basicSalary1Val: any = null;
        let basicSalary2Val: any = null;
        let basicSalary3Val: any = null;
        let skillAllowance1Val: any = null;
        let skillAllowance2Val: any = null;
        let skillAllowance3Val: any = null;
        let positionAllowance1Val: any = null;
        let positionAllowance2Val: any = null;
        let positionAllowance3Val: any = null;
        let dobVal: any = null;
        let nationalId = '';
        let placeOfBirth = '';
        let address = '';
        let education = '';
        let childrenVal: any = 0;
        let maritalStatusStr = 'SINGLE';
        let healthBook = '';
        let healthCertificate = '';
        let remark = '';
        let nssfNo = '';
        let spouseName = '';
        let phone = '';
        let telegramChatId = '';

        if (formatDetected === 'system38') {
          // =====================================
          // Exact 38-column System Form Template
          // =====================================
          employeeId = getCellText(row.getCell(2));
          nameKh = getCellText(row.getCell(3));
          nameEn = getCellText(row.getCell(4));
          genderStr = getCellText(row.getCell(5));
          dobVal = getCellVal(row.getCell(6));
          placeOfBirth = getCellText(row.getCell(7));
          address = getCellText(row.getCell(8));
          phone = getCellText(row.getCell(9));
          telegramChatId = getCellText(row.getCell(10));
          maritalStatusStr = getCellText(row.getCell(11));
          spouseName = getCellText(row.getCell(12));
          childrenVal = getCellVal(row.getCell(13));
          hireDateVal = getCellVal(row.getCell(14));
          department = getCellText(row.getCell(15)) || 'General';
          position = getCellText(row.getCell(16)) || 'Staff';
          probationStartVal = getCellVal(row.getCell(17));
          probationEndVal = getCellVal(row.getCell(18));
          regularContract1Val = getCellVal(row.getCell(19));
          regularContract2Val = getCellVal(row.getCell(20));
          regularContract3Val = getCellVal(row.getCell(21));
          basicSalary1Val = getCellVal(row.getCell(22));
          basicSalary2Val = getCellVal(row.getCell(23));
          basicSalary3Val = getCellVal(row.getCell(24));
          skillAllowance1Val = getCellVal(row.getCell(25));
          skillAllowance2Val = getCellVal(row.getCell(26));
          skillAllowance3Val = getCellVal(row.getCell(27));
          positionAllowance1Val = getCellVal(row.getCell(28));
          positionAllowance2Val = getCellVal(row.getCell(29));
          positionAllowance3Val = getCellVal(row.getCell(30));
          cardNo = getCellText(row.getCell(31));
          nationalId = getCellText(row.getCell(32));
          education = getCellText(row.getCell(33));
          bankCardNo = getCellText(row.getCell(34));
          nssfNo = getCellText(row.getCell(35));
          healthBook = getCellText(row.getCell(36));
          healthCertificate = getCellText(row.getCell(37));
          remark = getCellText(row.getCell(38));
        } else if (formatDetected === 'factory36') {
          // =====================================
          // Exact 36-column Factory Template (Image 1)
          // =====================================
          employeeId = getCellText(row.getCell(2));
          nameKh = getCellText(row.getCell(3));
          nameEn = getCellText(row.getCell(4));
          genderStr = getCellText(row.getCell(5));
          hireDateVal = getCellVal(row.getCell(6));
          cardNo = getCellText(row.getCell(7));
          bankCardNo = getCellText(row.getCell(8));
          department = getCellText(row.getCell(9)) || 'General';
          position = getCellText(row.getCell(10)) || 'Staff';
          probationStartVal = getCellVal(row.getCell(11));
          probationEndVal = getCellVal(row.getCell(12));
          regularContract1Val = getCellVal(row.getCell(13));
          regularContract2Val = getCellVal(row.getCell(14));
          regularContract3Val = getCellVal(row.getCell(15));
          basicSalary1Val = getCellVal(row.getCell(16));
          basicSalary2Val = getCellVal(row.getCell(17));
          basicSalary3Val = getCellVal(row.getCell(18));
          skillAllowance1Val = getCellVal(row.getCell(19));
          skillAllowance2Val = getCellVal(row.getCell(20));
          skillAllowance3Val = getCellVal(row.getCell(21));
          positionAllowance1Val = getCellVal(row.getCell(22));
          positionAllowance2Val = getCellVal(row.getCell(23));
          positionAllowance3Val = getCellVal(row.getCell(24));
          dobVal = getCellVal(row.getCell(25));
          nationalId = getCellText(row.getCell(26));
          placeOfBirth = getCellText(row.getCell(27));
          address = getCellText(row.getCell(28));
          education = getCellText(row.getCell(29));
          childrenVal = getCellVal(row.getCell(30));
          maritalStatusStr = getCellText(row.getCell(31));
          healthBook = getCellText(row.getCell(32));
          healthCertificate = getCellText(row.getCell(33));
          remark = getCellText(row.getCell(34));
          nssfNo = getCellText(row.getCell(35));
          spouseName = getCellText(row.getCell(36));
        } else if (Object.keys(headersMap).length > 0) {
          // Dynamic mapping based on detected header keys
          if (headersMap['employeeId']) employeeId = getCellText(row.getCell(headersMap['employeeId']));
          if (headersMap['nameKh']) nameKh = getCellText(row.getCell(headersMap['nameKh']));
          if (headersMap['nameEn']) nameEn = getCellText(row.getCell(headersMap['nameEn']));
          if (headersMap['gender']) genderStr = getCellText(row.getCell(headersMap['gender']));
          if (headersMap['hireDate']) hireDateVal = getCellVal(row.getCell(headersMap['hireDate']));
          if (headersMap['cardNo']) cardNo = getCellText(row.getCell(headersMap['cardNo']));
          if (headersMap['bankCardNo']) bankCardNo = getCellText(row.getCell(headersMap['bankCardNo']));
          if (headersMap['department']) department = getCellText(row.getCell(headersMap['department'])) || 'General';
          if (headersMap['position']) position = getCellText(row.getCell(headersMap['position'])) || 'Staff';
          if (headersMap['probationStart']) probationStartVal = getCellVal(row.getCell(headersMap['probationStart']));
          if (headersMap['probationEnd']) probationEndVal = getCellVal(row.getCell(headersMap['probationEnd']));
          if (headersMap['regularContract1']) regularContract1Val = getCellVal(row.getCell(headersMap['regularContract1']));
          if (headersMap['regularContract2']) regularContract2Val = getCellVal(row.getCell(headersMap['regularContract2']));
          if (headersMap['regularContract3']) regularContract3Val = getCellVal(row.getCell(headersMap['regularContract3']));
          if (headersMap['basicSalary1']) basicSalary1Val = getCellVal(row.getCell(headersMap['basicSalary1']));
          if (headersMap['basicSalary2']) basicSalary2Val = getCellVal(row.getCell(headersMap['basicSalary2']));
          if (headersMap['basicSalary3']) basicSalary3Val = getCellVal(row.getCell(headersMap['basicSalary3']));
          if (headersMap['skillAllowance1']) skillAllowance1Val = getCellVal(row.getCell(headersMap['skillAllowance1']));
          if (headersMap['skillAllowance2']) skillAllowance2Val = getCellVal(row.getCell(headersMap['skillAllowance2']));
          if (headersMap['skillAllowance3']) skillAllowance3Val = getCellVal(row.getCell(headersMap['skillAllowance3']));
          if (headersMap['positionAllowance1']) positionAllowance1Val = getCellVal(row.getCell(headersMap['positionAllowance1']));
          if (headersMap['positionAllowance2']) positionAllowance2Val = getCellVal(row.getCell(headersMap['positionAllowance2']));
          if (headersMap['positionAllowance3']) positionAllowance3Val = getCellVal(row.getCell(headersMap['positionAllowance3']));
          if (headersMap['dob']) dobVal = getCellVal(row.getCell(headersMap['dob']));
          if (headersMap['nationalId']) nationalId = getCellText(row.getCell(headersMap['nationalId']));
          if (headersMap['placeOfBirth']) placeOfBirth = getCellText(row.getCell(headersMap['placeOfBirth']));
          if (headersMap['address']) address = getCellText(row.getCell(headersMap['address']));
          if (headersMap['education']) education = getCellText(row.getCell(headersMap['education']));
          if (headersMap['numberOfChildren']) childrenVal = getCellVal(row.getCell(headersMap['numberOfChildren']));
          if (headersMap['maritalStatus']) maritalStatusStr = getCellText(row.getCell(headersMap['maritalStatus']));
          if (headersMap['healthBook']) healthBook = getCellText(row.getCell(headersMap['healthBook']));
          if (headersMap['healthCertificate']) healthCertificate = getCellText(row.getCell(headersMap['healthCertificate']));
          if (headersMap['remark']) remark = getCellText(row.getCell(headersMap['remark']));
          if (headersMap['nssfNo']) nssfNo = getCellText(row.getCell(headersMap['nssfNo']));
          if (headersMap['spouseName']) spouseName = getCellText(row.getCell(headersMap['spouseName']));
          if (headersMap['phone']) phone = getCellText(row.getCell(headersMap['phone']));
          if (headersMap['telegramChatId']) telegramChatId = getCellText(row.getCell(headersMap['telegramChatId']));
        }

        // Fallback for employeeId if not detected
        if (!employeeId) {
          const col1 = getCellText(row.getCell(1));
          const col2 = getCellText(row.getCell(2));
          if (col2 && isNaN(Number(col1))) {
            employeeId = col2;
          } else if (col2 && !isNaN(Number(col1))) {
            employeeId = col2;
          } else if (col1 && isNaN(Number(col1))) {
            employeeId = col1;
          }
        }

        // Ignore summary/header rows
        if (!employeeId || employeeId.toLowerCase().includes('id no') || employeeId.toLowerCase().includes('អត្តលេខ') || employeeId.toLowerCase().includes('total') || employeeId.toLowerCase().includes('សរុប')) {
          return;
        }

        rowsData.push({
          employeeId,
          nameKh,
          nameEn,
          genderStr,
          hireDateVal,
          cardNo,
          bankCardNo,
          department,
          position,
          probationStartVal,
          probationEndVal,
          regularContract1Val,
          regularContract2Val,
          regularContract3Val,
          basicSalary1Val,
          basicSalary2Val,
          basicSalary3Val,
          skillAllowance1Val,
          skillAllowance2Val,
          skillAllowance3Val,
          positionAllowance1Val,
          positionAllowance2Val,
          positionAllowance3Val,
          dobVal,
          nationalId,
          placeOfBirth,
          address,
          education,
          childrenVal,
          maritalStatusStr,
          healthBook,
          healthCertificate,
          remark,
          nssfNo,
          spouseName,
          phone,
          telegramChatId,
        });
      });
    } catch (excelJsError) {
      console.warn('ExcelJS failed, falling back to XLSX (SheetJS):', excelJsError);
      // Fallback parser with SheetJS for legacy files
      const workbook = XLSX.read(buffer, { type: 'buffer', codepage: 65001 });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      let startRow = 1;
      let sheetJsFormat: 'system38' | 'factory36' = 'factory36';

      // Find header row
      for (let r = 0; r < Math.min(15, rawRows.length); r++) {
        const rowStr = (rawRows[r] || []).join(' ').toLowerCase();
        if ((rowStr.includes('id') || rowStr.includes('អត្តលេខ') || rowStr.includes('编号')) && (rowStr.includes('name') || rowStr.includes('ឈ្មោះ'))) {
          startRow = r + 1;
          const nextRowStr = (rawRows[r + 1] || []).join(' ').toLowerCase();
          if (nextRowStr.includes('start') || nextRowStr.includes('ចាប់ផ្តើម') || nextRowStr.includes('sex') || nextRowStr.includes('ភេទ')) {
            startRow = r + 2;
          }
          if (rowStr.includes('birth') || rowStr.includes('កំណើត')) {
            sheetJsFormat = 'system38';
          }
          break;
        }
      }

      for (let r = startRow; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length === 0) continue;

        let employeeId = String(row[1] || row[0] || '').trim();
        if (!employeeId || !isNaN(Number(row[0])) && row[1]) {
          employeeId = String(row[1]).trim();
        }
        if (!employeeId || employeeId.toLowerCase().includes('total') || employeeId.toLowerCase().includes('id no') || employeeId.toLowerCase().includes('អត្តលេខ')) continue;

        if (sheetJsFormat === 'system38') {
          rowsData.push({
            employeeId,
            nameKh: String(row[2] || '').trim(),
            nameEn: String(row[3] || '').trim(),
            genderStr: String(row[4] || '').trim(),
            dobVal: row[5],
            placeOfBirth: String(row[6] || '').trim(),
            address: String(row[7] || '').trim(),
            phone: String(row[8] || '').trim(),
            telegramChatId: String(row[9] || '').trim(),
            maritalStatusStr: String(row[10] || 'SINGLE').trim(),
            spouseName: String(row[11] || '').trim(),
            childrenVal: row[12],
            hireDateVal: row[13],
            department: String(row[14] || 'General').trim(),
            position: String(row[15] || 'Staff').trim(),
            probationStartVal: row[16],
            probationEndVal: row[17],
            regularContract1Val: row[18],
            regularContract2Val: row[19],
            regularContract3Val: row[20],
            basicSalary1Val: row[21],
            basicSalary2Val: row[22],
            basicSalary3Val: row[23],
            skillAllowance1Val: row[24],
            skillAllowance2Val: row[25],
            skillAllowance3Val: row[26],
            positionAllowance1Val: row[27],
            positionAllowance2Val: row[28],
            positionAllowance3Val: row[29],
            cardNo: String(row[30] || '').trim(),
            nationalId: String(row[31] || '').trim(),
            education: String(row[32] || '').trim(),
            bankCardNo: String(row[33] || '').trim(),
            nssfNo: String(row[34] || '').trim(),
            healthBook: String(row[35] || '').trim(),
            healthCertificate: String(row[36] || '').trim(),
            remark: String(row[37] || '').trim(),
          });
        } else {
          rowsData.push({
            employeeId,
            nameKh: String(row[2] || '').trim(),
            nameEn: String(row[3] || '').trim(),
            genderStr: String(row[4] || '').trim(),
            hireDateVal: row[5],
            cardNo: String(row[6] || '').trim(),
            bankCardNo: String(row[7] || '').trim(),
            department: String(row[8] || 'General').trim(),
            position: String(row[9] || 'Staff').trim(),
            probationStartVal: row[10],
            probationEndVal: row[11],
            regularContract1Val: row[12],
            regularContract2Val: row[13],
            regularContract3Val: row[14],
            basicSalary1Val: row[15],
            basicSalary2Val: row[16],
            basicSalary3Val: row[17],
            skillAllowance1Val: row[18],
            skillAllowance2Val: row[19],
            skillAllowance3Val: row[20],
            positionAllowance1Val: row[21],
            positionAllowance2Val: row[22],
            positionAllowance3Val: row[23],
            dobVal: row[24],
            nationalId: String(row[25] || '').trim(),
            placeOfBirth: String(row[26] || '').trim(),
            address: String(row[27] || '').trim(),
            education: String(row[28] || '').trim(),
            childrenVal: row[29],
            maritalStatusStr: String(row[30] || 'SINGLE').trim(),
            healthBook: String(row[31] || '').trim(),
            healthCertificate: String(row[32] || '').trim(),
            remark: String(row[33] || '').trim(),
            nssfNo: String(row[34] || '').trim(),
            spouseName: String(row[35] || '').trim(),
            phone: '',
            telegramChatId: '',
          });
        }
      }
    }

    if (rowsData.length === 0) {
      return { success: false, error: 'រកមិនឃើញទិន្នន័យបុគ្គលិកក្នុងឯកសារនេះទេ (No employee records found in file).' };
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of rowsData) {
      const employeeId = String(item.employeeId || '').trim();
      if (!employeeId) continue;

      // Parse Names
      let firstNameEn = item.nameEn || 'Employee';
      let lastNameEn = '';
      if (item.nameEn && item.nameEn.includes(' ')) {
        const parts = item.nameEn.trim().split(/\s+/);
        firstNameEn = parts[0];
        lastNameEn = parts.slice(1).join(' ');
      }

      let firstNameKh = item.nameKh || '';
      let lastNameKh = '';
      if (item.nameKh && item.nameKh.includes(' ')) {
        const parts = item.nameKh.trim().split(/\s+/);
        firstNameKh = parts[0];
        lastNameKh = parts.slice(1).join(' ');
      }

      // Check if Khmer and English names were inverted
      const khmerRegex = /[\u1780-\u17FF]/;
      const hasKhmerInEn = firstNameEn && khmerRegex.test(firstNameEn);
      const hasKhmerInKh = firstNameKh && khmerRegex.test(firstNameKh);

      if (hasKhmerInEn && !hasKhmerInKh) {
        const tmpFn = firstNameKh;
        const tmpLn = lastNameKh;
        firstNameKh = firstNameEn;
        lastNameKh = lastNameEn;
        firstNameEn = tmpFn || 'Employee';
        lastNameEn = tmpLn;
      }

      // Parse Gender
      let gender = 'Female';
      const gStr = String(item.genderStr || '').trim().toUpperCase();
      if (gStr === 'M' || gStr === 'MALE' || gStr === 'ប្រុស' || gStr.includes('MALE') || gStr.includes('ប្រុស') || gStr.includes('男')) {
        gender = 'ប្រុស';
      } else if (gStr === 'F' || gStr === 'FEMALE' || gStr === 'ស្រី' || gStr.includes('FEMALE') || gStr.includes('ស្រី') || gStr.includes('女')) {
        gender = 'Female';
      }

      // Parse Dates
      const hireDate = parseExcelDate(item.hireDateVal) || new Date();
      const dob = parseExcelDate(item.dobVal);
      const probationStart = parseExcelDate(item.probationStartVal);
      const probationEnd = parseExcelDate(item.probationEndVal);
      const regularContract1 = parseExcelDate(item.regularContract1Val);
      const regularContract2 = parseExcelDate(item.regularContract2Val);
      const regularContract3 = parseExcelDate(item.regularContract3Val);

      // Parse Salaries & Allowances
      const basicSal1 = parseNullableNumber(item.basicSalary1Val);
      const basicSal2 = parseNullableNumber(item.basicSalary2Val);
      const basicSal3 = parseNullableNumber(item.basicSalary3Val);
      const primaryBasicSalary = basicSal1 ?? (parseNumber(item.basicSalaryVal, 0) || 0);

      const skill1 = parseNullableNumber(item.skillAllowance1Val);
      const skill2 = parseNullableNumber(item.skillAllowance2Val);
      const skill3 = parseNullableNumber(item.skillAllowance3Val);

      const posAllow1 = parseNullableNumber(item.positionAllowance1Val);
      const posAllow2 = parseNullableNumber(item.positionAllowance2Val);
      const posAllow3 = parseNullableNumber(item.positionAllowance3Val);

      // Parse Other fields
      const numberOfChildren = parseInt(String(item.childrenVal || '0').replace(/[^0-9]/g, '')) || 0;
      const maritalStatus = parseMaritalStatus(item.maritalStatusStr);

      const existing = await prisma.employee.findUnique({
        where: { employeeId }
      });

      const dataToSave: any = {
        firstNameEn,
        lastNameEn,
        firstNameKh: firstNameKh || null,
        lastNameKh: lastNameKh || null,
        gender,
        hireDate,
        dob,
        position: item.position || 'Staff',
        department: item.department || 'General',
        basicSalary: primaryBasicSalary,
        basicSalary1: basicSal1 ?? (primaryBasicSalary > 0 ? primaryBasicSalary : null),
        basicSalary2: basicSal2,
        basicSalary3: basicSal3,
        skillAllowance1: skill1,
        skillAllowance2: skill2,
        skillAllowance3: skill3,
        positionAllowance1: posAllow1,
        positionAllowance2: posAllow2,
        positionAllowance3: posAllow3,
        probationStart,
        probationEnd,
        regularContract1,
        regularContract2,
        regularContract3,
        cardNo: item.cardNo || null,
        bankCardNo: item.bankCardNo || null,
        nationalId: item.nationalId || null,
        placeOfBirth: item.placeOfBirth || null,
        address: item.address || null,
        education: item.education || null,
        numberOfChildren,
        maritalStatus,
        healthBook: item.healthBook || null,
        healthCertificate: item.healthCertificate || null,
        remark: item.remark || null,
        nssfNo: item.nssfNo || null,
        spouseName: item.spouseName || null,
        ...(item.phone ? { phone: item.phone } : {}),
        ...(item.telegramChatId ? { telegramChatId: item.telegramChatId } : {}),
      };

      if (existing) {
        await prisma.employee.update({
          where: { id: existing.id },
          data: dataToSave
        });
        updatedCount++;
      } else {
        await prisma.employee.create({
          data: {
            employeeId,
            ...dataToSave
          }
        });
        createdCount++;
      }
    }

    revalidatePath('/dashboard/employees');
    revalidatePath('/dashboard/exports');
    revalidatePath('/dashboard/payroll');
    revalidatePath('/dashboard/attendance');

    return { success: true, count: rowsData.length, created: createdCount, updated: updatedCount };
  } catch (error: any) {
    console.error('Error importing employee Excel:', error);
    return { success: false, error: 'បញ្ហាក្នុងការនាំចូលឯកសារ (Import error): ' + (error.message || 'Unknown error') };
  }
}
