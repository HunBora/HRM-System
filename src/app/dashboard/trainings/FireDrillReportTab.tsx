'use client';

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const STORAGE_KEY = 'hrm_fire_drill_report_data_v2';

const DEFAULT_DATA = {
  companyKh: 'ក្រុមហ៊ុន អេចវើហ្គ្រីន ស្ព័តធីង ហ្គូដ (ខេមបូឌា) ឯ.ក',
  companyEn: 'EVERGREEN SPORTING GOODS (CAMBODIA) CO., LTD.',
  companyZh: '长青户外用品(柬埔寨)有限公司',
  logoUrl: '/images/fire-drill/evergreen_logo.png',
  drillDate: '2024-11-23',
  drillTime: '14:00 - 16:00 នាទី',
  alarmTime: '15:20 នាទី',
  evacDuration: '៣ នាទី ២៥ វិនាទី (3m 25s)',
  docCode: 'SOP-TR-FIRE-2024',
  location: 'ក្រុមហ៊ុន អេចវើហ្គ្រីន ស្ព័តធីង ហ្គូដ (ខេមបូឌា) ឯ.ក',
  participants: 'កម្មករនិយោជិតទាំងអស់ / All Workers / 全体员工 (បុគ្គលិកសរុបប្រមាណ ៥៥ នាក់ និងតំណាងគ្រប់ផ្នែក)',
  trainers: 'ភ្នាក់ងារនគរបាលនៃក្រសួងមហាផ្ទៃទទួលបន្ទុកផែនបង្ការនិងពន្លត់អគ្គិភ័យ និង លោក ចាន់ ភារម្យ មន្ត្រីអនុវត្តច្បាប់ប្រចាំក្រុមហ៊ុន',
  sig1Name: 'ភឿក លីដា (Pheuk Lyda)',
  sig1Role: 'Compliance Officer',
  sig2Name: 'ចាន់ ភារម្យ (Chan Phearum)',
  sig2Role: 'Admin / HR / CSR Manager',
  sig3Name: 'CHEN LANMAO',
  sig3Role: 'General Manager',
  photos: {} as Record<string, string>,
  captions: {} as Record<string, string>
};

export default function FireDrillReportTab() {
  const [viewMode, setViewMode] = useState<'pages' | 'iframe'>('pages');
  const [data, setData] = useState(DEFAULT_DATA);
  const [showModal, setShowModal] = useState(false);
  const [formValues, setFormValues] = useState(DEFAULT_DATA);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = { ...DEFAULT_DATA, ...parsed, photos: { ...parsed.photos }, captions: { ...parsed.captions } };
        setData(merged);
        setFormValues(merged);
      }
    } catch (e) {
      console.error('Error loading report config:', e);
    }
  }, []);

  const saveToStorage = (updated: typeof DEFAULT_DATA) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  };

  const handleOpenModal = () => {
    setFormValues({ ...data });
    setShowModal(true);
  };

  const handleApplyForm = (e: React.FormEvent) => {
    e.preventDefault();
    setData(formValues);
    saveToStorage(formValues);
    setShowModal(false);
    Swal.fire({
      icon: 'success',
      title: 'បានធ្វើបច្ចុប្បន្នភាពជោគជ័យ!',
      text: 'ព័ត៌មានរោងចក្រ កាលបរិច្ឆេទ និងខ្លឹមសារត្រូវបានកែសម្រួលរួចរាល់។',
      timer: 1600,
      showConfirmButton: false,
    });
  };

  const handlePhotoUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      const updatedPhotos = { ...data.photos, [key]: base64 };
      const updated = { ...data, photos: updatedPhotos };
      setData(updated);
      saveToStorage(updated);
      Swal.fire({
        icon: 'success',
        title: 'បានផ្លាស់ប្តូររូបភាព!',
        timer: 1200,
        showConfirmButton: false
      });
    };
    reader.readAsDataURL(file);
  };

  const handleResetPhoto = (key: string) => {
    const updatedPhotos = { ...data.photos };
    delete updatedPhotos[key];
    const updated = { ...data, photos: updatedPhotos };
    setData(updated);
    saveToStorage(updated);
  };

  const handleResetAll = async () => {
    const result = await Swal.fire({
      title: 'កំណត់ឡើងវិញ?',
      text: 'តើអ្នកចង់កំណត់ទិន្នន័យទាំងអស់ត្រឡប់ទៅទម្រង់ដើមរបស់រោងចក្រ Evergreen វិញមែនទេ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'បាទ/ចាស កំណត់ឡើងវិញ',
      cancelButtonText: 'បោះបង់',
      confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      localStorage.removeItem(STORAGE_KEY);
      setData(DEFAULT_DATA);
      setFormValues(DEFAULT_DATA);
      Swal.fire({
        icon: 'success',
        title: 'បានកំណត់ឡើងវិញរួចរាល់!',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handlePrint = () => {
    const printWin = window.open('/docs/fire_drill_evacuation_report.html', '_blank');
    if (printWin) {
      printWin.onload = () => {
        printWin.print();
      };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #166534 50%, #0f172a 100%)',
          borderRadius: '12px',
          padding: '20px 24px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ maxWidth: '850px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.6rem' }}>🧯</span>
            <h2 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#f8fafc' }}>
              កំណត់ត្រាវគ្គបណ្ដុះបណ្ដាលបង្ការពន្លត់អគ្គីភ័យ និងជម្លៀសខ្លួនចេញពីអគ្គីភ័យ
            </h2>
            <span style={{ background: '#22c55e', color: '#052e16', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
              {data.docCode}
            </span>
          </div>

          <div style={{ fontSize: '0.92rem', color: '#86efac', fontWeight: 700, marginBottom: '6px' }}>
            Fire Drill and Evacuation Training Report • 消防演练与紧急疏散培训报告
          </div>

          <p style={{ margin: 0, fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.5 }}>
            រៀបចំឡើងស្របតាមច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា, សេចក្តីណែនាំស្តីពី OSH របស់ក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ, បទប្បញ្ញត្តិបង្ការអគ្គិភ័យនៃក្រសួងមហាផ្ទៃ និងស្តង់ដាសវនកម្មសង្គមអន្តរជាតិ (Better Factories Cambodia - BFC, BSCI, SMETA, ISO 45001)។
          </p>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: '4px' }}>
              📅 កាលបរិច្ឆេទ: <strong>{data.drillDate} ({data.drillTime})</strong>
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: '4px' }}>
              ⏱️ រយៈពេលជម្លៀស: <strong>{data.evacDuration}</strong>
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: '4px' }}>
              🏢 រោងចក្រ: <strong>{data.companyKh}</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
          <button
            type="button"
            onClick={handleOpenModal}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '7px',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(2,132,199,0.3)',
            }}
          >
            🏢 <span>កំណត់រោងចក្រ & ពេលវេលា</span>
          </button>

          <a
            href="/docs/fire_drill_evacuation_report.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#22c55e',
              color: '#052e16',
              padding: '9px 16px',
              borderRadius: '7px',
              fontSize: '0.84rem',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(34,197,94,0.35)',
            }}
          >
            📖 <span>បើកទម្រង់ពេញលេញ (Edit & Print)</span> ↗
          </a>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                flex: 1,
                background: '#0f172a',
                color: '#ffffff',
                border: '1px solid #334155',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🖨️ Print PDF
            </button>
            <button
              type="button"
              onClick={handleResetAll}
              style={{
                background: '#eab308',
                color: '#422006',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="កំណត់ឡើងវិញទៅទម្រង់ដើម"
            >
              🔄 Reset
            </button>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'pages' ? 'iframe' : 'pages')}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#f8fafc',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {viewMode === 'pages' ? '🖥️ A4 Doc' : '📋 Cards'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'iframe' ? (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ background: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
              📄 ផ្ទាំងមើលជាឯកសារដើម (Live Interactive Document Preview - Auto Synchronized)
            </span>
            <a href="/docs/fire_drill_evacuation_report.html" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
              បើកក្នុងផ្ទាំងដាច់ដោយឡែក ↗
            </a>
          </div>
          <iframe
            src="/docs/fire_drill_evacuation_report.html"
            style={{ width: '100%', height: '900px', border: 'none' }}
            title="Fire Drill Report Preview"
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card: Page 1 */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px 24px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #15803d', paddingBottom: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#15803d', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                  ទំព័រទី ១ / Page 1
                </span>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  ១. វគ្គបណ្តុះបណ្តាលទ្រឹស្តីក្នុងបន្ទប់ប្រជុំ (Classroom Training & Fire Safety Theory)
                </h3>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700, background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                {data.drillTime}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start' }}>
              <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.6 }}>
                <p style={{ marginBottom: '8px' }}>
                  គ្រូឧទ្ទេស៖ <strong>{data.trainers}</strong> បានបង្រៀនលើចំណុចសំខាន់ៗ ៤ ដល់ប្រធានផ្នែក និងកម្មករនិយោជិត៖
                </p>
                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li><strong>១. ការណែនាំដល់ប្រធានក្រុមនិមួយៗ៖</strong> ការរត់ជម្លៀស និងការគ្រប់គ្រងកូនចៅតាមជួរ។</li>
                  <li><strong>២. ចំណេះដឹងមូលដ្ឋានអគ្គិភ័យ៖</strong>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                      • ត្រីកោណភ្លើង (កម្តៅ, អុកស៊ីសែន, ឥន្ធនៈ)<br />
                      • មូលហេតុបង្ក (ទុស្សេខ្សែភ្លើង, កម្តៅម៉ាស៊ីន, សារធាតុគីមី)<br />
                      • ថ្នាក់នៃអគ្គិភ័យ (Class A, B, C, E) & សុវត្ថិភាព PPE
                    </div>
                  </li>
                  <li><strong>៣. គោលដៅត្រឹមត្រូវសម្រាប់ការជួបជុំ៖</strong> កន្លែងជួបជុំពេលមានអាសន្ន (Assembly Point)។</li>
                  <li><strong>៤. អនុសាសន៍សំខាន់ៗ៖</strong> ហាមរត់ជាន់គ្នា ហាមយកឥវ៉ាន់ និងឱនទាបពេលមានផ្សែង។</li>
                </ul>
              </div>

              <div>
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative' }}>
                  <img
                    src={data.photos['img-photo-1'] || '/images/fire-drill/image_01.jpg'}
                    alt="Classroom Session"
                    style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ position: 'absolute', bottom: '26px', right: '8px', background: 'rgba(0,0,0,0.7)', color: '#fbbf24', fontSize: '0.72rem', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace' }}>
                    {data.drillDate}
                  </div>
                  <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                    <label style={{ background: '#2563eb', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                      📷 ប្តូររូប
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload('img-photo-1', e)} style={{ display: 'none' }} />
                    </label>
                    {data.photos['img-photo-1'] && (
                      <button onClick={() => handleResetPhoto('img-photo-1')} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '3px 6px', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer' }}>
                        🔄
                      </button>
                    )}
                  </div>
                  <div style={{ background: '#f8fafc', padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600, color: '#334155', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                    រូបភាពទី ១៖ វគ្គបណ្តុះបណ្តាលទ្រឹស្តីក្នុងបន្ទប់ប្រជុំ (Classroom Presentation & Meeting)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Page 2 */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px 24px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #15803d', paddingBottom: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#15803d', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                  ទំព័រទី ២ / Page 2
                </span>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  ២. ការចុចកណ្ដឹងប្រកាសអាសន្ន និងការជម្លៀសខ្លួនក្នុងរោងចក្រ (Alarm Activation & Evacuation)
                </h3>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700, background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                វេលាម៉ោង {data.alarmTime}
              </span>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.6, marginBottom: '10px' }}>
              នៅវេលាម៉ោង {data.alarmTime} កណ្តឹងរោទិ៍អាសន្នបានបន្លឺឡើង។ កម្មករនិយោជិតទាំងអស់បានបិទម៉ាស៊ីន ផ្តាច់ចរន្ត និងដើរចេញតាមគន្លងផ្លូវសុវត្ថិភាពពណ៌លឿងប្រកបដោយរបៀបរៀបរយ។ មេក្រុមបានកាន់ស្លាកសម្គាល់ផ្នែក ដើម្បីដឹកនាំជួរជម្លៀស។
            </p>

            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', padding: '8px 14px', fontSize: '0.82rem', color: '#991b1b', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⏱️ រយៈពេលជម្លៀសខ្លួនសរុប (Total Evacuation Time):</span>
              <span style={{ background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                {data.evacDuration}
              </span>
              <span style={{ color: '#166534', fontWeight: 600, fontSize: '0.78rem' }}>
                ✅ សម្រេចតាមស្តង់ដាសុវត្ថិភាព
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {[
                { key: 'img-photo-2', defaultImg: '/images/fire-drill/image_03.jpg', title: 'កណ្ដឹងរោទិ៍ & ភ្លើងអាសន្ន' },
                { key: 'img-photo-3', defaultImg: '/images/fire-drill/image_04.jpg', title: 'កម្មករចាប់ផ្តើមជម្លៀស' },
                { key: 'img-photo-4', defaultImg: '/images/fire-drill/image_05.jpg', title: 'ដើរតាមគន្លងផ្លូវពណ៌លឿង' },
                { key: 'img-photo-5', defaultImg: '/images/fire-drill/image_06.jpg', title: 'ការជម្លៀសប្រកបដោយរបៀបរៀបរយ' },
                { key: 'img-photo-6', defaultImg: '/images/fire-drill/image_07.jpg', title: 'មេក្រុមលើកស្លាក Computer Line' },
                { key: 'img-photo-7', defaultImg: '/images/fire-drill/image_08.jpg', title: 'មេក្រុមផ្នែកកាត់ដេរ Line 02' },
              ].map((item, idx) => (
                <div key={idx} style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', position: 'relative' }}>
                  <img src={data.photos[item.key] || item.defaultImg} alt={item.title} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '2px' }}>
                    <label style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 5px', borderRadius: '3px', fontSize: '0.65rem', cursor: 'pointer' }}>
                      📷
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(item.key, e)} style={{ display: 'none' }} />
                    </label>
                  </div>
                  <div style={{ padding: '4px 6px', fontSize: '0.72rem', fontWeight: 600, color: '#334155', textAlign: 'center' }}>
                    {item.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Page 3 */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px 24px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #15803d', paddingBottom: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#15803d', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                  ទំព័រទី ៣ / Page 3
                </span>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  ៣. ការប្រមូលផ្តុំនៅទីតាំងសុវត្ថិភាព ការរាប់ចំនួនមនុស្ស និងការហ្វឹកហាត់ទុយោទឹកពន្លត់
                </h3>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700, background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                ទីតាំងសុវត្ថិភាព
              </span>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.6, marginBottom: '10px' }}>
              នៅកន្លែងជួបជុំ (Emergency Assembly Point): កម្មករនិយោជិតទាំងអស់បានប្រមូលផ្តុំយ៉ាងរហ័ស។ ប្រធានក្រុមនីមួយៗបានរាប់ចំនួនមនុស្ស (Headcount & Roll Call) គ្រប់ចំនួន ១០០% គ្មានអ្នកបាត់ខ្លួន។ បន្ទាប់មក ភ្នាក់ងារនគរបាលបានណែនាំពីរបៀបបើកទូពន្លត់អគ្គិភ័យ និងការតភ្ជាប់ទុយោបាញ់ទឹកសម្ពាធខ្ពស់ជាក់ស្តែង។
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {[
                { key: 'img-photo-8', defaultImg: '/images/fire-drill/image_09.jpg', title: 'ស្លាកសញ្ញាកន្លែងជួបជុំ' },
                { key: 'img-photo-9', defaultImg: '/images/fire-drill/image_10.jpg', title: 'ណែនាំទូពន្លត់អគ្គិភ័យ' },
                { key: 'img-photo-10', defaultImg: '/images/fire-drill/image_13.jpg', title: 'ហ្វឹកហាត់កាន់ទុយោទឹក' },
                { key: 'img-photo-11', defaultImg: '/images/fire-drill/image_15.jpg', title: 'ការបាញ់ទឹកពន្លត់ជាក់ស្តែង' },
                { key: 'img-photo-12', defaultImg: '/images/fire-drill/image_17.jpg', title: 'កម្មករនិយោជិតតម្រៀបជួរ' },
                { key: 'img-photo-13', defaultImg: '/images/fire-drill/image_19.jpg', title: 'ដុតភ្លើងពិសោធន៍ក្នុងធុងដែក' },
              ].map((item, idx) => (
                <div key={idx} style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', position: 'relative' }}>
                  <img src={data.photos[item.key] || item.defaultImg} alt={item.title} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '2px' }}>
                    <label style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 5px', borderRadius: '3px', fontSize: '0.65rem', cursor: 'pointer' }}>
                      📷
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(item.key, e)} style={{ display: 'none' }} />
                    </label>
                  </div>
                  <div style={{ padding: '4px 6px', fontSize: '0.72rem', fontWeight: 600, color: '#334155', textAlign: 'center' }}>
                    {item.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Page 4 */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px 24px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #15803d', paddingBottom: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#15803d', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                  ទំព័រទី ៤ / Page 4
                </span>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  ៤. ការអនុវត្តជាក់ស្តែងដោយបំពង់ពន្លត់អគ្គិភ័យ និងការវាយតម្លៃសន្និដ្ឋាន
                </h3>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700, background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                ការបាញ់ពន្លត់ជាក់ស្តែង
              </span>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.6, marginBottom: '10px' }}>
              តំណាងកម្មករនិយោជិត និងសមាជិកក្រុមសង្គ្រោះបឋមបានអនុវត្តបាញ់ពន្លត់ភ្លើងជាក់ស្តែងក្នុងធុងពិសោធន៍ដោយប្រើបំពង់ពន្លត់អគ្គិភ័យប្រភេទ ABC Dry Chemical Powder តាមគោលការណ៍ <strong>P.A.S.S (Pull, Aim, Squeeze, Sweep)</strong> ដោយជោគជ័យ។ វគ្គហាត់សមបានបញ្ចប់សព្វគ្រប់នៅវេលាម៉ោង {data.drillTime.split('-')[1] || '16:00'}។
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative' }}>
                <img src={data.photos['img-photo-14'] || '/images/fire-drill/image_25.jpg'} alt="Extinguisher Drill 1" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '2px' }}>
                  <label style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 5px', borderRadius: '3px', fontSize: '0.65rem', cursor: 'pointer' }}>
                    📷
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload('img-photo-14', e)} style={{ display: 'none' }} />
                  </label>
                </div>
                <div style={{ padding: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#334155', textAlign: 'center', background: '#f8fafc' }}>
                  រូបភាពទី ១៤៖ កម្មករនិយោជិតដកគន្លឹះ និងតម្រង់ក្បាលបាញ់
                </div>
              </div>
              <div style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative' }}>
                <img src={data.photos['img-photo-15'] || '/images/fire-drill/image_26.jpg'} alt="Extinguisher Drill 2" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '2px' }}>
                  <label style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 5px', borderRadius: '3px', fontSize: '0.65rem', cursor: 'pointer' }}>
                    📷
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload('img-photo-15', e)} style={{ display: 'none' }} />
                  </label>
                </div>
                <div style={{ padding: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#334155', textAlign: 'center', background: '#f8fafc' }}>
                  រូបភាពទី ១៥៖ ការបាញ់ពន្លត់ភ្លើងក្នុងធុងពិសោធន៍ដោយជោគជ័យ
                </div>
              </div>
            </div>

            {/* 3 Signatures Preview */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '10px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px', textAlign: 'center' }}>
                ✍️ ហត្ថលេខាបញ្ជាក់ត្រឹមត្រូវ (Authorized Signatures):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', textAlign: 'center' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ធ្វើរបាយការណ៍ដោយ / Prepared by</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{data.sig1Name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>{data.sig1Role}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ពិនិត្យដោយ / Checked by</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{data.sig2Name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700 }}>{data.sig2Role}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>អនុម័តដោយ / Approved by</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{data.sig3Name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 700 }}>{data.sig3Role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FACTORY & SETTINGS MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                🏢 កំណត់ព័ត៌មានរោងចក្រ កាលបរិច្ឆេទ & ខ្លឹមសារ (Factory & Drill Setup)
              </h3>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleApplyForm} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', color: '#1e40af' }}>
                💡 <strong>ការណែនាំ៖</strong> លោកអ្នកអាចកែប្រែឈ្មោះរោងចក្រ កាលបរិច្ឆេទ ម៉ោងហ្វឹកហាត់ រយៈពេលជម្លៀស និងឈ្មោះអ្នកចុះហត្ថលេខា ដើម្បីប្រើប្រាស់តាមរោងចក្រជាក់ស្តែងផ្សេងៗគ្នា។
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>ឈ្មោះរោងចក្រ (ខ្មែរ)</label>
                  <input
                    type="text"
                    value={formValues.companyKh}
                    onChange={(e) => setFormValues({ ...formValues, companyKh: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>Factory Name (EN)</label>
                  <input
                    type="text"
                    value={formValues.companyEn}
                    onChange={(e) => setFormValues({ ...formValues, companyEn: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>公司名称 (中文)</label>
                  <input
                    type="text"
                    value={formValues.companyZh}
                    onChange={(e) => setFormValues({ ...formValues, companyZh: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>កាលបរិច្ឆេទហាត់សម</label>
                  <input
                    type="date"
                    value={formValues.drillDate}
                    onChange={(e) => setFormValues({ ...formValues, drillDate: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>ពេលវេលា (Time)</label>
                  <input
                    type="text"
                    value={formValues.drillTime}
                    onChange={(e) => setFormValues({ ...formValues, drillTime: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>ម៉ោងរោទិ៍អាសន្ន (Alarm)</label>
                  <input
                    type="text"
                    value={formValues.alarmTime}
                    onChange={(e) => setFormValues({ ...formValues, alarmTime: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>⏱️ រយៈពេលជម្លៀសខ្លួន</label>
                  <input
                    type="text"
                    value={formValues.evacDuration}
                    onChange={(e) => setFormValues({ ...formValues, evacDuration: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>កូដឯកសារ (Doc Code)</label>
                  <input
                    type="text"
                    value={formValues.docCode}
                    onChange={(e) => setFormValues({ ...formValues, docCode: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>អ្នកចូលរួម (Participants)</label>
                <input
                  type="text"
                  value={formValues.participants}
                  onChange={(e) => setFormValues({ ...formValues, participants: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>គ្រូឧទ្ទេស (Trainers)</label>
                <input
                  type="text"
                  value={formValues.trainers}
                  onChange={(e) => setFormValues({ ...formValues, trainers: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  ✍️ អ្នកចុះហត្ថលេខាទាំង ៣ ជាន់ (Signatures):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>១. ធ្វើរបាយការណ៍ដោយ</label>
                    <input
                      type="text"
                      value={formValues.sig1Name}
                      onChange={(e) => setFormValues({ ...formValues, sig1Name: e.target.value })}
                      style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginBottom: '3px' }}
                    />
                    <input
                      type="text"
                      value={formValues.sig1Role}
                      onChange={(e) => setFormValues({ ...formValues, sig1Role: e.target.value })}
                      style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.72rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>២. ពិនិត្យដោយ</label>
                    <input
                      type="text"
                      value={formValues.sig2Name}
                      onChange={(e) => setFormValues({ ...formValues, sig2Name: e.target.value })}
                      style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginBottom: '3px' }}
                    />
                    <input
                      type="text"
                      value={formValues.sig2Role}
                      onChange={(e) => setFormValues({ ...formValues, sig2Role: e.target.value })}
                      style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.72rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>៣. អនុម័តដោយ</label>
                    <input
                      type="text"
                      value={formValues.sig3Name}
                      onChange={(e) => setFormValues({ ...formValues, sig3Name: e.target.value })}
                      style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginBottom: '3px' }}
                    />
                    <input
                      type="text"
                      value={formValues.sig3Role}
                      onChange={(e) => setFormValues({ ...formValues, sig3Role: e.target.value })}
                      style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.72rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  ✅ រក្សាទុក & អនុវត្ត
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
