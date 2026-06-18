import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../src/pages/Login';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Supabase — no real network calls during tests
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-token' } },
        error: null,
      }),
    },
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── Helper ───────────────────────────────────────────────────────────────────

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Login page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // ── Rendering ──
  it('renders the app title "RailSafe Monitor"', () => {
    renderLogin();
    expect(screen.getByText('RailSafe Monitor')).toBeInTheDocument();
  });

  it('renders the subtitle "Track Crack Detection System"', () => {
    renderLogin();
    expect(screen.getByText('Track Crack Detection System')).toBeInTheDocument();
  });

  it('renders "Operator Login" heading', () => {
    renderLogin();
    expect(screen.getByText('Operator Login')).toBeInTheDocument();
  });

  it('renders email input field', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('admin@example.com')).toBeInTheDocument();
  });

  it('renders password input field', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('renders Sign In button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('renders email label', () => {
    renderLogin();
    expect(screen.getByText(/Email Address/i)).toBeInTheDocument();
  });

  it('renders password label', () => {
    renderLogin();
    expect(screen.getByText(/Password/i)).toBeInTheDocument();
  });

  it('renders authorized personnel notice', () => {
    renderLogin();
    expect(screen.getByText(/Authorized railway personnel only/i)).toBeInTheDocument();
  });

  // ── Password toggle ──
  it('password field is of type "password" by default (hidden)', () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('toggles password visibility when eye icon is clicked', () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    // Find toggle button (the button next to password input)
    const toggleBtn = screen.getByRole('button', { name: '' }); // eye icon button has no text
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('hides password again when eye icon is clicked a second time', () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const toggleBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(toggleBtn); // show
    fireEvent.click(toggleBtn); // hide again
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // ── Input interaction ──
  it('updates email state when user types', () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText('admin@example.com') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });

  it('updates password state when user types', () => {
    renderLogin();
    const passInput = screen.getByPlaceholderText('Enter your password') as HTMLInputElement;
    fireEvent.change(passInput, { target: { value: 'secret123' } });
    expect(passInput.value).toBe('secret123');
  });

  // ── Form attributes ──
  it('email input has type="email"', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('admin@example.com')).toHaveAttribute('type', 'email');
  });

  it('email input is required', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('admin@example.com')).toHaveAttribute('required');
  });

  it('password input is required', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Enter your password')).toHaveAttribute('required');
  });

  it('password input has minLength of 6', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Enter your password')).toHaveAttribute('minLength', '6');
  });

  // ── Submit button state ──
  it('Sign In button is not disabled initially', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /Sign In/i })).not.toBeDisabled();
  });
});
