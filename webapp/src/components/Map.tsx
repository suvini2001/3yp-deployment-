import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
if (mapboxToken) {
  mapboxgl.accessToken = mapboxToken;
}

export type CrackMarker = {
  id: string;
  lat: number;
  lng: number;
  severity?: number;
};

interface Props {
  markers: CrackMarker[];
  center?: [number, number];
  zoom?: number;
  flyToId?: string | null;
}

export default function MapComponent({ markers, center = [80.7718, 7.8731], zoom = 12, flyToId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const mapReadyRef = useRef(false);

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    if (!mapboxToken) {
      console.warn("Mapbox token is missing! Please provide VITE_MAPBOX_TOKEN in .env");
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#f8fafc;border:2px dashed #cbd5e1;border-radius:0.5rem;padding:2rem;text-align:center;">
            <p style="color:#64748b;font-weight:600;margin-bottom:0.5rem;font-size:1.1rem;">Map Cannot Load</p>
            <p style="color:#94a3b8;font-size:0.875rem;">Please provide a valid VITE_MAPBOX_TOKEN in your .env file.</p>
          </div>
        `;
      }
      return;
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center,
      zoom,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.on("load", () => {
      mapReadyRef.current = true;
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      mapReadyRef.current = false;
    };
  }, []);

  // Sync markers
  useEffect(() => {
    if (!mapRef.current) return;
    const currentIds = new Set(markers.map((m) => m.id));

    Object.keys(markersRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    markers.forEach((crack) => {
      const severityNum = typeof crack.severity === 'number' ? crack.severity : 0;
const color = severityNum >= 0.7 ? "#dc2626" : severityNum >= 0.4 ? "#f59e0b" : "#2563eb";

      if (markersRef.current[crack.id]) {
        markersRef.current[crack.id].setLngLat([crack.lng, crack.lat]);
        return;
      }

      const el = document.createElement("div");
      el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.4);cursor:pointer;transition:all 0.3s ease;`;

      markersRef.current[crack.id] = new mapboxgl.Marker({ element: el })
        .setLngLat([crack.lng, crack.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 12 }).setHTML(
            `<div style="font-size:12px"><b>Severity:</b> ${typeof crack.severity === 'number' ? crack.severity.toFixed(2) : crack.severity}<br/><b>Lat/Lng:</b> ${crack.lat.toFixed(5)}, ${crack.lng.toFixed(5)}</div>`
          )
        )
        .addTo(mapRef.current!);
    });
  }, [markers]);

  // Fly to and highlight
  useEffect(() => {
    if (!flyToId || !mapRef.current) return;
    const t = markers.find((m) => m.id === flyToId);
    if (!t) return;

    const doFly = () => {
      mapRef.current!.flyTo({ center: [t.lng, t.lat], zoom: 17, speed: 1.4 });

      setTimeout(() => {
        const el = markersRef.current[flyToId]?.getElement();
        if (el) {
          el.style.width = "22px";
          el.style.height = "22px";
          el.style.boxShadow = "0 0 0 4px rgba(255,255,255,0.8), 0 0 12px 4px rgba(255,200,0,0.9)";
          el.style.zIndex = "10";
        }
        markersRef.current[flyToId]?.togglePopup();
      }, 1500);
    };

    // Wait for map to be ready if it isn't yet
    if (mapReadyRef.current) {
      doFly();
    } else {
      mapRef.current.on("load", doFly);
    }
  }, [flyToId, markers]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}