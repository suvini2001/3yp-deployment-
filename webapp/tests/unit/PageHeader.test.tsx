import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageHeader from '../../src/components/PageHeader';
import { Train } from 'lucide-react';

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders title as an h1 element', () => {
    render(<PageHeader title="My Page" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('My Page');
  });

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Dashboard" subtitle="Welcome back" />);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('does NOT render subtitle when omitted', () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
  });

  it('renders an icon when provided', () => {
    render(<PageHeader title="Dashboard" icon={<Train data-testid="train-icon" />} />);
    expect(screen.getByTestId('train-icon')).toBeInTheDocument();
  });

  it('does NOT render icon wrapper when icon is not provided', () => {
    const { container } = render(<PageHeader title="Dashboard" />);
    // The icon wrapper div should not exist
    expect(container.querySelector('.bg-white\\/10')).not.toBeInTheDocument();
  });

  it('renders children content when provided', () => {
    render(
      <PageHeader title="Dashboard">
        <p data-testid="child-content">Extra content</p>
      </PageHeader>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});
