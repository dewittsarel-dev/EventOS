import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TaskPriority } from './dto/task-priority.enum';
import { TaskStatus } from './dto/task-status.enum';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  const organizationId = '11111111-1111-4111-8111-111111111111';
  const otherOrganizationId = '22222222-2222-4222-8222-222222222222';
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const assignedUserId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const taskId = '99999999-9999-4999-8999-999999999999';
  const eventId = '55555555-5555-4555-8555-555555555555';
  const quotationId = '77777777-7777-4777-8777-777777777777';

  function taskRecord(overrides: Record<string, unknown> = {}) {
    return {
      id: taskId,
      organizationId,
      eventId,
      assignedUserId,
      quotationId,
      title: 'Confirm setup',
      description: 'Do before noon',
      dueDate: new Date('2026-11-10T12:00:00.000Z'),
      priority: TaskPriority.Medium,
      status: TaskStatus.Todo,
      completedAt: null,
      archivedAt: null,
      createdAt: new Date('2026-07-30T00:00:00.000Z'),
      updatedAt: new Date('2026-07-30T00:00:00.000Z'),
      createdByUserId: userId,
      organization: {
        id: organizationId,
        name: 'EventOS',
      },
      assignedUser: {
        id: assignedUserId,
        name: 'Assigned User',
        email: 'assigned@example.com',
      },
      createdBy: {
        id: userId,
        name: 'Creator User',
        email: 'creator@example.com',
      },
      ...overrides,
    };
  }

  const prisma = {
    membership: {
      findUnique: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    quotation: {
      findUnique: jest.fn(),
    },
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: TasksService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TasksService(prisma as never);

    prisma.membership.findUnique.mockImplementation(
      ({
        where,
      }: {
        where: {
          userId_organizationId: { userId: string; organizationId: string };
        };
      }) => {
        const match =
          where.userId_organizationId.organizationId === organizationId &&
          (where.userId_organizationId.userId === userId ||
            where.userId_organizationId.userId === assignedUserId);

        if (!match) {
          return Promise.resolve(null);
        }

        return Promise.resolve({
          id: 'membership-1',
          userId: where.userId_organizationId.userId,
          organizationId,
          role: 'owner',
        });
      },
    );

    prisma.event.findUnique.mockResolvedValue({ id: eventId, organizationId });
    prisma.quotation.findUnique.mockResolvedValue({
      id: quotationId,
      organizationId,
    });
  });

  it('creates a task with default status and priority', async () => {
    prisma.task.create.mockResolvedValue(taskRecord());

    const result = await service.create(userId, {
      organizationId,
      eventId,
      assignedUserId,
      quotationId,
      title: 'Confirm setup',
      description: 'Do before noon',
      dueDate: '2026-11-10T12:00:00.000Z',
    });

    expect(prisma.task.create).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        id: taskId,
        priority: TaskPriority.Medium,
        status: TaskStatus.Todo,
        assignedUserId,
      }),
    );
  });

  it('lists tasks with pagination and filters', async () => {
    prisma.$transaction.mockImplementation(
      async (queries: Promise<unknown>[]) => Promise.all(queries),
    );
    prisma.task.findMany.mockResolvedValue([taskRecord()]);
    prisma.task.count.mockResolvedValue(1);

    const result = await service.findAll(userId, {
      organizationId,
      page: 2,
      limit: 5,
      search: 'setup',
      eventId,
      assignedUserId,
      status: TaskStatus.Todo,
      priority: TaskPriority.High,
      dueFrom: '2026-11-01T00:00:00.000Z',
      dueTo: '2026-11-30T23:59:59.000Z',
      sortBy: 'dueDate',
      sort: 'asc',
      includeArchived: false,
    });

    expect(prisma.task.findMany).toHaveBeenCalled();
    expect(result.meta).toEqual({ page: 2, limit: 5, total: 1 });
    expect(result.data[0]).toEqual(
      expect.objectContaining({
        id: taskId,
        assignedUserId,
      }),
    );
  });

  it('updates task status to completed', async () => {
    prisma.task.findUnique.mockResolvedValue(
      taskRecord({
        archivedAt: null,
        status: TaskStatus.InProgress,
        completedAt: null,
      }),
    );
    prisma.task.update.mockResolvedValue(
      taskRecord({
        status: TaskStatus.Completed,
        completedAt: new Date('2026-11-10T18:00:00.000Z'),
      }),
    );

    const result = await service.updateStatus(userId, taskId, {
      status: TaskStatus.Completed,
    });

    expect(prisma.task.update).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        id: taskId,
        status: TaskStatus.Completed,
      }),
    );
  });

  it('rejects update when task is archived', async () => {
    prisma.task.findUnique.mockResolvedValue(
      taskRecord({
        archivedAt: new Date(),
      }),
    );

    await expect(
      service.update(userId, taskId, {
        title: 'Changed title',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forbids create when event belongs to another organization', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: eventId,
      organizationId: otherOrganizationId,
    });

    await expect(
      service.create(userId, {
        organizationId,
        eventId,
        title: 'Forbidden task',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
