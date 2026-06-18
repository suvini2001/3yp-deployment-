import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MapComponent, { CrackMarker } from "../components/Map";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";



type CrackLocation = {
    id: string;
    sensorId: string;
    timestamp: string;
    deviceId: string;
    crackDetected: boolean;
    status: string;
    lat: number;
    lng: number;
    severity: number;
};

const parsePayload = (payload: unknown): CrackLocation | null => {
    if (typeof payload !== "object" || payload === null) return null;
    const obj = payload as Record<string, unknown>;

    const rawLocation = (obj.location as Record<string, unknown> | undefined) ?? {};
    const lat = Number(rawLocation.lat ?? obj.lat ?? rawLocation.latitude ?? obj.latitude ?? 0);
    const lng = Number(rawLocation.lng ?? obj.lng ?? rawLocation.longitude ?? obj.longitude ?? 0);
    const severity = Number(obj.severity ?? 0);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
        return null;
    }

    return {
        sensorId: String(obj.sensorId ?? "unknown"),
        timestamp: String(obj.timestamp ?? ""),
        deviceId: String(obj.deviceId ?? "unknown"),
        crackDetected: Boolean(obj.crackDetected),
        status: String(obj.status ?? "UNKNOWN"),
        lat,
        lng,
        severity: Number.isFinite(severity) ? severity : 0,
        id: `${String(obj.sensorId ?? "unknown")}-${String(obj.timestamp ?? Date.now())}`,
    };
};

const wsToSockJsUrl = (wsUrl: string): string => {
    return wsUrl.replace(/^ws:/, "http:").replace(/^wss:/, "https:").replace(/\/+$/, "").replace(/\/ws$/, "/raid-websocket");
};

const MapPage = () => {
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080";
    const wsUrl = (import.meta.env.VITE_WS_URL as string | undefined) ?? "ws://localhost:8080/ws";
const [searchParams] = useSearchParams();
const focusLat = Number(searchParams.get("lat"));
const focusLng = Number(searchParams.get("lng"));
const focusId = searchParams.get("focus");
    
    const [locations, setLocations] = useState<CrackMarker[]>([]);
const [activeFlyToId, setActiveFlyToId] = useState<string | null>(null);

    const upsertLocation = useCallback((incoming: CrackMarker) => {
        setLocations((prev) => {
            const filtered = prev.filter((p) => p.id !== incoming.id);
            return [incoming, ...filtered].slice(0, 2000);
        });
    }, []);
    useEffect(() => {
    console.log("focusId:", focusId);
    console.log("locations ids:", locations.map(l => l.id));
    console.log("activeFlyToId:", activeFlyToId);
}, [focusId, locations, activeFlyToId]);
useEffect(() => {
    console.log("Current URL:", window.location.href);
    console.log("Search string:", window.location.search);
}, []);
    useEffect(() => {
    if (focusId && locations.length > 0) {
        setActiveFlyToId(focusId);
    }
}, [focusId, locations]);

    useEffect(() => {
        const loadHistory = async () => {
            const crackResponse = await fetch(`${apiBaseUrl}/api/crack-locations`);
            if (!crackResponse.ok) {
                throw new Error(`Failed to fetch crack locations: ${crackResponse.status}`);
            }

            const crackData = (await crackResponse.json()) as unknown[];
            const crackParsed = crackData.map(parsePayload).filter((x): x is CrackLocation => x !== null);

            setLocations([...crackParsed]);
        };

        loadHistory().catch((err) => {
            console.error(err);
        });
    }, [apiBaseUrl]);

 

  

    useEffect(() => {
        const sockJsUrl = wsToSockJsUrl(wsUrl);

        const client = new Client({
            webSocketFactory: () => new SockJS(sockJsUrl),
            reconnectDelay: 3000,
            onConnect: () => {
                client.subscribe("/topic/cracks", (message) => {
                    try {
                        const payload = JSON.parse(message.body) as unknown;
                        const parsed = parsePayload(payload);
                        if (parsed) {
                            upsertLocation(parsed);
                        }
                    } catch (e) {
                        console.error("Failed to parse /topic/cracks payload", e);
                    }
                });
            },
            onStompError: (frame) => {
                console.error("STOMP error", frame.headers["message"], frame.body);
            },
        });

        client.activate();
        return () => {
            client.deactivate();
        };
    }, [upsertLocation, wsUrl]);

    return (
  <div className="w-full h-[calc(100vh-80px)]">
    <MapComponent
  markers={locations}
  center={focusLat && focusLng ? [focusLng, focusLat] : undefined}
  zoom={focusId ? 17 : 12}
  flyToId={activeFlyToId}
/>
  </div>
);
};
export default MapPage;
