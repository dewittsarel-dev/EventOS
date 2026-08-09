import { UnauthorizedException } from '@nestjs/common';
import { MarketplaceCustomerGuard } from './marketplace-customer.guard';

describe('MarketplaceCustomerGuard', () => {
  const jwt = { verifyAsync: jest.fn() };
  const prisma = { marketplaceCustomer: { findUnique: jest.fn() } };
  const request = { headers: { authorization: 'Bearer token' } } as never;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;
  const guard = new MarketplaceCustomerGuard(jwt as never, prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('accepts only Marketplace customer audience tokens', async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: 'customer-1',
      audience: 'marketplace-customer',
    });
    prisma.marketplaceCustomer.findUnique.mockResolvedValue({
      id: 'customer-1',
      email: 'sam@example.com',
      name: 'Sam',
      phone: null,
    });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rejects ClientOS tokens at the Marketplace customer boundary', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-1' });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
