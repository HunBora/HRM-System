'use client';

import React, { useState } from 'react';
import DepartmentGroupManager from './DepartmentGroupManager';
import PayrollSettingsManager from './PayrollSettingsManager';
import AppearanceSettingsManager from './AppearanceSettingsManager';
import Link from 'next/link';

export default function SettingsControlPanel({ initialCompanySettings }: { initialCompanySettings: any }) {
  const [activeTab, setActiveTab] = useState('groups');

  const tabs = [
    { id: 'groups', label: 'ក្រុមផ្នែក (Department Groups)', icon: '👥' },
    { id: 'payroll', label: 'ការបើកប្រាក់ខែ (Payroll Dates)', icon: '💰' },
    { id: 'appearance', label: 'ការរចនា (Appearance)', icon: '🎨' },
    { id: 'advance', label: 'ប្រាក់ខ្ចី (Advance Salary)', icon: '💸' },
    { id: 'kpi', label: 'វាយតម្លៃ (KPI)', icon: '📈' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          ត្រលប់ទៅ Dashboard វិញ
        </Link>
        <h1 style={{ margin: 0, color: '#333', fontSize: '1.714em' }}>ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យគោល (Control Panel)</h1>
      </div>

      <div style={{ display: 'flex', gap: '20px', minHeight: '600px' }}>
        {/* Sidebar */}
        <div style={{ width: '280px', flexShrink: 0, backgroundColor: '#fff', borderRadius: '12px', padding: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 15px',
                border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                fontSize: '1.071em', fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                backgroundColor: activeTab === tab.id ? '#1976d2' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#4b5563',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '1.286em' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
          {activeTab === 'groups' && <DepartmentGroupManager />}
          {activeTab === 'payroll' && <PayrollSettingsManager initialSettings={initialCompanySettings} />}
          {activeTab === 'appearance' && <AppearanceSettingsManager initialSettings={initialCompanySettings} />}
          {activeTab === 'advance' && (
            <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
              <h2>មុខងារប្រាក់ខ្ចី (Advance Salary)</h2>
              <p>នឹងមានការដាក់ឱ្យប្រើប្រាស់នាពេលខាងមុខ។ (Coming Soon)</p>
            </div>
          )}
          {activeTab === 'kpi' && (
            <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
              <h2>មុខងារវាយតម្លៃ (KPI)</h2>
              <p>នឹងមានការដាក់ឱ្យប្រើប្រាស់នាពេលខាងមុខ។ (Coming Soon)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
