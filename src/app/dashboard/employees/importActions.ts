'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

export async function importEmployeeExcel(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file || file.size === 0) {
    return { success: false, error: 'សូមជ្រើសរើសឯកសារ Excel ឬ CSV (Please select an Excel or CSV file).' };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const rowsData: any[] = [];
    const headersMap: { [key: string]: number } = {};
    let dataStartRow = 2;
    let isMasterFormat = false;

    // Try parsing with ExcelJS first (best for .xlsx)
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.worksheets[0];
      if (!sheet) {
        return { success: false, error: 'ឯកសារទទេ (Empty worksheet).' };
      }

      // Check header text in A1 to A6 to detect if it's Master Employee Excel format
      const a1Text = sheet.getCell('A1').text?.trim() || '';
      const a4Text = sheet.getCell('A4').text?.trim() || '';
      if (a1Text.includes('ក្រុមហ៊ុន') || a1Text.includes('EVERGREEN') || a4Text.includes('EMPLOYEE NAME LIST')) {
        isMasterFormat = true;
        dataStartRow = 7;
      } else {
        // Find header row (usually row 1 or 2)
        for (let r = 1; r <= 6; r++) {
          const firstCellText = sheet.getCell(r, 1).text?.trim() || '';
          const thirdCellText = sheet.getCell(r, 3).text?.trim() || '';
          if (firstCellText.includes('ID') || firstCellText.includes('អត្តលេខ') || firstCellText.includes('No') || thirdCellText.includes('ID')) {
            dataStartRow = r + 1;
            // Map header text to column index by checking both the current row and the row above it (to handle merged cells)
            const headerRow = sheet.getRow(r);
            const prevHeaderRow = r > 1 ? sheet.getRow(r - 1) : null;
            
            headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              const text1 = cell.text?.trim()?.toLowerCase() || '';
              const text2 = prevHeaderRow ? prevHeaderRow.getCell(colNumber).text?.trim()?.toLowerCase() || '' : '';
              const text = text1 + ' ' + text2; // Combine text from both rows
              
              if (text.includes('id no') || text.includes('អត្តលេខ') || text === 'id' || text.includes('employee id') || text.match(/\bid\b/)) headersMap['employeeId'] = colNumber;
              else if (text.includes('khmer') || text.includes('ខ្មែរ')) headersMap['nameKh'] = colNumber;
              else if (text.includes('english') || text.includes('ឡាតាំង') || text.includes('name') || text.includes('ឈ្មោះ')) headersMap['nameEn'] = colNumber;
              else if (text.includes('sex') || text.includes('gender') || text.includes('ភេទ')) headersMap['gender'] = colNumber;
              else if (text.includes('hire') || text.includes('join') || text.includes('start date') || text.includes('ចូលធ្វើការ')) headersMap['hireDate'] = colNumber;
              else if (text.includes('position') || text.includes('job') || text.includes('មុខងារ')) headersMap['position'] = colNumber;
              else if (text.includes('dept') || text.includes('department') || text.includes('ផ្នែក')) headersMap['department'] = colNumber;
              else if (text.includes('salary') || text.includes('បៀវត្សរ៍')) headersMap['basicSalary'] = colNumber;
              else if (text.includes('phone') || text.includes('ទូរស័ព្ទ')) headersMap['phone'] = colNumber;
              else if (text.includes('dob') || text.includes('birth') || text.includes('កំណើត')) headersMap['dob'] = colNumber;
              else if (text.includes('bank') || text.includes('ធនាគារ')) headersMap['bankCardNo'] = colNumber;
              else if (text.includes('national') || text.includes('អត្តសញ្ញាណប័ណ្ណ')) headersMap['nationalId'] = colNumber;
              else if (text.includes('card') || text.includes('កាត')) headersMap['cardNo'] = colNumber;
            });
            break;
          }
        }
      }

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber < dataStartRow) return;

        let employeeId = '';
        let nameKh = '';
        let nameEn = '';
        let genderStr = '';
        let hireDateVal: any = null;
        let dobVal: any = null;
        let position = 'Staff';
        let department = 'General';
        let basicSalary = 0;
        let phone = '';
        let cardNo = '';
        let bankCardNo = '';
        let nationalId = '';
        let address = '';
        let placeOfBirth = '';
        let education = '';
        let maritalStatus = 'SINGLE';
        let nssfNo = '';
        let remark = '';

        if (isMasterFormat) {
          // Fixed col indexes for Master Employee Excel
          employeeId = row.getCell(1).text?.trim();
          cardNo = row.getCell(3).text?.trim();
          nameKh = row.getCell(4).text?.trim();
          nameEn = row.getCell(5).text?.trim();
          genderStr = row.getCell(6).text?.trim();
          hireDateVal = row.getCell(7).value || row.getCell(7).text?.trim();
          nationalId = row.getCell(8).text?.trim();
          bankCardNo = row.getCell(9).text?.trim();
          department = row.getCell(10).text?.trim() || 'General';
          position = row.getCell(11).text?.trim() || 'Staff';
          
          const salVal = row.getCell(17).value || row.getCell(17).text?.trim();
          basicSalary = typeof salVal === 'number' ? salVal : parseFloat(String(salVal).replace(/[^0-9.]/g, '')) || 0;
          
          dobVal = row.getCell(26).value || row.getCell(26).text?.trim();
          placeOfBirth = row.getCell(28).text?.trim();
          address = row.getCell(29).text?.trim();
          education = row.getCell(30).text?.trim();
          
          const marStr = row.getCell(32).text?.trim()?.toUpperCase() || '';
          if (marStr.includes('MARRIED') || marStr.includes('រៀបការ')) maritalStatus = 'MARRIED';
          
          remark = row.getCell(35).text?.trim();
          nssfNo = row.getCell(36).text?.trim();
        } else if (Object.keys(headersMap).length > 0) {
          // Dynamic mapped columns
          if (headersMap['employeeId']) employeeId = row.getCell(headersMap['employeeId']).text?.trim();
          if (headersMap['nameKh']) nameKh = row.getCell(headersMap['nameKh']).text?.trim();
          if (headersMap['nameEn']) nameEn = row.getCell(headersMap['nameEn']).text?.trim();
          if (headersMap['gender']) genderStr = row.getCell(headersMap['gender']).text?.trim();
          if (headersMap['hireDate']) hireDateVal = row.getCell(headersMap['hireDate']).value || row.getCell(headersMap['hireDate']).text?.trim();
          if (headersMap['dob']) dobVal = row.getCell(headersMap['dob']).value || row.getCell(headersMap['dob']).text?.trim();
          if (headersMap['position']) position = row.getCell(headersMap['position']).text?.trim() || 'Staff';
          if (headersMap['department']) department = row.getCell(headersMap['department']).text?.trim() || 'General';
          if (headersMap['phone']) phone = row.getCell(headersMap['phone']).text?.trim();
          if (headersMap['cardNo']) cardNo = row.getCell(headersMap['cardNo']).text?.trim();
          if (headersMap['bankCardNo']) bankCardNo = row.getCell(headersMap['bankCardNo']).text?.trim();
          if (headersMap['nationalId']) nationalId = row.getCell(headersMap['nationalId']).text?.trim();
          
          if (headersMap['basicSalary']) {
            const salVal = row.getCell(headersMap['basicSalary']).value || row.getCell(headersMap['basicSalary']).text?.trim();
            basicSalary = typeof salVal === 'number' ? salVal : parseFloat(String(salVal).replace(/[^0-9.]/g, '')) || 0;
          }
        } else {
          // Default simple format fallback: Col 1=ID, Col 2=En Name, Col 3=Kh Name, Col 4=Gender, Col 5=DOB, Col 6=Hire Date, Col 7=Position, Col 8=Dept, Col 9=Salary, Col 10=Phone
          employeeId = row.getCell(1).text?.trim();
          nameEn = row.getCell(2).text?.trim();
          nameKh = row.getCell(3).text?.trim();
          genderStr = row.getCell(4).text?.trim();
          dobVal = row.getCell(5).value || row.getCell(5).text?.trim();
          hireDateVal = row.getCell(6).value || row.getCell(6).text?.trim();
          position = row.getCell(7).text?.trim() || 'Staff';
          department = row.getCell(8).text?.trim() || 'General';
          const salVal = row.getCell(9).value || row.getCell(9).text?.trim();
          basicSalary = typeof salVal === 'number' ? salVal : parseFloat(String(salVal).replace(/[^0-9.]/g, '')) || 0;
          phone = row.getCell(10).text?.trim();
        }

        if (employeeId && employeeId !== 'ID No' && employeeId !== 'អត្តលេខ' && employeeId !== 'No.') {
          rowsData.push({
            employeeId, nameKh, nameEn, genderStr, hireDateVal, dobVal, position, department, basicSalary, phone, cardNo, bankCardNo, nationalId, address, placeOfBirth, education, maritalStatus, nssfNo, remark
          });
        }
      });
    } catch (excelJsError) {
      // Fallback to SheetJS (XLSX) if ExcelJS fails (e.g. legacy CSV or XLS)
      const workbook = XLSX.read(buffer, { type: 'buffer', codepage: 65001 });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      let startRow = 1;
      if (rawRows.length > 5 && (String(rawRows[0]?.[0] || '').includes('ក្រុមហ៊ុន') || String(rawRows[3]?.[0] || '').includes('EMPLOYEE'))) {
        startRow = 6;
        isMasterFormat = true;
      }

      for (let r = startRow; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || !row[0]) continue;
        const employeeId = String(row[0]).trim();
        if (employeeId === 'ID No' || employeeId === 'អត្តលេខ' || employeeId === 'No.') continue;

        if (isMasterFormat) {
          rowsData.push({
            employeeId,
            cardNo: String(row[2] || '').trim(),
            nameKh: String(row[3] || '').trim(),
            nameEn: String(row[4] || '').trim(),
            genderStr: String(row[5] || '').trim(),
            hireDateVal: row[6],
            nationalId: String(row[7] || '').trim(),
            bankCardNo: String(row[8] || '').trim(),
            department: String(row[9] || 'General').trim(),
            position: String(row[10] || 'Staff').trim(),
            basicSalary: parseFloat(String(row[16] || row[13] || '0').replace(/[^0-9.]/g, '')) || 0,
            dobVal: row[25],
            placeOfBirth: String(row[27] || '').trim(),
            address: String(row[28] || '').trim(),
            education: String(row[29] || '').trim(),
            maritalStatus: String(row[31] || '').toUpperCase().includes('MARRIED') ? 'MARRIED' : 'SINGLE',
            remark: String(row[34] || '').trim(),
            nssfNo: String(row[35] || '').trim()
          });
        } else {
          rowsData.push({
            employeeId,
            nameEn: String(row[1] || '').trim(),
            nameKh: String(row[2] || '').trim(),
            genderStr: String(row[3] || '').trim(),
            dobVal: row[4],
            hireDateVal: row[5],
            position: String(row[6] || 'Staff').trim(),
            department: String(row[7] || 'General').trim(),
            basicSalary: parseFloat(String(row[8] || '0').replace(/[^0-9.]/g, '')) || 0,
            phone: String(row[9] || '').trim()
          });
        }
      }
    }

    if (rowsData.length === 0) {
      return { success: false, error: 'រកមិនឃើញទិន្នន័យបុគ្គលិកក្នុងឯកសារនេះទេ (No employee records found in file).' };
    }

    const parseDate = (val: any): Date => {
      if (!val) return new Date();
      if (val instanceof Date && !isNaN(val.getTime())) return val;
      const str = String(val).trim();
      if (!str) return new Date();
      // Try YYYY-MM-DD
      if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str)) {
        const d = new Date(str);
        if (!isNaN(d.getTime())) return d;
      }
      // Try DD/MM/YYYY
      if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
        const parts = str.split('/');
        const d = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
        if (!isNaN(d.getTime())) return d;
      }
      const d = new Date(str);
      return isNaN(d.getTime()) ? new Date() : d;
    };

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of rowsData) {
      const employeeId = String(item.employeeId).trim();
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

      // Parse Gender
      let gender = 'Female';
      const gStr = String(item.genderStr || '').trim().toUpperCase();
      if (gStr === 'M' || gStr === 'MALE' || gStr === 'ប្រុស' || gStr.includes('MALE') || gStr.includes('ប្រុស')) {
        gender = 'ប្រុស'; // Keep khmer/system standard
      } else if (gStr === 'F' || gStr === 'FEMALE' || gStr === 'ស្រី' || gStr.includes('FEMALE') || gStr.includes('ស្រី')) {
        gender = 'Female';
      }

      const hireDate = parseDate(item.hireDateVal);
      const dob = item.dobVal ? parseDate(item.dobVal) : null;

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
        basicSalary: item.basicSalary || 0,
        basicSalary1: item.basicSalary || null,
        phone: item.phone || null,
        cardNo: item.cardNo || null,
        bankCardNo: item.bankCardNo || null,
        nationalId: item.nationalId || null,
        address: item.address || null,
        placeOfBirth: item.placeOfBirth || null,
        education: item.education || null,
        maritalStatus: item.maritalStatus || 'SINGLE',
        nssfNo: item.nssfNo || null,
        remark: item.remark || null,
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
