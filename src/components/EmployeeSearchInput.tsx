'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';

type Employee = {
  id: string;
  employeeId: string;
  firstNameKh: string | null;
  lastNameKh: string | null;
  firstNameEn: string | null;
  lastNameEn: string | null;
  department?: string | null;
};

type MasterKpi = {
  id: string;
  department: string;
  kpiType: string;
  description: string | null;
};

export default function EmployeeSearchInput({ 
  employees,
  masterKpis = [],
  labels 
}: { 
  employees: Employee[],
  masterKpis?: MasterKpi[],
  labels: { refDoc: string, employee: string, docDate: string } 
}) {
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [selectedName, setSelectedName] = useState('');

  // Extract unique departments
  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department).filter(Boolean) as string[]);
    return Array.from(depts).sort();
  }, [employees]);

  // Filter employees based on selected department
  const filteredEmployees = useMemo(() => {
    if (!selectedDept) return employees;
    return employees.filter(e => e.department === selectedDept);
  }, [employees, selectedDept]);

  // Filter master KPIs based on selected department
  const filteredKpis = useMemo(() => {
    if (!selectedDept) return masterKpis;
    return masterKpis.filter(k => k.department === selectedDept);
  }, [masterKpis, selectedDept]);

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDept(e.target.value);
    setSelectedId('');
    setSelectedName('');
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectedId(val);
    const emp = filteredEmployees.find(emp => emp.employeeId === val);
    if (emp) {
      setSelectedName(`${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.trim());
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectedName(val);
    const emp = filteredEmployees.find(emp => 
      `${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.trim() === val || 
      `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim() === val
    );
    if (emp) {
      setSelectedId(emp.employeeId || '');
    }
  };

  return (
    <>
      {/* Hidden Inputs for Form Submission */}
      <input type="hidden" name="employeeId" value={employees.find(emp => emp.employeeId === selectedId)?.id || ''} />
      <input type="hidden" name="refDoc" value={selectedId} />

      {/* Department Filter */}
      <div style={{ gridColumn: '1 / -1', paddingBottom: '10px' }}>
        <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          ជ្រើសរើសផ្នែក (Department Filter)
        </label>
        <select 
          className="input-field kh-text" 
          value={selectedDept} 
          onChange={handleDeptChange}
        >
          <option value="">-- គ្រប់ផ្នែកទាំងអស់ (All Departments) --</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Reference Doc (Employee ID) */}
      <div>
        <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          {labels.refDoc}
        </label>
        <input 
          type="text" 
          list="employee-ids"
          value={selectedId}
          onChange={handleIdChange}
          className="input-field kh-text"
          placeholder="បញ្ចូល ឬស្វែងរក ID..."
        />
        <datalist id="employee-ids">
          {filteredEmployees.map(emp => (
            <option key={emp.id} value={emp.employeeId || ''}>
              {emp.lastNameKh || ''} {emp.firstNameKh || ''} ({emp.firstNameEn || ''})
            </option>
          ))}
        </datalist>
      </div>

      {/* Doc Date */}
      <div suppressHydrationWarning>
        <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          {labels.docDate}
        </label>
        <input type="date" name="docDate" className="input-field kh-text" defaultValue={new Date().toISOString().split('T')[0]} suppressHydrationWarning />
      </div>

      {/* Employee Name */}
      <div>
        <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          {labels.employee}
        </label>
        <input 
          type="text" 
          list="employee-names"
          value={selectedName}
          onChange={handleNameChange}
          className="input-field kh-text"
          placeholder="បញ្ចូល ឬស្វែងរកឈ្មោះ..."
        />
        <datalist id="employee-names">
          {filteredEmployees.map(emp => (
            <option key={emp.id} value={`${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.trim()}>
              ID: {emp.employeeId} - {emp.firstNameEn || ''} {emp.lastNameEn || ''}
            </option>
          ))}
        </datalist>
      </div>

      {/* KPI Type Dropdown (Dynamic) */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
          <label className="kh-text" style={{ display: 'block', fontWeight: 500 }}>
            ប្រភេទ KPI (KPI Type)
          </label>
          <Link href="/dashboard/kpi/master" className="kh-text" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
            + បង្កើត/គ្រប់គ្រង KPI ថ្មី
          </Link>
        </div>
        <select name="kpiType" className="input-field kh-text" required>
          <option value="">ជ្រើសរើសប្រភេទ KPI...</option>
          {filteredKpis.length > 0 ? (
            filteredKpis.map(kpi => (
              <option key={kpi.id} value={kpi.kpiType}>
                {kpi.kpiType} {kpi.department ? `(${kpi.department})` : ''}
              </option>
            ))
          ) : (
            <option value="" disabled>មិនមានទិន្នន័យទេ សូមបង្កើតថ្មី (No KPIs found)</option>
          )}
        </select>
      </div>
    </>
  );
}
