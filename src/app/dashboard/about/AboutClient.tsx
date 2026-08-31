'use client';

import React, { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import { updateAboutSettings } from './actions';

export default function AboutClient({ settings, isAdmin }: { settings: any, isAdmin: boolean }) {
  const [phone, setPhone] = useState(settings?.contactPhone || '');
  const [tgLink, setTgLink] = useState(settings?.telegramLink || '');
  const [qrBase64, setQrBase64] = useState(settings?.telegramQrUrl || '');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setQrBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateAboutSettings({
        contactPhone: phone,
        telegramLink: tgLink,
        telegramQrUrl: qrBase64,
      });
      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ!',
        text: 'រក្សាទុកបានជោគជ័យ! (Saved successfully)',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'បរាជ័យ!',
        text: 'មានបញ្ហាក្នុងការរក្សាទុក (Error saving)',
        confirmButtonColor: '#ef4444'
      });
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h1 className="kh-text" style={{ fontSize: '1.8rem', color: '#1e3a8a', margin: 0 }}>
          អំពីប្រព័ន្ធ និងទំនាក់ទំនង (About & Contact)
        </h1>
        {isAdmin && (
          <button 
            onClick={handleSave} 
            disabled={loading}
            style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            className="kh-text"
          >
            {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក (Save)'}
          </button>
        )}
      </div>
      <p className="kh-text" style={{ color: '#64748b', marginBottom: '30px', fontSize: '1rem' }}>
        ព័ត៌មានលម្អិតអំពីប្រព័ន្ធគ្រប់គ្រងធនធានមនុស្ស និងការទំនាក់ទំនងមកកាន់ផ្នែករដ្ឋបាល (HR)។
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Contact Info Card */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h2 className="kh-text" style={{ fontSize: '1.3rem', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📞</span> ផ្នែកទំនាក់ទំនង (Contact Info)
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontSize: '1.2rem' }}>
                📱
              </div>
              <div style={{ flex: 1 }}>
                <div className="kh-text" style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>លេខទូរស័ព្ទ (Phone)</div>
                {isAdmin ? (
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="បញ្ចូលលេខទូរស័ព្ទ" 
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
                  />
                ) : (
                  <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#1e293b' }}>
                    {phone || 'មិនទាន់មានទេ'}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontSize: '1.2rem' }}>
                ✈️
              </div>
              <div style={{ flex: 1 }}>
                <div className="kh-text" style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>តេឡេក្រាម (Telegram)</div>
                {isAdmin ? (
                  <input 
                    type="text" 
                    value={tgLink} 
                    onChange={(e) => setTgLink(e.target.value)} 
                    placeholder="Link តេឡេក្រាម (https://t.me/...)" 
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
                  />
                ) : (
                  tgLink ? (
                    <a href={tgLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '1.1rem', fontWeight: '500', color: '#2563eb', textDecoration: 'none' }}>
                      ចុចទីនេះដើម្បីឆាត (Click to chat)
                    </a>
                  ) : (
                    <div className="kh-text" style={{ fontSize: '1rem', color: '#94a3b8' }}>មិនទាន់មាន Link ទេ</div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Card */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 className="kh-text" style={{ fontSize: '1.3rem', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', justifyContent: 'center' }}>
            <span>📷</span> Telegram QR Code
          </h2>
          
          <div 
            onClick={() => isAdmin && fileInputRef.current?.click()}
            style={{ 
              width: '200px', 
              height: '200px', 
              backgroundColor: '#f8fafc', 
              borderRadius: '12px', 
              border: '2px dashed #cbd5e1', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              overflow: 'hidden', 
              position: 'relative',
              cursor: isAdmin ? 'pointer' : 'default'
            }}
          >
            {qrBase64 ? (
              <>
                <img src={qrBase64} alt="Telegram QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                {isAdmin && (
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.75rem', textAlign: 'center', padding: '4px 0' }}>
                    ចុចដើម្បីប្តូរ (Click to change)
                  </div>
                )}
              </>
            ) : (
              <div className="kh-text" style={{ color: '#94a3b8', textAlign: 'center', fontSize: '0.9rem', padding: '20px' }}>
                មិនទាន់មាន QR Code ទេ<br/>
                {isAdmin && <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>(ចុចទីនេះដើម្បី Upload)</span>}
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleQrUpload} 
              style={{ display: 'none' }} 
            />
          </div>
          <p className="kh-text" style={{ marginTop: '15px', color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>
            សូមស្កេន QR នេះដើម្បីទំនាក់ទំនងមកកាន់ផ្នែក HR
          </p>
        </div>

      </div>
    </div>
  );
}
