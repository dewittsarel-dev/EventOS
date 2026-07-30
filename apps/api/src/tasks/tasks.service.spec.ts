import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskPriority } from './dto/task-priority.enum';
import { TaskStatus } from './dto/task-status.enum';

describe('TasksService', () => {
  const organizationId = '11111111-1111-4111-8111-111111111111';
  const otherOrganizationId = '22222222-2222-4222-8222-222222222222';
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const taskId = '99999999-9999-4999-8999-999999999999';
  const eventId = '55555555-5555-4555-8555-555555555555';
  const contactId = '33333333-3333-4333-8333-333333333333';
  const quotationId = '77777777-7777-4777-8777-777777777777';

  const prisma = {
    membership: {
      findUnique: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    contact: {
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

    prisma.membership.findUnique.mockResolvedValue({
      id: 'membership-1',
      userId,
      organizationId,
      role: 'owner',
    });

    prisma.event.findUnique.mockResolvedValue({ id: eventId, organizationId });
    prisma.contact.findUnique.mockResolvedValue({
      id: contactId,
      organizationId,
    });
    prisma.quotation.findUnique.mockResolvedValue({
      id: quotationId,
      organizationId,
    });
  });

  it('creates a task with default status and priority', async () => {
    prisma.task.create.mockResolvedValue({ id: taskId });

    const result = await service.create(userId, {
      organizationId,
      eventId,
      assignedContactId: contactId,
      quotationId,
      title: 'Confirm setup',
      description: 'Do before noon',
      dueDate: '2026-11-10T12:00:00.000Z',
    });

    expect(prisma.task.create).toHaveBeenCalled();
    expect(result).toEqual({ id: taskId });
  });

  it('lists tasks with pagination and filters', async () => {
    prisma.$transaction.mockImplementation(
      async (queries: Promise<unknown>[]) => Promise.all(queries),
    );
    prisma.task.findMany.mockResolvedValue([{ id: taskId }]);
    prisma.task.count.mockResolvedValue(1);

    const result = await service.findAll(userId, {
      organizationId,
      page: 2,
      limit: 5,
      search: 'setup',
      eventId,
      assignedContactId: contactId,
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
  });

  it('completes a task', async () => {
    prisma.task.findUnique.mockResolvedValue({
      id: taskId,
      organizationId,
      archivedAt: null,
      status: TaskStatus.InProgress,
      completedAt: null,
    });
    prisma.task.update.mockResolvedValue({
      id: taskId,
      status: TaskStatus.Completed,
    });

    const result = await service.complete(userId, taskId, {
      completedAt: '2026-11-10T18:00:00.000Z',
    });

    expect(prisma.task.update).toHaveBeenCalled();
    expect(result).toEqual({ id: taskId, status: TaskStatus.Completed });
  });

  it('rejects update when task is archived', async () => {
    prisma.task.findUnique.mockResolvedValue({
      id: taskId,
      organizationId,
      archivedAt: new Date(),
      status: TaskStatus.Todo,
    });

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
        dueDate: '2026-11-10T12:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
