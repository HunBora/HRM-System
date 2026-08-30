'use client'

export default function PrintAttendanceButton({ targetId, title }: { targetId: string, title: string }) {
  const handlePrint = () => {
    const printContents = document.getElementById(targetId)?.innerHTML;
    if (printContents) {
      const originalTitle = document.title;
      document.title = title;
      
      const style = document.createElement('style');
      style.innerHTML = `
        @media print {
          body * { visibility: hidden; }
          #${targetId}, #${targetId} * { visibility: visible; }
          #${targetId} { 
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
          .no-print { display: none !important; }
          
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
          h2, p {
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
      
      document.head.removeChild(style);
      document.title = originalTitle;
    } else {
      window.print();
    }
  };

  return (
    <button 
      onClick={handlePrint} 
      className="btn-secondary no-print" 
      style={{ backgroundColor: '#475569', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
    >
      🖨️ Print Preview & Print
    </button>
  );
}
