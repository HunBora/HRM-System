'use client';

import React, { useState } from 'react';

export default function FireDrillReportTab() {
  const [viewMode, setViewMode] = useState<'pages' | 'iframe'>('pages');

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
              SOP-TR-FIRE-2024
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
              📅 កាលបរិច្ឆេទ: <strong>23-11-2024 (14:00 - 16:00)</strong>
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: '4px' }}>
              ⏱️ រយៈពេលជម្លៀស: <strong>3 នាទី 25 វិនាទី</strong>
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: '4px' }}>
              👥 អ្នកចូលរួម: <strong>កម្មករនិយោជិតទាំងអស់ (55 នាក់)</strong>
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: '4px' }}>
              🏢 រោងចក្រ: <strong>Evergreen Sporting Goods (Cambodia)</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
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
              transition: 'background 0.2s',
            }}
          >
            📖 <span>បើកទម្រង់ពេញលេញ (Edit & Print)</span> ↗
          </a>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: '1px solid #334155',
              padding: '8px 16px',
              borderRadius: '7px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            🖨️ <span>បោះពុម្ព ៤ ទំព័រ (Print 4 Pages PDF)</span>
          </button>

          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'pages' ? 'iframe' : 'pages')}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#f8fafc',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {viewMode === 'pages' ? '🖥️ ទិដ្ឋភាព A4 Document' : '📋 ទិដ្ឋភាព Cards'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'iframe' ? (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ background: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
              📄 ផ្ទាំងមើលជាឯកសារដើម (Live Interactive Document Preview)
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
                14:00 - 14:45
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start' }}>
              <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.6 }}>
                <p style={{ marginBottom: '8px' }}>
                  លោក <strong>ចាន់ ភារម្យ</strong> (HRM) សហការជាមួយ <strong>ភ្នាក់ងារនគរបាលជំនាញបង្ការអគ្គិភ័យ នៃក្រសួងមហាផ្ទៃ</strong> បានបង្រៀនលើចំណុចសំខាន់ៗ ៤៖
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
                    src="/images/fire-drill/image_01.jpg"
                    alt="Classroom Session"
                    style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ position: 'absolute', bottom: '26px', right: '8px', background: 'rgba(0,0,0,0.7)', color: '#fbbf24', fontSize: '0.72rem', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace' }}>
                    23-11-2024
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
                វេលាម៉ោង 15:20
              </span>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.6, marginBottom: '10px' }}>
              នៅវេលាម៉ោង ១៥:២០ កណ្តឹងរោទិ៍អាសន្នបានបន្លឺឡើង។ កម្មករនិយោជិតទាំងអស់បានបិទម៉ាស៊ីន ផ្តាច់ចរន្ត និងដើរចេញតាមគន្លងផ្លូវសុវត្ថិភាពពណ៌លឿងប្រកបដោយរបៀបរៀបរយ។ មេក្រុមបានកាន់ស្លាកសម្គាល់ផ្នែក (Line 01, Line 02, Computer Line, ផ្នែកកាត់ដេរ 02) ដើម្បីដឹកនាំជួរជម្លៀស។
            </p>

            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', padding: '8px 14px', fontSize: '0.82rem', color: '#991b1b', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⏱️ រយៈពេលជម្លៀសខ្លួនសរុប (Total Evacuation Time):</span>
              <span style={{ background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                ៣ នាទី ២៥ វិនាទី (3m 25s)
              </span>
              <span style={{ color: '#166534', fontWeight: 600, fontSize: '0.78rem' }}>
                ✅ សម្រេចតាមស្តង់ដាសុវត្ថិភាព (ក្រោម 5 នាទី)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {[
                { img: '/images/fire-drill/image_03.jpg', title: 'កណ្ដឹងរោទិ៍ & ភ្លើងអាសន្ន' },
                { img: '/images/fire-drill/image_04.jpg', title: 'កម្មករចាប់ផ្តើមជម្លៀស' },
                { img: '/images/fire-drill/image_05.jpg', title: 'ដើរតាមគន្លងផ្លូវពណ៌លឿង' },
                { img: '/images/fire-drill/image_06.jpg', title: 'ការជម្លៀសប្រកបដោយរបៀបរៀបរយ' },
                { img: '/images/fire-drill/image_07.jpg', title: 'មេក្រុមលើកស្លាក Computer Line' },
                { img: '/images/fire-drill/image_08.jpg', title: 'មេក្រុមផ្នែកកាត់ដេរ Line 02' },
              ].map((item, idx) => (
                <div key={idx} style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <img src={item.img} alt={item.title} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
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
                15:25 - 15:45
              </span>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.6, marginBottom: '10px' }}>
              នៅកន្លែងជួបជុំ (Emergency Assembly Point): កម្មករនិយោជិតទាំងអស់បានប្រមូលផ្តុំយ៉ាងរហ័ស។ ប្រធានក្រុមនីមួយៗបានរាប់ចំនួនមនុស្ស (Headcount & Roll Call) គ្រប់ចំនួន ១០០% គ្មានអ្នកបាត់ខ្លួន។ បន្ទាប់មក ភ្នាក់ងារនគរបាលបានណែនាំពីរបៀបបើកទូពន្លត់អគ្គិភ័យ និងការតភ្ជាប់ទុយោបាញ់ទឹកសម្ពាធខ្ពស់ជាក់ស្តែង។
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {[
                { img: '/images/fire-drill/image_09.jpg', title: 'ស្លាកសញ្ញាកន្លែងជួបជុំពេលមានអាសន្ន' },
                { img: '/images/fire-drill/image_10.jpg', title: 'ណែនាំទូពន្លត់អគ្គិភ័យ (Hydrant)' },
                { img: '/images/fire-drill/image_13.jpg', title: 'ហ្វឹកហាត់កាន់ទុយោទឹកសម្ពាធខ្ពស់' },
                { img: '/images/fire-drill/image_15.jpg', title: 'ការបាញ់ទឹកពន្លត់ជាក់ស្តែង' },
                { img: '/images/fire-drill/image_17.jpg', title: 'កម្មករនិយោជិតតម្រៀបជួររាប់ចំនួន' },
                { img: '/images/fire-drill/image_19.jpg', title: 'ដុតភ្លើងពិសោធន៍ក្នុងធុងដែក' },
              ].map((item, idx) => (
                <div key={idx} style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <img src={item.img} alt={item.title} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
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
                15:45 - 16:00
              </span>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.6, marginBottom: '10px' }}>
              តំណាងកម្មករនិយោជិត និងសមាជិកក្រុមសង្គ្រោះបឋមបានអនុវត្តបាញ់ពន្លត់ភ្លើងជាក់ស្តែងក្នុងធុងពិសោធន៍ដោយប្រើបំពង់ពន្លត់អគ្គិភ័យប្រភេទ ABC Dry Chemical Powder តាមគោលការណ៍ <strong>P.A.S.S (Pull, Aim, Squeeze, Sweep)</strong> ដោយជោគជ័យ។ វគ្គហាត់សមបានបញ្ចប់សព្វគ្រប់នៅវេលាម៉ោង ១៦:០០ នាទី។
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                <img src="/images/fire-drill/image_25.jpg" alt="Extinguisher Drill 1" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                <div style={{ padding: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#334155', textAlign: 'center', background: '#f8fafc' }}>
                  រូបភាពទី ១៤៖ កម្មករនិយោជិតដកគន្លឹះ និងតម្រង់ក្បាលបាញ់
                </div>
              </div>
              <div style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                <img src="/images/fire-drill/image_26.jpg" alt="Extinguisher Drill 2" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
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
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>ភឿក លីដា (Pheuk Lyda)</div>
                  <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>Compliance Officer</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ពិនិត្យដោយ / Checked by</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>ចាន់ ភារម្យ (Chan Phearum)</div>
                  <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700 }}>Admin / HR / CSR Manager</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>អនុម័តដោយ / Approved by</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>CHEN LANMAO</div>
                  <div style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 700 }}>General Manager</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
