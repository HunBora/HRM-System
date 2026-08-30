'use client';

import { useState } from 'react';
import { generatePayroll } from './actions';

type ModalState = 'IDLE' | 'CONFIRM' | 'LOADING' | 'SUCCESS' | 'ERROR';

export default function GeneratePayrollButton({
  month,
  year,
  text,
}: {
  month: number;
  year: number;
  text: string;
}) {
  const [modalState, setModalState] = useState<ModalState>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenConfirm = () => {
    setErrorMessage(null);
    setModalState('CONFIRM');
  };

  const handleGenerate = async () => {
    setModalState('LOADING');
    try {
      const res = await generatePayroll(month, year);
      if (res && !res.success) {
        setErrorMessage(res.error || 'គណនាប្រាក់ខែមិនជោគជ័យ សូមពិនិត្យមើលទិន្នន័យឡើងវិញ!');
        setModalState('ERROR');
      } else {
        setModalState('SUCCESS');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'ប្រព័ន្ធជួបបញ្ហាពេលគណនា (System Error)');
      setModalState('ERROR');
    }
  };

  const handleClose = () => {
    setModalState('IDLE');
    setErrorMessage(null);
  };

  return (
    <>
      <style jsx>{`
        @keyframes modalZoomIn {
          from {
            opacity: 0;
            transform: scale(0.94) translateY(-12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes spinSlow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes progressShimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(250%);
          }
        }
        @keyframes pulseGlow {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 14px rgba(16, 185, 129, 0);
          }
        }
      `}</style>

      {/* Trigger Button */}
      <button
        onClick={handleOpenConfirm}
        className="btn-primary kh-text"
        style={{
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        {text}
      </button>

      {/* Modal Dialog */}
      {modalState !== 'IDLE' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out forwards',
          }}
          onClick={(e) => {
            if (modalState === 'CONFIRM' || modalState === 'ERROR' || modalState === 'SUCCESS') {
              if (e.target === e.currentTarget) handleClose();
            }
          }}
        >
          <div
            className="card"
            style={{
              width: '480px',
              maxWidth: '95vw',
              backgroundColor: 'var(--bg-color)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              padding: '28px',
              border: '1px solid var(--border-color)',
              animation: 'modalZoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Accent Gradient Bar */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background:
                  modalState === 'SUCCESS'
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : modalState === 'ERROR'
                    ? 'linear-gradient(90deg, #ef4444, #f87171)'
                    : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
              }}
            />

            {/* 1. CONFIRM STATE */}
            {modalState === 'CONFIRM' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.25))',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.6rem',
                      flexShrink: 0,
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    💸
                  </div>
                  <div>
                    <h3 className="kh-text" style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-color)' }}>
                      បញ្ជាក់ការគណនាប្រាក់ខែ
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                      Generate Draft Payrolls Confirmation
                    </p>
                  </div>
                </div>

                {/* Info Card */}
                <div
                  style={{
                    backgroundColor: 'var(--surface-color)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px dashed var(--border-color)',
                    marginBottom: '18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span className="kh-text" style={{ fontSize: '0.9rem', color: '#64748b' }}>សម្រាប់កាលបរិច្ឆេទ (Period):</span>
                    <span className="kh-text" style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                      ខែ {month} ឆ្នាំ {year} ({month}/{year})
                    </span>
                  </div>
                  <p className="kh-text" style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.6, margin: 0 }}>
                    ប្រព័ន្ធនឹងទាញយកទិន្នន័យវត្តមាន (Attendance), ថែមម៉ោង (OT), ច្បាប់ឈប់សម្រាក និងប្រាក់បំពាក់បំប៉នផ្សេងៗពីមូលដ្ឋានទិន្នន័យ ដើម្បីគណនាប្រាក់បៀវត្សរ៍សម្រាប់បុគ្គលិកទាំងអស់។
                  </p>
                </div>

                {/* Alert Box */}
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '8px',
                    borderLeft: '4px solid #f59e0b',
                    marginBottom: '24px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                  <p className="kh-text" style={{ fontSize: '0.82rem', color: '#d97706', margin: 0, lineHeight: 1.5 }}>
                    <strong>ចំណាំ៖</strong> ប្រសិនបើមានទិន្នន័យប្រាក់ខែចាស់ក្នុងខែនេះ ប្រព័ន្ធនឹងធ្វើការគណនា និងអាប់ដេតទិន្នន័យថ្មីស្វ័យប្រវត្តិ។
                  </p>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
                  <button
                    onClick={handleClose}
                    className="btn-secondary kh-text"
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 500,
                      border: '1px solid var(--border-color)',
                      background: 'transparent',
                      color: 'var(--text-color)',
                      cursor: 'pointer',
                    }}
                  >
                    បោះបង់ (Cancel)
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="btn-primary kh-text"
                    style={{
                      padding: '10px 24px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    ⚡ យល់ព្រមគណនា (Generate Now)
                  </button>
                </div>
              </div>
            )}

            {/* 2. LOADING STATE */}
            {modalState === 'LOADING' && (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '70px', height: '70px', margin: '0 auto 24px auto' }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: '4px solid rgba(59, 130, 246, 0.2)',
                      borderTopColor: '#3b82f6',
                      borderRadius: '50%',
                      animation: 'spinSlow 1s linear infinite',
                    }}
                  />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.8rem' }}>
                    ⚡
                  </div>
                </div>

                <h3 className="kh-text" style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '10px', color: 'var(--text-color)' }}>
                  ⏳ កំពុងដំណើរការគណនាប្រាក់ខែ...
                </h3>
                <p className="kh-text" style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '24px', maxWidth: '380px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
                  សូមរង់ចាំបន្តិច ប្រព័ន្ធកំពុងគណនាប្រាក់បៀវត្សរ៍ ថែមម៉ោង និងកាត់កងផ្សេងៗសម្រាប់បុគ្គលិកទាំងអស់...
                </p>

                {/* Animated Progress Bar */}
                <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(59, 130, 246, 0.15)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: '40%',
                      background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6)',
                      borderRadius: '4px',
                      animation: 'progressShimmer 1.5s ease-in-out infinite',
                    }}
                  />
                </div>
              </div>
            )}

            {/* 3. SUCCESS STATE */}
            {modalState === 'SUCCESS' && (
              <div style={{ padding: '10px 0', textAlign: 'center' }}>
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    margin: '0 auto 20px auto',
                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
                    animation: 'pulseGlow 2s infinite',
                  }}
                >
                  ✓
                </div>

                <h3 className="kh-text" style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '10px', color: 'var(--text-color)' }}>
                  🎉 គណនាប្រាក់ខែជោគជ័យ!
                </h3>
                <p className="kh-text" style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>
                  ប្រាក់បៀវត្សរ៍សម្រាប់ <strong style={{ color: '#10b981' }}>ខែ {month}/{year}</strong> ត្រូវបានគណនា និងរក្សាទុកក្នុងបញ្ជីរួចរាល់ហើយ។ តារាងប្រាក់ខែត្រូវបានអាប់ដេត!
                </p>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <button
                    onClick={handleClose}
                    className="btn-primary kh-text"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    ✅ យល់ព្រម និងមើលតារាងប្រាក់ខែ (Done & View Payroll)
                  </button>
                </div>
              </div>
            )}

            {/* 4. ERROR STATE */}
            {modalState === 'ERROR' && (
              <div style={{ padding: '10px 0', textAlign: 'center' }}>
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    margin: '0 auto 20px auto',
                    boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)',
                  }}
                >
                  ✕
                </div>

                <h3 className="kh-text" style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '10px', color: '#ef4444' }}>
                  ⚠️ បរាជ័យក្នុងការគណនាប្រាក់ខែ
                </h3>
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    borderRadius: '8px',
                    padding: '14px',
                    border: '1px dashed rgba(239, 68, 68, 0.3)',
                    marginBottom: '24px',
                  }}
                >
                  <p className="kh-text" style={{ fontSize: '0.85rem', color: '#dc2626', margin: 0, lineHeight: 1.5 }}>
                    <strong>មូលហេតុ៖</strong> {errorMessage || 'មានបញ្ហាក្នុងការគណនា សូមព្យាយាមម្តងទៀត!'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
                  <button
                    onClick={handleClose}
                    className="btn-secondary kh-text"
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      fontWeight: 500,
                      border: '1px solid var(--border-color)',
                      background: 'transparent',
                      color: 'var(--text-color)',
                      cursor: 'pointer',
                    }}
                  >
                    បិទ (Close)
                  </button>
                  <button
                    onClick={handleOpenConfirm}
                    className="btn-primary kh-text"
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    🔄 ព្យាយាមម្តងទៀត (Try Again)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
