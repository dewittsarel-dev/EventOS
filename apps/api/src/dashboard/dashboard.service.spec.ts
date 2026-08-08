import { ForbiddenException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const organizationId = '11111111-1111-4111-8111-111111111111';

  const prisma = {
    membership: {
      findUnique: jest.fn(),
    },
    event: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    quotation: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    task: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    supplier: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    contact: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService(prisma as never);

    prisma.membership.findUnique.mockResolvedValue({
      id: 'membership-1',
      userId,
      organizationId,
      role: 'owner',
    });

    prisma.event.count.mockResolvedValueOnce(3).mockResolvedValueOnce(7);
    prisma.quotation.count.mockResolvedValue(4);
    prisma.task.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    prisma.supplier.count.mockResolvedValue(6);
    prisma.contact.count.mockResolvedValue(22);

    prisma.event.findMany
      .mockResolvedValueOnce([
        {
          id: 'event-1',
          title: 'Launch Gala',
          startDateTime: new Date('2026-08-10T10:00:00.000Z'),
          status: 'Planned',
          contact: { firstName: 'Alicia', lastName: 'Keys' },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'event-2',
          title: 'Production Review',
          createdAt: new Date('2026-08-01T12:00:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'event-1',
          title: 'Launch Gala',
          startDateTime: new Date('2026-08-10T10:00:00.000Z'),
          status: 'Planned',
          contact: { firstName: 'Alicia', lastName: 'Keys' },
        },
      ]);

    prisma.task.findMany
      .mockResolvedValueOnce([
        {
          id: 'task-1',
          title: 'Call venue',
          dueDate: new Date('2026-08-01T10:00:00.000Z'),
          status: 'Todo',
          priority: 'High',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'task-9',
          title: 'Finalize run sheet',
          completedAt: new Date('2026-08-01T09:00:00.000Z'),
        },
      ]);

    prisma.supplier.findMany.mockResolvedValue([
      {
        id: 'supplier-1',
        companyName: 'Nova Security',
        createdAt: new Date('2026-08-01T11:00:00.000Z'),
      },
    ]);

    prisma.contact.findMany.mockResolvedValue([
      {
        id: 'contact-1',
        firstName: 'Alex',
        lastName: 'Meyer',
        createdAt: new Date('2026-08-01T08:30:00.000Z'),
      },
    ]);

    prisma.quotation.findMany.mockResolvedValue([
      {
        id: 'quotation-1',
        quoteNumber: 'Q-100',
        title: 'Expo Package',
        createdAt: new Date('2026-08-01T10:30:00.000Z'),
      },
    ]);
  });

  it('returns aggregated dashboard overview', async () => {
    const result = await service.getOverview(userId, {
      organizationId,
      upcomingLimit: 5,
      tasksLimit: 5,
      activityLimit: 10,
    });

    expect(result.stats).toEqual({
      eventsThisMonth: 3,
      upcomingEvents: 7,
      openQuotations: 4,
      tasksDueToday: 2,
      overdueTasks: 1,
      activeSuppliers: 6,
      totalContacts: 22,
    });

    expect(result.attention).toEqual(
      expect.objectContaining({
        status: 'NeedsAttention',
      }),
    );

    expect(result.upcomingEvents[0]).toEqual(
      expect.objectContaining({
        event: 'Launch Gala',
        client: 'Alicia Keys',
      }),
    );
    expect(result.myTasks.dueToday[0]).toEqual(
      expect.objectContaining({ title: 'Call venue' }),
    );
    expect(result.recentActivity.length).toBeGreaterThan(0);
    expect(result.calendarPreview.length).toBeGreaterThan(0);
  });

  it('throws forbidden when user is outside organization', async () => {
    prisma.membership.findUnique.mockResolvedValue(null);

    await expect(
      service.getOverview(userId, {
        organizationId,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
