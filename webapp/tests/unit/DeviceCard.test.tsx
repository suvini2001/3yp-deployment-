import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeviceCard from '../../src/components/DeviceCard';
import type { CrackEvent } from '../../src/hooks/useTelemetry';

// ─── Mock data helpers ────────────────────────────────────────────────────────

const makeCrack = (overrides: Partial<CrackEvent> = {}): CrackEvent => ({
  id: 'crack-1',
  type: 'Crack Detected',
  severity: 'HIGH',
  location: 'Track Marker KM 142.5',
  km: 142.5,
  timestamp: '2024-01-15T10:30:00.000Z',
  status: 'pending',
  confidence: 92,
  gps: { lat: 28.6155, lng: 77.21 },
  media: null,
  description: 'Significant transverse crack.',
  deviceId: 'device-001',
  sensorId: 'IR_Bottom',
  ...overrides,
});

const defaultProps = {
  deviceId: 'device-001',
  deviceName: 'Train Unit Alpha',
  isReal: true,
  isConnected: true,
  liveCracks: [],
  onViewDetails: vi.fn(),
  onCrackClick: vi.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DeviceCard', () => {
  // ── Rendering ──
  it('renders device name and ID', () => {
    render(<DeviceCard {...defaultProps} />);
    expect(screen.getByText('Train Unit Alpha')).toBeInTheDocument();
    expect(screen.getByText('device-001')).toBeInTheDocument();
  });

  it('shows REAL DATA badge when isReal=true', () => {
    render(<DeviceCard {...defaultProps} isReal={true} />);
    expect(screen.getByText(/REAL DATA/i)).toBeInTheDocument();
  });

  it('shows MOCK DATA badge when isReal=false', () => {
    render(<DeviceCard {...defaultProps} isReal={false} />);
    expect(screen.getByText(/MOCK DATA/i)).toBeInTheDocument();
  });

  // ── Connection status ──
  it('shows Live status when connected', () => {
    render(<DeviceCard {...defaultProps} isConnected={true} />);
    expect(screen.getByText(/Live/i)).toBeInTheDocument();
  });

  it('shows Disconnected status when not connected', () => {
    render(<DeviceCard {...defaultProps} isConnected={false} />);
    expect(screen.getByText(/Disconnected/i)).toBeInTheDocument();
  });

  // ── Crack counts ──
  it('shows total crack count of 0 when no cracks', () => {
    render(<DeviceCard {...defaultProps} liveCracks={[]} />);
    const counts = screen.getAllByText('0');
    // Both Total Cracks and Critical Alerts should be 0
    expect(counts.length).toBeGreaterThanOrEqual(2);
  });

  it('counts total cracks correctly', () => {
    const cracks = [makeCrack(), makeCrack({ id: 'c2', severity: 'LOW' })];
    render(<DeviceCard {...defaultProps} liveCracks={cracks} />);
    expect(screen.getByText('2')).toBeInTheDocument(); // Total Cracks = 2
  });

  it('counts only HIGH severity as critical alerts', () => {
    const cracks = [
      makeCrack({ id: 'c1', severity: 'HIGH' }),
      makeCrack({ id: 'c2', severity: 'HIGH' }),
      makeCrack({ id: 'c3', severity: 'LOW' }),
    ];
    render(<DeviceCard {...defaultProps} liveCracks={cracks} />);
    // Total = 3, High = 2
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  // ── Empty state ──
  it('shows "No detections yet" when crack list is empty', () => {
    render(<DeviceCard {...defaultProps} liveCracks={[]} />);
    expect(screen.getByText(/No detections yet/i)).toBeInTheDocument();
  });

  // ── Crack list ──
  it('renders crack list items when cracks exist', () => {
    const cracks = [makeCrack({ km: 142.5 })];
    render(<DeviceCard {...defaultProps} liveCracks={cracks} />);
    expect(screen.getByText(/142.5 km/i)).toBeInTheDocument();
  });

  it('shows up to 4 recent detections', () => {
    const cracks = Array.from({ length: 6 }, (_, i) =>
      makeCrack({ id: `c${i}`, km: 140 + i })
    );
    render(<DeviceCard {...defaultProps} liveCracks={cracks} />);
    // Only first 4 km values should appear
    expect(screen.getByText('140.0 km')).toBeInTheDocument();
    expect(screen.queryByText('145.0 km')).not.toBeInTheDocument();
  });

  it('shows correct status badge on each crack item (pending)', () => {
    const cracks = [makeCrack({ status: 'pending' })];
    render(<DeviceCard {...defaultProps} liveCracks={cracks} />);
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('shows correct status badge on each crack item (approved)', () => {
    const cracks = [makeCrack({ status: 'approved' as any })];
    render(<DeviceCard {...defaultProps} liveCracks={cracks} />);
    expect(screen.getByText('approved')).toBeInTheDocument();
  });

  // ── Actions ──
  it('calls onViewDetails when "View Details" button is clicked', () => {
    const onViewDetails = vi.fn();
    render(<DeviceCard {...defaultProps} onViewDetails={onViewDetails} />);
    fireEvent.click(screen.getByText('View Details'));
    expect(onViewDetails).toHaveBeenCalledTimes(1);
  });

  it('calls onCrackClick when a crack row is clicked', () => {
    const onCrackClick = vi.fn();
    const crack = makeCrack();
    render(<DeviceCard {...defaultProps} liveCracks={[crack]} onCrackClick={onCrackClick} />);
    fireEvent.click(screen.getByText(/142.5 km/i));
    expect(onCrackClick).toHaveBeenCalledWith(crack);
  });
});
