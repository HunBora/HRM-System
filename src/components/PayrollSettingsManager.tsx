'use client';

import React, { useState } from 'react';
import { updatePayrollDates } from '@/app/dashboard/payrollSettingsActions';
import { updateExchangeRateAndRecalculate, recalculateDraftsWithNewAllowances, recalculateNssfOnDrafts } from '@/app/dashboard/payroll/actions';
import { notify } from '@/lib/notify';
import { NSSF_CONFIG } from '@/lib/nssf';

export default function PayrollSettingsManager({ initialSettings }: { initialSettings: any }) {
  const [formData, setFormData] = useState({
    payment1StartDate: initialSettings?.payment1StartDate || 1,
    payment1EndDate: initialSettings?.payment1EndDate || 15,
    payment2StartDate: initialSettings?.payment2StartDate || 16,
    payment2EndDate: initialSettings?.payment2EndDate || 31,
    exchangeRate: initialSettings?.exchangeRate || 4000,
    transportationAllowance: initialSettings?.transportationAllowance ?? 7.0,
    attendanceBonus: initialSettings?.attendanceBonus ?? 15.0,
    lunchAllowancePerDay: initialSettings?.lunchAllowancePerDay ?? 0.50,
    otMealAllowance: initialSettings?.otMealAllowance ?? 0.50,
    dayCareAllowancePerChild: initialSettings?.dayCareAllowancePerChild ?? 0.0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculatingRate, setIsRecalculatingRate] = useState(false);
  const [isRecalculatingAllowances, setIsRecalculatingAllowances] = useState(false);
  const [isRecalculatingNssf, setIsRecalculatingNssf] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      await updatePayrollDates(formData);
      const successText = 'ការកំណត់ប្រាក់ឧបត្ថម្ភ និងកាលវិភាគត្រូវបានរក្សាទុកដោយជោគជ័យ!';
      setMessage(successText);
      notify.toast(successText, 'success');
    } catch (error) {
      console.error(error);
      setMessage('មានបញ្ហាក្នុងការរក្សាទុក។ (Error Saving)');
      notify.error('បរាជ័យក្នុងការរក្សាទុក');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecalculateRateDrafts = async () => {
    const confirmed = await notify.confirm({
      title: 'គណនាអត្រាប្តូរប្រាក់ឡើងវិញ',
      text: `តើអ្នកពិតជាចង់អនុវត្តអត្រា ${formData.exchangeRate.toLocaleString()} ៛ ទៅលើតារាងប្រាក់ខែព្រាង (Draft Payrolls) ទាំងអស់មែនទេ?`,
      icon: 'question',
      confirmButtonText: 'យល់ព្រមអនុវត្ត',
    });
    if (!confirmed) return;

    setIsRecalculatingRate(true);
    setMessage('');
    try {
      const res = await updateExchangeRateAndRecalculate(formData.exchangeRate);
      if (res.success) {
        const successMsg = `ជោគជ័យ! បានគណនាអត្រាប្តូរប្រាក់ ${formData.exchangeRate.toLocaleString()} ៛ លើតារាងប្រាក់ខែចំនួន ${res.count || 0} នាក់។`;
        setMessage(successMsg);
        notify.success('បានគណនាឡើងវិញដោយជោគជ័យ', successMsg);
      } else {
        setMessage('កំហុស៖ ' + res.error);
        notify.error('បរាជ័យក្នុងការគណនា', res.error);
      }
    } catch (err: any) {
      setMessage('កំហុសក្នុងការគណនា៖ ' + err.message);
      notify.error('បរាជ័យក្នុងការគណនា', err.message);
    } finally {
      setIsRecalculatingRate(false);
    }
  };

  const handleRecalculateAllowancesDrafts = async () => {
    const confirmed = await notify.confirm({
      title: 'អនុវត្តគោលការណ៍ប្រាក់ឧបត្ថម្ភលើតារាងព្រាង',
      text: `តើអ្នកពិតជាចង់យកអត្រាប្រាក់ឧបត្ថម្ភថ្មី (ធ្វើដំណើរ $${formData.transportationAllowance}, រង្វាន់ទៀងទាត់ $${formData.attendanceBonus}, ថ្លៃបាយ $${formData.lunchAllowancePerDay}, កូនតូច $${formData.dayCareAllowancePerChild}/កូន) ទៅគណនាឡើងវិញលើតារាងប្រាក់ខែព្រាង (Draft Payrolls) ទាំងអស់មែនទេ?`,
      icon: 'question',
      confirmButtonText: 'យល់ព្រមអនុវត្តអូតូ',
    });
    if (!confirmed) return;

    setIsRecalculatingAllowances(true);
    setMessage('');
    try {
      // First save the settings so they persist
      await updatePayrollDates(formData);
      // Then recalculate all drafts
      const res = await recalculateDraftsWithNewAllowances();
      if (res.success) {
        const successMsg = `ជោគជ័យ! បានគណនាប្រាក់ឧបត្ថម្ភថ្មីលើតារាងប្រាក់ខែព្រាងចំនួន ${res.count || 0} នាក់រួចរាល់ដោយស្វ័យប្រវត្តិ។`;
        setMessage(successMsg);
        notify.success('បានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ', successMsg);
      } else {
        setMessage('កំហុស៖ ' + res.error);
        notify.error('បរាជ័យក្នុងការគណនា', res.error);
      }
    } catch (err: any) {
      setMessage('កំហុសក្នុងការគណនា៖ ' + err.message);
      notify.error('បរាជ័យក្នុងការគណនា', err.message);
    } finally {
      setIsRecalculatingAllowances(false);
    }
  };

  const handleRecalculateNssfDrafts = async () => {
    const confirmed = await notify.confirm({
      title: 'គណនាភាគទាន ប.ស.ស. ឡើងវិញលើតារាងព្រាង',
      text: 'តើអ្នកពិតជាចង់អនុវត្តរូបមន្ត ប.ស.ស. តាមច្បាប់ថ្មី (ប្រកាសលេខ ២៣៤/២៦ និងសេចក្តីជូនដំណឹងលេខ ៣១៣៤/២៦ ប.ស.ស.) លើតារាងប្រាក់ខែព្រាងទាំងអស់មែនទេ? (ពិដានថ្មី ១ ៥០០ ០០០៛ / $375 ចាប់ពីខែ ១១/២០២៦)',
      icon: 'question',
      confirmButtonText: 'យល់ព្រមអនុវត្ត',
    });
    if (!confirmed) return;

    setIsRecalculatingNssf(true);
    setMessage('');
    try {
      const res = await recalculateNssfOnDrafts();
      if (res.success) {
        const successMsg = `ជោគជ័យ! បានគណនាភាគទាន ប.ស.ស. ឡើងវិញលើតារាងប្រាក់ខែព្រាងចំនួន ${res.count || 0} នាក់រួចរាល់។`;
        setMessage(successMsg);
        notify.success('បានធ្វើបច្ចុប្បន្នភាព ប.ស.ស. ដោយជោគជ័យ', successMsg);
      } else {
        setMessage('កំហុស៖ ' + res.error);
        notify.error('បរាជ័យក្នុងការគណនា ប.ស.ស.', res.error);
      }
    } catch (err: any) {
      setMessage('កំហុសក្នុងការគណនា ប.ស.ស.៖ ' + err.message);
      notify.error('បរាជ័យក្នុងការគណនា', err.message);
    } finally {
      setIsRecalculatingNssf(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', color: '#1976d2', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💰</span> ការកំណត់កាលវិភាគ & គោលការណ៍ប្រាក់ឧបត្ថម្ភ (Payroll & Allowances Config)
        </h2>
        <p style={{ color: '#64748b', margin: 0, fontSize: '0.88rem' }}>
          កំណត់កាលបរិច្ឆេទបើកប្រាក់ខែ, អត្រាប្តូរប្រាក់ទីផ្សារ និងគោលការណ៍ប្រាក់ឧបត្ថម្ភប្រចាំខែ (ធ្វើដំណើរ, រង្វាន់ទៀងទាត់, ថ្លៃបាយ, កូនតូច) ស្របតាមក្រុមហ៊ុនផ្ទាល់ខ្លួន។
        </p>
      </div>

      {message && (
        <div style={{ padding: '12px 18px', backgroundColor: message.includes('ជោគជ័យ') ? '#e8f5e9' : '#fee2e2', color: message.includes('ជោគជ័យ') ? '#2e7d32' : '#b91c1c', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* ========================================================================= */}
        {/* 1. CUSTOM ALLOWANCES & INCENTIVES CARD                                     */}
        {/* ========================================================================= */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '14px', border: '1.5px solid #3b82f6', boxShadow: '0 4px 16px rgba(59, 130, 246, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, color: '#1e40af', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏢</span> គោលការណ៍ប្រាក់ឧបត្ថម្ភ និងរង្វាន់ប្រចាំខែ (Allowances & Incentives Settings)
            </h3>
            <span style={{ fontSize: '0.78rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
              កំណត់តាមចិត្តក្រុមហ៊ុន
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 18px 0', lineHeight: 1.5 }}>
            រោងចក្រ និងក្រុមហ៊ុននីមួយៗអាចកំណត់ប្រាក់ឧបត្ថម្ភតិច ឬច្រើនស្របតាមបទបញ្ជាផ្ទៃក្នុង។ នៅពេលកំណត់រួច ប្រព័ន្ធនឹងយកអត្រាទាំងនេះទៅគណនាដោយស្វ័យប្រវត្តិក្នងតារាង Payroll ទាំងអស់។
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {/* 1. Transportation Allowance */}
            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  🚌 ប្រាក់ធ្វើដំណើរ (Transport)
                </label>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2563eb' }}>
                  ${formData.transportationAllowance.toFixed(2)} / ខែ
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: '#64748b' }}>$</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  name="transportationAllowance"
                  value={formData.transportationAllowance}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.95rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {[0, 5, 7, 10, 15, 20].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, transportationAllowance: val }))}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: formData.transportationAllowance === val ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: formData.transportationAllowance === val ? '#eff6ff' : '#ffffff',
                      color: formData.transportationAllowance === val ? '#1d4ed8' : '#64748b',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    ${val}
                  </button>
                ))}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                ផ្តល់ថេរប្រចាំខែដល់បុគ្គលិកទាំងអស់
              </p>
            </div>

            {/* 2. Attendance Bonus */}
            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  🏆 រង្វាន់ទៀងទាត់ (Att. Bonus)
                </label>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#16a34a' }}>
                  ${formData.attendanceBonus.toFixed(2)} / ខែ
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: '#64748b' }}>$</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  name="attendanceBonus"
                  value={formData.attendanceBonus}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.95rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {[0, 10, 15, 20, 25, 30].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, attendanceBonus: val }))}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: formData.attendanceBonus === val ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                      backgroundColor: formData.attendanceBonus === val ? '#f0fdf4' : '#ffffff',
                      color: formData.attendanceBonus === val ? '#15803d' : '#64748b',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    ${val}
                  </button>
                ))}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                ផ្តល់ជូននៅពេលគ្មានអវត្តមាន (Absent Days = 0)
              </p>
            </div>

            {/* 3. Meal Allowance */}
            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  🍚 ថ្លៃបាយថ្ងៃត្រង់ (Lunch)
                </label>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#d97706' }}>
                  ${formData.lunchAllowancePerDay.toFixed(2)} / ថ្ងៃ
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: '#64748b' }}>$</span>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  name="lunchAllowancePerDay"
                  value={formData.lunchAllowancePerDay}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.95rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {[0, 0.50, 0.75, 1.00, 1.50].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, lunchAllowancePerDay: val }))}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: formData.lunchAllowancePerDay === val ? '1.5px solid #d97706' : '1px solid #e2e8f0',
                      backgroundColor: formData.lunchAllowancePerDay === val ? '#fffbeb' : '#ffffff',
                      color: formData.lunchAllowancePerDay === val ? '#b45309' : '#64748b',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    ${val.toFixed(2)}
                  </button>
                ))}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                គណនាស្មើ ថ្ងៃធ្វើការ × ${formData.lunchAllowancePerDay.toFixed(2)}
              </p>
            </div>

            {/* 4. OT Meal Allowance */}
            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  🍱 ថ្លៃបាយថែមម៉ោង (OT Meal)
                </label>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ea580c' }}>
                  ${formData.otMealAllowance.toFixed(2)} / លើក
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: '#64748b' }}>$</span>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  name="otMealAllowance"
                  value={formData.otMealAllowance}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.95rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {[0, 0.50, 0.75, 1.00].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, otMealAllowance: val }))}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: formData.otMealAllowance === val ? '1.5px solid #ea580c' : '1px solid #e2e8f0',
                      backgroundColor: formData.otMealAllowance === val ? '#fff7ed' : '#ffffff',
                      color: formData.otMealAllowance === val ? '#c2410c' : '#64748b',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    ${val.toFixed(2)}
                  </button>
                ))}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                ផ្តល់ជូននៅពេលថែមម៉ោង OT ≥ ២ ម៉ោងក្នុងមួយថ្ងៃ
              </p>
            </div>

            {/* 5. Child Care / Day Care Allowance */}
            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#fdf2f8', border: '1.5px solid #f472b6', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <label style={{ fontSize: '0.92rem', fontWeight: 700, color: '#9d174d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>👶</span> ប្រាក់កូនតូច / ថ្លៃមើលថែកូន (Day Care / Child Allowance)
                </label>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#be185d', backgroundColor: '#fce7f3', padding: '3px 10px', borderRadius: '12px' }}>
                  ${formData.dayCareAllowancePerChild.toFixed(2)} / កូន / ខែ
                </span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#831843' }}>
                ស្របតាមមាត្រា ១៨៦ នៃច្បាប់ការងារ ប្រាក់ឧបត្ថម្ភនេះនឹងត្រូវគណនាដោយស្វ័យប្រវត្តិតាមចំនួនកូនក្នុងបន្ទុករបស់បុគ្គលិក (Employee Children × ${formData.dayCareAllowancePerChild.toFixed(2)})។
              </p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '200px' }}>
                  <span style={{ fontWeight: 700, color: '#9d174d' }}>$</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    name="dayCareAllowancePerChild"
                    value={formData.dayCareAllowancePerChild}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #f472b6', fontWeight: 700, fontSize: '0.95rem' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {[0, 5, 10, 15, 20].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, dayCareAllowancePerChild: val }))}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: formData.dayCareAllowancePerChild === val ? '1.5px solid #be185d' : '1px solid #fbcfe8',
                        backgroundColor: formData.dayCareAllowancePerChild === val ? '#fbcfe8' : '#ffffff',
                        color: '#9d174d',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      ${val} / កូន
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* One-Click Apply to All Drafts Button */}
          <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px dashed #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: '#1e40af', fontWeight: 600 }}>
              ⚡ ចង់យកអត្រាប្រាក់ឧបត្ថម្ភថ្មីទាំងនេះទៅគណនាឡើងវិញលើតារាងប្រាក់ខែព្រាងដែលកំពុងមានភ្លាមៗមែនទេ?
            </span>
            <button
              type="button"
              disabled={isRecalculatingAllowances}
              onClick={handleRecalculateAllowancesDrafts}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: isRecalculatingAllowances ? 'not-allowed' : 'pointer',
                opacity: isRecalculatingAllowances ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              <span>{isRecalculatingAllowances ? 'កំពុងគណនាស្វ័យប្រវត្តិ...' : '🔄 អនុវត្តគោលការណ៍ថ្មីនេះលើតារាងព្រាងទាំងអស់ (Apply to All Drafts Now)'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. EXCHANGE RATE CARD                                                     */}
        {/* ========================================================================= */}
        <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1.5px solid #86efac' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
              <span>💱</span> អត្រាប្តូរប្រាក់ទីផ្សារ (1$ = ? ៛)
            </h3>
            <span style={{ fontWeight: 800, color: '#15803d', fontSize: '1.05rem', backgroundColor: '#dcfce7', padding: '3px 10px', borderRadius: '12px' }}>
              {formData.exchangeRate.toLocaleString()} ៛
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#15803d', margin: '0 0 12px 0' }}>
            អត្រានេះនឹងត្រូវយកទៅគណនាប្រាក់ខែជាប្រាក់រៀល (Net Salary Riel) ដោយស្វ័យប្រវត្តិក្នងតារាង Payroll ទាំងអស់។
          </p>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <input
                type="number"
                name="exchangeRate"
                value={formData.exchangeRate}
                onChange={handleChange}
                min={1000}
                max={10000}
                step={1}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '2px solid #22c55e',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {[4000, 4050, 4100, 4120, 4150].map((pr) => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, exchangeRate: pr }))}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: formData.exchangeRate === pr ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                    backgroundColor: formData.exchangeRate === pr ? '#bbf7d0' : '#ffffff',
                    color: '#166534',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {pr.toLocaleString()} ៛
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <button
              type="button"
              disabled={isRecalculatingRate}
              onClick={handleRecalculateRateDrafts}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: isRecalculatingRate ? 'not-allowed' : 'pointer',
                opacity: isRecalculatingRate ? 0.7 : 1,
              }}
            >
              <span>{isRecalculatingRate ? 'កំពុងគណនា...' : '🔄 អនុវត្តអត្រាថ្មីនេះទៅលើតារាងព្រាង (Apply Rate to All Drafts)'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. NSSF (ប.ស.ស) STATUTORY REGULATIONS CARD                              */}
        {/* ========================================================================= */}
        <div style={{ backgroundColor: '#ffffff', padding: '22px', borderRadius: '14px', border: '1.5px solid #0284c7', boxShadow: '0 4px 16px rgba(2, 132, 199, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, color: '#0369a1', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏥</span> បទប្បញ្ញត្តិរបបសន្តិសុខសង្គម ប.ស.ស. (NSSF Law - Prakas 234/26)
            </h3>
            <span style={{ fontSize: '0.78rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, border: '1px solid #bae6fd' }}>
              អនុវត្តចាប់ពីខែ វិច្ឆិកា ឆ្នាំ ២០២៦ តទៅ
            </span>
          </div>

          <p style={{ fontSize: '0.84rem', color: '#475569', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            អនុលោមតាម<strong>ប្រកាសអន្តរក្រសួងលេខ ២៣៤/២៦ ក.ប/ប្រ.ក.ប.ស.ស</strong> និង<strong>សេចក្តីជូនដំណឹងលេខ ៣១៣៤/២៦ ប.ស.ស.</strong> ចុះថ្ងៃទី ២៨ ខែតុលា ឆ្នាំ២០២៦ ស្តីពីការកែសម្រួលកម្រិតអប្បបរមានិងពិដាននៃប្រាក់ឈ្នួលជាប់ភាគទាន។
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            {/* Box 1: Minimum Contributory Wage */}
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0369a1', marginBottom: '4px' }}>
                ប្រាក់ឈ្នួលជាប់ភាគទានអប្បបរមា
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>
                ៦០០ ០០០ ៛ <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>(${(600000 / formData.exchangeRate).toFixed(2)})</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px' }}>
                ភាគទានអប្បបរមា ២% ស្មើនឹង <strong>១២ ០០០ ៛ ($3.00)</strong>
              </div>
            </div>

            {/* Box 2: Maximum Ceiling */}
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#15803d', marginBottom: '4px' }}>
                ប្រាក់ឈ្នួលជាប់ភាគទានពិដាន (អតិបរមា)
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>
                ១ ៥០០ ០០០ ៛ <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>(${(1500000 / formData.exchangeRate).toFixed(2)})</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px' }}>
                ភាគទានអតិបរមា ២% ស្មើនឹង <strong>៣០ ០០០ ៛ ($7.50)</strong>
              </div>
            </div>

            {/* Box 3: Rate Breakdown */}
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#fdf4ff', border: '1px solid #f5d0fe' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#86198f', marginBottom: '4px' }}>
                អត្រាភាគទានសោធន (Pension Scheme)
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#a21caf' }}>
                ២% <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>(កាត់កងពីប្រាក់ខែ)</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px' }}>
                និយោជកបង់ ២% បន្ថែម (សរុប ៤% ចូល ប.ស.ស.)
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '0.82rem', color: '#334155', lineHeight: 1.6, marginBottom: '14px' }}>
            💡 <strong>ប្រព័ន្ធដំណើរការដោយស្វ័យប្រវត្តិ៖</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
              <li><strong>ខែវិច្ឆិកា ឆ្នាំ២០២៦ តទៅ៖</strong> គណនាក្នុងចន្លោះពី ៦០០ ០០០៛ ($150) ដល់ពិដាន ១ ៥០០ ០០០៛ ($375) ដោយកាត់ចន្លោះពី $3.00 ដល់ $7.50។</li>
              <li><strong>មុនខែវិច្ឆិកា ឆ្នាំ២០២៦៖</strong> រក្សាពិដានចាស់ ត្រឹម $300 (កាត់អតិបរមា $6.00) មិនប៉ះពាល់ដល់ទិន្នន័យប្រវត្តិសាស្ត្រចាស់ៗឡើយ។</li>
            </ul>
          </div>

          <div>
            <button
              type="button"
              disabled={isRecalculatingNssf}
              onClick={handleRecalculateNssfDrafts}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: isRecalculatingNssf ? 'not-allowed' : 'pointer',
                opacity: isRecalculatingNssf ? 0.7 : 1,
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
              }}
            >
              <span>{isRecalculatingNssf ? 'កំពុងគណនា ប.ស.ស...' : '🔄 អនុវត្តរូបមន្ត ប.ស.ស ថ្មីលើតារាងព្រាង (Apply NSSF to Drafts)'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. PAYROLL SCHEDULE DATES                                                 */}
        {/* ========================================================================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '0.98rem' }}>📅 លើកទី១ (Payment 1)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.84rem', color: '#475569' }}>ថ្ងៃចាប់ផ្តើម</label>
                <input type="number" name="payment1StartDate" value={formData.payment1StartDate} onChange={handleChange} min={1} max={31} required style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.84rem', color: '#475569' }}>ថ្ងៃបញ្ចប់</label>
                <input type="number" name="payment1EndDate" value={formData.payment1EndDate} onChange={handleChange} min={1} max={31} required style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '0.98rem' }}>📅 លើកទី២ (Payment 2)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.84rem', color: '#475569' }}>ថ្ងៃចាប់ផ្តើម</label>
                <input type="number" name="payment2StartDate" value={formData.payment2StartDate} onChange={handleChange} min={1} max={31} required style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.84rem', color: '#475569' }}>ថ្ងៃបញ្ចប់</label>
                <input type="number" name="payment2EndDate" value={formData.payment2EndDate} onChange={handleChange} min={1} max={31} required style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Global Save Button */}
        <div>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              padding: '12px 28px',
              backgroundColor: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              boxShadow: '0 4px 14px rgba(25, 118, 210, 0.3)',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? 'កំពុងរក្សាទុក...' : '💾 រក្សាទុកការកំណត់ទាំងអស់ (Save Settings)'}
          </button>
        </div>
      </form>
    </div>
  );
}
