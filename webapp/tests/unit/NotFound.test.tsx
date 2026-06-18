import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '../../src/pages/NotFound';

const renderNotFound = (path = '/some/bad/route') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <NotFound />
    </MemoryRouter>
  );

describe('NotFound page', () => {
  it('renders 404 heading', () => {
    renderNotFound();
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
  });

  it('renders "Page not found" message', () => {
    renderNotFound();
    expect(screen.getByText(/Page not found/i)).toBeInTheDocument();
  });

  it('renders "Return to Home" link', () => {
    renderNotFound();
    expect(screen.getByRole('link', { name: /Return to Home/i })).toBeInTheDocument();
  });

  it('"Return to Home" link points to "/"', () => {
    renderNotFound();
    const link = screen.getByRole('link', { name: /Return to Home/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders within a min-h-screen container', () => {
    const { container } = renderNotFound();
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.classList.toString()).toContain('min-h-screen');
  });
});
