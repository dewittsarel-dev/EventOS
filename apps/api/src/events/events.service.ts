import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import {
  EventSortOrder,
  FindEventsQueryDto,
} from './dto/find-events-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateEventDto) {
    await this.ensureOrganizationAccess(userId, data.organizationId);
    await this.ensureContactOwnership(data.contactId, data.organizationId);
    if (data.assignedUserId) {
      await this.ensureAssignedUserInOrganization(
        data.assignedUserId,
        data.organizationId,
      );
    }

    const { startDateTime, endDateTime } = this.buildDateTimes(
      data.eventDate,
      data.startTime,
      data.endTime,
    );

    const event = await this.prisma.event.create({
      data: {
        organizationId: data.organizationId,
        contactId: data.contactId,
        assignedUserId: data.assignedUserId,
        title: data.title,
        eventType: data.eventType,
        eventDate: new Date(data.eventDate),
        startTime: data.startTime,
        endTime: data.endTime,
        venue: data.venue,
        budgetCents: data.budgetCents,
        notes: data.notes,
        description: data.notes,
        startDateTime,
        endDateTime,
        location: data.venue,
        status: data.status,
      },
      include: this.defaultIncludes,
    });

    return this.toEventResponse(event);
  }

  async findAll(userId: string, query: FindEventsQueryDto) {
    await this.ensureOrganizationAccess(userId, query.organizationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.EventWhereInput = {
      organizationId: query.organizationId,
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
                eventType: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                venue: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.eventType
        ? {
            eventType: {
              contains: query.eventType,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(query.assignedUserId ? { assignedUserId: query.assignedUserId } : {}),
    };

    const orderBy = {
      startDateTime:
        query.sort === EventSortOrder.Asc
          ? ('asc' as const)
          : ('desc' as const),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: this.defaultIncludes,
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: data.map((event) => this.toEventResponse(event)),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findOne(userId: string, id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: this.defaultIncludes,
    });

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    await this.ensureOrganizationAccess(userId, event.organizationId);

    return this.toEventResponse(event);
  }

  async update(userId: string, id: string, data: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: this.defaultIncludes,
    });

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    await this.ensureOrganizationAccess(userId, event.organizationId);

    if (data.contactId) {
      await this.ensureContactOwnership(data.contactId, event.organizationId);
    }

    if (data.assignedUserId) {
      await this.ensureAssignedUserInOrganization(
        data.assignedUserId,
        event.organizationId,
      );
    }

    const nextEventDate = data.eventDate ?? event.eventDate.toISOString();
    const nextStartTime = data.startTime ?? event.startTime;
    const nextEndTime = data.endTime ?? event.endTime;
    const { startDateTime, endDateTime } = this.buildDateTimes(
      nextEventDate,
      nextStartTime,
      nextEndTime,
    );

    const updated = await this.prisma.event.update({
      where: { id: event.id },
      data: {
        contactId: data.contactId,
        assignedUserId:
          data.assignedUserId === null
            ? null
            : (data.assignedUserId ?? undefined),
        title: data.title,
        eventType: data.eventType,
        eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
        startTime: data.startTime,
        endTime: data.endTime,
        venue: data.venue,
        budgetCents:
          data.budgetCents === null ? null : (data.budgetCents ?? undefined),
        notes: data.notes === null ? null : (data.notes ?? undefined),
        description: data.notes === null ? null : (data.notes ?? undefined),
        startDateTime,
        endDateTime,
        location: data.venue ?? undefined,
        status: data.status,
      },
      include: this.defaultIncludes,
    });

    return this.toEventResponse(updated);
  }

  async remove(userId: string, id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    await this.ensureOrganizationAccess(userId, event.organizationId);

    await this.prisma.event.delete({ where: { id: event.id } });
  }

  private readonly defaultIncludes = {
    contact: {
      select: {
        firstName: true,
        lastName: true,
      },
    },
    assignedUser: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  } as const;

  private toEventResponse(
    event: Prisma.EventGetPayload<{
      include: {
        contact: {
          select: {
            firstName: true;
            lastName: true;
          };
        };
        assignedUser: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    }>,
  ) {
    const contactName = [event.contact.firstName, event.contact.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      ...event,
      contactName: contactName.length > 0 ? contactName : null,
      assignedUserName:
        event.assignedUser?.name ?? event.assignedUser?.email ?? null,
    };
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

  private buildDateTimes(
    eventDate: string,
    startTime: string,
    endTime: string,
  ) {
    const start = new Date(`${eventDate.slice(0, 10)}T${startTime}:00.000Z`);
    const end = new Date(`${eventDate.slice(0, 10)}T${endTime}:00.000Z`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException(
        'Invalid eventDate/startTime/endTime combination',
      );
    }

    if (end.getTime() < start.getTime()) {
      throw new BadRequestException(
        'endTime must be greater than or equal to startTime',
      );
    }

    return {
      startDateTime: start,
      endDateTime: end,
    };
  }
}
