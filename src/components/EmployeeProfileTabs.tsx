'use client';

import React, { useState } from 'react';
import EmployeeForm from '@/components/EmployeeForm';
import EmployeeDocumentsTab from './EmployeeDocumentsTab';
import EmployeeAssetsTab from './EmployeeAssetsTab';

export default function EmployeeProfileTabs({ employee, documents, assets, t }: { employee: any, documents: any[], assets: any[], t: any }) {
  const [activeTab, setActiveTab] = useState('info');

  return (
    <div>
      <div style={{ display: 'flex', gap: '15px', borderBottom: '2px solid var(--border-color)', marginBottom: '25px' }}>
        <button 
          onClick={() => setActiveTab('info')}
          className="kh-text"
          style={{ 
            padding: '10px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'info' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'info' ? '#1e40af' : '#64748b',
            fontWeight: activeTab === 'info' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          📝 ព័ត៌មានទូទៅ (General Info)
        </button>
        <button 
          onClick={() => setActiveTab('docs')}
          className="kh-text"
          style={{ 
            padding: '10px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'docs' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'docs' ? '#1e40af' : '#64748b',
            fontWeight: activeTab === 'docs' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          📂 ឯកសារភ្ជាប់ (Documents)
        </button>
        <button 
          onClick={() => setActiveTab('assets')}
          className="kh-text"
          style={{ 
            padding: '10px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'assets' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'assets' ? '#1e40af' : '#64748b',
            fontWeight: activeTab === 'assets' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          💻 សម្ភារៈក្រុមហ៊ុន (Assets)
        </button>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px' }}>
        {activeTab === 'info' && <EmployeeForm employee={employee} t={t} />}
        {activeTab === 'docs' && <EmployeeDocumentsTab employeeId={employee.id} documents={documents} />}
        {activeTab === 'assets' && <EmployeeAssetsTab employeeId={employee.id} assets={assets} />}
      </div>
    </div>
  );
}
