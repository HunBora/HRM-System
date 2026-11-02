'use client';

import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { Html5Qrcode } from 'html5-qrcode';
import { DEFAULT_COMPANY_LAT, DEFAULT_COMPANY_LNG, DEFAULT_GEO_RADIUS_METERS, calculateHaversineDistance } from '@/lib/attendanceClockIn';

interface MobileClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  onSuccess?: () => void;
}

export default function MobileClockInModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  onSuccess,
}: MobileClockInModalProps) {
  const [activeTab, setActiveTab] = useState<'QR' | 'GPS'>('QR');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // GPS State
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';

  // Start QR Camera Scanner when tab is QR and modal is open
  useEffect(() => {
    if (!isOpen || activeTab !== 'QR') {
      stopCamera();
      return;
    }

    let isMounted = true;
    const startCamera = async () => {
      setCameraError(null);
      try {
        // Wait for container to be rendered in DOM
        await new Promise((r) => setTimeout(r, 200));
        if (!isMounted) return;

        const scanner = new Html5Qrcode(scannerContainerId);
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          async (decodedText) => {
            // Successful QR Read
            await handleQrScanned(decodedText);
          },
          () => {} // scan error (ignore frame misses)
        );
        if (isMounted) setCameraActive(true);
      } catch (err: any) {
        if (isMounted) {
          console.error('Camera start error:', err);
          setCameraError(err?.message || 'មិនអាចបើកកាមេរ៉ាបានទេ សូមអនុញ្ញាតសិទ្ធិកាមេរ៉ា (Camera Permission Required)');
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.error('Error stopping camera:', e);
      }
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  };

  const handleQrScanned = async (decodedToken: string) => {
    await stopCamera();
    setLoading(true);

    try {
      const res = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          method: 'QR_DYNAMIC',
          qrToken: decodedToken,
        }),
      });

      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'ជោគជ័យ! (Success)',
          text: data.message,
          confirmButtonColor: '#10b981',
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'កត់ត្រាមិនជោគជ័យ',
          text: data.error || 'QR Code មិនត្រឹមត្រូវ ឬផុតកំណត់',
          confirmButtonColor: '#ef4444',
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'កំហុសបច្ចេកទេស',
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Get GPS Location
  const fetchGpsLocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('ទូរស័ព្ទរបស់អ្នកមិនគាំទ្រប្រព័ន្ធ Geolocation ទេ');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);
        setGpsCoords({ lat, lng, accuracy: acc });

        const dist = calculateHaversineDistance(
          DEFAULT_COMPANY_LAT,
          DEFAULT_COMPANY_LNG,
          lat,
          lng
        );
        setDistance(dist);
        setGpsLoading(false);
      },
      (err) => {
        console.error('GPS Error:', err);
        setGpsError('មិនអាចទាញយកទីតាំងបានទេ សូមបើក GPS/Location លើទូរស័ព្ទ និងចុច Allow!');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (isOpen && activeTab === 'GPS') {
      fetchGpsLocation();
    }
  }, [isOpen, activeTab]);

  const handleGpsClockIn = async () => {
    if (!gpsCoords) return;
    setLoading(true);

    try {
      const res = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          method: 'GPS_MOBILE',
          latitude: gpsCoords.lat,
          longitude: gpsCoords.lng,
          accuracy: gpsCoords.accuracy,
        }),
      });

      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'ជោគជ័យ! (Success)',
          text: data.message,
          confirmButtonColor: '#10b981',
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'កត់ត្រាមិនជោគជ័យ',
          text: data.error || 'អ្នកនៅក្រៅបរិវេណក្រុមហ៊ុន!',
          confirmButtonColor: '#ef4444',
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'កំហុសបច្ចេកទេស',
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isWithinFence = distance !== null && distance <= DEFAULT_GEO_RADIUS_METERS;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '440px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: '#ffffff',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
              ⚡ កត់ត្រាវត្តមាន (Mobile Clock-In)
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              {employeeName}
            </p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Toggle Bar */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '4px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('QR')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'QR' ? '#ffffff' : 'transparent',
              color: activeTab === 'QR' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'QR' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            📷 ស្កេន Dynamic QR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('GPS')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'GPS' ? '#ffffff' : 'transparent',
              color: activeTab === 'GPS' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'GPS' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            📍 GPS Geo-Fence
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {activeTab === 'QR' && (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: '#64748b' }}>
                សូមតម្រង់កាមេរ៉ាទៅកាន់ផ្ទាំង <b>QR Kiosk</b> នៅមាត់ទ្វារក្រុមហ៊ុន
              </p>

              {cameraError ? (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    fontSize: '0.82rem',
                    lineHeight: 1.5,
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 700 }}>⚠️ បរាជ័យក្នុងការបើកកាមេរ៉ា</p>
                  <p style={{ margin: '4px 0 0' }}>{cameraError}</p>
                </div>
              ) : (
                <div
                  id={scannerContainerId}
                  style={{
                    width: '100%',
                    minHeight: '260px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#0f172a',
                  }}
                />
              )}

              {loading && (
                <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#0284c7', fontWeight: 700 }}>
                  កំពុងផ្ទៀងផ្ទាត់ QR Code...
                </div>
              )}
            </div>
          )}

          {activeTab === 'GPS' && (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: gpsLoading
                    ? '#f1f5f9'
                    : isWithinFence
                    ? '#dcfce7'
                    : '#fee2e2',
                  color: isWithinFence ? '#16a34a' : '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  margin: '0 auto 14px',
                }}
              >
                {gpsLoading ? '⏳' : isWithinFence ? '✓' : '✕'}
              </div>

              {gpsLoading ? (
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>កំពុងចាប់យកទីតាំង GPS ជាក់ស្តែង...</p>
              ) : gpsError ? (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    fontSize: '0.82rem',
                  }}
                >
                  {gpsError}
                  <button
                    onClick={fetchGpsLocation}
                    style={{
                      marginTop: '8px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ព្យាយាមម្តងទៀត
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: isWithinFence ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {isWithinFence
                      ? `🟢 ស្ថិតក្នុងបរិវេណក្រុមហ៊ុន (~${distance} ម៉ែត្រ)`
                      : `🔴 នៅក្រៅបរិវេណក្រុមហ៊ុន (~${distance} ម៉ែត្រ)`}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    ចម្ងាយអនុញ្ញាត: ត្រឹម {DEFAULT_GEO_RADIUS_METERS} ម៉ែត្រពីទីស្នាក់ការក្រុមហ៊ុន
                  </div>

                  {gpsCoords && (
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Lat: {gpsCoords.lat.toFixed(4)}, Lng: {gpsCoords.lng.toFixed(4)} (ភាពជាក់លាក់ ±{gpsCoords.accuracy}m)
                    </div>
                  )}

                  <button
                    onClick={handleGpsClockIn}
                    disabled={!isWithinFence || loading}
                    style={{
                      marginTop: '14px',
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: isWithinFence ? '#10b981' : '#cbd5e1',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: isWithinFence && !loading ? 'pointer' : 'not-allowed',
                      boxShadow: isWithinFence ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                    }}
                  >
                    {loading ? 'កំពុងកត់ត្រា...' : '✅ បញ្ជាក់វត្តមានតាម GPS ឥឡូវនេះ'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
