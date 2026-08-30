'use client'
import { useState } from 'react';

export default function ExportExcelButton({ employeeId }: { employeeId: string }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    // trigger file download
    window.location.href = `/api/export/employee-attendance?employeeId=${employeeId}`;
    
    // reset button state after a short delay
    setTimeout(() => {
      setExporting(false);
    }, 2000);
  };

  return (
    <button 
      onClick={handleExport} 
      disabled={exporting}
      className="btn-primary no-print" 
      style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px' }}
    >
      {exporting ? '⏳ កំពុងទាញយក...' : '📊 ទាញយក Excel'}
    </button>
  );
}
