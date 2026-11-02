'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

interface PunchItem {
  id: string;
  empId: string;
  nameKh: string;
  nameEn: string;
  department: string;
  photoUrl?: string | null;
  time: string;
  type: string;
  mode: string;
}

export default function QrKioskClient({ settings }: { settings: any }) {
  const [token, setToken] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(25);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [recentPunches, setRecentPunches] = useState<PunchItem[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const kioskRef = useRef<HTMLDivElement>(null);

  // Digital Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch rotating QR Token & Recent Punches
  const fetchQrToken = async () => {
    try {
      const res = await fetch('/api/attendance/qr-token');
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
          setCountdown(data.intervalSec || 25);
          if (data.recentPunches) {
            setRecentPunches(data.recentPunches);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching dynamic QR token:', e);
    }
  };

  useEffect(() => {
    fetchQrToken();
    const tokenInterval = setInterval(fetchQrToken, 25000);
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 25));
    }, 1000);

    return () => {
      clearInterval(tokenInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      kioskRef.current?.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const timeFormatted = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateKhmer = currentTime.toLocaleDateString('km-KH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      ref={kioskRef}
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
        color: '#ffffff',
        fontFamily: 'var(--font-khmer), -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)',
            }}
          >
            🏢
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, letterSpacing: '0.3px' }}>
              {settings?.companyName || 'G.STextileGarment (Cambodia) co.,Ltd'}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#94a3b8' }}>
              ស្ថានីយ៍កត់ត្រាវត្តមានស្វ័យប្រវត្ត (Smart Dynamic Attendance Kiosk)
            </p>
          </div>
        </div>

        {/* Live Digital Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                color: '#38bdf8',
                letterSpacing: '1px',
                fontFamily: 'monospace',
                textShadow: '0 0 15px rgba(56, 189, 248, 0.5)',
              }}
            >
              {timeFormatted}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{dateKhmer}</div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={toggleFullscreen}
              title="Fullscreen"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#ffffff',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{isFullscreen ? '⤦ បង្រួម' : '⛶ ពង្រីកពេញអេក្រង់'}</span>
            </button>
            <Link
              href="/dashboard/biometric"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '8px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              ✕ ចាកចេញ
            </Link>
          </div>
        </div>
      </div>

      {/* Main Kiosk Layout */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(300px, 0.8fr)',
          gap: '24px',
          marginTop: '24px',
          alignItems: 'stretch',
        }}
      >
        {/* Left Column: Rotating Dynamic QR Code */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 60px rgba(37, 99, 235, 0.05)',
            position: 'relative',
          }}
        >
          {/* Badge */}
          <div
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 10px #10b981',
              }}
            />
            Dynamic QR Scanner Ready • QR បង្វិលសុវត្ថិភាព
          </div>

          {/* QR Container with Glow Frame */}
          <div
            style={{
              padding: '20px',
              background: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 0 50px rgba(56, 189, 248, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '4px solid #38bdf8',
            }}
          >
            {token ? (
              <QRCodeSVG
                value={token}
                size={270}
                level="M"
                includeMargin={false}
              />
            ) : (
              <div
                style={{
                  width: 270,
                  height: 270,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                }}
              >
                កំពុងបង្កើត QR Code...
              </div>
            )}
          </div>

          {/* Rotating Progress Bar */}
          <div style={{ width: '80%', maxWidth: '320px', marginTop: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: '#94a3b8',
                marginBottom: '6px',
                fontWeight: 600,
              }}
            >
              <span>ផ្លាស់ប្តូរ QR ស្វ័យប្រវត្តិក្នង</span>
              <span style={{ color: '#38bdf8', fontWeight: 800 }}>{countdown}s</span>
            </div>
            <div
              style={{
                height: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(countdown / 25) * 100}%`,
                  background: 'linear-gradient(90deg, #38bdf8, #10b981)',
                  transition: 'width 1s linear',
                }}
              />
            </div>
          </div>

          <p
            style={{
              marginTop: '18px',
              fontSize: '0.9rem',
              color: '#cbd5e1',
              textAlign: 'center',
              maxWidth: '360px',
              lineHeight: 1.5,
            }}
          >
            សូមបើកទូរស័ព្ទដៃចូល <b>Employee Self-Service Portal</b> ហើយចុច <b>"ស្កេន QR វត្តមាន"</b> ដើម្បី Check-In ឬ Check-Out។
          </p>
        </div>

        {/* Right Column: Live Punch Activity Stream */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '12px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚡</span> សកម្មភាពស្កេនទើបកត់ត្រា (Live Activity)
            </h2>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                fontWeight: 700,
              }}
            >
              Realtime
            </span>
          </div>

          {recentPunches.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '2rem' }}>🕒</span>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>មិនទាន់មានការស្កេនថ្មីនៅឡើយទេ</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentPunches.map((item, idx) => {
                const isCheckIn = item.type === 'CHECK_IN';
                return (
                  <div
                    key={item.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isCheckIn ? '#065f46' : '#7f1d1d',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                        }}
                      >
                        {item.nameKh ? item.nameKh[0] : item.nameEn[0] || 'E'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9' }}>
                          {item.nameKh || item.nameEn}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {item.empId} • {item.department}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: isCheckIn ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: isCheckIn ? '#34d399' : '#f87171',
                          display: 'inline-block',
                          marginBottom: '2px',
                        }}
                      >
                        {isCheckIn ? 'IN' : 'OUT'} • {item.time}
                      </span>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.mode}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
