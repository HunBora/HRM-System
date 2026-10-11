'use client'

import { useState } from 'react';
import Swal from 'sweetalert2';
import { updateSettings, testTelegramBotAction } from './actions';
import Image from 'next/image';

export default function SettingsForm({ settings }: { settings: any }) {
  const [loading, setLoading] = useState(false);
  const [testingBot, setTestingBot] = useState(false);
  const [preview, setPreview] = useState<string | null>(settings?.logoUrl || null);

  const handleTestTelegram = async () => {
    const tokenInput = document.querySelector('input[name="telegramBotToken"]') as HTMLInputElement;
    const chatInput = document.querySelector('input[name="telegramChatId"]') as HTMLInputElement;
    const token = tokenInput ? tokenInput.value.trim() : '';
    const chatId = chatInput ? chatInput.value.trim() : '';

    if (!token || !chatId) {
      Swal.fire({
        icon: 'warning',
        title: 'ទិន្នន័យមិនទាន់គ្រប់គ្រាន់',
        text: 'សូមបញ្ចូល Telegram Bot Token និង Chat ID ជាមុនសិន! (Please fill Bot Token & Chat ID)',
      });
      return;
    }

    setTestingBot(true);
    try {
      const res = await testTelegramBotAction(token, chatId);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'តភ្ជាប់ជោគជ័យ! (Success)',
          text: res.message,
          confirmButtonColor: '#10b981',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'តភ្ជាប់មិនបានសម្រេច (Failed)',
          text: res.message,
          confirmButtonColor: '#ef4444',
        });
      }
    } catch (e: any) {
      Swal.fire({
        icon: 'error',
        title: 'កំហុសបច្ចេកទេស',
        text: e.message || 'Error testing bot',
      });
    } finally {
      setTestingBot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await updateSettings(formData);
    setLoading(false);
    Swal.fire({
      icon: 'success',
      title: 'ជោគជ័យ!',
      text: 'រក្សាទុកការកំណត់បានជោគជ័យ! (Settings saved successfully)',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>ឈ្មោះក្រុមហ៊ុន (Company Name)</label>
        <input 
          type="text" 
          name="companyName" 
          defaultValue={settings?.companyName || 'HRM System'}
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '1rem' }}
          required
        />
      </div>

      <div>
        <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>និមិត្តសញ្ញាក្រុមហ៊ុន (Company Logo)</label>
        {preview && (
          <div style={{ marginBottom: '10px', width: '150px', height: '150px', position: 'relative', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
             <Image src={preview} alt="Logo Preview" fill style={{ objectFit: 'contain' }} />
          </div>
        )}
        <input 
          type="file" 
          name="logo" 
          accept="image/*"
          onChange={handleImageChange}
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
        />
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <h3 className="kh-text" style={{ marginBottom: '15px' }}>កំណត់ម៉ោងវេនថ្ងៃ (Day Shift Settings)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label className="kh-text" style={{ fontSize: '0.9rem' }}>ម៉ោងចូលព្រឹក (Morning In)</label>
            <input type="time" name="shiftMornIn" defaultValue={settings?.shiftMornIn || '07:00'} style={{ width: '100%', padding: '8px' }} required />
          </div>
          <div>
            <label className="kh-text" style={{ fontSize: '0.9rem' }}>ម៉ោងចេញព្រឹក (Morning Out)</label>
            <input type="time" name="shiftMornOut" defaultValue={settings?.shiftMornOut || '11:00'} style={{ width: '100%', padding: '8px' }} required />
          </div>
          <div>
            <label className="kh-text" style={{ fontSize: '0.9rem' }}>ម៉ោងចូលល្ងាច (Afternoon In)</label>
            <input type="time" name="shiftAftIn" defaultValue={settings?.shiftAftIn || '13:00'} style={{ width: '100%', padding: '8px' }} required />
          </div>
          <div>
            <label className="kh-text" style={{ fontSize: '0.9rem' }}>ម៉ោងចេញល្ងាច (Afternoon Out)</label>
            <input type="time" name="shiftAftOut" defaultValue={settings?.shiftAftOut || '17:00'} style={{ width: '100%', padding: '8px' }} required />
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <h3 className="kh-text" style={{ marginBottom: '15px' }}>កំណត់ម៉ោងវេនយប់ (Night Shift Settings)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label className="kh-text" style={{ fontSize: '0.9rem' }}>ម៉ោងចូលយប់ (Night In)</label>
            <input type="time" name="nightShiftMornIn" defaultValue={settings?.nightShiftMornIn || '17:00'} style={{ width: '100%', padding: '8px' }} required />
          </div>
          <div>
            <label className="kh-text" style={{ fontSize: '0.9rem' }}>ម៉ោងចេញយប់ (Night Out)</label>
            <input type="time" name="nightShiftMornOut" defaultValue={settings?.nightShiftMornOut || '22:00'} style={{ width: '100%', padding: '8px' }} required />
          </div>
          <div>
            <label className="kh-text" style={{ fontSize: '0.9rem' }}>ម៉ោងចូលយប់ជ្រៅ (Late Night In)</label>
            <input type="time" name="nightShiftAftIn" defaultValue={settings?.nightShiftAftIn || '23:00'} style={{ width: '100%', padding: '8px' }} required />
          </div>
          <div>
            <label className="kh-text" style={{ fontSize: '0.9rem' }}>ម៉ោងចេញព្រឹកព្រលឹម (Morning Out)</label>
            <input type="time" name="nightShiftAftOut" defaultValue={settings?.nightShiftAftOut || '04:00'} style={{ width: '100%', padding: '8px' }} required />
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <h3 className="kh-text" style={{ marginBottom: '15px' }}>ម៉ោងចាប់ផ្តើមថែមម៉ោងយប់ (Night OT Start)</h3>
        <div>
           <label className="kh-text" style={{ fontSize: '0.9rem' }}>ម៉ោងចាប់ផ្តើម Night OT (ឧទាហរណ៍ 22:00)</label>
           <input type="time" name="nightOtStart" defaultValue={settings?.nightOtStart || '22:00'} style={{ width: '50%', padding: '8px', display: 'block' }} required />
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <h3 className="kh-text" style={{ marginBottom: '15px' }}>ការភ្ជាប់ Telegram Bot (Telegram Integration)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label className="kh-text" style={{ fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>Telegram Bot Token (ឧទាហរណ៍: 123456:ABC-DEF1234...)</label>
            <input 
              type="text" 
              name="telegramBotToken" 
              defaultValue={settings?.telegramBotToken || ''} 
              style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} 
              placeholder="វាយបញ្ចូល Bot Token..."
            />
          </div>
          <div>
            <label className="kh-text" style={{ fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>Telegram Chat ID (ឧទាហរណ៍: -100123456789)</label>
            <input 
              type="text" 
              name="telegramChatId" 
              id="telegramChatId"
              defaultValue={settings?.telegramChatId || ''} 
              style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} 
              placeholder="វាយបញ្ចូល Chat ID គោលដៅ..."
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
            <button
              type="button"
              disabled={testingBot}
              onClick={handleTestTelegram}
              className="btn-secondary kh-text"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.88rem',
                cursor: testingBot ? 'not-allowed' : 'pointer',
                opacity: testingBot ? 0.7 : 1,
              }}
            >
              <span>{testingBot ? 'កំពុងសាកល្បង...' : '⚡ សាកល្បងតភ្ជាប់ (Test Connection)'}</span>
            </button>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              ចុចដើម្បីផ្ញើសារសាកល្បង (Test Ping) ទៅកាន់ Telegram Chat ID ខាងលើ
            </span>
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary kh-text" disabled={loading} style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
        {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក (Save Settings)'}
      </button>
    </form>
  );
}
