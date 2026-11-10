'use client';

import React, { useEffect, useRef, useState } from 'react';

interface GpsLocationPickerMapProps {
  lat: number;
  lng: number;
  radiusMeters: number;
  onLocationChange: (lat: number, lng: number) => void;
  onAccuracyDetected?: (accuracyMeters: number) => void;
}

export default function GpsLocationPickerMap({
  lat,
  lng,
  radiusMeters,
  onLocationChange,
  onAccuracyDetected,
}: GpsLocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  const [isLeafletReady, setIsLeafletReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isCalibratingGps, setIsCalibratingGps] = useState(false);
  const [calibrationStatus, setCalibrationStatus] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // 1. Load Leaflet CDN Assets dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).L) {
      setIsLeafletReady(true);
      return;
    }

    const linkId = 'leaflet-css-cdn';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const scriptId = 'leaflet-js-cdn';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setIsLeafletReady(true);
      document.head.appendChild(script);
    } else {
      const checkTimer = setInterval(() => {
        if ((window as any).L) {
          setIsLeafletReady(true);
          clearInterval(checkTimer);
        }
      }, 100);
      return () => clearInterval(checkTimer);
    }
  }, []);

  // 2. Initialize Map once Leaflet is ready
  useEffect(() => {
    if (!isLeafletReady || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Destroy prior map instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const validLat = Number.isFinite(lat) && lat !== 0 ? lat : 11.5564;
    const validLng = Number.isFinite(lng) && lng !== 0 ? lng : 104.9282;

    const map = L.map(mapContainerRef.current, {
      center: [validLat, validLng],
      zoom: 16,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);

    // Custom high-visibility SVG pin with pulsing base
    const customPinIcon = L.divIcon({
      className: 'custom-factory-gps-marker',
      html: `
        <div style="position: relative; width: 38px; height: 38px; transform: translate(-19px, -36px); cursor: grab;">
          <svg viewBox="0 0 24 24" width="38" height="38" fill="#dc2626" stroke="#ffffff" stroke-width="1.8" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.45));">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <div style="position: absolute; bottom: 0; left: 50%; transform: translate(-50%, 50%); width: 12px; height: 12px; background: rgba(220, 38, 38, 0.45); border-radius: 50%; border: 1.5px solid #ffffff;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    // Create Draggable Marker
    const marker = L.marker([validLat, validLng], {
      draggable: true,
      icon: customPinIcon,
      title: 'អូសដើម្បីប្តូរទីតាំងរោងចក្រ (Drag to move factory location)',
    }).addTo(map);

    // Create Geo-Fence Circle
    const circle = L.circle([validLat, validLng], {
      radius: radiusMeters > 0 ? radiusMeters : 500,
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.16,
      weight: 2,
      dashArray: '6, 6',
    }).addTo(map);

    // Sync on drag
    marker.on('drag', (e: any) => {
      const pos = e.target.getLatLng();
      circle.setLatLng(pos);
    });

    marker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      circle.setLatLng(pos);
      onLocationChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
    });

    // Click anywhere on map to jump pin
    map.on('click', (e: any) => {
      marker.setLatLng(e.latlng);
      circle.setLatLng(e.latlng);
      onLocationChange(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;

    // Force map size refresh after container finishes layout
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isLeafletReady]);

  // 3. Keep Marker and Circle in sync when props change
  useEffect(() => {
    if (!markerRef.current || !circleRef.current || !mapInstanceRef.current) return;
    const currentMarkerPos = markerRef.current.getLatLng();
    const latDiff = Math.abs(currentMarkerPos.lat - lat);
    const lngDiff = Math.abs(currentMarkerPos.lng - lng);

    if (latDiff > 0.000005 || lngDiff > 0.000005) {
      markerRef.current.setLatLng([lat, lng]);
      circleRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.panTo([lat, lng]);
    }

    if (radiusMeters > 0) {
      circleRef.current.setRadius(radiusMeters);
    }
  }, [lat, lng, radiusMeters]);

  // 4. Parse Google Maps coordinates or search location
  const handleParseOrSearch = async () => {
    const raw = searchQuery.trim();
    if (!raw) return;

    // Regex check for Google Maps URL or raw coordinates
    // Matches: "11.555052, 104.906843" or "11.555052 104.906843" or "https://maps.google.com/?q=11.555052,104.906843" or "@11.555052,104.906843"
    const coordMatch = raw.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (coordMatch) {
      const parsedLat = parseFloat(coordMatch[1]);
      const parsedLng = parseFloat(coordMatch[2]);
      if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat >= -90 && parsedLat <= 90) {
        onLocationChange(Number(parsedLat.toFixed(6)), Number(parsedLng.toFixed(6)));
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([parsedLat, parsedLng], 17);
        }
        setSearchResults([]);
        return;
      }
    }

    // Otherwise search Nominatim OpenStreetMap (focused on Cambodia)
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(raw)}&countrycodes=kh&limit=5`
      );
      const data = await res.json();
      setSearchResults(data || []);
      if (data && data.length === 1) {
        handleSelectSearchResult(data[0]);
      }
    } catch (e) {
      console.error('Map search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item: any) => {
    const nLat = parseFloat(item.lat);
    const nLng = parseFloat(item.lon);
    if (!isNaN(nLat) && !isNaN(nLng)) {
      onLocationChange(Number(nLat.toFixed(6)), Number(nLng.toFixed(6)));
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([nLat, nLng], 17);
      }
      setSearchResults([]);
      setSearchQuery(item.display_name?.split(',')[0] || searchQuery);
    }
  };

  // 5. 100% High-Accuracy Device GPS Calibration Engine
  const handleCalibrateDeviceGps = () => {
    if (!navigator.geolocation) {
      alert('Browser របស់អ្នកមិនគាំទ្រប្រព័ន្ធ Geolocation ទេ');
      return;
    }

    setIsCalibratingGps(true);
    setCalibrationStatus('📡 កំពុងភ្ជាប់ផ្កាយរណប GPS (0s)...');

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

        setGpsAccuracy(bestReading.accuracy);
        setCalibrationStatus(`🎯 កំពុងស្ទង់ GPS: ±${bestReading.accuracy}m (Lat: ${cLat.toFixed(5)}, Lng: ${cLng.toFixed(5)})`);

        // If high precision <= 12m achieved, immediately finalize
        if (cAcc <= 12) {
          finalizeCalibration(bestReading);
          navigator.geolocation.clearWatch(watchId);
        }
      },
      (err) => {
        console.warn('GPS watch error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );

    // Timeout countdown to ensure optimal reading within 5 seconds
    const intervalTimer = setInterval(() => {
      ticks += 1;
      if (ticks >= 5 || (bestReading && bestReading.accuracy <= 15)) {
        clearInterval(intervalTimer);
        navigator.geolocation.clearWatch(watchId);
        if (bestReading) {
          finalizeCalibration(bestReading);
        } else {
          setIsCalibratingGps(false);
          setCalibrationStatus('⚠️ មិនអាចចាប់យក GPS បានទេ សូមពិនិត្យ Permission!');
        }
      } else {
        setCalibrationStatus(`📡 កំពុងស្ទង់ GPS ពីឧបករណ៍ (${ticks}/5s)... ${bestReading ? `±${bestReading.accuracy}m` : ''}`);
      }
    }, 1000);
  };

  const finalizeCalibration = (reading: { lat: number; lng: number; accuracy: number }) => {
    setIsCalibratingGps(false);
    setGpsAccuracy(reading.accuracy);
    onLocationChange(Number(reading.lat.toFixed(6)), Number(reading.lng.toFixed(6)));
    if (onAccuracyDetected) onAccuracyDetected(reading.accuracy);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([reading.lat, reading.lng], 17);
    }

    if (reading.accuracy <= 25) {
      setCalibrationStatus(`✅ ចាប់បានទីតាំង Device ជោគជ័យ! សុក្រិតកម្រិតខ្ពស់ (±${reading.accuracy} ម៉ែត្រ)`);
    } else {
      setCalibrationStatus(
        `📡 ចាប់បានតាម Network/Wi-Fi (±${reading.accuracy}m)។ អ្នកអាចអូស Pin ក្រហមដើម្បីដាក់ចំរោងចក្រ ១០០%!`
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* CSS Override for Leaflet tiles in Next.js */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .leaflet-container img { max-width: none !important; }
          .custom-factory-gps-marker { background: none; border: none; }
        `
      }} />

      {/* Search / Paste Google Maps Coords or Link */}
      <div style={{ display: 'flex', gap: '8px', position: 'relative', width: '100%' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleParseOrSearch();
            }
          }}
          placeholder="🔍 ស្វែងរកទីតាំង ឬ Paste Google Maps Coords / Link (ឧ. 11.555052, 104.906843)..."
          style={{
            flex: 1,
            height: '42px',
            padding: '0 14px',
            fontSize: '0.88rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            outline: 'none',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={handleParseOrSearch}
          disabled={isSearching}
          style={{
            height: '42px',
            padding: '0 18px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
            boxShadow: '0 2px 5px rgba(2, 132, 199, 0.25)',
          }}
        >
          {isSearching ? 'កំពុងស្វែងរក...' : 'ស្វែងរក / អនុវត្ត'}
        </button>

        {/* Autocomplete Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              zIndex: 1000,
              maxHeight: '220px',
              overflowY: 'auto',
            }}
          >
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSearchResult(item)}
                style={{
                  padding: '9px 14px',
                  fontSize: '0.84rem',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.display_name?.split(',')[0]}</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{item.display_name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GPS Accuracy Status / Calibration Feedback */}
      {calibrationStatus && (
        <div
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 600,
            backgroundColor: gpsAccuracy && gpsAccuracy <= 25 ? '#dcfce7' : '#fef3c7',
            color: gpsAccuracy && gpsAccuracy <= 25 ? '#166534' : '#92400e',
            border: `1px solid ${gpsAccuracy && gpsAccuracy <= 25 ? '#86efac' : '#fde68a'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '6px',
          }}
        >
          <span>{calibrationStatus}</span>
          {gpsAccuracy && (
            <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>
              (ភាពលំអៀង: ±{gpsAccuracy}m)
            </span>
          )}
        </div>
      )}

      {/* Interactive Map Box */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '380px',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '2px solid #cbd5e1',
          boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
          backgroundColor: '#e2e8f0',
        }}
      >
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {!isLeafletReady && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(248, 250, 252, 0.95)',
              fontSize: '0.88rem',
              color: '#64748b',
              fontWeight: 600,
              gap: '8px',
            }}
          >
            <span>🗺️ កំពុងផ្ទុកផែនទីអន្តរកម្ម (Loading Interactive Map)...</span>
          </div>
        )}

        {/* Live Coordinate Overlay Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            color: '#ffffff',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            backdropFilter: 'blur(4px)',
            zIndex: 500,
            pointerEvents: 'none',
            display: 'flex',
            gap: '12px',
          }}
        >
          <span>📍 Lat: <b>{lat.toFixed(6)}</b></span>
          <span>Lng: <b>{lng.toFixed(6)}</b></span>
          <span>កាំ Geo-Fence: <b>{radiusMeters}m</b></span>
        </div>
      </div>

      {/* Helpful Guidance Hint */}
      <div
        style={{
          fontSize: '0.76rem',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          lineHeight: 1.4,
        }}
      >
        <span>💡</span>
        <span>
          <b>របៀបប្រើប្រាស់៖</b> អ្នកអាច <b>ចាប់ទាញ Pin ក្រហម (Drag Marker)</b> ឬ <b>ចុចលើផែនទី (Click)</b> ដើម្បីប្តូរទីតាំងរោងចក្រដោយសេរី ១០០%។ រង្វង់ពណ៌ខៀវគឺជាកាំ Geo-Fencing ដែលបុគ្គលិកអាចស្កេនវត្តមានបាន។
        </span>
      </div>
    </div>
  );
}
