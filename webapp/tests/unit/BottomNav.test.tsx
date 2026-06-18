import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BottomNav from '../../src/components/BottomNav';

// ─── Mock dependencies ────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AlertContext with 2 pending alerts and 1 confirmed alert
vi.mock('@/context/AlertContext', () => ({
  useAlerts: () => ({
    alerts: [
      { id: '1', status: 'pending' },
      { id: '2', status: 'pending' },
      { id: '3', status: 'confirmed' },
    ],
  }),
}));

// ─── Helper ───────────────────────────────────────────────────────────────────

const renderNav = (initialPath = '/dashboard') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <BottomNav />
    </MemoryRouter>
  );

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BottomNav', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders all three nav items', () => {
    renderNav();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('navigates to /dashboard when Home is clicked', () => {
    renderNav('/map');
    fireEvent.click(screen.getByText('Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to /map when Map is clicked', () => {
    renderNav('/dashboard');
    fireEvent.click(screen.getByText('Map'));
    expect(mockNavigate).toHaveBeenCalledWith('/map');
  });

  it('navigates to /reports when Reports is clicked', () => {
    renderNav('/dashboard');
    fireEvent.click(screen.getByText('Reports'));
    expect(mockNavigate).toHaveBeenCalledWith('/reports');
  });

  it('renders inside a nav element', () => {
    renderNav();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders 3 clickable buttons', () => {
    renderNav();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  // ─── New Tests for Class Styling & Alert Badges ────────────────────────────

  it('applies active styles to the current active route item', () => {
    renderNav('/dashboard');
    
    // Find the closest button element enclosing the text 'Home'
    const homeButton = screen.getByText('Home').closest('button');
    const mapButton = screen.getByText('Map').closest('button');

    expect(homeButton).toHaveClass('bottom-nav-active');
    expect(mapButton).not.toHaveClass('bottom-nav-active');
    expect(mapButton).toHaveClass('text-muted-foreground');
  });

  it('displays the correct number of pending alerts as a badge', () => {
    renderNav();
    
    // Based on the mock context, there are 2 'pending' alerts
    const badge = screen.getByText('2');
    expect(badge).toBeInTheDocument();
    
    // Verifies CSS utility classes are attached to the badge structure
    expect(badge).toHaveClass('bg-destructive');
  });
});