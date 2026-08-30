'use client'

import React from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type DeptSummary = {
  department: string;
  headcount: number;
  usd100: number;
  usd50: number;
  usd20: number;
  usd10: number;
  totalUsd: number;
  riel50k: number;
  riel20k: number;
  riel10k: number;
  riel5k: number;
  riel1k: number;
  riel500: number;
  riel100: number;
  totalRiel: number;
  totalNetUsd: number;
  totalFirstPayment: number;
};

export default function MasterSalarySummaryClient({ data, month, year, companyName }: { data: DeptSummary[], month: number, year: number, companyName: string }) {
  const currentYear = new Date().getFullYear();

  // Calculate Grand Totals
  const totals = data.reduce((acc, curr) => {
    acc.headcount += curr.headcount;
    acc.usd100 += curr.usd100;
    acc.usd50 += curr.usd50;
    acc.usd20 += curr.usd20;
    acc.usd10 += curr.usd10;
    acc.totalUsd += curr.totalUsd;
    acc.riel50k += curr.riel50k;
    acc.riel20k += curr.riel20k;
    acc.riel10k += curr.riel10k;
    acc.riel5k += curr.riel5k;
    acc.riel1k += curr.riel1k;
    acc.riel500 += curr.riel500;
    acc.riel100 += curr.riel100;
    acc.totalRiel += curr.totalRiel;
    acc.totalNetUsd += curr.totalNetUsd;
    acc.totalFirstPayment += curr.totalFirstPayment;
    return acc;
  }, {
    headcount: 0, usd100: 0, usd50: 0, usd20: 0, usd10: 0, totalUsd: 0,
    riel50k: 0, riel20k: 0, riel10k: 0, riel5k: 0, riel1k: 0, riel500: 0, riel100: 0, totalRiel: 0,
    totalNetUsd: 0, totalFirstPayment: 0
  });

  const generateExcel = async () => {
    // Import dynamically to avoid SSR issues with exceljs if any, or just require it
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Summary');

    // Title rows
    ws.mergeCells('A1:O1');
    const title1 = ws.getCell('A1');
    title1.value = companyName;
    title1.font = { name: 'Khmer OS Siemreap', bold: true, size: 14 };
    title1.alignment = { horizontal: 'center', vertical: 'middle' };

    ws.mergeCells('A2:O2');
    const title2 = ws.getCell('A2');
    title2.value = `${year}年 ${String(month).padStart(2, '0')}月份员工薪资总额表 / Master Salary Summary Month ${month}-${year}`;
    title2.font = { name: 'Khmer OS Siemreap', bold: true, size: 12 };
    title2.alignment = { horizontal: 'center', vertical: 'middle' };

    ws.addRow([]); // Row 3

    // Grouped Headers (Row 4)
    ws.addRow([
      '', '', 
      'ក្រដាសប្រាក់ដុល្លារ\nUSD BREAKDOWN', '', '', '', 'ប្រាក់ដុល្លារ\n金额美金\nTotal USD', 
      'ក្រដាសប្រាក់រៀល\nRIEL BREAKDOWN', '', '', '', '', '', '', 'ប្រាក់រៀល\n金额柬币\nTotal Riel'
    ]);
    ws.mergeCells('A4:A5');
    ws.getCell('A4').value = 'ផ្នែក\n部门\nDepartment';
    ws.mergeCells('B4:B5');
    ws.getCell('B4').value = 'ចំនួន\n人数\nCount';
    ws.mergeCells('C4:F4');
    ws.mergeCells('H4:N4');
    
    ws.mergeCells('G4:G5');
    ws.mergeCells('O4:O5');
    
    // Sub Headers (Row 5)
    ws.addRow([
      '', '', 
      '100$', '50$', '20$', '10$', '',
      '50,000 ៛', '20,000 ៛', '10,000 ៛', '5,000 ៛', '1,000 ៛', '500 ៛', '100 ៛', ''
    ]);

    const headerRow4 = ws.getRow(4);
    headerRow4.height = 35;
    const headerRow5 = ws.getRow(5);
    headerRow5.height = 55; // Taller to fit 3 lines

    [4, 5].forEach(rowNum => {
      ws.getRow(rowNum).eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber <= 15) {
          cell.font = { name: 'Khmer OS Siemreap', bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        }
      });
    });

    // Data rows
    let currentRow = 6;
    data.forEach(d => {
      const row = ws.addRow([
        d.department, d.headcount,
        d.usd100 || '-', d.usd50 || '-', d.usd20 || '-', d.usd10 || '-', d.totalUsd,
        d.riel50k || '-', d.riel20k || '-', d.riel10k || '-', d.riel5k || '-', d.riel1k || '-', d.riel500 || '-', d.riel100 || '-', d.totalRiel
      ]);
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber <= 15) {
          cell.alignment = { horizontal: colNumber === 1 ? 'left' : 'center', vertical: 'middle', wrapText: true };
          if (colNumber === 7 || colNumber === 15) { 
            cell.font = { name: 'Khmer OS Siemreap', bold: true }; 
          } else {
            cell.font = { name: 'Khmer OS Siemreap' };
          }
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        }
      });
      currentRow++;
    });

    // Totals row
    const totalsRow = ws.addRow([
      'សរុបរួម (TOTAL)', totals.headcount,
      totals.usd100, totals.usd50, totals.usd20, totals.usd10, totals.totalUsd,
      totals.riel50k, totals.riel20k, totals.riel10k, totals.riel5k, totals.riel1k, totals.riel500, totals.riel100, totals.totalRiel
    ]);
    totalsRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= 15) {
        cell.font = { name: 'Khmer OS Siemreap', bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      }
    });
    currentRow++;

    // Grand Totals Table
    ws.addRow([]); currentRow++; // Blank row before grand totals
    
    // Row: Headers
    const grandHeaderRow = ws.addRow([
      '', '', // A, B
      'ប្រាក់ដុល្លារ\n美金 (USD)', '', // C, D
      'ប្រាក់រៀល\n柬币 (Riel)', '', // E, F
      'ប្រាក់ខែសរុប\n总共金额 (Total)', '', // G, H
      'បើកលើកទី១\n首付薪水 (1st Pay)', '', // I, J
      '', '', '', '', ''
    ]);
    grandHeaderRow.height = 40;
    ws.mergeCells(`A${currentRow}:B${currentRow}`);
    ws.mergeCells(`C${currentRow}:D${currentRow}`);
    ws.mergeCells(`E${currentRow}:F${currentRow}`);
    ws.mergeCells(`G${currentRow}:H${currentRow}`);
    ws.mergeCells(`I${currentRow}:J${currentRow}`);
    
    // Row: Values
    const valRow = ws.addRow([
      'សរុបរួម (TOTAL)', '', // A, B
      totals.totalUsd, '', // C, D
      totals.totalRiel, '', // E, F
      totals.totalNetUsd, '', // G, H
      totals.totalFirstPayment, '', // I, J
      '', '', '', '', ''
    ]);
    valRow.height = 25;
    const valRowNum = currentRow + 1;
    ws.mergeCells(`A${valRowNum}:B${valRowNum}`);
    ws.mergeCells(`C${valRowNum}:D${valRowNum}`);
    ws.mergeCells(`E${valRowNum}:F${valRowNum}`);
    ws.mergeCells(`G${valRowNum}:H${valRowNum}`);
    ws.mergeCells(`I${valRowNum}:J${valRowNum}`);

    // Apply borders and alignment to Grand Totals (A to J)
    [currentRow, valRowNum].forEach((rowNum) => {
      const row = ws.getRow(rowNum);
      [1, 3, 5, 7, 9].forEach(col => { // we apply to the start of each merged block
        const cell = row.getCell(col);
        cell.font = { name: 'Khmer OS Siemreap', bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        
        // Don't add border to the empty cell A10 (which is col 1 on currentRow)
        if (!(rowNum === currentRow && col === 1)) {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        }
      });
    });
    currentRow += 2;

    // Signatures
    ws.addRow([]); currentRow++;
    ws.addRow([]); currentRow++;
    const sigRow = ws.addRow([
      'អ្នកអនុញ្ញាត\n(Authorized by)', '', // A, B
      'ផ្នែកគណនេយ្យ\n(Accounting)', '', // C, D
      'ផ្នែករដ្ឋបាល\n(Admin)', '', // E, F
      'អ្នកច្រកលុយ\n(Packer)', '', // G, H
      'អ្នកបើកលុយ\n(Payer)', '', // I, J
      '', '', '', '', ''
    ]);
    sigRow.height = 40;
    ws.mergeCells(`A${currentRow}:B${currentRow}`);
    ws.mergeCells(`C${currentRow}:D${currentRow}`);
    ws.mergeCells(`E${currentRow}:F${currentRow}`);
    ws.mergeCells(`G${currentRow}:H${currentRow}`);
    ws.mergeCells(`I${currentRow}:J${currentRow}`);
    
    [1, 3, 5, 7, 9].forEach(col => {
      const cell = sigRow.getCell(col);
      cell.font = { name: 'Khmer OS Siemreap', bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    // Adjust column widths back to optimal sizing for A4
    ws.columns = [
      { width: 14 }, // A: Dept
      { width: 8 },  // B: Count
      { width: 7 },  // C: 100$
      { width: 7 },  // D: 50$
      { width: 7 },  // E: 20$
      { width: 7 },  // F: 10$
      { width: 13 }, // G: Total USD
      { width: 9 },  // H: 50k
      { width: 9 },  // I: 20k
      { width: 9 },  // J: 10k
      { width: 9 },  // K: 5k
      { width: 9 },  // L: 1k
      { width: 9 },  // M: 500
      { width: 9 },  // N: 100
      { width: 14 }  // O: Total Riel
    ];

    // Page Setup for printing (Fit to 1 page wide, Landscape)
    ws.pageSetup.orientation = 'landscape';
    ws.pageSetup.paperSize = 9; // A4
    ws.pageSetup.fitToPage = true;
    ws.pageSetup.fitToWidth = 1;
    ws.pageSetup.fitToHeight = 0; // Allow multiple pages vertically
    ws.pageSetup.margins = {
      left: 0.25, right: 0.25,
      top: 0.5, bottom: 0.5,
      header: 0.3, footer: 0.3
    };

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Master_Salary_Summary_${month}_${year}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const exportContainer = document.getElementById('salary-summary-container');
      if (!exportContainer) return;

      const canvas = await html2canvas(exportContainer, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.text('HUI MAO HANDBAGS MANUFACTURING CO.,LTD.', 14, 15);
      pdf.setFontSize(12);
      pdf.text(`Master Salary Summary - Month ${month}/${year}`, 14, 22);
      
      pdf.addImage(imgData, 'PNG', 10, 30, pdfWidth - 20, pdfHeight);
      pdf.save(`Master_Salary_Summary_${month}_${year}.pdf`);
    } catch (e) {
      console.error('Error generating PDF', e);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const generateWord = () => {
    const exportContainer = document.getElementById('salary-summary-container');
    if (!exportContainer) return;

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Master Salary Summary</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; border: 1px solid black; margin-bottom: 20px; }
          th, td { border: 1px solid black; padding: 5px; text-align: center; font-size: 11px; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 5px; }
          .subtitle { text-align: center; font-size: 14px; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="title">${companyName}</div>
        <div class="subtitle">${year}年 ${String(month).padStart(2, '0')}月份员工薪资总额表 / Master Salary Summary Month ${month}-${year}</div>
        ${exportContainer.outerHTML}
      </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Master_Salary_Summary_${month}_${year}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSV = () => {
    const headers = [
      'Department', 'Count', 
      '100$', '50$', '20$', '10$', 'Total USD', 
      '50,000 Riel', '20,000 Riel', '10,000 Riel', '5,000 Riel', '1,000 Riel', '500 Riel', '100 Riel', 'Total Riel'
    ];
    
    const rows = data.map(d => [
      d.department, d.headcount, 
      d.usd100, d.usd50, d.usd20, d.usd10, d.totalUsd,
      d.riel50k, d.riel20k, d.riel10k, d.riel5k, d.riel1k, d.riel500, d.riel100, d.totalRiel
    ]);
    
    rows.push(['TOTAL', totals.headcount, totals.usd100, totals.usd50, totals.usd20, totals.usd10, totals.totalUsd, totals.riel50k, totals.riel20k, totals.riel10k, totals.riel5k, totals.riel1k, totals.riel500, totals.riel100, totals.totalRiel]);
    rows.push([]);
    rows.push(['Grand Totals']);
    rows.push(['Total USD', totals.totalUsd]);
    rows.push(['Total Riel', totals.totalRiel]);
    rows.push(['Total Net USD', totals.totalNetUsd]);
    rows.push(['First Payment', totals.totalFirstPayment]);
    
    rows.push([]);
    rows.push([]);
    rows.push(['Authorized by', '', '', 'Accounting', '', '', 'Admin', '', '', 'Packer', '', '', 'Payer']);
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Master_Salary_Summary_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <form method="GET" className="flex flex-row gap-3 w-full md:w-auto items-center">
          <select name="month" defaultValue={month} onChange={(e) => e.currentTarget.form?.submit()} className="flex-1 md:flex-none border border-slate-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 shadow-sm">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>Month {m}</option>
            ))}
          </select>
          <select name="year" defaultValue={year} onChange={(e) => e.currentTarget.form?.submit()} className="flex-1 md:flex-none border border-slate-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 shadow-sm">
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </form>

        <div className="flex flex-row gap-2 w-full md:w-auto items-center">
          <select 
            id="exportType" 
            className="flex-1 md:flex-none border border-slate-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 shadow-sm"
          >
            <option value="excel">Excel (.xlsx)</option>
            <option value="word">Word (.doc)</option>
            <option value="pdf">PDF Document</option>
            <option value="csv">CSV File</option>
          </select>
          <button 
            onClick={() => {
              const type = (document.getElementById('exportType') as HTMLSelectElement).value;
              if (type === 'excel') generateExcel();
              if (type === 'word') generateWord();
              if (type === 'pdf') generatePDF();
              if (type === 'csv') generateCSV();
            }}
            className="bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium whitespace-nowrap shadow-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Export
          </button>
        </div>
      </div>

      <div id="salary-summary-container" className="bg-white">
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table className="w-full text-sm text-left border-collapse min-w-max">
          <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 shadow-sm">
            <tr>
              <th className="p-3 border-r border-b border-slate-200 text-center align-middle" rowSpan={2}>
                <div className="kh-text text-sm font-bold text-slate-800">ផ្នែក</div>
                <div className="text-xs font-medium">部门</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Department</div>
              </th>
              <th className="p-3 border-r border-b border-slate-200 text-center align-middle" rowSpan={2}>
                <div className="kh-text text-sm font-bold text-slate-800">ចំនួន</div>
                <div className="text-xs font-medium">人数</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Count</div>
              </th>
              <th className="p-2 border-r border-b border-slate-200 text-center bg-green-50 text-green-800" colSpan={4}>
                <div className="kh-text text-sm font-bold">ក្រដាសប្រាក់ដុល្លារ</div>
                <div className="text-xs font-medium tracking-wider">USD BREAKDOWN</div>
              </th>
              <th className="p-2 border-r border-b border-slate-200 text-center bg-green-100 text-green-900 font-bold whitespace-nowrap align-middle" rowSpan={2}>
                <div className="kh-text text-sm">ប្រាក់ដុល្លារ</div>
                <div className="text-xs font-medium">金额美金</div>
                <div className="text-[10px] text-green-700 uppercase tracking-wider">Total USD</div>
              </th>
              <th className="p-2 border-r border-b border-slate-200 text-center bg-blue-50 text-blue-800" colSpan={7}>
                <div className="kh-text text-sm font-bold">ក្រដាសប្រាក់រៀល</div>
                <div className="text-xs font-medium tracking-wider">RIEL BREAKDOWN</div>
              </th>
              <th className="p-2 border-b border-slate-200 text-center bg-blue-100 text-blue-900 font-bold whitespace-nowrap align-middle" rowSpan={2}>
                <div className="kh-text text-sm">ប្រាក់រៀល</div>
                <div className="text-xs font-medium">金额柬币</div>
                <div className="text-[10px] text-blue-700 uppercase tracking-wider">Total Riel</div>
              </th>
            </tr>
            <tr>
              <th className="p-2 border-r border-b border-slate-200 text-center bg-green-50 text-green-800 font-medium">100$</th>
              <th className="p-2 border-r border-b border-slate-200 text-center bg-green-50 text-green-800 font-medium">50$</th>
              <th className="p-2 border-r border-b border-slate-200 text-center bg-green-50 text-green-800 font-medium">20$</th>
              <th className="p-2 border-r border-b border-slate-200 text-center bg-green-50 text-green-800 font-medium">10$</th>
              
              <th className="p-2 border-r border-b border-slate-200 text-center bg-blue-50 text-blue-800 font-medium">50,000</th>
              <th className="p-2 border-r border-b border-slate-200 text-center bg-blue-50 text-blue-800 font-medium">20,000</th>
              <th className="p-2 border-r border-b border-slate-200 text-center bg-blue-50 text-blue-800 font-medium">10,000</th>
              <th className="p-2 border-r border-b border-slate-200 text-center bg-blue-50 text-blue-800 font-medium">5,000</th>
              <th className="p-2 border-r border-b border-slate-200 text-center bg-blue-50 text-blue-800 font-medium">1,000</th>
              <th className="p-2 border-r border-b border-slate-200 text-center bg-blue-50 text-blue-800 font-medium">500</th>
              <th className="p-2 border-r border-b border-slate-200 text-center bg-blue-50 text-blue-800 font-medium">100</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={15} className="p-8 border-b border-slate-200 text-center text-gray-500 kh-text">មិនមានទិន្នន័យទេ (No data found)</td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 border-b border-slate-200">
                  <td className="p-2 border-r border-slate-200 text-center font-medium kh-text text-gray-800">{row.department}</td>
                  <td className="p-2 border-r border-slate-200 text-center text-gray-600">{row.headcount}</td>
                  <td className="p-2 border-r border-slate-200 text-center text-gray-600">{row.usd100 > 0 ? row.usd100 : '-'}</td>
                  <td className="p-2 border-r border-slate-200 text-center text-gray-600">{row.usd50 > 0 ? row.usd50 : '-'}</td>
                  <td className="p-2 border-r border-slate-200 text-center text-gray-600">{row.usd20 > 0 ? row.usd20 : '-'}</td>
                  <td className="p-2 border-r border-slate-200 text-center text-gray-600">{row.usd10 > 0 ? row.usd10 : '-'}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-semibold text-green-700 bg-green-50/30">${row.totalUsd.toFixed(2)}</td>
                  
                  <td className="p-2 border-r border-slate-200 text-center text-gray-600">{row.riel50k > 0 ? row.riel50k : '-'}</td>
                  <td className="p-2 border-r border-slate-200 text-center text-gray-600">{row.riel20k > 0 ? row.riel20k : '-'}</td>
                  <td className="p-2 border-r border-slate-200 text-center text-gray-600">{row.riel10k > 0 ? row.riel10k : '-'}</td>
                  <td className="p-2 border-r border-slate-200 text-center text-gray-600">{row.riel5k > 0 ? row.riel5k : '-'}</td>
                  <td className="p-2 border-r border-slate-200 text-center text-gray-600">{row.riel1k > 0 ? row.riel1k : '-'}</td>
                  <td className="p-2 border-r border-slate-200 text-center text-gray-600">{row.riel500 > 0 ? row.riel500 : '-'}</td>
                  <td className="p-2 border-r border-slate-200 text-center text-gray-600">{row.riel100 > 0 ? row.riel100 : '-'}</td>
                  <td className="p-2 text-right font-semibold text-blue-700 bg-blue-50/30">៛{row.totalRiel.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
          {data.length > 0 && (
            <tfoot className="bg-slate-100 font-bold border-t border-slate-300 shadow-inner">
              <tr>
                <td className="p-3 border-r border-slate-200 text-center text-gray-800 kh-text">សរុបរួម (TOTAL)</td>
                <td className="p-3 border-r border-slate-200 text-center text-gray-800">{totals.headcount}</td>
                <td className="p-3 border-r border-slate-200 text-center text-gray-800">{totals.usd100}</td>
                <td className="p-3 border-r border-slate-200 text-center text-gray-800">{totals.usd50}</td>
                <td className="p-3 border-r border-slate-200 text-center text-gray-800">{totals.usd20}</td>
                <td className="p-3 border-r border-slate-200 text-center text-gray-800">{totals.usd10}</td>
                <td className="p-3 border-r border-slate-200 text-right text-green-800 bg-green-100">${totals.totalUsd.toFixed(2)}</td>
                
                <td className="p-3 border-r border-slate-200 text-center text-gray-800">{totals.riel50k}</td>
                <td className="p-3 border-r border-slate-200 text-center text-gray-800">{totals.riel20k}</td>
                <td className="p-3 border-r border-slate-200 text-center text-gray-800">{totals.riel10k}</td>
                <td className="p-3 border-r border-slate-200 text-center text-gray-800">{totals.riel5k}</td>
                <td className="p-3 border-r border-slate-200 text-center text-gray-800">{totals.riel1k}</td>
                <td className="p-3 border-r border-slate-200 text-center text-gray-800">{totals.riel500}</td>
                <td className="p-3 border-r border-slate-200 text-center text-gray-800">{totals.riel100}</td>
                <td className="p-3 text-right text-blue-800 bg-blue-100">៛{totals.totalRiel.toLocaleString()}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      
      {data.length > 0 && (
        <div className="mt-8 border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full sm:w-auto text-sm text-center border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-3 border border-slate-300 w-48 text-right align-middle">
                    
                  </th>
                  <th className="p-3 border border-slate-300 w-32 bg-slate-100">
                    <div className="kh-text font-bold text-slate-800">ប្រាក់ដុល្លារ</div>
                    <div className="text-xs font-normal text-slate-600">美金 (USD)</div>
                  </th>
                  <th className="p-3 border border-slate-300 w-32 bg-slate-100">
                    <div className="kh-text font-bold text-slate-800">ប្រាក់រៀល</div>
                    <div className="text-xs font-normal text-slate-600">柬币 (Riel)</div>
                  </th>
                  <th className="p-3 border border-slate-300 w-32 bg-slate-100">
                    <div className="kh-text font-bold text-slate-800">ប្រាក់ខែសរុប</div>
                    <div className="text-xs font-normal text-slate-600">总共金额 (Total)</div>
                  </th>
                  <th className="p-3 border border-slate-300 w-32 bg-slate-100">
                    <div className="kh-text font-bold text-slate-800">បើកលើកទី១</div>
                    <div className="text-xs font-normal text-slate-600">首付薪水 (1st Pay)</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-slate-300 font-bold bg-slate-50 text-right">
                    <div className="kh-text text-[15px] font-bold text-slate-800">សរុបរួម :</div>
                    <div className="text-xs font-normal text-slate-500">总共金额 :</div>
                  </td>
                  <td className="p-3 border border-slate-300 font-semibold">{totals.totalUsd.toFixed(2)}</td>
                  <td className="p-3 border border-slate-300 font-semibold">{totals.totalRiel.toFixed(2)}</td>
                  <td className="p-3 border border-slate-300 font-semibold">{totals.totalNetUsd.toFixed(2)}</td>
                  <td className="p-3 border border-slate-300 font-semibold">{totals.totalFirstPayment.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto mt-12 mb-6">
            <table className="w-full text-center min-w-[800px] kh-text font-bold no-border">
              <tbody>
                <tr>
                  <td className="p-4 pt-6 pb-20 w-1/5 align-top">
                    អ្នកអនុញ្ញាត<br/><span className="text-xs font-normal text-gray-500">(Authorized by)</span>
                  </td>
                  <td className="p-4 pt-6 pb-20 w-1/5 align-top">
                    ផ្នែកគណនេយ្យ<br/><span className="text-xs font-normal text-gray-500">(Accounting)</span>
                  </td>
                  <td className="p-4 pt-6 pb-20 w-1/5 align-top">
                    ផ្នែករដ្ឋបាល<br/><span className="text-xs font-normal text-gray-500">(Admin)</span>
                  </td>
                  <td className="p-4 pt-6 pb-20 w-1/5 align-top">
                    អ្នកច្រកលុយ<br/><span className="text-xs font-normal text-gray-500">(Packer)</span>
                  </td>
                  <td className="p-4 pt-6 pb-20 w-1/5 align-top">
                    អ្នកបើកលុយ<br/><span className="text-xs font-normal text-gray-500">(Payer)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
