import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketplaceHeader } from './marketplace-shell';

const readSession = vi.fn();

vi.mock('@/lib/marketplace-customer-session', () => ({
  readMarketplaceCustomerSession: () => readSession(),
}));

describe('MarketplaceHeader', () => {
  beforeEach(() => readSession.mockReset());

  it('keeps customer and business navigation clearly separated', () => {
    readSession.mockReturnValue(null);
    render(<MarketplaceHeader />);

    expect(screen.getByRole('link', { name: 'EventOS Marketplace home' })).toHaveAttribute('href', '/marketplace');
    expect(screen.getByRole('link', { name: 'Customer sign in' })).toHaveAttribute('href', '/marketplace/account');
    expect(screen.getByRole('link', { name: 'Business ClientOS' })).toHaveAttribute('href', '/login');
  });

  it('shows the signed-in customer planning destination', () => {
    readSession.mockReturnValue({ accessToken: 'token', customer: { name: 'Alex' } });
    render(<MarketplaceHeader compact />);

    expect(screen.getByRole('link', { name: 'My planning' })).toHaveAttribute('href', '/marketplace/account');
  });
});
