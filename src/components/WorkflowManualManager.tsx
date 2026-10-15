'use client';

import React, { useState, useMemo } from 'react';

interface WorkflowManualManagerProps {
  settings?: any;
}

export default function WorkflowManualManager({ settings }: WorkflowManualManagerProps) {
  // Live dynamic values synced directly from system settings
  const exchangeRate = settings?.exchangeRate || 4000;
  const p1Start = settings?.payment1StartDate || 1;
  const p1End = settings?.payment1EndDate || 15;
  const p2Start = settings?.payment2StartDate || 16;
  const p2End = settings?.payment2EndDate || 31;
  const advanceLimit = settings?.advanceMaxLimit || 50;
  const advanceMonths = settings?.advanceEligibilityMonths || 3;
  const advancePolicy = settings?.advanceRepaymentPolicy || 'NEXT_PAYROLL';
  const companyName = settings?.companyName || 'HRM System';

  // Navigation states
  const [subTab, setSubTab] = useState<'formulas' | 'simulator' | 'lifecycle' | 'attendance' | 'advance' | 'law'>('formulas');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Interactive Live Simulator States
  const [simBasic, setSimBasic] = useState<number>(250);
  const [simDays, setSimDays] = useState<number>(26);
  const [simNormalOt, setSimNormalOt] = useState<number>(10);
  const [simSunOt, setSimSunOt] = useState<number>(0);
  const [simNightOt, setSimNightOt] = useState<number>(0);
  const [simAbsentDays, setSimAbsentDays] = useState<number>(0);
  const [simPosition, setSimPosition] = useState<number>(15);
  const [simSkill, setSimSkill] = useState<number>(10);
  const [simAdvance, setSimAdvance] = useState<number>(0);
  const [simHasNssf, setSimHasNssf] = useState<boolean>(true);
  const [simHasFdc, setSimHasFdc] = useState<boolean>(true);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Live Simulator Calculation engine (100% matched with production actions.ts)
  const simResults = useMemo(() => {
    const dailyRate = simBasic / 26;
    const hourlyRate = dailyRate / 8;
    const workingSalary = dailyRate * simDays;

    const otWage = hourlyRate * 1.5 * simNormalOt;
    const sunOtWage = hourlyRate * 2.0 * simSunOt;
    const nightOtWage = hourlyRate * 2.0 * simNightOt;

    const lunchAllowance = simDays * 0.50; // $0.50 (2,000 KHR per working day)
    const totalOtHours = simNormalOt + simSunOt + simNightOt;
    const otMealAllowance = totalOtHours >= 2 ? 0.50 : 0;
    const transportation = 7.00; // Fixed $7.00
    const attendanceBonus = simAbsentDays > 0 ? 0 : 15.00; // $15.00 if 0 absences

    const payScaleIncentive = simPosition || 0;
    const adjustmentSkill = simSkill || 0;

    const totalSalary = workingSalary + payScaleIncentive + adjustmentSkill + otWage + sunOtWage + nightOtWage
      + attendanceBonus + transportation + lunchAllowance + otMealAllowance;

    const severancePay = simHasFdc ? totalSalary * 0.05 : 0; // 5% FDC severance

    // NSSF: 2% of contributory wage, max capped at $300 ($6.00 max)
    const nssf = simHasNssf && simBasic > 0 ? Math.min(simBasic, 300) * 0.02 : 0;
    const taxPayment = 0;
    const loanPension = simAdvance || 0;

    const netSalaryUsd = totalSalary + severancePay - loanPension - nssf - taxPayment;

    // Currency Split Engine
    let paidSalaryUsd = 0;
    let netSalaryRiel = 0;

    if (netSalaryUsd > 0) {
      paidSalaryUsd = Math.floor(netSalaryUsd / 10) * 10;
      let remainder = netSalaryUsd - paidSalaryUsd;

      if (remainder < 7.50 && paidSalaryUsd > 0) {
        paidSalaryUsd -= 10;
        remainder = netSalaryUsd - paidSalaryUsd;
      }

      netSalaryRiel = remainder * exchangeRate;
      netSalaryRiel = Math.floor(netSalaryRiel / 100) * 100;
    }

    return {
      dailyRate,
      hourlyRate,
      workingSalary,
      otWage,
      sunOtWage,
      nightOtWage,
      lunchAllowance,
      otMealAllowance,
      transportation,
      attendanceBonus,
      payScaleIncentive,
      adjustmentSkill,
      totalSalary,
      severancePay,
      nssf,
      loanPension,
      netSalaryUsd,
      paidSalaryUsd,
      netSalaryRiel,
      remainderUsd: netSalaryUsd - paidSalaryUsd,
    };
  }, [
    simBasic,
    simDays,
    simNormalOt,
    simSunOt,
    simNightOt,
    simAbsentDays,
    simPosition,
    simSkill,
    simAdvance,
    simHasNssf,
    simHasFdc,
    exchangeRate,
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner / Sync Indicator */}
      <div
        className="card"
        style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(30, 58, 138, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.8rem' }}>📖</span>
                <h1 className="title kh-text" style={{ margin: 0, fontSize: '1.55rem', color: '#ffffff', fontWeight: 800 }}>
                  សៀវភៅណែនាំនីតិវិធីការងារ & រូបមន្តគណនាប្រាក់ខែ (Workflow & Payroll SOP Hub)
                </h1>
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#bfdbfe', maxWidth: '780px', lineHeight: 1.5 }}>
                ឯកសារណែនាំប្រតិបត្តិការងារស្តង់ដារ (SOP) និងរូបមន្តគណនាប្រាក់បៀវត្សរ៍ ប្រាក់ឧបត្ថម្ភ និងអត្ថប្រយោជន៍នានា ស្របតាមច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា។ រូបមន្តត្រូវបានធ្វើសមកាលកម្មដោយស្វ័យប្រវត្តិតាមការកំណត់បច្ចុប្បន្នរបស់ប្រព័ន្ធ ({companyName})។
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#ffffff',
                  color: '#1e40af',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s',
                }}
              >
                <span>🖨️</span>
                <span className="kh-text">បោះពុម្ពឯកសារ (Print / PDF)</span>
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80' }}></span>
                <span>Auto-Synced: <strong>1$ = {exchangeRate.toLocaleString()} ៛</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--surface-color)',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'formulas', icon: '💰', titleKh: 'រូបមន្តគណនាប្រាក់ខែ & អត្ថប្រយោជន៍', titleEn: 'Payroll Formulas' },
            { id: 'simulator', icon: '🧮', titleKh: 'ម៉ាស៊ីនសាកល្បងគណនាផ្ទាល់', titleEn: 'Live Simulator' },
            { id: 'lifecycle', icon: '👤', titleKh: 'វដ្តជីវិតបុគ្គលិក (Onboarding/Offboarding)', titleEn: 'Employee Lifecycle' },
            { id: 'attendance', icon: '⏱️', titleKh: 'វត្តមាន, ថែមម៉ោង & ច្បាប់ឈប់សម្រាក', titleEn: 'Attendance & OT SOP' },
            { id: 'advance', icon: '💸', titleKh: 'គោលការណ៍ប្រាក់បុរេប្រទាន & កម្ចី', titleEn: 'Salary Advance' },
            { id: 'law', icon: '⚖️', titleKh: 'យោងច្បាប់ការងារ & ប.ស.ស', titleEn: 'Labor Law Standards' },
          ].map((tab) => {
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: isActive ? '1.5px solid #2563eb' : '1px solid transparent',
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                  color: isActive ? '#1d4ed8' : '#475569',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.icon}</span>
                <span className="kh-text">{tab.titleKh}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Search */}
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <input
            type="text"
            placeholder="ស្វែងរកក្នុងសៀវភៅណែនាំ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px 7px 32px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '0.83rem',
              outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: '10px', top: '7px', fontSize: '0.9rem', color: '#94a3b8' }}>🔍</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FORMULAS & CALCULATION MANUAL                                      */}
      {/* ========================================================================= */}
      {subTab === 'formulas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Dynamic Sync Notice Card */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.6rem' }}>⚡</span>
              <div>
                <strong className="kh-text" style={{ color: '#1e40af', fontSize: '0.95rem' }}>
                  រូបមន្តធ្វើសមកាលកម្មស្វ័យប្រវត្តិតាមការកំណត់បច្ចុប្បន្ន (Live Formula Auto-Sync)
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: '0.83rem', color: '#3b82f6' }}>
                  រាល់ពេលមានការផ្លាស់ប្តូរអត្រាប្តូរប្រាក់ ({exchangeRate.toLocaleString()} ៛) ឬកាលបរិច្ឆេទបើកប្រាក់ខែក្នុងប្រព័ន្ធ នោះសៀវភៅណែនាំនេះនឹងកែសម្រួលតម្លៃជាក់ស្តែងដោយស្វ័យប្រវត្តិ។
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.78rem',
                backgroundColor: '#dbeafe',
                color: '#1d4ed8',
                padding: '4px 12px',
                borderRadius: '20px',
                fontWeight: 700,
              }}
            >
              🔄 Version: 2025/2026 Live Dynamic
            </span>
          </div>

          {/* Group 1: Base Rates */}
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h2 className="kh-text" style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>1️⃣</span> ប្រាក់ឈ្នួលប្រចាំថ្ងៃ និងប្រចាំម៉ោង (Daily & Hourly Wage Rate)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* Daily Rate */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong className="kh-text" style={{ color: '#0f172a' }}>ប្រាក់ឈ្នួលប្រចាំថ្ងៃ (Daily Rate)</strong>
                  <button
                    onClick={() => handleCopy('DailyRate = BasicSalary / 26', 'daily')}
                    style={{ fontSize: '0.72rem', cursor: 'pointer', background: '#e2e8f0', border: 'none', borderRadius: '4px', padding: '2px 6px' }}
                  >
                    {copiedKey === 'daily' ? '✓ បានចម្លង' : '📋 ចម្លងរូបមន្ត'}
                  </button>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb', fontSize: '0.95rem' }}>
                  Daily Rate = ប្រាក់ខែគោល (Basic Salary) ÷ 26 ថ្ងៃ
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  ឧទាហរណ៍៖ ប្រាក់ខែគោល $260.00 ÷ 26 = <strong>$10.00 / ថ្ងៃ</strong> (យោងតាមមាត្រា ១០៤ នៃច្បាប់ការងារ ដែលកំណត់ខែធ្វើការស្មើ ២៦ ថ្ងៃ)។
                </p>
              </div>

              {/* Hourly Rate */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong className="kh-text" style={{ color: '#0f172a' }}>ប្រាក់ឈ្នួលប្រចាំម៉ោង (Hourly Rate)</strong>
                  <button
                    onClick={() => handleCopy('HourlyRate = DailyRate / 8', 'hourly')}
                    style={{ fontSize: '0.72rem', cursor: 'pointer', background: '#e2e8f0', border: 'none', borderRadius: '4px', padding: '2px 6px' }}
                  >
                    {copiedKey === 'hourly' ? '✓ បានចម្លង' : '📋 ចម្លងរូបមន្ត'}
                  </button>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb', fontSize: '0.95rem' }}>
                  Hourly Rate = ប្រាក់ឈ្នួលប្រចាំថ្ងៃ ÷ 8 ម៉ោង
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  ឧទាហរណ៍៖ $10.00 ÷ 8 ម៉ោង = <strong>$1.25 / ម៉ោង</strong> (១ ថ្ងៃធ្វើការស្តង់ដារកំណត់ស្មើ ៨ ម៉ោង)។
                </p>
              </div>

              {/* Working Salary */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong className="kh-text" style={{ color: '#0f172a' }}>ប្រាក់ខែតាមថ្ងៃធ្វើការជាក់ស្តែង (Working Salary)</strong>
                  <button
                    onClick={() => handleCopy('WorkingSalary = DailyRate * WorkingDays', 'working')}
                    style={{ fontSize: '0.72rem', cursor: 'pointer', background: '#e2e8f0', border: 'none', borderRadius: '4px', padding: '2px 6px' }}
                  >
                    {copiedKey === 'working' ? '✓ បានចម្លង' : '📋 ចម្លងរូបមន្ត'}
                  </button>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1', fontFamily: 'monospace', fontWeight: 700, color: '#059669', fontSize: '0.95rem' }}>
                  Working Salary = Daily Rate × ថ្ងៃធ្វើការជាក់ស្តែង (Working Days)
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  ប្រសិនបើបុគ្គលិកធ្វើការគ្រប់ ២៦ ថ្ងៃ នោះទទួលបានប្រាក់ខែពេញ។ បើមានអវត្តមាន នឹងគណនាតាមចំនួនថ្ងៃដែលបានមកបំពេញការងារជាក់ស្តែង។
                </p>
              </div>
            </div>
          </div>

          {/* Group 2: Overtime Calculations */}
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h2 className="kh-text" style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>2️⃣</span> ការគណនាប្រាក់ថែមម៉ោង (Overtime / OT Calculations)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* Normal OT */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#92400e' }} className="kh-text">ថែមម៉ោងថ្ងៃធម្មតា (Normal OT - 150%)</span>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>1.5x Multiplier</span>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #fcd34d', fontFamily: 'monospace', fontWeight: 700, color: '#b45309', fontSize: '0.92rem' }}>
                  OT Wage = Hourly Rate × 1.5 × ម៉ោងថែម
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#78350f' }}>
                  អនុវត្តចំពោះម៉ោងធ្វើការបន្ថែមក្រៅពី ៨ ម៉ោងធម្មតានៅថ្ងៃចន្ទ ដល់ថ្ងៃសៅរ៍ (គុណនឹង ១៥០%)។
                </p>
              </div>

              {/* Sunday & Holiday OT */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#991b1b' }} className="kh-text">ថែមម៉ោងថ្ងៃអាទិត្យ/បុណ្យជាតិ (200%)</span>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>2.0x Multiplier</span>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #fca5a5', fontFamily: 'monospace', fontWeight: 700, color: '#dc2626', fontSize: '0.92rem' }}>
                  Sun/Holiday Wage = Hourly Rate × 2.0 × ម៉ោងថែម
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#991b1b' }}>
                  អនុវត្តចំពោះការងារនៅថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍ (អាទិត្យ) ឬថ្ងៃបុណ្យជាតិដែលរដ្ឋកំណត់ (គុណនឹង ២០០%)។
                </p>
              </div>

              {/* Night OT */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#5b21b6' }} className="kh-text">ថែមម៉ោងវេនយប់ (Night OT - 200%)</span>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#ede9fe', color: '#7c3aed', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>2.0x Multiplier</span>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #c4b5fd', fontFamily: 'monospace', fontWeight: 700, color: '#7c3aed', fontSize: '0.92rem' }}>
                  Night OT Wage = Hourly Rate × 2.0 × ម៉ោងយប់
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#5b21b6' }}>
                  អនុវត្តចំពោះម៉ោងធ្វើការបន្ថែមនៅចន្លោះម៉ោង ២២:០០ យប់ ដល់ម៉ោង ០៦:០០ ព្រឹក (គុណនឹង ២០០%)។
                </p>
              </div>
            </div>
          </div>

          {/* Group 3: Allowances & Statutory Benefits */}
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h2 className="kh-text" style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>3️⃣</span> ប្រាក់ឧបត្ថម្ភ និងអត្ថប្រយោជន៍ (Allowances & Benefits)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Lunch Allowance */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong className="kh-text" style={{ color: '#166534' }}>🍚 ថ្លៃបាយថ្ងៃត្រង់ (Lunch)</strong>
                  <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>$0.50 / ថ្ងៃ</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#14532d' }}>
                  គណនាស្មើនឹង <strong>Working Days × $0.50</strong> (ស្មើ ២,០០០ រៀលក្នុងមួយថ្ងៃធ្វើការជាក់ស្តែង)។
                </p>
              </div>

              {/* OT Meal Allowance */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong className="kh-text" style={{ color: '#166534' }}>🍱 ថ្លៃបាយថែមម៉ោង (OT Meal)</strong>
                  <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>$0.50 / លើក</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#14532d' }}>
                  ផ្តល់ជូន <strong>$0.50</strong> នៅពេលបុគ្គលិកថែមម៉ោងសរុប (OT) ចាប់ពី <strong>២ ម៉ោងឡើងទៅ</strong> ក្នុងមួយថ្ងៃ។
                </p>
              </div>

              {/* Transportation */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong className="kh-text" style={{ color: '#166534' }}>🚌 ថ្លៃធ្វើដំណើរ (Transport)</strong>
                  <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>$7.00 / ខែ</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#14532d' }}>
                  ប្រាក់ឧបត្ថម្ភថ្លៃធ្វើដំណើរ និងស្នាក់នៅកំណត់ថេរ <strong>$7.00 ក្នុងមួយខែ</strong> សម្រាប់បុគ្គលិកទាំងអស់។
                </p>
              </div>

              {/* Attendance Bonus */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong className="kh-text" style={{ color: '#166534' }}>🏆 រង្វាន់ឧស្សាហ៍ព្យាយាម (Attendance)</strong>
                  <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>$15.00 / ខែ</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#14532d' }}>
                  ផ្តល់ជូន <strong>$15.00</strong> ប្រសិនបើបុគ្គលិក <strong>គ្មានអវត្តមានឥតច្បាប់ (Absent Days = 0)</strong> ក្នុងខែនោះ។
                </p>
              </div>

              {/* Skill & Position */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong className="kh-text" style={{ color: '#166534' }}>🎖️ ប្រាក់ជំនាញ & តួនាទី</strong>
                  <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>តាមកិច្ចសន្យា</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#14532d' }}>
                  ប្រាក់ឧបត្ថម្ភតាមជំនាញ (Skill Allowance) និងប្រាក់តួនាទី (Position Incentive) ដែលបានកំណត់ក្នុងប្រវត្តិរូប។
                </p>
              </div>

              {/* Severance 5% FDC */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong className="kh-text" style={{ color: '#166534' }}>📄 ប្រាក់ដំណាច់ 5% (Severance Pay)</strong>
                  <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>5% នៃ Total</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#14532d' }}>
                  អនុវត្ត <strong>Total Salary × 0.05</strong> សម្រាប់បុគ្គលិកកិច្ចសន្យាមានកំណត់ថិរវេលា (FDC Contract)។
                </p>
              </div>
            </div>
          </div>

          {/* Group 4: Deductions, NSSF & Currency Payout Splitting */}
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h2 className="kh-text" style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>4️⃣</span> ការកាត់កង, ប.ស.ស និងការបំបែកបើកជាប្រាក់ដុល្លារ/រៀល
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* NSSF Deduction */}
              <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong className="kh-text" style={{ color: '#0f172a', fontSize: '0.95rem' }}>🏥 ប.ស.ស (NSSF Deduction)</strong>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>2% នៃពិដាន</span>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px dashed #cbd5e1', fontFamily: 'monospace', fontWeight: 700, color: '#0369a1', fontSize: '0.9rem', marginBottom: '8px' }}>
                  NSSF = Math.min(BasicSalary, 300) × 0.02
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                  <li>កាត់កងភាគទានសោធន <strong>២%</strong> នៃប្រាក់បៀវត្សជាប់កាតព្វកិច្ច (ពិដានអតិបរមា $300)។</li>
                  <li>ការកាត់កងអតិបរមាក្នុងមួយខែគឺត្រឹម <strong>$6.00</strong> សម្រាប់បុគ្គលិកដែលមានកាត ប.ស.ស។</li>
                </ul>
              </div>

              {/* Advance Deduction */}
              <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong className="kh-text" style={{ color: '#0f172a', fontSize: '0.95rem' }}>💸 ប្រាក់បុរេប្រទាន/កម្ចី (Advance Salary)</strong>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>កាត់ ១០០%</span>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px dashed #cbd5e1', fontFamily: 'monospace', fontWeight: 700, color: '#b45309', fontSize: '0.9rem', marginBottom: '8px' }}>
                  Loan/Advance Deduction = Total Approved Advance
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                  ទឹកប្រាក់ដែលបុគ្គលិកបានខ្ចីមុន ឬបើកមុន (ត្រូវបានអនុម័ត) នឹងត្រូវកាត់កងចេញពីប្រាក់ខែសុទ្ធដោយស្វ័យប្រវត្តិ។
                </p>
              </div>

              {/* Dynamic Currency Splitting Engine */}
              <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1.5px solid #86efac', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong className="kh-text" style={{ color: '#166534', fontSize: '1.02rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>💱</span> រូបមន្តបំបែកបើកជាលុយដុល្លារ និងរៀល (Factory Cash Payout Engine)
                  </strong>
                  <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem' }}>
                    អត្រា៖ 1$ = {exchangeRate.toLocaleString()} ៛
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginTop: '12px' }}>
                  <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.88rem', marginBottom: '4px' }}>ជំហានទី១៖ ដកដុល្លារក្រដាសមូល (Paid USD)</div>
                    <code style={{ display: 'block', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', fontSize: '0.8rem', color: '#0f172a' }}>
                      PaidUSD = Math.floor(NetSalary / 10) * 10
                    </code>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      ឧទាហរណ៍៖ $284.50 ➔ ដកមូលជាដប់បាន <strong>$280.00</strong>
                    </span>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.88rem', marginBottom: '4px' }}>ជំហានទី២៖ លក្ខខណ្ឌសេស &lt; $7.50</div>
                    <code style={{ display: 'block', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', fontSize: '0.8rem', color: '#0f172a' }}>
                      if (Remainder &lt; 7.50) PaidUSD -= 10
                    </code>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      បើសេស $4.50 (&lt; $7.50) ➔ ដកដុល្លារមកនៅ $270.00 (ដើម្បីសេស $14.50 ដូរជាប្រាក់រៀល)
                    </span>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.88rem', marginBottom: '4px' }}>ជំហានទី៣៖ គុណជាប្រាក់រៀល (Net Riel)</div>
                    <code style={{ display: 'block', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', fontSize: '0.8rem', color: '#0f172a' }}>
                      NetRiel = Math.floor((Remainder * {exchangeRate}) / 100) * 100
                    </code>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      គុណនឹង {exchangeRate.toLocaleString()} ៛ ហើយកាត់កម្រិតទម្លាក់មូលត្រឹម ១០០៛ ជានិច្ច។
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INTERACTIVE LIVE FORMULA SIMULATOR                                 */}
      {/* ========================================================================= */}
      {subTab === 'simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <strong className="kh-text" style={{ color: '#15803d', fontSize: '1.02rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🧮</span> ម៉ាស៊ីនសាកល្បងគណនាផ្ទាល់ (Interactive Formula Simulator & Sandbox)
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#166534' }}>
                បញ្ចូលទិន្នន័យគំរូខាងក្រោមដើម្បីផ្ទៀងផ្ទាត់ និងមើលការគណនាលម្អិតមួយជំហានម្តងៗ ស្របតាមរូបមន្តជាក់ស្តែងរបស់ប្រព័ន្ធ។
              </p>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 700, backgroundColor: '#dcfce7', padding: '6px 14px', borderRadius: '10px' }}>
              អត្រាប្តូរប្រាក់បច្ចុប្បន្ន៖ 1$ = {exchangeRate.toLocaleString()} ៛
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {/* Input Controls Card */}
            <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <h3 className="kh-text" style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#1e3a8a' }}>
                📝 ១. បញ្ចូលប៉ារ៉ាម៉ែត្រសាកល្បង
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                    ប្រាក់ខែគោល (Basic Salary USD) :
                  </label>
                  <input
                    type="number"
                    value={simBasic}
                    onChange={(e) => setSimBasic(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      ថ្ងៃធ្វើការ (Working Days) :
                    </label>
                    <input
                      type="number"
                      value={simDays}
                      onChange={(e) => setSimDays(parseFloat(e.target.value) || 0)}
                      max={26}
                      min={0}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      ថ្ងៃអវត្តមាន (Absent Days) :
                    </label>
                    <input
                      type="number"
                      value={simAbsentDays}
                      onChange={(e) => setSimAbsentDays(parseFloat(e.target.value) || 0)}
                      min={0}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      OT ធម្មតា (150%) :
                    </label>
                    <input
                      type="number"
                      value={simNormalOt}
                      onChange={(e) => setSimNormalOt(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      OT អាទិត្យ (200%) :
                    </label>
                    <input
                      type="number"
                      value={simSunOt}
                      onChange={(e) => setSimSunOt(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      OT យប់ (200%) :
                    </label>
                    <input
                      type="number"
                      value={simNightOt}
                      onChange={(e) => setSimNightOt(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      ប្រាក់តួនាទី (Position) :
                    </label>
                    <input
                      type="number"
                      value={simPosition}
                      onChange={(e) => setSimPosition(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      ប្រាក់ជំនាញ (Skill) :
                    </label>
                    <input
                      type="number"
                      value={simSkill}
                      onChange={(e) => setSimSkill(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                    ប្រាក់បើកមុន / កម្ចី (Advance Deduction USD) :
                  </label>
                  <input
                    type="number"
                    value={simAdvance}
                    onChange={(e) => setSimAdvance(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                  />
                </div>

                {/* Toggles */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={simHasNssf}
                      onChange={(e) => setSimHasNssf(e.target.checked)}
                    />
                    មានកាត ប.ស.ស (2%)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={simHasFdc}
                      onChange={(e) => setSimHasFdc(e.target.checked)}
                    />
                    ប្រាក់ដំណាច់ 5% (FDC)
                  </label>
                </div>
              </div>
            </div>

            {/* Live Calculation Output Card */}
            <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1.5px solid #2563eb', backgroundColor: '#fafcff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 className="kh-text" style={{ margin: 0, fontSize: '1.1rem', color: '#1e40af' }}>
                  📊 ២. លទ្ធផលគណនាជាក់ស្តែង (Live Breakdown)
                </h3>
                <span style={{ fontSize: '0.72rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                  Realtime Engine
                </span>
              </div>

              {/* Rate Badges */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <div style={{ flex: 1, backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Daily Rate</span>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>${simResults.dailyRate.toFixed(2)}</strong>
                </div>
                <div style={{ flex: 1, backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Hourly Rate</span>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>${simResults.hourlyRate.toFixed(2)}</strong>
                </div>
              </div>

              {/* Step-by-step breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>ប្រាក់ខែតាមថ្ងៃជាក់ស្តែង ({simDays} ថ្ងៃ):</span>
                  <strong>${simResults.workingSalary.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>ថែមម៉ោងសរុប (OT {simNormalOt + simSunOt + simNightOt} ម៉ោង):</span>
                  <strong>${(simResults.otWage + simResults.sunOtWage + simResults.nightOtWage).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>ថ្លៃបាយថ្ងៃត្រង់ + ថ្លៃបាយ OT:</span>
                  <strong>${(simResults.lunchAllowance + simResults.otMealAllowance).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>ថ្លៃធ្វើដំណើរ (Transport):</span>
                  <strong>${simResults.transportation.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>រង្វាន់ឧស្សាហ៍ព្យាយាម (Attendance):</span>
                  <strong style={{ color: simResults.attendanceBonus > 0 ? '#15803d' : '#dc2626' }}>
                    ${simResults.attendanceBonus.toFixed(2)} {simAbsentDays > 0 ? '(អវត្តមាន ០$)' : ''}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>ប្រាក់តួនាទី + ប្រាក់ជំនាញ:</span>
                  <strong>${(simResults.payScaleIncentive + simResults.adjustmentSkill).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>ប្រាក់ខែសរុប (Total Salary):</span>
                  <strong style={{ color: '#2563eb' }}>${simResults.totalSalary.toFixed(2)}</strong>
                </div>
                {simHasFdc && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#059669' }}>+ ប្រាក់ដំណាច់ 5% (Severance):</span>
                    <strong style={{ color: '#059669' }}>+${simResults.severancePay.toFixed(2)}</strong>
                  </div>
                )}
                {simResults.nssf > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#dc2626' }}>- កាត់កង ប.ស.ស (NSSF 2%):</span>
                    <strong style={{ color: '#dc2626' }}>-${simResults.nssf.toFixed(2)}</strong>
                  </div>
                )}
                {simResults.loanPension > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#dc2626' }}>- កាត់ប្រាក់បើកមុន (Advance):</span>
                    <strong style={{ color: '#dc2626' }}>-${simResults.loanPension.toFixed(2)}</strong>
                  </div>
                )}
              </div>

              {/* Grand Total Net Salary */}
              <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '10px', border: '1.5px solid #3b82f6', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Net Salary USD</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e40af' }}>
                      ${simResults.netSalaryUsd.toFixed(2)}
                    </div>
                  </div>
                  <span style={{ fontSize: '1.5rem' }}>💵</span>
                </div>
              </div>

              {/* Currency Split Display */}
              <div style={{ backgroundColor: '#ecfdf5', padding: '14px', borderRadius: '10px', border: '1.5px solid #10b981' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💱</span> ការទូទាត់ប្រាក់បៀវត្សរ៍ជាក់ស្តែង (Cash Payout Split):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                    <span style={{ fontSize: '0.72rem', color: '#065f46', display: 'block' }}>បើកជាដុល្លារ (Paid USD)</span>
                    <strong style={{ fontSize: '1.2rem', color: '#047857' }}>${simResults.paidSalaryUsd.toFixed(2)}</strong>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                    <span style={{ fontSize: '0.72rem', color: '#065f46', display: 'block' }}>បើកជារៀល (Net Riel)</span>
                    <strong style={{ fontSize: '1.2rem', color: '#047857' }}>{simResults.netSalaryRiel.toLocaleString()} ៛</strong>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '6px' }}>
                  * សេស ${simResults.remainderUsd.toFixed(2)} × {exchangeRate.toLocaleString()} ៛ (កាត់ទម្លាក់ត្រឹម ១០០៛)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EMPLOYEE LIFECYCLE SOP                                             */}
      {/* ========================================================================= */}
      {subTab === 'lifecycle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h2 className="kh-text" style={{ margin: '0 0 16px', fontSize: '1.25rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👤</span> នីតិវិធីគ្រប់គ្រងវដ្តជីវិតបុគ្គលិក (Employee Lifecycle SOP)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Step 1 */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                  1
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="kh-text" style={{ margin: '0 0 6px', fontSize: '1.02rem', color: '#0f172a' }}>
                    ការជ្រើសរើស និងចុះឈ្មោះបុគ្គលិកថ្មី (Recruitment & Onboarding)
                  </h3>
                  <p style={{ margin: '0 0 8px', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                    នៅពេលមានបុគ្គលិកថ្មីចូលបម្រើការងារ ផ្នែករដ្ឋបាល/ធនធានមនុស្សត្រូវប្រមូលឯកសារ និងបំពេញព័ត៌មានក្នុងប្រព័ន្ធ៖
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>
                    <li><strong>ឯកសារតម្រូវ៖</strong> អត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ (ID Card), សៀវភៅការងារ, លេខកាត ប.ស.ស (បើមាន), និងលេខគណនីធនាគារ។</li>
                    <li><strong>បង្កើត Profile៖</strong> ចូលទៅកាន់ម៉ឺនុយ «បុគ្គលិក» ➔ «ចុះឈ្មោះបុគ្គលិកថ្មី» បញ្ចូលឈ្មោះ (ខ្មែរ/ឡាតាំង), ភេទ, ថ្ងៃចូលធ្វើការ, ផ្នែក និងតួនាទី។</li>
                    <li><strong>កំណត់ប្រាក់ខែ៖</strong> បញ្ចូលប្រាក់ខែគោល (Basic Salary), ប្រាក់ជំនាញ (Skill), និងប្រាក់តួនាទី (Position Allowance)។</li>
                  </ul>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                  2
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="kh-text" style={{ margin: '0 0 6px', fontSize: '1.02rem', color: '#0f172a' }}>
                    ការសាកល្បងការងារ និងកិច្ចសន្យាការងារ (Probation & Contract Setup)
                  </h3>
                  <p style={{ margin: '0 0 8px', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                    កំណត់ប្រភេទកិច្ចសន្យាការងារស្របតាមច្បាប់ការងារកម្ពុជា៖
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>
                    <li><strong>កិច្ចសន្យាសាកល្បង (Probation):</strong> កំណត់ពី ១ ដល់ ៣ ខែ ទៅតាមមុខតំណែងជំនាញ និងធម្មតារបស់បុគ្គលិក។</li>
                    <li><strong>កិច្ចសន្យា FDC (មានកំណត់ថិរវេលា):</strong> មានសិទ្ធិទទួលបានប្រាក់ដំណាច់ ៥% (Severance Pay) រៀងរាល់ដំណាច់កិច្ចសន្យា ឬដំណាច់ខែ។</li>
                    <li><strong>កិច្ចសន្យា UDC (គ្មានកំណត់ថិរវេលា):</strong> ទទួលបានប្រាក់បំណាច់អតីតភាពការងារ (Seniority Indemnity) ១៥ ថ្ងៃក្នុងមួយឆ្នាំ (បើក ២ ដង/ឆ្នាំ)។</li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                  3
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="kh-text" style={{ margin: '0 0 6px', fontSize: '1.02rem', color: '#0f172a' }}>
                    ការវាយតម្លៃលទ្ធផលការងារ (KPI & Performance Review)
                  </h3>
                  <p style={{ margin: '0 0 8px', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                    ការវាយតម្លៃ និងតម្លើងឋានៈ/ប្រាក់បៀវត្សរ៍ប្រចាំត្រីមាស ឬប្រចាំឆ្នាំ៖
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>
                    <li>គ្រប់គ្រងសូចនាករ KPI ក្នុងផ្ទាំង «ការកំណត់ KPI & រូបមន្ត» តាមផ្នែកនីមួយៗ។</li>
                    <li>ពិន្ទុវាយតម្លៃនឹងត្រូវកត់ត្រាជាមូលដ្ឋានសម្រាប់ផ្តល់ប្រាក់រង្វាន់លើកទឹកចិត្ត (Performance Incentive)។</li>
                  </ul>
                </div>
              </div>

              {/* Step 4 */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#ef4444', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                  4
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="kh-text" style={{ margin: '0 0 6px', fontSize: '1.02rem', color: '#0f172a' }}>
                    ការបញ្ចប់ការងារ និងគណនាប្រាក់ដំណាច់ចុងក្រោយ (Offboarding & Final Settlement)
                  </h3>
                  <p style={{ margin: '0 0 8px', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                    នីតិវិធីពេលបុគ្គលិកលាលែងពីការងារ ឬបញ្ចប់កិច្ចសន្យា៖
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>
                    <li><strong>ការជូនដំណឹងជាមុន (Notice Period):</strong> ស្របតាមមាត្រា ៧៥ នៃច្បាប់ការងារ (៧ ថ្ងៃ ដល់ ៣ ខែ តាមអតីតភាព)។</li>
                    <li><strong>គណនាប្រាក់ខែចុងក្រោយ៖</strong> គិតតាមចំនួនថ្ងៃធ្វើការជាក់ស្តែង + ប្រាក់ថែមម៉ោង + ប្រាក់ដំណាច់ ៥% (បើរជា FDC) + ប្រាក់បំណាច់ថ្ងៃច្បាប់ប្រចាំឆ្នាំដែលនៅសល់ (Annual Leave Compensation)។</li>
                    <li><strong>កាត់កងបំណុល/ប្រាក់ខ្ចី៖</strong> ដកប្រាក់បុរេប្រទាន ឬកម្ចីដែលនៅជំពាក់ទាំងអស់ចេញពីប្រាក់ដំណាច់។</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ATTENDANCE & LEAVE WORK INSTRUCTIONS                               */}
      {/* ========================================================================= */}
      {subTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h2 className="kh-text" style={{ margin: '0 0 16px', fontSize: '1.25rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⏱️</span> នីតិវិធីវត្តមាន, ថែមម៉ោង & ច្បាប់ឈប់សម្រាក (Attendance, OT & Leave WI)
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* Working Shifts Card */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h3 className="kh-text" style={{ margin: '0 0 10px', fontSize: '1.02rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏢</span> វេនការងារស្តង់ដារ (Work Shifts)
                </h3>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.83rem', color: '#475569', lineHeight: 1.6 }}>
                  <li><strong>វេនព្រឹក៖</strong> ០៧:០០ ព្រឹក ដល់ ១១:០០ ថ្ងៃត្រង់ (៤ ម៉ោង)</li>
                  <li><strong>សម្រាកថ្ងៃត្រង់៖</strong> ១១:០០ ដល់ ១៣:០០ (២ ម៉ោង)</li>
                  <li><strong>វេនរសៀល៖</strong> ១៣:០០ ដល់ ១៧:០០ ល្ងាច (៤ ម៉ោង)</li>
                  <li><strong>វេនយប់ (ប្រសិនបើមាន)៖</strong> ១៧:០០ ដល់ ០៤:០០ ព្រឹក</li>
                </ul>
                <div style={{ marginTop: '10px', padding: '8px', borderRadius: '6px', backgroundColor: '#f1f5f9', fontSize: '0.78rem', color: '#64748b' }}>
                  💡 ការស្កេនម្រាមដៃយឺត ឬចេញមុន នឹងត្រូវកត់ត្រាចូលរបាយការណ៍វត្តមានស្វ័យប្រវត្តិ។
                </div>
              </div>

              {/* Overtime Approval SOP */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h3 className="kh-text" style={{ margin: '0 0 10px', fontSize: '1.02rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⏳</span> នីតិវិធីស្នើសុំថែមម៉ោង (OT SOP)
                </h3>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.83rem', color: '#475569', lineHeight: 1.6 }}>
                  <li><strong>ការស្នើសុំជាមុន៖</strong> ប្រធានផ្នែកត្រូវបញ្ចូលពាក្យស្នើសុំថែមម៉ោង (OT Request) យ៉ាងហោចណាស់ <strong>២ ម៉ោងមុន</strong> ពេលចាប់ផ្តើមថែមម៉ោង។</li>
                  <li><strong>ការអនុម័ត (Approval):</strong> ប្រធានរដ្ឋបាល/HR ពិនិត្យ និងចុច «អនុម័ត (APPROVE)» ក្នុងប្រព័ន្ធ។</li>
                  <li><strong>ការទាញទិន្នន័យ៖</strong> ម៉ោង OT ដែលបានអនុម័ត នឹងត្រូវបញ្ចូលស្វ័យប្រវត្តិក្នងតារាង Payroll ប្រចាំខែ។</li>
                </ul>
              </div>

              {/* Leave Policy Card */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                <h3 className="kh-text" style={{ margin: '0 0 12px', fontSize: '1.02rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏖️</span> គោលការណ៍ច្បាប់ឈប់សម្រាក (Leave Request SOP)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.88rem' }}>ច្បាប់ឈប់សម្រាកប្រចាំឆ្នាំ (Annual Leave)</div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                      បុគ្គលិកមានសិទ្ធិឈប់សម្រាក <strong>១៨ ថ្ងៃក្នុងមួយឆ្នាំ</strong> (កើនឡើង ១ ថ្ងៃរៀងរាល់អតីតភាព ៣ ឆ្នាំ)។ នៅពេលមានច្បាប់អនុម័ត មិនកាត់ប្រាក់ខែឡើយ។
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.88rem' }}>ច្បាប់ឈឺ (Sick Leave)</div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                      ត្រូវមានលិខិតបញ្ជាក់ពីគ្រូពេទ្យស្របច្បាប់។ ទទួលបានប្រាក់ឈ្នួល ១០០% ក្នុងអំឡុងពេលកំណត់នៃច្បាប់ការងារ។
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.88rem' }}>អវត្តមានឥតច្បាប់ (Unexcused Absence)</div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                      កាត់ប្រាក់ឈ្នួលតាមចំនួនថ្ងៃអវត្តមាន (Daily Rate) និង <strong>បាត់បង់ប្រាក់រង្វាន់ឧស្សាហ៍ព្យាយាម $15.00</strong> ក្នុងខែនោះ។
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SALARY ADVANCE POLICY                                              */}
      {/* ========================================================================= */}
      {subTab === 'advance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 className="kh-text" style={{ margin: 0, fontSize: '1.25rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💸</span> គោលការណ៍ប្រាក់បុរេប្រទាន និងប្រាក់កម្ចី (Salary Advance Policy)
              </h2>
              <span style={{ fontSize: '0.8rem', backgroundColor: '#eff6ff', color: '#1e40af', padding: '4px 12px', borderRadius: '16px', fontWeight: 700 }}>
                Synced Settings Live
              </span>
            </div>

            <p style={{ margin: '0 0 20px', fontSize: '0.86rem', color: '#475569', lineHeight: 1.5 }}>
              គោលការណ៍នេះបង្កើតឡើងដើម្បីជួយសម្រួលដល់បុគ្គលិកដែលមានតម្រូវការហិរញ្ញវត្ថុបន្ទាន់ ដោយអនុលោមតាមបទបញ្ជាផ្ទៃក្នុងរបស់ក្រុមហ៊ុន៖
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Rule 1 */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.3rem' }}>🎯</span>
                  <strong className="kh-text" style={{ color: '#0f172a' }}>លក្ខខណ្ឌអតីតភាពការងារ (Eligibility)</strong>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2563eb', marginBottom: '6px' }}>
                  យ៉ាងតិច {advanceMonths} ខែ
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                  បុគ្គលិកត្រូវមានអតីតភាពការងារជាប់លាប់ចាប់ពី <strong>{advanceMonths} ខែឡើងទៅ</strong> ទើបមានសិទ្ធិដាក់ពាក្យស្នើសុំប្រាក់បុរេប្រទាន។
                </p>
              </div>

              {/* Rule 2 */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.3rem' }}>📊</span>
                  <strong className="kh-text" style={{ color: '#0f172a' }}>ដែនកំណត់ទឹកប្រាក់អតិបរមា (Max Limit)</strong>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#15803d', marginBottom: '6px' }}>
                  {advanceLimit}% នៃប្រាក់ខែគោល
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                  អាចស្នើបានអតិបរមាមិនលើសពី <strong>{advanceLimit}%</strong> នៃប្រាក់បៀវត្សរ៍គោលប្រចាំខែឡើយ ដើម្បីធានាសុវត្ថិភាពហិរញ្ញវត្ថុ។
                </p>
              </div>

              {/* Rule 3 */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.3rem' }}>🔄</span>
                  <strong className="kh-text" style={{ color: '#0f172a' }}>គោលការណ៍សងត្រឡប់ (Repayment Policy)</strong>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b45309', marginBottom: '6px' }}>
                  {advancePolicy === 'NEXT_PAYROLL' ? 'កាត់ក្នុងតារាងប្រាក់ខែបន្ទាប់' : 'រំលស់តាមការព្រមព្រៀង'}
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                  ប្រាក់ដែលបានបើកមុននឹងត្រូវកាត់កងស្វ័យប្រវត្តិចេញពីតារាងបើកប្រាក់ខែ (Payroll) ក្នុងខែដែលបានស្នើសុំ ឬខែបន្ទាប់។
                </p>
              </div>
            </div>

            {/* Advance Workflow */}
            <div style={{ marginTop: '20px', padding: '16px', borderRadius: '10px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <h4 className="kh-text" style={{ margin: '0 0 8px', color: '#1e40af', fontSize: '0.95rem' }}>
                📋 ដំណើរការស្នើសុំ និងអនុម័តប្រាក់បុរេប្រទាន (Step-by-Step Approval Workflow)
              </h4>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.83rem', color: '#1e3a8a', lineHeight: 1.6 }}>
                <li>បុគ្គលិកដាក់ពាក្យស្នើសុំតាមរយៈទម្រង់ ឬតាមរយៈផ្នែករដ្ឋបាល ដោយបញ្ជាក់ពីមូលហេតុច្បាស់លាស់។</li>
                <li>ប្រធានផ្នែក និងប្រធានរដ្ឋបាលត្រួតពិនិត្យអតីតភាពការងារ និងកម្រិតកំណត់ {advanceLimit}%។</li>
                <li>គណនេយ្យ/អ្នកគ្រប់គ្រងចុច «អនុម័ត (APPROVE)» ក្នុងផ្ទាំង «ប្រាក់បុរេប្រទាន»។</li>
                <li>ប្រព័ន្ធនឹងកាត់កងទឹកប្រាក់នេះដោយស្វ័យប្រវត្តិនៅពេលបង្កើតតារាងប្រាក់ខែ (Payroll Generation)។</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: LABOR LAW STANDARDS & REFERENCES                                  */}
      {/* ========================================================================= */}
      {subTab === 'law' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h2 className="kh-text" style={{ margin: '0 0 16px', fontSize: '1.25rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚖️</span> សេចក្តីយោងច្បាប់ស្តីពីការងារ និងបទដ្ឋានគតិយុត្តិ (Cambodia Labor Law Standards)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>មាត្រា ១០៤ ដល់ ១០៨ នៃច្បាប់ស្តីពីការងារ (ប្រាក់ឈ្នួល)</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                  កំណត់អំពីនិយមន័យប្រាក់ឈ្នួល ការគណនាប្រាក់ឈ្នួលប្រចាំថ្ងៃដោយចែកនឹង ២៦ ថ្ងៃ និងការហាមឃាត់ការកាត់ប្រាក់ឈ្នួលដោយគ្មានមូលដ្ឋានច្បាប់។
                </p>
              </div>

              <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>មាត្រា ១៣៩ នៃច្បាប់ស្តីពីការងារ (ការថែមម៉ោង)</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                  ការងារលើសម៉ោងធម្មតាត្រូវផ្តល់ប្រាក់ឈ្នួលស្មើនឹង ១៥០%។ ការងារថែមម៉ោងនៅពេលយប់ ឬនៅថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍ត្រូវផ្តល់ប្រាក់ឈ្នួលស្មើនឹង ២០០%។
                </p>
              </div>

              <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>ច្បាប់ស្តីពីរបបសន្តិសុខសង្គម (ប.ស.ស - NSSF Law)</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                  កំណត់កាតព្វកិច្ចចុះបញ្ជី និងបង់ភាគទានរបបសន្តិសុខសង្គមផ្នែកថែទាំសុខភាព ហានិភ័យការងារ និងរបបសោធន (២% ភាគីនិយោជិត និង ២% ភាគីនិយោជក) ក្រោមពិដានកំណត់អតិបរមា $300 ($6.00/ខែ)។
                </p>
              </div>

              <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>សារាចរណែនាំលេខ ០០២ សហវ.អពដ នៃក្រសួងសេដ្ឋកិច្ច និងហិរញ្ញវត្ថុ</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                  កំណត់អំពីកម្រិតប្រាក់បៀវត្សរ៍ជាប់ពន្ធតាមអត្រាកើនឡើងជាជណ្ដើរ (០%, ៥%, ១០%, ១៥%, ២០%) និងការកាត់បន្ថយបន្ទុកគ្រួសារ (សហព័ទ្ធ និងកូនក្នុងបន្ទុក)។
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
