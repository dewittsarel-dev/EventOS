import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto';
import { TaskPriority } from './dto/task-priority.enum';
import { TaskSortBy, TaskSortOrder } from './dto/task-sort.enum';
import { TaskStatus } from './dto/task-status.enum';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateTaskDto) {
    await this.ensureOrganizationAccess(userId, data.organizationId);
    await this.ensureEventOwnership(data.eventId, data.organizationId);

    if (data.assignedContactId) {
      await this.ensureContactOwnership(
        data.assignedContactId,
        data.organizationId,
      );
    }

    if (data.quotationId) {
      await this.ensureQuotationOwnership(
        data.quotationId,
        data.organizationId,
      );
    }

    const dueDate = new Date(data.dueDate);
    const status = data.status ?? TaskStatus.Todo;
    const priority = data.priority ?? TaskPriority.Normal;

    return this.prisma.task.create({
      data: {
        organizationId: data.organizationId,
        eventId: data.eventId,
        assignedContactId: data.assignedContactId,
        quotationId: data.quotationId,
        title: data.title,
        description: data.description,
        dueDate,
        priority,
        status,
        completedAt: status === TaskStatus.Completed ? new Date() : null,
      },
    });
  }

  async findAll(userId: string, query: FindTasksQueryDto) {
    await this.ensureOrganizationAccess(userId, query.organizationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const includeArchived = query.includeArchived ?? false;
    const sortBy = query.sortBy ?? TaskSortBy.DueDate;
    const sort = query.sort ?? TaskSortOrder.Asc;

    const dueDateFilter =
      query.dueFrom || query.dueTo
        ? {
            dueDate: {
              ...(query.dueFrom ? { gte: new Date(query.dueFrom) } : {}),
              ...(query.dueTo ? { lte: new Date(query.dueTo) } : {}),
            },
          }
        : {};

    const where = {
      organizationId: query.organizationId,
      ...(query.eventId ? { eventId: query.eventId } : {}),
      ...(query.assignedContactId
        ? { assignedContactId: query.assignedContactId }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(includeArchived ? {} : { archivedAt: null }),
      ...dueDateFilter,
      ...(query.search
        ? {
            OR: [
              {
                title: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: {
          [sortBy]: sort,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });

    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    await this.ensureOrganizationAccess(userId, task.organizationId);

    return task;
  }

  async update(userId: string, id: string, data: UpdateTaskDto) {
    const task = await this.findOne(userId, id);
    this.ensureNotArchived(task.archivedAt);

    if (data.eventId) {
      await this.ensureEventOwnership(data.eventId, task.organizationId);
    }

    if (data.assignedContactId) {
      await this.ensureContactOwnership(
        data.assignedContactId,
        task.organizationId,
      );
    }

    if (data.quotationId) {
      await this.ensureQuotationOwnership(
        data.quotationId,
        task.organizationId,
      );
    }

    const status = data.status ?? task.status;

    return this.prisma.task.update({
      where: { id: task.id },
      data: {
        eventId: data.eventId,
        assignedContactId:
          data.assignedContactId === null
            ? null
            : (data.assignedContactId ?? undefined),
        quotationId:
          data.quotationId === null ? null : (data.quotationId ?? undefined),
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        priority: data.priority,
        status,
        completedAt:
          status === TaskStatus.Completed
            ? (task.completedAt ?? new Date())
            : status === TaskStatus.Cancelled ||
                status === TaskStatus.Todo ||
                status === TaskStatus.Waiting ||
                status === TaskStatus.InProgress
              ? null
              : undefined,
      },
    });
  }

  async complete(userId: string, id: string, data?: CompleteTaskDto) {
    const task = await this.findOne(userId, id);
    this.ensureNotArchived(task.archivedAt);

    return this.prisma.task.update({
      where: { id: task.id },
      data: {
        status: TaskStatus.Completed,
        completedAt: data?.completedAt
          ? new Date(data.completedAt)
          : new Date(),
      },
    });
  }

  async archive(userId: string, id: string) {
    const task = await this.findOne(userId, id);

    await this.prisma.task.update({
      where: { id: task.id },
      data: {
        archivedAt: new Date(),
      },
    });
  }

  async remove(userId: string, id: string) {
    const task = await this.findOne(userId, id);

    await this.prisma.task.delete({
      where: { id: task.id },
    });
  }

  private ensureNotArchived(archivedAt: Date | null) {
    if (archivedAt) {
      throw new BadRequestException('Archived tasks cannot be updated');
    }
  }

  private async ensureOrganizationAccess(
    userId: string,
    organizationId: string,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }
  }

  private async ensureEventOwnership(eventId: string, organizationId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Event does not belong to this organization',
      );
    }
  }

  private async ensureContactOwnership(
    contactId: string,
    organizationId: string,
  ) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact || contact.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Contact does not belong to this organization',
      );
    }
  }

  private async ensureQuotationOwnership(
    quotationId: string,
    organizationId: string,
  ) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
    });

    if (!quotation || quotation.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Quotation does not belong to this organization',
      );
    }
  }
}
