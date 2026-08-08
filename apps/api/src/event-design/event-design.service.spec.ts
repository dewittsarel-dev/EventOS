/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { EventDesignStatus } from '@prisma/client';
import { EventDesignService } from './event-design.service';

describe('EventDesignService', () => {
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const organizationId = '11111111-1111-1111-1111-111111111111';
  const eventId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const briefId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const designId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

  const prisma = {
    event: { findUnique: jest.fn() },
    membership: { findUnique: jest.fn() },
    clientBriefVersion: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    eventDesignVersion: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: EventDesignService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventDesignService(prisma as never);
    prisma.event.findUnique.mockResolvedValue({ id: eventId, organizationId });
    prisma.membership.findUnique.mockResolvedValue({ id: 'membership-1' });
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
  });

  it('creates the next immutable Client Brief version', async () => {
    prisma.clientBriefVersion.findFirst.mockResolvedValue({ version: 2 });
    prisma.clientBriefVersion.create.mockImplementation(async ({ data }) => ({
      id: briefId,
      ...data,
    }));

    const result = await service.createClientBriefVersion(userId, eventId, {
      clientName: 'Lara Croft',
      eventName: 'Wedding Reception',
      eventDates: ['2026-12-01'],
      eventType: 'Wedding',
      expectedGuests: 120,
      attachments: [{ name: 'brief.pdf', url: 'https://files.test/brief.pdf' }],
    });

    expect(result).toEqual(expect.objectContaining({ version: 3 }));
    expect(prisma.clientBriefVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId,
          organizationId,
          createdByUserId: userId,
          version: 3,
        }),
      }),
    );
  });

  it('rejects an Event Design linked to another event brief', async () => {
    prisma.clientBriefVersion.findUnique.mockResolvedValue({
      id: briefId,
      eventId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    });

    await expect(
      service.createEventDesignVersion(userId, eventId, {
        clientBriefVersionId: briefId,
        seating: { tableType: 'round' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a draft Event Design with all approved category boundaries', async () => {
    prisma.clientBriefVersion.findUnique.mockResolvedValue({
      id: briefId,
      eventId,
    });
    prisma.eventDesignVersion.findFirst.mockResolvedValue({ version: 1 });
    prisma.eventDesignVersion.create.mockImplementation(async ({ data }) => ({
      id: designId,
      status: EventDesignStatus.Draft,
      ...data,
    }));

    const categories = {
      seating: { tableType: 'round' },
      decor: { theme: 'garden' },
      catering: { serviceStyle: 'plated' },
      entertainment: { format: 'band' },
      lightingAndAv: { lightingStyle: 'warm' },
      branding: { signage: true },
      infrastructure: { tent: true },
      staffing: { waiters: 'required' },
    };
    const result = await service.createEventDesignVersion(userId, eventId, {
      clientBriefVersionId: briefId,
      ...categories,
    });

    expect(result).toEqual(
      expect.objectContaining({ version: 2, status: EventDesignStatus.Draft }),
    );
    expect(prisma.eventDesignVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining(categories) }),
    );
  });

  it('records the human approval without changing design content', async () => {
    prisma.eventDesignVersion.findUnique.mockResolvedValue({
      id: designId,
      eventId,
      status: EventDesignStatus.Draft,
    });
    prisma.eventDesignVersion.update.mockResolvedValue({
      id: designId,
      status: EventDesignStatus.Approved,
      approvedByUserId: userId,
    });

    await service.approveEventDesignVersion(userId, eventId, designId);

    expect(prisma.eventDesignVersion.update).toHaveBeenCalledWith({
      where: { id: designId },
      data: {
        status: EventDesignStatus.Approved,
        approvedByUserId: userId,
        approvedAt: expect.any(Date),
      },
    });
  });

  it('does not approve the same design twice', async () => {
    prisma.eventDesignVersion.findUnique.mockResolvedValue({
      id: designId,
      eventId,
      status: EventDesignStatus.Approved,
    });

    await expect(
      service.approveEventDesignVersion(userId, eventId, designId),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('denies access outside the event organization', async () => {
    prisma.membership.findUnique.mockResolvedValue(null);

    await expect(
      service.listClientBriefVersions(userId, eventId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
