'use client'

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell } from 'docx';

interface ExportButtonsProps {
  data: any[];
  columns: { header: string; key: string }[];
  filename: string;
  printId?: string; // ID of the HTML element to print
  hidePdf?: boolean;
  hideWord?: boolean;
}

export default function ExportButtons({ data, columns, filename, printId, hidePdf, hideWord }: ExportButtonsProps) {
  
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(item => {
      const row: any = {};
      columns.forEach(col => {
        row[col.header] = item[col.key];
      });
      return row;
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = columns.map(col => col.header);
    const tableRows = data.map(item => columns.map(col => item[col.key] || ''));

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      styles: { font: "helvetica", fontSize: 9 }
    });

    doc.save(`${filename}.pdf`);
  };

  const exportToWord = async () => {
    const table = new Table({
      rows: [
        new TableRow({
          children: columns.map(col => new TableCell({ children: [new Paragraph(col.header)] })),
        }),
        ...data.map(item => new TableRow({
          children: columns.map(col => new TableCell({ children: [new Paragraph(String(item[col.key] || ''))] })),
        }))
      ]
    });

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: filename, heading: "Heading1" as any }),
          table
        ],
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.docx`;
    link.click();
  };

  const exportToPrint = () => {
    if (printId) {
      const printContents = document.getElementById(printId)?.innerHTML;
      if (printContents) {
        const originalContents = document.body.innerHTML;
        const originalTitle = document.title;
        document.title = filename;
        
        // Hide everything except the print area using CSS injection instead of replacing body
        const style = document.createElement('style');
        style.innerHTML = `
          @media print {
            body * {
              visibility: hidden;
            }
            #${printId}, #${printId} * {
              visibility: visible;
            }
            #${printId} {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 5px !important;
            }
            @page {
              size: landscape;
              margin: 10mm;
            }
            /* Auto fit adjustments */
            table {
              width: 100% !important;
              font-size: 8px !important;
              table-layout: auto !important;
              border-collapse: collapse !important;
            }
            th, td {
              padding: 4px !important;
              white-space: normal !important;
              word-wrap: break-word !important;
              border: 1px solid #ccc !important;
            }
            h2, h3, p {
              margin: 4px 0 !important;
            }
            .card {
              box-shadow: none !important;
              border: none !important;
            }
          }
        `;
        document.head.appendChild(style);
        
        window.print();
        
        // Cleanup
        document.head.removeChild(style);
        document.title = originalTitle;
        return;
      }
    }
    
    // Fallback if no printId or element not found: Create a simple HTML table and print it
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${filename}</title>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 20px; }
              h1 { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f8fafc; }
              @media print {
                @page { size: landscape; margin: 10mm; }
                table { font-size: 8px !important; }
                th, td { white-space: normal !important; word-wrap: break-word !important; padding: 4px !important; }
              }
            </style>
          </head>
          <body>
            <h1>${filename.replace(/_/g, ' ')}</h1>
            <table>
              <thead>
                <tr>${columns.map(c => `<th>${c.header}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${data.map(item => `<tr>${columns.map(c => `<td>${item[c.key] || ''}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
      <button onClick={exportToExcel} className="btn-secondary" style={{ backgroundColor: '#107c41', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
        📥 Export Excel
      </button>
      {!hidePdf && (
        <button onClick={exportToPDF} className="btn-secondary" style={{ backgroundColor: '#da0b20', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
          📥 Export PDF
        </button>
      )}
      {!hideWord && (
        <button onClick={exportToWord} className="btn-secondary" style={{ backgroundColor: '#185abd', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
          📥 Export Word
        </button>
      )}
      <button onClick={exportToPrint} className="btn-secondary" style={{ backgroundColor: '#475569', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
        🖨️ Print
      </button>
    </div>
  );
}
