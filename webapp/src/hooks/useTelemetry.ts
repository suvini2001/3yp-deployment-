import { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface CrackEvent {
  id?: string | number;
  gps?: any;
  media?: any;
  imageUrl?: string;  // For camera detections
  image_url?: string; // Alternative field name
  timestamp?: string;
  status?: string;
  crackDetected?: boolean;
  crack_detected?: boolean;
  [key: string]: any; // Allow other properties returned by the backend
}

type AnyRecord = Record<string, any>;

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null;
}

function unwrapDynamoValue(value: any): any {
  if (!isRecord(value)) {
    return value;
  }

  const keys = Object.keys(value);
  if (keys.length === 1) {
    const [key] = keys;
    switch (key) {
      case 'S':
        return value.S;
      case 'N': {
        const parsed = Number(value.N);
        return Number.isFinite(parsed) ? parsed : value.N;
      }
      case 'BOOL':
        return Boolean(value.BOOL);
      case 'NULL':
        return null;
      case 'M':
        return unwrapDynamoValue(value.M);
      case 'L':
        return Array.isArray(value.L) ? value.L.map(unwrapDynamoValue) : [];
      default:
        break;
    }
  }


  const normalized: AnyRecord = {};
  for (const [k, v] of Object.entries(value)) {
    normalized[k] = unwrapDynamoValue(v);
  }
  return normalized;
}

function firstNonEmptyString(candidates: any[]): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return undefined;
}

function normalizeCrackEvent(raw: any): CrackEvent {
  const base = unwrapDynamoValue(raw) ?? {};
  const media = unwrapDynamoValue(base.media ?? base.Media ?? null);
  const location = unwrapDynamoValue(base.location ?? base.Location ?? null);
  const gps = unwrapDynamoValue(base.gps ?? location ?? null);

  const imageUrl = firstNonEmptyString([
    base.imageUrl,
    base.image_url,
    base.imageURL,
    base.photoUrl,
    base.photo_url,
    base.url,
    media?.imageUrl,
    media?.image_url,
    media?.photoUrl,
    media?.photo_url,
    media?.s3Url,
    media?.s3_url,
    media?.url,
  ]);

  // Flatten location coords to top level so all components can read them directly
  const lat = location?.lat ?? location?.latitude ?? gps?.lat ?? gps?.latitude ?? base.latitude ?? base.lat;
  const lng = location?.lng ?? location?.longitude ?? gps?.lng ?? gps?.longitude ?? base.longitude ?? base.lng;
  const locationValid = location?.valid ?? base.locationValid ?? (lat != null && lat !== 0);

  return {
    ...base,
    media,
    location,
    gps,
    imageUrl,
    latitude: lat,
    longitude: lng,
    locationValid,
    crackDetected: base.crackDetected ?? base.crack_detected ?? true,
  };
}

export function useTelemetry(deviceId: string, sensorId: string) {
  const [liveCracks, setLiveCracks] = useState<CrackEvent[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080";
    const wsUrl = (import.meta.env.VITE_BACKEND_WS_URL as string | undefined) ?? "http://localhost:8080/raid-websocket";

    // 1. Fetch Historical Data (Cold Path)
    // NOTE: The URL is /api/cracks/{deviceId}/{sensorId}
    // The controller passes these to getCracksByDeviceAndSensor(deviceId, sensorId)
    // The repository queries DynamoDB WHERE SensorID = sensorId AND deviceId = deviceId
    // So sensorId here MUST match the DynamoDB Partition Key value (e.g. "LEFT", "RIGHT", "CENTER")
    fetch(`${apiBaseUrl}/api/cracks/${deviceId}/${sensorId}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log(`[useTelemetry] Fetched ${Array.isArray(data) ? data.length : 0} records for ${deviceId}/${sensorId}`);
        const normalized = (Array.isArray(data) ? data : [])
          .map(normalizeCrackEvent)
          .reverse();
        setLiveCracks(normalized);
      })
      .catch(err => console.error("Historical fetch error:", err));

    // 2. Establish Real-Time Connection (Hot Path)
    const stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      
      onConnect: () => {
        setIsConnected(true);
        console.log(`Connected to telemetry stream: ${deviceId}/${sensorId}`);

        // Subscribe to IR Sensor crack data
        stompClient.subscribe(`/topic/cracks`, (message) => {
          const rawData = JSON.parse(message.body);
          const safeCrackEvent = normalizeCrackEvent(rawData);

            setLiveCracks(prev => [safeCrackEvent, ...prev].slice(0, 100));
        });

        // Subscribe to Camera detections (with image URLs)
        stompClient.subscribe(`/topic/camera-detections`, (message) => {
            const cameraData = JSON.parse(message.body);
          const cameraCrackEvent = normalizeCrackEvent(cameraData);

            console.log("Camera detection received with imageUrl:", cameraCrackEvent.imageUrl);
            setLiveCracks(prev => [cameraCrackEvent, ...prev].slice(0, 100));
        });
      },
      onDisconnect: () => setIsConnected(false),
      onStompError: (err) => console.error("Broker error:", err)
    });

    stompClient.activate();

    return () => {
        stompClient.deactivate();
        setIsConnected(false);
    };
  }, [deviceId, sensorId]);

  return { liveCracks, isConnected };
}





/*
==================== useTelemetry HOOK ====================

1. PURPOSE:
- Fetches historical crack data from REST API
- Streams real-time crack data using WebSocket (STOMP + SockJS)
- Combines both into a single live dashboard dataset

2. INPUTS:
- deviceId: ID of the IoT device
- sensorId: ID of the sensor

3. STATE:
- liveCracks: stores all crack events (newest first, max 100)
- isConnected: shows WebSocket connection status

4. COLD PATH (REST API):
- Fetches past stored crack data from backend
- Reverses data to show newest first

5. HOT PATH (WEBSOCKET):
- Connects to /raid-websocket using SockJS
- Subscribes to /topic/cracks/{deviceId}/{sensorId}
- Receives real-time crack updates

6. DATA HANDLING:
- Parses incoming JSON messages
- Adds missing fields safely (gps, media)
- Prepends new events to state

7. OPTIMIZATION:
- Keeps only latest 100 records to avoid memory issues

8. CLEANUP:
- Disconnects WebSocket when component unmounts or dependencies change

9. OUTPUT:
- liveCracks: combined historical + real-time data
- isConnected: connection status indicator

===================================================================
*/

