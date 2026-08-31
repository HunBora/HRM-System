'use client';

import React, { useRef, useState } from 'react';
import Select from 'react-select';

export default function PayrollFilterForm({ 
  uniqueDepartments, 
  month, 
  year, 
  department, 
  filterBtnText,
  q = ''
}: { 
  uniqueDepartments: string[], 
  month: number, 
  year: number, 
  department: string,
  filterBtnText: string,
  q?: string
}) {
  const currentYear = new Date().getFullYear();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedDept, setSelectedDept] = useState(department);

  const deptOptions = [
    { value: '', label: 'គ្រប់ផ្នែកទាំងអស់ (All Dept)' },
    ...uniqueDepartments.map(d => ({ value: d, label: d }))
  ];

  return (
    <form ref={formRef} method="GET" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
      <input 
        type="text" 
        name="q" 
        defaultValue={q} 
        placeholder="ស្វែងរកអត្តលេខ ឫឈ្មោះ..." 
        className="input-field kh-text"
        style={{ margin: 0, width: '200px', padding: '4px 8px' }}
      />
      
      <input type="hidden" name="department" value={selectedDept} />
      <div style={{ minWidth: '220px' }}>
        <Select
          options={deptOptions}
          value={deptOptions.find(o => o.value === selectedDept) || deptOptions[0]}
          onChange={(option: any) => {
            setSelectedDept(option?.value || '');
            // Small timeout to ensure state is updated before submitting
            setTimeout(() => {
              formRef.current?.submit();
            }, 0);
          }}
          isSearchable={true}
          className="kh-text"
          styles={{
            control: (base) => ({
              ...base,
              minHeight: '36px',
              height: '36px',
              borderRadius: '6px',
              borderColor: '#cbd5e1'
            })
          }}
        />
      </div>
      
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
