'use client';

import React from 'react';

export default function PayrollFilterForm({ 
  uniqueDepartments, 
  month, 
  year, 
  department, 
  filterBtnText 
}: { 
  uniqueDepartments: string[], 
  month: number, 
  year: number, 
  department: string,
  filterBtnText: string
}) {
  const currentYear = new Date().getFullYear();
  
  return (
    <form method="GET" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <select 
        name="department" 
        defaultValue={department} 
        onChange={(e) => e.currentTarget.form?.submit()} 
        className="input-field kh-text" 
        style={{ margin: 0, width: 'auto', padding: '4px 8px', minWidth: '150px' }}
      >
        <option value="">គ្រប់ផ្នែកទាំងអស់ (All Dept)</option>
        {uniqueDepartments.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      
      <select 
        name="month" 
        defaultValue={month} 
        onChange={(e) => e.currentTarget.form?.submit()} 
        className="input-field" 
        style={{ margin: 0, width: 'auto', padding: '4px 8px' }}
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
          <option key={m} value={m}>Month {m}</option>
        ))}
      </select>
      
      <select 
        name="year" 
        defaultValue={year} 
        onChange={(e) => e.currentTarget.form?.submit()} 
        className="input-field" 
        style={{ margin: 0, width: 'auto', padding: '4px 8px' }}
      >
        {[currentYear - 1, currentYear, currentYear + 1].map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      
      <button type="submit" className="btn-secondary kh-text" style={{ padding: '4px 12px' }}>
        {filterBtnText}
      </button>
    </form>
  );
}
