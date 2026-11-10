'use client';

import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { Html5Qrcode } from 'html5-qrcode';
import { calculateHaversineDistance } from '@/lib/attendanceClockIn';

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
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  // GPS State
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [geoSettings, setGeoSettings] = useState<{
    companyLat: number;
    companyLng: number;
    geoRadiusMeters: number;
    geoFenceEnabled: boolean;
  }>({
    companyLat: 11.5564,
    companyLng: 104.9282,
    geoRadiusMeters: 500,
    geoFenceEnabled: true,
  });

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch company GPS settings
  useEffect(() => {
    fetch('/api/attendance/geo-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setGeoSettings({
            companyLat: data.companyLat,
            companyLng: data.companyLng,
            geoRadiusMeters: data.geoRadiusMeters,
            geoFenceEnabled: data.geoFenceEnabled,
          });
        }
      })
      .catch((e) => console.error('Failed to load geo settings:', e));
  }, []);

  // Safe Camera Stop
  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Error clearing scanner:', e);
      }
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  };

  // Start Camera with resilient fallback (Back camera -> Front camera -> Any webcam)
  const startCamera = async (specificCameraId?: string) => {
    await stopCamera();
    setCameraError(null);

    try {
      await new Promise((r) => setTimeout(r, 200));

      const scanner = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = scanner;

      let devices: Array<{ id: string; label: string }> = [];
      try {
        devices = await Html5Qrcode.getCameras();
        setAvailableCameras(devices);
      } catch (e) {
        console.warn('Could not enumerate cameras:', e);
      }

      let cameraParam: any = { facingMode: 'environment' };

      if (specificCameraId) {
        cameraParam = { deviceId: { exact: specificCameraId } };
      } else if (devices && devices.length > 0) {
        // Try finding back camera, else use the first available device
        const backCam = devices.find((d) =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        const chosen = backCam || devices[0];
        setSelectedCameraId(chosen.id);
        cameraParam = { deviceId: { exact: chosen.id } };
      }

      // Try starting preferred camera
      try {
        await scanner.start(
          cameraParam,
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          async (decodedText) => {
            await handleQrScanned(decodedText);
          },
          () => {}
        );
        setCameraActive(true);
      } catch (firstErr: any) {
        console.warn('Primary camera mode failed, attempting user-facing fallback:', firstErr);
        // Fallback: Try facingMode: 'user' (common for laptops / webcams)
        await scanner.start(
          { facingMode: 'user' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          async (decodedText) => {
            await handleQrScanned(decodedText);
          },
          () => {}
        );
        setCameraActive(true);
      }
    } catch (finalErr: any) {
      console.error('Final camera start error:', finalErr);
      setCameraError(
        'កុំព្យូទ័រ ឬទូរស័ព្ទរបស់អ្នកមិនទាន់បានអនុញ្ញាតសិទ្ធិប្រើប្រាស់កាមេរ៉ា (Camera Permission Required)។ សូមចុចប៊ូតុង "តេស្តស្កេនភ្លាមៗ" ខាងក្រោមដើម្បីសាកល្បងដំណើរការ!'
      );
    }
  };

  useEffect(() => {
    if (!isOpen || activeTab !== 'QR') {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

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
        // Restart camera on failure
        startCamera();
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'កំហុសបច្ចេកទេស',
        text: err.message,
      });
      startCamera();
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-Click Demo / Test Scan (Gets live token & clocks in)
  const handleTestDemoScan = async () => {
    setLoading(true);
    try {
      const tokenRes = await fetch('/api/attendance/qr-token');
      const tokenData = await tokenRes.json();
      if (!tokenData.success || !tokenData.token) {
        throw new Error('មិនអាចទាញយក Dynamic QR Token សាកល្បងបានទេ');
      }

      await handleQrScanned(tokenData.token);
    } catch (e: any) {
      Swal.fire({
        icon: 'error',
        title: 'កំហុសតេស្ត',
        text: e.message || 'Error executing test scan',
      });
      setLoading(false);
    }
  };

  // Handle Scanning from Image File
  const handleScanImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      await stopCamera();
      const scanner = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = scanner;
      const decodedText = await scanner.scanFile(file, true);
      await handleQrScanned(decodedText);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'ស្កេនមិនឃើញ QR Code ក្នុងរូបភាពនេះទេ',
        text: err?.message || 'Please upload a clear QR code image',
      });
      setLoading(false);
      startCamera();
    }
  };

  // Get GPS Location with Live High-Precision Calibration
  const fetchGpsLocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('ទូរស័ព្ទ ឬកម្មវិធីរុករករបស់អ្នកមិនគាំទ្រប្រព័ន្ធ Geolocation ទេ');
      setGpsLoading(false);
      return;
    }

    let bestFix: { lat: number; lng: number; accuracy: number } | null = null;
    let ticks = 0;

    const applyFix = (fix: { lat: number; lng: number; accuracy: number }) => {
      setGpsCoords({ lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy });
      const dist = calculateHaversineDistance(
        geoSettings.companyLat,
        geoSettings.companyLng,
        fix.lat,
        fix.lng
      );
      setDistance(dist);
      setGpsLoading(false);
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);

        if (!bestFix || acc < bestFix.accuracy) {
          bestFix = { lat, lng, accuracy: acc };
        }

        // If phone GPS achieved high precision <= 15m, finalize early
        if (acc <= 15) {
          navigator.geolocation.clearWatch(watchId);
          applyFix(bestFix);
        }
      },
      (err) => {
        console.error('GPS Error:', err);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );

    const timer = setInterval(() => {
      ticks += 1;
      if (ticks >= 3 || (bestFix && bestFix.accuracy <= 20)) {
        clearInterval(timer);
        navigator.geolocation.clearWatch(watchId);
        if (bestFix) {
          applyFix(bestFix);
        } else {
          setGpsError('មិនអាចទាញយកទីតាំងបានទេ សូមបើក Location លើទូរស័ព្ទ និងចុច Allow!');
          setGpsLoading(false);
        }
      }
    }, 1000);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'GPS') {
      fetchGpsLocation();
    }
  }, [isOpen, activeTab, geoSettings]);

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

  const isWithinFence = distance !== null && distance <= geoSettings.geoRadiusMeters;

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
          maxWidth: '460px',
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
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {activeTab === 'QR' && (
            <div style={{ width: '100%', textAlign: 'center' }}>
              {/* Camera Switcher if multiple cameras */}
              {availableCameras.length > 1 && (
                <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      startCamera(e.target.value);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.78rem',
                      color: '#334155',
                      outline: 'none',
                    }}
                  >
                    {availableCameras.map((cam, i) => (
                      <option key={cam.id} value={cam.id}>
                        📷 {cam.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#64748b' }}>
                សូមតម្រង់កាមេរ៉ាទៅកាន់ផ្ទាំង <b>QR Kiosk</b> នៅមាត់ទ្វារក្រុមហ៊ុន
              </p>

              {cameraError ? (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                    marginBottom: '12px',
                    textAlign: 'left',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚠️</span> បរាជ័យក្នុងការបើកកាមេរ៉ាស្វ័យប្រវត្ត
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.76rem' }}>{cameraError}</p>
                </div>
              ) : (
                <div
                  id={scannerContainerId}
                  style={{
                    width: '100%',
                    minHeight: '230px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#0f172a',
                    marginBottom: '10px',
                  }}
                />
              )}

              {/* Action Buttons Toolbar: Test Demo Scan & Upload File */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  marginTop: '10px',
                }}
              >
                {/* 1-Click Test Demo Scan */}
                <button
                  type="button"
                  onClick={handleTestDemoScan}
                  disabled={loading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <span>{loading ? 'កំពុងតេស្ត...' : '🧪 តេស្តស្កេនភ្លាមៗ (Test Punch)'}</span>
                </button>

                {/* Scan Image from file */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>📁 រូបភាព QR</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleScanImageFile}
                />

                {/* Retry Camera Button */}
                {cameraError && (
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span>🔄 សាកល្បងបើកកាមេរ៉ាម្តងទៀត</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'GPS' && (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
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
                  fontSize: '1.6rem',
                  margin: '0 auto 12px',
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
                  <div style={{ marginTop: '8px' }}>
                    <button
                      onClick={fetchGpsLocation}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        background: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ព្យាយាមម្តងទៀត
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    style={{
                      fontSize: '0.98rem',
                      fontWeight: 800,
                      color: isWithinFence ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {isWithinFence
                      ? `🟢 ស្ថិតក្នុងបរិវេណក្រុមហ៊ុន (~${distance} ម៉ែត្រ)`
                      : `🔴 នៅក្រៅបរិវេណក្រុមហ៊ុន (~${distance} ម៉ែត្រ)`}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    កាំរង្វង់អនុញ្ញាត: ត្រឹម {geoSettings.geoRadiusMeters} ម៉ែត្រពីទីស្នាក់ការក្រុមហ៊ុន
                  </div>

                  {gpsCoords && (
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      ទីតាំងរបស់អ្នក: {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)} (±{gpsCoords.accuracy}m)
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
                    <button
                      onClick={handleGpsClockIn}
                      disabled={!isWithinFence || loading}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        backgroundColor: isWithinFence ? '#10b981' : '#cbd5e1',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: isWithinFence && !loading ? 'pointer' : 'not-allowed',
                        boxShadow: isWithinFence ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                      }}
                    >
                      {loading ? 'កំពុងកត់ត្រា...' : '✅ បញ្ជាក់វត្តមានតាម GPS'}
                    </button>
                    <button
                      onClick={fetchGpsLocation}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      title="Refresh GPS"
                    >
                      🔄
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
