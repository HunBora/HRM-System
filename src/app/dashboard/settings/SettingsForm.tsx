'use client'

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  updateSettings,
  testTelegramBotAction,
  setupTelegramWebhookAction,
  getTelegramWebhookInfoAction,
  sendDailySummaryAction,
} from './actions';
import Image from 'next/image';
import { SIDEBAR_THEMES, SidebarThemeId } from '@/components/ResizableSidebar';
import GpsLocationPickerMap from '@/components/GpsLocationPickerMap';

export default function SettingsForm({ settings }: { settings: any }) {
  const [loading, setLoading] = useState(false);
  const [testingBot, setTestingBot] = useState(false);
  const [preview, setPreview] = useState<string | null>(settings?.logoUrl || null);
  const [currentThemeId, setCurrentThemeId] = useState<SidebarThemeId>('dark');
  const [rateValue, setRateValue] = useState<number>(settings?.exchangeRate || 4000);
  const [companyLat, setCompanyLat] = useState<number>(settings?.companyLat ?? 11.5564);
  const [companyLng, setCompanyLng] = useState<number>(settings?.companyLng ?? 104.9282);
  const [geoRadiusMeters, setGeoRadiusMeters] = useState<number>(settings?.geoRadiusMeters ?? 500);
  const [geoFenceEnabled, setGeoFenceEnabled] = useState<boolean>(settings?.geoFenceEnabled !== false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_theme_v2') as SidebarThemeId;
    if (saved && SIDEBAR_THEMES[saved]) {
      setCurrentThemeId(saved);
    }
    const handleSync = () => {
      const s = localStorage.getItem('sidebar_theme_v2') as SidebarThemeId;
      if (s && SIDEBAR_THEMES[s]) setCurrentThemeId(s);
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('sidebar-theme-changed', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('sidebar-theme-changed', handleSync);
    };
  }, []);

  const handlePickTheme = (tId: SidebarThemeId) => {
    setCurrentThemeId(tId);
    localStorage.setItem('sidebar_theme_v2', tId);
    window.dispatchEvent(new Event('sidebar-theme-changed'));
  };

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

  const [settingUpWebhook, setSettingUpWebhook] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [checkingWebhook, setCheckingWebhook] = useState(false);

  const handleSetupWebhook = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const defaultWebhook = `${origin}/api/telegram/webhook`;

    const { value: customUrl } = await Swal.fire({
      title: '🔗 កំណត់ Bot Webhook (1-Click Approvals)',
      input: 'text',
      inputLabel: 'សូមផ្ទៀងផ្ទាត់ Webhook URL (ត្រូវតែជា HTTPS លើ Vercel ឬ Public Domain):',
      inputValue: defaultWebhook,
      showCancelButton: true,
      confirmButtonText: '🚀 បញ្ជូនទៅ Telegram',
      cancelButtonText: 'បោះបង់',
      confirmButtonColor: '#0284c7',
      inputValidator: (val) => {
        if (!val || !val.startsWith('https://')) {
          return 'Webhook URL ត្រូវតែចាប់ផ្តើមដោយ https:// តាមស្តង់ដារ Telegram!';
        }
        return null;
      }
    });

    if (!customUrl) return;

    setSettingUpWebhook(true);
    try {
      const res = await setupTelegramWebhookAction(customUrl);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'ជោគជ័យ (Webhook Connected)!',
          text: res.message,
          confirmButtonColor: '#10b981',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'បរាជ័យ (Failed)',
          text: res.message,
          confirmButtonColor: '#ef4444',
        });
      }
    } catch (e: any) {
      Swal.fire({
        icon: 'error',
        title: 'កំហុសបច្ចេកទេស',
        text: e.message || 'Error setting up webhook',
      });
    } finally {
      setSettingUpWebhook(false);
    }
  };

  const handleCheckWebhook = async () => {
    setCheckingWebhook(true);
    try {
      const res = await getTelegramWebhookInfoAction();
      if (res.success) {
        const d = res.data || {};
        Swal.fire({
          icon: 'info',
          title: 'ស្ថានភាព Webhook (Webhook Status)',
          html: `
            <div style="text-align: left; font-size: 0.85rem; line-height: 1.6;">
              <p><b>URL:</b> ${d.url ? `<code style="color:#0284c7">${d.url}</code>` : '<span style="color:#ef4444">មិនទាន់កំណត់ (Not set)</span>'}</p>
              <p><b>Custom Certificate:</b> ${d.has_custom_certificate ? 'បាទ/ចាស' : 'ទេ'}</p>
              <p><b>Pending Updates:</b> ${d.pending_update_count || 0}</p>
              ${d.last_error_message ? `<p style="color:#ef4444"><b>កំហុសចុងក្រោយ:</b> ${d.last_error_message}</p>` : '<p style="color:#10b981"><b>កំហុស:</b> គ្មាន (No Errors)</p>'}
              ${d.last_error_date ? `<p><b>កាលបរិច្ឆេទកំហុស:</b> ${new Date(d.last_error_date * 1000).toLocaleString('km-KH')}</p>` : ''}
            </div>
          `,
          confirmButtonColor: '#0284c7',
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'មិនអាចទាញយកព័ត៌មានបាន',
          text: res.message,
        });
      }
    } catch (e: any) {
      Swal.fire({
        icon: 'error',
        title: 'កំហុសបច្ចេកទេស',
        text: e.message || 'Error checking webhook',
      });
    } finally {
      setCheckingWebhook(false);
    }
  };

  const handleSendDailySummary = async () => {
    setSendingSummary(true);
    try {
      const res = await sendDailySummaryAction();
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'ផ្ញើបានជោគជ័យ!',
          text: res.message,
          confirmButtonColor: '#10b981',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'បរាជ័យក្នុងការផ្ញើ',
          text: res.message,
          confirmButtonColor: '#ef4444',
        });
      }
    } catch (e: any) {
      Swal.fire({
        icon: 'error',
        title: 'កំហុសបច្ចេកទេស',
        text: e.message || 'Error sending summary',
      });
    } finally {
      setSendingSummary(false);
    }
  };

  const [fetchingCurrentLocation, setFetchingCurrentLocation] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire({ icon: 'warning', title: 'មិនគាំទ្រ Geolocation', text: 'Browser របស់អ្នកមិនគាំទ្រ GPS ទេ' });
      return;
    }
    setFetchingCurrentLocation(true);

    let bestReading: { lat: number; lng: number; accuracy: number } | null = null;
    let ticks = 0;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const cLat = pos.coords.latitude;
        const cLng = pos.coords.longitude;
        const cAcc = Math.round(pos.coords.accuracy);

        if (!bestReading || cAcc < bestReading.accuracy) {
          bestReading = { lat: cLat, lng: cLng, accuracy: cAcc };
        }

        if (cAcc <= 15) {
          navigator.geolocation.clearWatch(watchId);
          applyFix(bestReading);
        }
      },
      (err) => {
        console.warn('GPS error:', err);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    const timer = setInterval(() => {
      ticks += 1;
      if (ticks >= 4 || (bestReading && bestReading.accuracy <= 15)) {
        clearInterval(timer);
        navigator.geolocation.clearWatch(watchId);
        if (bestReading) {
          applyFix(bestReading);
        } else {
          setFetchingCurrentLocation(false);
          Swal.fire({
            icon: 'error',
            title: 'មិនអាចចាប់យកទីតាំងបានទេ',
            text: 'សូមចុច Allow Permission លើ Browser ដើម្បីចាប់យក GPS',
          });
        }
      }
    }, 1000);

    const applyFix = (fix: { lat: number; lng: number; accuracy: number }) => {
      setFetchingCurrentLocation(false);
      const roundedLat = Number(fix.lat.toFixed(6));
      const roundedLng = Number(fix.lng.toFixed(6));
      setCompanyLat(roundedLat);
      setCompanyLng(roundedLng);

      Swal.fire({
        icon: 'success',
        title: 'ចាប់យកទីតាំង Device ជោគជ័យ!',
        html: `
          <div style="font-size: 0.88rem; text-align: left; line-height: 1.6;">
            <div>📍 <b>Latitude:</b> ${roundedLat}</div>
            <div>📍 <b>Longitude:</b> ${roundedLng}</div>
            <div>🎯 <b>ភាពសុក្រិត (Accuracy):</b> ±${fix.accuracy} ម៉ែត្រ ${fix.accuracy <= 25 ? '⭐ (ខ្ពស់បំផុត ១០០%)' : '(តាម Wi-Fi/IP)'}</div>
            ${fix.accuracy > 25 ? '<div style="color: #b45309; margin-top: 6px; font-size: 0.8rem;">💡 អ្នកអាចអូស Pin ក្រហមលើផែនទី ឬ Paste កូអរដោនេពី Google Maps ដើម្បីដាក់ឱ្យចំរោងចក្រ ១០០%!</div>' : ''}
          </div>
        `,
        confirmButtonColor: '#10b981',
      });
    };
  };

  const handleViewGoogleMaps = () => {
    window.open(`https://maps.google.com/?q=${companyLat},${companyLng}`, '_blank');
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

      {/* ស្បែកពណ៌ Sidebar (Sidebar Glassmorphism Theme) */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 className="kh-text" style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎨</span> រូបរាង & ស្បែកពណ៌ Sidebar (Sidebar Theme & Glassmorphism)
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              ជ្រើសរើសពណ៌ផ្ទៃខាងក្រោយ និងពន្លឺកញ្ចក់ Glassmorphism សម្រាប់ផ្ទាំងចំហៀង (Sidebar) របស់អ្នក
            </p>
          </div>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: '20px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: '#2563eb',
            border: '1px solid rgba(59, 130, 246, 0.25)',
          }}>
            {SIDEBAR_THEMES[currentThemeId]?.nameKh} ({SIDEBAR_THEMES[currentThemeId]?.nameEn})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {Object.values(SIDEBAR_THEMES).map((th) => {
            const isSelected = th.id === currentThemeId;
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => handlePickTheme(th.id)}
                title={`${th.nameKh} (${th.nameEn})`}
                aria-label={`${th.nameKh} (${th.nameEn})`}
                style={{
                  position: 'relative',
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid #2563eb' : '1px solid var(--border-color)',
                  background: th.bgColor,
                  backgroundImage: th.bgImage,
                  color: th.textColor,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  boxShadow: isSelected
                    ? '0 0 0 3px rgba(37, 99, 235, 0.25), 0 4px 12px rgba(0,0,0,0.2)'
                    : '0 2px 6px rgba(0,0,0,0.05)',
                  transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.18s ease',
                  padding: 0,
                  outline: 'none',
                }}
              >
                <span>{th.icon}</span>
                {isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                      border: '2px solid #ffffff',
                    }}
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* អត្រាប្តូរប្រាក់ទីផ្សារ (Market Exchange Rate: USD ➔ KHR) */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 className="kh-text" style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💱</span> អត្រាប្តូរប្រាក់ទីផ្សារ (Market Exchange Rate: USD ➔ KHR)
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              កំណត់អត្រាប្តូរប្រាក់ទីផ្សារជាក់ស្តែង (1$ = ? ៛)។ អត្រានេះនឹងត្រូវយកទៅគណនាប្រាក់ខែជាប្រាក់រៀល (Net Salary Riel) ដោយស្វ័យប្រវត្តិក្នងតារាង Payroll ទាំងអស់។
            </p>
          </div>
          <span style={{
            fontSize: '0.88rem',
            fontWeight: 800,
            padding: '4px 14px',
            borderRadius: '20px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            color: '#059669',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}>
            1 USD = {rateValue.toLocaleString()} ៛
          </span>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <label className="kh-text" style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              តម្លៃប្តូរប្រាក់ (Exchange Rate ក្នុង 1$)
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                name="exchangeRate"
                value={rateValue}
                onChange={(e) => setRateValue(parseFloat(e.target.value) || 0)}
                step="1"
                min="1000"
                max="10000"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '2px solid #10b981',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  outline: 'none',
                }}
                required
              />
              <span style={{ marginLeft: '-42px', fontWeight: 800, color: '#10b981', fontSize: '1rem', pointerEvents: 'none' }}>
                ៛
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>ជ្រើសរើសអត្រារហ័ស (Quick Presets)៖</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[4000, 4050, 4100, 4120, 4150].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRateValue(preset)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: rateValue === preset ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                    backgroundColor: rateValue === preset ? '#d1fae5' : 'var(--surface-color)',
                    color: rateValue === preset ? '#065f46' : '#334155',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {preset.toLocaleString()} ៛
                </button>
              ))}
            </div>
          </div>
        </div>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⏱️</span> កំណត់ការគិតថែមម៉ោងអូតូ (Auto Overtime Settings)
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              កំណត់លក្ខខណ្ឌម៉ោងចេញលើសកំណត់វេនធ្វើការ (ឧ. លើសពី 60 នាទី / 1 ម៉ោង) ដើម្បីប្រព័ន្ធគិត OT ដោយស្វ័យប្រវត្តិតាមតម្រូវការរោងចក្រ/ក្រុមហ៊ុន។
            </p>
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-secondary, #f8fafc)', padding: '6px 14px', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)' }}>
            <input
              type="checkbox"
              name="autoOtEnabled"
              value="true"
              defaultChecked={settings?.autoOtEnabled !== false}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span className="kh-text" style={{ fontSize: '0.88rem', fontWeight: 700 }}>
              បើកគិតថែមម៉ោងអូតូ (Auto-OT)
            </span>
          </label>
        </div>

        <div style={{ background: 'var(--bg-secondary, #f8fafc)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'center' }}>
            <div>
              <label className="kh-text" style={{ fontSize: '0.88rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                លក្ខខណ្ឌលើសម៉ោងចេញដើម្បីចាប់ផ្តើមគិតថែមម៉ោង (គិតជានាទី / Minutes Threshold)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  name="autoOtThresholdMinutes"
                  id="autoOtThresholdInput"
                  defaultValue={settings?.autoOtThresholdMinutes ?? 60}
                  min={1}
                  max={300}
                  step={5}
                  style={{
                    width: '120px',
                    height: '42px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '1rem',
                    fontWeight: 700,
                  }}
                  required
                />
                <span className="kh-text" style={{ fontSize: '0.85rem', color: '#64748b' }}>នាទី (ឧ. 60 = 1 ម៉ោង)</span>
              </div>
            </div>

            <div>
              <label className="kh-text" style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                កំណត់រហ័ស (Presets)៖
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: '30 នាទី', val: 30 },
                  { label: '60 នាទី (1 ម៉ោង)', val: 60 },
                  { label: '90 នាទី (1.5 ម៉ោង)', val: 90 },
                  { label: '120 នាទី (2 ម៉ោង)', val: 120 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('autoOtThresholdInput') as HTMLInputElement | null;
                      if (input) input.value = preset.val.toString();
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', borderLeft: '4px solid #3b82f6', fontSize: '0.82rem', color: '#1e40af' }} className="kh-text">
            💡 <b>របៀបគិត៖</b> ប្រសិនបើម៉ោងចេញវេនល្ងាចគឺ <b>{settings?.shiftAftOut || '17:00'}</b> ហើយកំណត់លើសពី <b>60 នាទី</b> នោះបុគ្គលិកណាដែលស្កេនចេញចាប់ពីម៉ោង <b>18:00</b> ឡើងទៅ ទើបប្រព័ន្ធគិតម៉ោងថែម (OT) ជូនដោយស្វ័យប្រវត្តិ។ បើស្កេនចេញមុនម៉ោង 18:00 (មិនដល់ 1 ម៉ោង) គឺមិនគិត OT ឡើយ។
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🤖</span> Telegram Interactive Bot & Webhook (1-Click Approvals)
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              តភ្ជាប់ Telegram Bot ដើម្បីទទួលបានការជូនដំណឹង និងអនុម័តសំណើ (ច្បាប់, បុរេប្រទាន, ចំណាយ, OT) ផ្ទាល់លើ Telegram ដោយចុចប៊ូតុង [✅ អនុម័ត] / [❌ បដិសេធ]។
            </p>
          </div>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '12px',
            backgroundColor: '#e0f2fe',
            color: '#0369a1',
            border: '1px solid #bae6fd',
          }}>
            ⚡ 2-Way Interactive Bot
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
            <div>
              <label className="kh-text" style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                Telegram Bot Token (ឧ. 123456:ABC-DEF1234...)
              </label>
              <input 
                type="text" 
                name="telegramBotToken" 
                defaultValue={settings?.telegramBotToken || ''} 
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem' }} 
                placeholder="វាយបញ្ចូល Bot Token..."
              />
            </div>
            <div>
              <label className="kh-text" style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                Telegram Chat ID គោលដៅ (ឧ. -100123456789)
              </label>
              <input 
                type="text" 
                name="telegramChatId" 
                id="telegramChatId"
                defaultValue={settings?.telegramChatId || ''} 
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem' }} 
                placeholder="វាយបញ្ចូល Chat ID គោលដៅ..."
              />
            </div>
          </div>

          {/* Action Toolbar Box */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: 'rgba(2, 132, 199, 0.05)',
            border: '1px solid rgba(2, 132, 199, 0.2)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Test Ping */}
              <button
                type="button"
                disabled={testingBot}
                onClick={handleTestTelegram}
                className="btn-secondary kh-text"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: testingBot ? 'not-allowed' : 'pointer',
                  opacity: testingBot ? 0.7 : 1,
                }}
              >
                <span>{testingBot ? 'កំពុងតេស្ត...' : '⚡ តេស្តតភ្ជាប់ (Ping)'}</span>
              </button>

              {/* Setup Webhook */}
              <button
                type="button"
                disabled={settingUpWebhook}
                onClick={handleSetupWebhook}
                className="btn-secondary kh-text"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: settingUpWebhook ? 'not-allowed' : 'pointer',
                  opacity: settingUpWebhook ? 0.7 : 1,
                }}
              >
                <span>{settingUpWebhook ? 'កំពុងភ្ជាប់...' : '🔗 កំណត់ Webhook (1-Click Bot)'}</span>
              </button>

              {/* Check Webhook Status */}
              <button
                type="button"
                disabled={checkingWebhook}
                onClick={handleCheckWebhook}
                className="btn-secondary kh-text"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  backgroundColor: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: checkingWebhook ? 'not-allowed' : 'pointer',
                  opacity: checkingWebhook ? 0.7 : 1,
                }}
              >
                <span>{checkingWebhook ? 'កំពុងឆែក...' : 'ℹ️ ស្ថានភាព Webhook'}</span>
              </button>

              {/* Push Daily Summary */}
              <button
                type="button"
                disabled={sendingSummary}
                onClick={handleSendDailySummary}
                className="btn-secondary kh-text"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: sendingSummary ? 'not-allowed' : 'pointer',
                  opacity: sendingSummary ? 0.7 : 1,
                }}
              >
                <span>{sendingSummary ? 'កំពុងផ្ញើ...' : '📊 ផ្ញើសង្ខេបវត្តមានថ្ងៃនេះ'}</span>
              </button>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span>• ចុច <b>"កំណត់ Webhook"</b> ដើម្បីភ្ជាប់ Bot ទៅកាន់ប្រព័ន្ធ Live នៅលើ Cloud ឬ Public Domain ដើម្បីអនុញ្ញាតប៊ូតុងចុចអនុម័ត 1-Click។</span>
              <span>• ក្នុង Telegram Bot អ្នកគ្រប់គ្រងអាចវាយពាក្យបញ្ជា <code>/today</code>, <code>/summary</code> ឬ <code>/pending</code> ដើម្បីមើលរបាយការណ៍បានគ្រប់ពេលវេលា។</span>
            </div>
          </div>
        </div>
      </div>

      {/* កំណត់ទីតាំង GPS & Geo-Fencing (Company GPS Location & Radius) */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📍</span> កំណត់ទីតាំង GPS & Geo-Fencing របស់ក្រុមហ៊ុន (Company GPS Location)
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              កំណត់កូអរដោនេទីតាំង និងកាំរង្វង់អនុញ្ញាត (Radius) សម្រាប់បុគ្គលិកចុះវត្តមានតាមទូរស័ព្ទដៃ GPS Geo-Fence។
            </p>
          </div>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '12px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            border: '1px solid #bbf7d0',
          }}>
            📍 GPS Anti-Spoofing
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Geo-Fence Enable Toggle Switch */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            backgroundColor: geoFenceEnabled ? '#eff6ff' : '#f8fafc',
            border: geoFenceEnabled ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
            borderRadius: '8px',
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                🛡️ បើកដំណើរការកំណត់ព្រំប្រទល់វត្តមាន GPS (Enable Geo-Fencing Attendance)
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                {geoFenceEnabled
                  ? 'បុគ្គលិកអាចស្កេនវត្តមានតាមទូរស័ព្ទដៃបាន លុះត្រាតែស្ថិតក្នុងកាំរង្វង់រោងចក្រដែលបានកំណត់ខាងក្រោម។'
                  : 'បានបិទ Geo-Fencing៖ បុគ្គលិកអាចស្កេនវត្តមានបានពីគ្រប់ទីកន្លែង។'}
              </div>
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="geoFenceEnabled"
                value="true"
                checked={geoFenceEnabled}
                onChange={(e) => setGeoFenceEnabled(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#2563eb' }}
              />
              <span style={{ marginLeft: '8px', fontWeight: 700, fontSize: '0.85rem', color: geoFenceEnabled ? '#2563eb' : '#64748b' }}>
                {geoFenceEnabled ? 'បើក (ON)' : 'បិទ (OFF)'}
              </span>
            </label>
          </div>

          {/* Coordinate & Radius Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label className="kh-text" style={{ fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', color: '#1e293b' }}>
                <span>📍 រយៈទទឹង (Latitude)</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>ឧ. 11.555052</span>
              </label>
              <input
                type="number"
                step="any"
                name="companyLat"
                id="companyLatInput"
                value={companyLat}
                onChange={(e) => setCompanyLat(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', height: '42px', padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.92rem', boxSizing: 'border-box' }}
                placeholder="Latitude (ឧ. 11.555052)..."
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label className="kh-text" style={{ fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', color: '#1e293b' }}>
                <span>📍 រយៈបណ្តោយ (Longitude)</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>ឧ. 104.906843</span>
              </label>
              <input
                type="number"
                step="any"
                name="companyLng"
                id="companyLngInput"
                value={companyLng}
                onChange={(e) => setCompanyLng(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', height: '42px', padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.92rem', boxSizing: 'border-box' }}
                placeholder="Longitude (ឧ. 104.906843)..."
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label className="kh-text" style={{ fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', color: '#1e293b' }}>
                <span>🎯 កាំរង្វង់អនុញ្ញាត (Geo-Radius)</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>គិតជាម៉ែត្រ</span>
              </label>
              <input
                type="number"
                step="10"
                min="50"
                max="10000"
                name="geoRadiusMeters"
                id="geoRadiusMetersInput"
                value={geoRadiusMeters}
                onChange={(e) => setGeoRadiusMeters(parseFloat(e.target.value) || 500)}
                style={{ width: '100%', height: '42px', padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.92rem', boxSizing: 'border-box' }}
                placeholder="Radius meters (ឧ. 500)..."
                required
              />
            </div>
          </div>

          {/* Quick Buttons for GPS Location & Radius */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={fetchingCurrentLocation}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: fetchingCurrentLocation ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 5px rgba(16, 185, 129, 0.25)',
              }}
            >
              <span>{fetchingCurrentLocation ? 'កំពុងស្ទង់ GPS ពី Device...' : '📍 ចាប់យកទីតាំង Device ជាក់ស្តែង (Get My Location)'}</span>
            </button>

            <button
              type="button"
              onClick={handleViewGoogleMaps}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>🗺️ បើកមើលក្នុង Google Maps</span>
            </button>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>កាំរហ័ស:</span>
              {[200, 500, 1000, 2000].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setGeoRadiusMeters(r)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: geoRadiusMeters === r ? '1px solid #2563eb' : '1px solid #cbd5e1',
                    background: geoRadiusMeters === r ? '#2563eb' : '#f8fafc',
                    color: geoRadiusMeters === r ? '#ffffff' : '#334155',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {r}m
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Visual Map with Draggable Pin ("អាច move ប្តូរទីតាំងបានតាមចិត្តទៅរោងចក្រនីមួយៗ") */}
          <div style={{ marginTop: '4px' }}>
            <GpsLocationPickerMap
              lat={companyLat}
              lng={companyLng}
              radiusMeters={geoRadiusMeters}
              onLocationChange={(newLat, newLng) => {
                setCompanyLat(newLat);
                setCompanyLng(newLng);
              }}
            />
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary kh-text" disabled={loading} style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
        {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក (Save Settings)'}
      </button>
    </form>
  );
}
