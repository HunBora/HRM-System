'use client'

import { QRCodeSVG } from 'qrcode.react';

export default function IDCardClient({ employee, companyName }: { employee: any, companyName: string }) {
  
  const qrValue = `ID: ${employee.employeeId}\nName: ${employee.firstNameEn} ${employee.lastNameEn}\nPhone: ${employee.phone || 'N/A'}\nPosition: ${employee.position}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      
      <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button className="btn-primary" onClick={() => window.print()}>🖨️ Print ID Card</button>
        <button className="btn-secondary" onClick={() => window.history.back()}>Back</button>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #id-card-container, #id-card-container * {
            visibility: visible;
          }
          #id-card-container {
            position: absolute;
            left: 0;
            top: 0;
            display: flex !important;
            flex-direction: row !important;
            gap: 20px !important;
            justify-content: flex-start !important;
          }
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}</style>

      <div id="id-card-container" style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
        
        {/* FRONT SIDE */}
        <div style={{
          width: '54mm',
          height: '86mm',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e2e8f0'
        }}>
          {/* Top Blue Wave Background */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '35%',
            backgroundColor: '#0a192f',
            borderBottomLeftRadius: '50% 20%',
            borderBottomRightRadius: '50% 20%',
            borderBottom: '4px solid #ef4444',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '15px'
          }}>
            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', textAlign: 'center', letterSpacing: '1px', marginBottom: '15px' }}>
              {companyName.toUpperCase()}
            </div>
          </div>
          
          {/* Photo */}
          <div style={{
            position: 'absolute',
            top: '18%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '24mm',
            height: '24mm',
            borderRadius: '50%',
            border: '3px solid white',
            boxShadow: '0 0 0 2px #ef4444',
            backgroundColor: '#e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}>
            {employee.photoUrl ? (
              <img src={employee.photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            ) : (
              <span style={{ fontSize: '24px', color: '#64748b' }}>👤</span>
            )}
          </div>

          {/* Details Section */}
          <div style={{ marginTop: '42mm', padding: '0 10px', textAlign: 'left', zIndex: 1, fontSize: '8px', color: '#334155', lineHeight: '1.4' }} className="kh-text">
            
            <div style={{ display: 'flex', marginBottom: '2px' }}>
              <div style={{ width: '35%', fontWeight: 600 }}>ID no</div>
              <div style={{ width: '5%' }}>:</div>
              <div style={{ width: '60%' }}>{employee.employeeId}</div>
            </div>

            <div style={{ display: 'flex', marginBottom: '2px' }}>
              <div style={{ width: '35%', fontWeight: 600 }}>Name</div>
              <div style={{ width: '5%' }}>:</div>
              <div style={{ width: '60%' }}>{employee.firstNameEn} {employee.lastNameEn}</div>
            </div>

            <div style={{ display: 'flex', marginBottom: '2px' }}>
              <div style={{ width: '35%', fontWeight: 600 }}>Date of Birth</div>
              <div style={{ width: '5%' }}>:</div>
              <div style={{ width: '60%' }}>{employee.dob ? new Date(employee.dob).toLocaleDateString('en-GB') : 'N/A'}</div>
            </div>

            <div style={{ display: 'flex', marginBottom: '2px' }}>
              <div style={{ width: '35%', fontWeight: 600 }}>Position</div>
              <div style={{ width: '5%' }}>:</div>
              <div style={{ width: '60%', color: '#ef4444', fontWeight: 'bold' }}>{employee.position}</div>
            </div>

            <div style={{ display: 'flex', marginBottom: '2px' }}>
              <div style={{ width: '35%', fontWeight: 600 }}>Hire date</div>
              <div style={{ width: '5%' }}>:</div>
              <div style={{ width: '60%' }}>{new Date(employee.hireDate).toLocaleDateString('en-GB')}</div>
            </div>

          </div>

          {/* Bottom Wave */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '10px',
            backgroundColor: '#0a192f',
            borderTop: '2px solid #ef4444'
          }}></div>
        </div>


        {/* BACK SIDE */}
        <div style={{
          width: '54mm',
          height: '86mm',
          backgroundColor: '#f8fafc',
          borderRadius: '10px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e2e8f0',
          padding: '10px'
        }}>
          {/* Top Wave */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '15px',
            backgroundColor: '#0a192f',
            borderBottom: '2px solid #ef4444'
          }}></div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '11px', color: '#0a192f', margin: '0 0 5px 0' }}>TERMS AND CONDITIONS</h3>
            <p style={{ fontSize: '7px', color: '#64748b', margin: '0 0 10px 0', padding: '0 5px' }}>
              This card is the property of the company. If found, please return to the company office.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
            <div style={{ border: '2px solid #0a192f', padding: '2px', borderRadius: '4px', backgroundColor: 'white' }}>
              <QRCodeSVG value={qrValue} size={60} level="M" />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 'auto', marginBottom: '20px' }}>
             <div style={{ width: '40px', borderBottom: '1px solid #0a192f', margin: '0 auto 5px auto' }}></div>
             <p style={{ fontSize: '8px', color: '#0a192f', margin: 0 }}>Authorized Signature</p>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
             <h4 style={{ fontSize: '12px', color: '#0a192f', margin: 0, letterSpacing: '0.5px' }}>{companyName.toUpperCase()}</h4>
          </div>

          {/* Bottom Wave */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '10px',
            backgroundColor: '#0a192f',
            borderTop: '2px solid #ef4444'
          }}></div>
        </div>

      </div>
    </div>
  );
}
