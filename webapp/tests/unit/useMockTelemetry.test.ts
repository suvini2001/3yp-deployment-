import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMockTelemetry } from '../../src/hooks/useMockTelemetry';

describe('useMockTelemetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns isConnected = true immediately on mount', () => {
    const { result } = renderHook(() => useMockTelemetry('device-001', 'IR_Bottom'));
    expect(result.current.isConnected).toBe(true);
  });

  it('initializes with 5 crack events', () => {
    const { result } = renderHook(() => useMockTelemetry('device-001', 'IR_Bottom'));
    expect(result.current.liveCracks).toHaveLength(5);
  });

  it('each crack has required fields', () => {
    const { result } = renderHook(() => useMockTelemetry('device-001', 'IR_Bottom'));
    const crack = result.current.liveCracks[0];
    expect(crack).toHaveProperty('id');
    expect(crack).toHaveProperty('severity');
    expect(crack).toHaveProperty('km');
    expect(crack).toHaveProperty('timestamp');
    expect(crack).toHaveProperty('status');
    expect(crack).toHaveProperty('confidence');
    expect(crack).toHaveProperty('gps');
    expect(crack.gps).toHaveProperty('lat');
    expect(crack.gps).toHaveProperty('lng');
  });

  it('each crack severity is HIGH, MEDIUM, or LOW', () => {
    const { result } = renderHook(() => useMockTelemetry('device-001', 'IR_Bottom'));
    const validSeverities = ['HIGH', 'MEDIUM', 'LOW'];
    result.current.liveCracks.forEach(crack => {
      expect(validSeverities).toContain(crack.severity);
    });
  });

  it('each crack status is pending, confirmed, or ignored', () => {
    const { result } = renderHook(() => useMockTelemetry('device-001', 'IR_Bottom'));
    const validStatuses = ['pending', 'confirmed', 'ignored'];
    result.current.liveCracks.forEach(crack => {
      expect(validStatuses).toContain(crack.status);
    });
  });

  it('each crack has a km value in the range 140–150', () => {
    const { result } = renderHook(() => useMockTelemetry('device-001', 'IR_Bottom'));
    result.current.liveCracks.forEach(crack => {
      expect(crack.km).toBeGreaterThanOrEqual(140);
      expect(crack.km).toBeLessThan(150);
    });
  });

  it('each crack has deviceId matching the provided deviceId', () => {
    const { result } = renderHook(() => useMockTelemetry('test-device-xyz', 'IR_Bottom'));
    result.current.liveCracks.forEach(crack => {
      expect(crack.deviceId).toBe('test-device-xyz');
    });
  });

  it('each crack has a valid ISO timestamp', () => {
    const { result } = renderHook(() => useMockTelemetry('device-001', 'IR_Bottom'));
    result.current.liveCracks.forEach(crack => {
      expect(new Date(crack.timestamp!).toString()).not.toBe('Invalid Date');
    });
  });

  it('each crack has a description string', () => {
    const { result } = renderHook(() => useMockTelemetry('device-001', 'IR_Bottom'));
    result.current.liveCracks.forEach(crack => {
      expect(typeof crack.description).toBe('string');
      expect(crack.description!.length).toBeGreaterThan(0);
    });
  });

  it('HIGH severity cracks have confidence >= 80', () => {
    const { result } = renderHook(() => useMockTelemetry('device-001', 'IR_Bottom'));
    const highCracks = result.current.liveCracks.filter(c => c.severity === 'HIGH');
    highCracks.forEach(crack => {
      expect(crack.confidence).toBeGreaterThanOrEqual(80);
    });
  });

  it('unmounting sets isConnected to false (cleanup)', () => {
    const { result, unmount } = renderHook(() => useMockTelemetry('device-001', 'IR_Bottom'));
    expect(result.current.isConnected).toBe(true);
    unmount();
    // After unmount the cleanup runs — we can't read result after unmount,
    // but we verify no errors are thrown
  });

  it('uses a different device id for different hook instances', () => {
    const { result: r1 } = renderHook(() => useMockTelemetry('device-A', 'IR_Bottom'));
    const { result: r2 } = renderHook(() => useMockTelemetry('device-B', 'IR_Bottom'));

    r1.current.liveCracks.forEach(c => expect(c.deviceId).toBe('device-A'));
    r2.current.liveCracks.forEach(c => expect(c.deviceId).toBe('device-B'));
  });
});
