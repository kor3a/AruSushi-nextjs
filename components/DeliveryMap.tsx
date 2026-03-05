import { useEffect, useRef, useState } from 'react';

interface DeliveryMapProps {
  dasherLat: number | null | undefined;
  dasherLng: number | null | undefined;
  dropoffAddress?: string | null;
  dasherName?: string | null;
}

export default function DeliveryMap({
  dasherLat,
  dasherLng,
  dropoffAddress,
  dasherName,
}: DeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let link = document.querySelector('link[href*="leaflet.css"]');
    if (!link) {
      link = document.createElement('link');
      (link as HTMLLinkElement).rel = 'stylesheet';
      (link as HTMLLinkElement).href =
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      (link as HTMLLinkElement).integrity =
        'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      (link as HTMLLinkElement).crossOrigin = '';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      (window as any).L = L.default || L;
      setLeafletLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    if (dasherLat == null || dasherLng == null) return;

    const L = (window as any).L;
    if (!L) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([dasherLat, dasherLng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([dasherLat, dasherLng]);
    } else {
      const dasherIcon = L.divIcon({
        html: `<div style="
          background: #fc3678;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          border: 3px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">🛵</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      markerRef.current = L.marker([dasherLat, dasherLng], {
        icon: dasherIcon,
      }).addTo(mapRef.current);

      if (dasherName) {
        markerRef.current.bindPopup(
          `<strong>${dasherName}</strong><br/>Your Dasher`
        );
      }
    }

    mapRef.current.panTo([dasherLat, dasherLng], { animate: true, duration: 0.5 });

    return () => {};
  }, [leafletLoaded, dasherLat, dasherLng, dasherName]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  if (dasherLat == null || dasherLng == null) {
    return (
      <div
        style={{
          background: 'rgba(17, 17, 17, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '32px 16px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📍</div>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '14px' }}>
          {dropoffAddress
            ? 'Waiting for Dasher location...'
            : 'Map will appear when a Dasher is assigned'}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '300px',
          background: '#1a1a1a',
        }}
      />
      {dasherName && (
        <div
          style={{
            background: 'rgba(17, 17, 17, 0.8)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px' }}>🛵</span>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
            {dasherName}
          </span>
          <span style={{ color: '#9ca3af', fontSize: '13px' }}>
            is your Dasher
          </span>
        </div>
      )}
    </div>
  );
}
