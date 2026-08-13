/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { MarketplaceCustomerService } from './marketplace-customer.service';

jest.mock('bcryptjs');

describe('MarketplaceCustomerService', () => {
  const prisma = {
    marketplaceCustomer: { findUnique: jest.fn(), create: jest.fn() },
    resource: { findFirst: jest.fn() },
    marketplaceEnquiry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    marketplaceCustomerShortlistItem: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    marketplaceEnquiryMessage: { create: jest.fn() },
    marketplaceEventConcept: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    marketplaceEventConceptSelection: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const jwt = { sign: jest.fn().mockReturnValue('customer-token') };
  const marketplace = { findListing: jest.fn() };
  const service = new MarketplaceCustomerService(
    prisma as never,
    jwt as never,
    marketplace as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('registers an isolated customer and issues a customer-audience token', async () => {
    prisma.marketplaceCustomer.findUnique.mockResolvedValue(null);
    prisma.marketplaceCustomer.create.mockResolvedValue({
      id: 'customer-1',
      email: 'sam@example.com',
      name: 'Sam',
      phone: null,
    });
    jest.mocked(bcrypt.hash).mockResolvedValue('hash' as never);
    const result = await service.register({
      email: 'SAM@example.com',
      password: 'SecurePass1!',
      name: 'Sam',
    });
    expect(result.accessToken).toBe('customer-token');
    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ audience: 'marketplace-customer' }),
    );
  });

  it('rejects duplicate customer email addresses', async () => {
    prisma.marketplaceCustomer.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(
      service.register({
        email: 'sam@example.com',
        password: 'SecurePass1!',
        name: 'Sam',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not reveal whether an account exists during invalid login', async () => {
    prisma.marketplaceCustomer.findUnique.mockResolvedValue(null);
    await expect(
      service.login('missing@example.com', 'wrong'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('creates enquiries from server-owned customer identity', async () => {
    prisma.marketplaceCustomer.findUnique.mockResolvedValue({
      id: 'customer-1',
      email: 'sam@example.com',
      name: 'Sam',
      phone: '123',
    });
    prisma.resource.findFirst.mockResolvedValue({
      id: 'resource-1',
      organizationId: 'org-1',
    });
    prisma.marketplaceEnquiry.create.mockResolvedValue({ id: 'enquiry-1' });
    await service.createEnquiry('customer-1', {
      resourceId: 'resource-1',
      message: 'Need chairs',
    });
    expect(prisma.marketplaceEnquiry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'customer-1',
          customerEmail: 'sam@example.com',
          organizationId: 'org-1',
        }),
      }),
    );
  });

  it('creates a customer-owned event concept', async () => {
    prisma.marketplaceEventConcept.create.mockResolvedValue({
      id: 'concept-1',
      customerId: 'customer-1',
      title: 'Annual dinner',
      selections: [],
    });

    const result = await service.createEventConcept('customer-1', {
      title: 'Annual dinner',
    });

    expect(result.id).toBe('concept-1');
    expect(prisma.marketplaceEventConcept.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'customer-1',
          title: 'Annual dinner',
        }),
      }),
    );
  });

  it('adds only published Marketplace listings to a customer-owned concept', async () => {
    const concept = {
      id: 'concept-1',
      customerId: 'customer-1',
      selections: [],
    };
    prisma.marketplaceEventConcept.findFirst.mockResolvedValue(concept);
    marketplace.findListing.mockResolvedValue({
      id: 'resource-1',
      title: 'Gold Tiffany Chair',
    });
    prisma.marketplaceEventConceptSelection.upsert.mockResolvedValue({});
    prisma.marketplaceEventConcept.update.mockResolvedValue({});

    await service.addEventConceptSelection('customer-1', 'concept-1', {
      resourceId: 'resource-1',
      discoveryPath: 'GuidedBuilder',
      quantity: 100,
    });

    expect(marketplace.findListing).toHaveBeenCalledWith('resource-1');
    expect(prisma.marketplaceEventConceptSelection.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          conceptId: 'concept-1',
          resourceId: 'resource-1',
          discoveryPath: 'GuidedBuilder',
          quantity: 100,
        }),
      }),
    );
  });

  it('does not expose another customer event concept', async () => {
    prisma.marketplaceEventConcept.findFirst.mockResolvedValue(null);

    await expect(
      service.eventConcept('customer-2', 'concept-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
