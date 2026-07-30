import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    this.ensureDateRange(data.startDateTime, data.endDateTime);

    return this.prisma.event.create({
      data: {
        organizationId: data.organizationId,
        contactId: data.contactId,
        title: data.title,
        description: data.description,
        startDateTime: new Date(data.startDateTime),
        endDateTime: new Date(data.endDateTime),
        location: data.location,
        status: data.status,
      },
    });
  }

  async findAll(userId: string, query: FindEventsQueryDto) {
    await this.ensureOrganizationAccess(userId, query.organizationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = {
      organizationId: query.organizationId,
      ...(query.title
        ? {
            title: {
              contains: query.title,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
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
      }),
      this.prisma.event.count({ where }),
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
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    await this.ensureOrganizationAccess(userId, event.organizationId);

    return event;
  }

  async update(userId: string, id: string, data: UpdateEventDto) {
    const event = await this.findOne(userId, id);

    if (data.contactId) {
      await this.ensureContactOwnership(data.contactId, event.organizationId);
    }

    const startDateTime =
      data.startDateTime ?? event.startDateTime.toISOString();
    const endDateTime = data.endDateTime ?? event.endDateTime.toISOString();
    this.ensureDateRange(startDateTime, endDateTime);

    return this.prisma.event.update({
      where: { id: event.id },
      data: {
        contactId: data.contactId,
        title: data.title,
        description: data.description,
        startDateTime: data.startDateTime
          ? new Date(data.startDateTime)
          : undefined,
        endDateTime: data.endDateTime ? new Date(data.endDateTime) : undefined,
        location: data.location,
        status: data.status,
      },
    });
  }

  async remove(userId: string, id: string) {
    const event = await this.findOne(userId, id);
    await this.prisma.event.delete({ where: { id: event.id } });
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

  private ensureDateRange(startDateTime: string, endDateTime: string) {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (end.getTime() < start.getTime()) {
      throw new BadRequestException(
        'endDateTime must be greater than or equal to startDateTime',
      );
    }
  }
}
