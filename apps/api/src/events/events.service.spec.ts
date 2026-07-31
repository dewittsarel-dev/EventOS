import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventStatus } from './dto/event-status.enum';

describe('EventsService', () => {
  const organizationId = '11111111-1111-1111-1111-111111111111';
  const otherOrganizationId = '22222222-2222-2222-2222-222222222222';
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const assignedUserId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const eventId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const contactId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  function makeEvent(overrides: Record<string, unknown> = {}) {
    return {
      id: eventId,
      organizationId,
      contactId,
      assignedUserId,
      title: 'Wedding Event',
      eventType: 'Wedding',
      eventDate: new Date('2026-12-01T00:00:00.000Z'),
      startTime: '12:00',
      endTime: '14:00',
      venue: 'Venue 1',
      budgetCents: 120000,
      notes: 'Reception details',
      description: 'Reception details',
      startDateTime: new Date('2026-12-01T12:00:00.000Z'),
      endDateTime: new Date('2026-12-01T14:00:00.000Z'),
      location: 'Venue 1',
      status: EventStatus.Draft,
      createdAt: new Date(),
      updatedAt: new Date(),
      contact: {
        firstName: 'Lara',
        lastName: 'Croft',
      },
      assignedUser: {
        id: assignedUserId,
        name: 'Alice Admin',
        email: 'alice@example.com',
      },
      ...overrides,
    };
  }

  const prisma = {
    membership: {
      findUnique: jest.fn(),
    },
    contact: {
      findUnique: jest.fn(),
    },
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: EventsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventsService(prisma as never);

    prisma.membership.findUnique.mockResolvedValue({
      id: 'membership-1',
      userId,
      organizationId,
      role: 'owner',
    });

    prisma.contact.findUnique.mockResolvedValue({
      id: contactId,
      organizationId,
    });
  });

  it('creates an event when access and contact ownership are valid', async () => {
    prisma.event.create.mockResolvedValue(makeEvent());

    const result = await service.create(userId, {
      organizationId,
      contactId,
      assignedUserId,
      title: 'Wedding Event',
      eventType: 'Wedding',
      eventDate: '2026-12-01T00:00:00.000Z',
      startTime: '12:00',
      endTime: '14:00',
      venue: 'Venue 1',
      budgetCents: 120000,
      notes: 'Reception',
      status: EventStatus.Draft,
    });

    expect(prisma.event.create).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        id: eventId,
        contactName: 'Lara Croft',
        assignedUserName: 'Alice Admin',
      }),
    );
  });

  it('lists paginated events with filters', async () => {
    prisma.$transaction.mockImplementation(
      async (queries: Promise<unknown>[]) => Promise.all(queries),
    );
    prisma.event.findMany.mockResolvedValue([makeEvent()]);
    prisma.event.count.mockResolvedValue(1);

    const result = await service.findAll(userId, {
      organizationId,
      page: 2,
      limit: 5,
      search: 'Wedding',
      status: EventStatus.Planned,
      sort: 'asc',
    });

    expect(prisma.event.findMany).toHaveBeenCalled();
    expect(prisma.event.count).toHaveBeenCalled();
    expect(result.meta).toEqual({ page: 2, limit: 5, total: 1 });
    expect(result.data[0]).toEqual(
      expect.objectContaining({
        id: eventId,
        contactName: 'Lara Croft',
      }),
    );
  });

  it('throws forbidden if contact belongs to another organization', async () => {
    prisma.contact.findUnique.mockResolvedValue({
      id: contactId,
      organizationId: otherOrganizationId,
    });

    await expect(
      service.create(userId, {
        organizationId,
        contactId,
        assignedUserId,
        title: 'Wedding Event',
        eventType: 'Wedding',
        eventDate: '2026-12-01T00:00:00.000Z',
        startTime: '12:00',
        endTime: '14:00',
        venue: 'Venue 1',
        budgetCents: 120000,
        notes: 'Reception',
        status: EventStatus.Draft,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws not found on missing event read', async () => {
    prisma.event.findUnique.mockResolvedValue(null);

    await expect(service.findOne(userId, eventId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes an event in own organization', async () => {
    prisma.event.findUnique.mockResolvedValue(makeEvent());

    await service.remove(userId, eventId);

    expect(prisma.event.delete).toHaveBeenCalledWith({
      where: { id: eventId },
    });
  });
});
