import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto';
import { TaskPriority } from './dto/task-priority.enum';
import { TaskSortBy, TaskSortOrder } from './dto/task-sort.enum';
import { TaskStatus } from './dto/task-status.enum';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly taskInclude = {
    organization: {
      select: {
        id: true,
        name: true,
      },
    },
    assignedUser: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    createdBy: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  };

  async create(userId: string, data: CreateTaskDto) {
    await this.ensureOrganizationAccess(userId, data.organizationId);

    if (data.eventId) {
      await this.ensureEventOwnership(data.eventId, data.organizationId);
    }

    if (data.assignedUserId) {
      await this.ensureAssignedUserInOrganization(
        data.assignedUserId,
        data.organizationId,
      );
    }

    if (data.quotationId) {
      await this.ensureQuotationOwnership(
        data.quotationId,
        data.organizationId,
      );
    }

    const dueDate = data.dueDate ? new Date(data.dueDate) : null;
    const status = data.status ?? TaskStatus.Todo;
    const priority = data.priority ?? TaskPriority.Medium;

    const created = await this.prisma.task.create({
      data: {
        organizationId: data.organizationId,
        eventId: data.eventId,
        assignedUserId: data.assignedUserId,
        quotationId: data.quotationId,
        createdByUserId: userId,
        title: data.title,
        description: data.description,
        dueDate,
        priority,
        status,
        completedAt: status === TaskStatus.Completed ? new Date() : null,
      },
      include: this.taskInclude,
    });

    return this.mapTask(created);
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
      ...(query.assignedUserId ? { assignedUserId: query.assignedUserId } : {}),
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
        include: this.taskInclude,
        orderBy: {
          [sortBy]: sort,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: data.map((task) => this.mapTask(task)),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: this.taskInclude,
    });

    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    await this.ensureOrganizationAccess(userId, task.organizationId);

    return this.mapTask(task);
  }

  async update(userId: string, id: string, data: UpdateTaskDto) {
    const task = await this.findTaskForUpdate(userId, id);
    this.ensureNotArchived(task.archivedAt);

    if (data.eventId) {
      await this.ensureEventOwnership(data.eventId, task.organizationId);
    }

    if (data.assignedUserId) {
      await this.ensureAssignedUserInOrganization(
        data.assignedUserId,
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

    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: {
        eventId: data.eventId,
        assignedUserId:
          data.assignedUserId === null
            ? null
            : (data.assignedUserId ?? undefined),
        quotationId:
          data.quotationId === null ? null : (data.quotationId ?? undefined),
        title: data.title,
        description: data.description,
        dueDate:
          data.dueDate === null
            ? null
            : data.dueDate
              ? new Date(data.dueDate)
              : undefined,
        priority: data.priority,
        status,
        completedAt: this.resolveCompletedAt(status, task.completedAt),
      },
      include: this.taskInclude,
    });

    return this.mapTask(updated);
  }

  async updateStatus(userId: string, id: string, data: UpdateTaskStatusDto) {
    const task = await this.findTaskForUpdate(userId, id);
    this.ensureNotArchived(task.archivedAt);

    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: {
        status: data.status,
        completedAt: this.resolveCompletedAt(data.status, task.completedAt),
      },
      include: this.taskInclude,
    });

    return this.mapTask(updated);
  }

  async archive(userId: string, id: string) {
    const task = await this.findTaskForUpdate(userId, id);

    await this.prisma.task.update({
      where: { id: task.id },
      data: {
        archivedAt: new Date(),
      },
    });
  }

  async remove(userId: string, id: string) {
    const task = await this.findTaskForUpdate(userId, id);

    await this.prisma.task.delete({
      where: { id: task.id },
    });
  }

  private async findTaskForUpdate(userId: string, id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });

    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    await this.ensureOrganizationAccess(userId, task.organizationId);

    return task;
  }

  private resolveCompletedAt(
    status: TaskStatus,
    previousCompletedAt: Date | null,
  ): Date | null {
    if (status === TaskStatus.Completed) {
      return previousCompletedAt ?? new Date();
    }

    return null;
  }

  private mapTask(task: {
    id: string;
    organizationId: string;
    eventId: string | null;
    assignedUserId: string | null;
    quotationId: string | null;
    title: string;
    description: string | null;
    dueDate: Date | null;
    priority: TaskPriority;
    status: TaskStatus;
    completedAt: Date | null;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdByUserId: string;
    organization?: { id: string; name: string };
    assignedUser?: { id: string; name: string | null; email: string } | null;
    createdBy?: { id: string; name: string | null; email: string } | null;
  }) {
    return {
      id: task.id,
      organizationId: task.organizationId,
      eventId: task.eventId,
      assignedUserId: task.assignedUserId,
      assignedUserName: task.assignedUser
        ? (task.assignedUser.name ?? task.assignedUser.email)
        : null,
      quotationId: task.quotationId,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
      completedAt: task.completedAt,
      archivedAt: task.archivedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      organizationName: task.organization?.name ?? task.organizationId,
      createdByUserId: task.createdByUserId,
      createdByName: task.createdBy
        ? (task.createdBy.name ?? task.createdBy.email)
        : null,
    };
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

  private async ensureAssignedUserInOrganization(
    assignedUserId: string,
    organizationId: string,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: assignedUserId,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Assigned user does not belong to this organization',
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
